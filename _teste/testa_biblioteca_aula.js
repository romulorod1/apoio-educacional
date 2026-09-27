/* testa_biblioteca_aula.js
 *
 * A biblioteca a partir da aula (PR D e PR H da B4), com o pacote SINTÉTICO na
 * forma "compor". O pacote real do Drive nunca entra aqui.
 *
 * Sem navegador (Node):
 *   0. o fechamento de um mês SEM biblioteca sai byte a byte igual ao de main
 *      (PDF e texto, com e sem "exibir temas e áreas"); o anexo da biblioteca
 *      sozinho não põe nada em "Temas trabalhados" (a regra antiga saiu, sem
 *      migração); o assunto gravado pela biblioteca sai igual a qualquer
 *      assunto, e o mesmo título escrito de outro jeito é uma linha só.
 *
 * No Chrome:
 *   S. sem pacote, nenhuma linha de assunto oferece Material;
 *   1. com pacote, o botão Material só aparece quando a biblioteca tem o
 *      assunto ("Bhaskara", pelo apelido); o toque abre o MÓDULO dele, com a
 *      faixa da aula, e sem busca no caminho (B7, itens 1 e 2);
 *   2. "Ainda não usei com:" já vem com o aluno da aula;
 *   3. gerar e anexar na aula de onde ela veio: o módulo vira o segundo
 *      assunto (o dela continua), e o aviso diz qual; o mesmo título sem
 *      acento, ou com espaços a mais, não vira assunto repetido;
 *   4. de volta à lista: os usados somem para aquele aluno;
 *   5. o fechamento traz o assunto dela e o do módulo;
 *   7. o Material do assunto da biblioteca abre o módulo direto;
 *   8. anexar de novo o mesmo material: nenhum assunto novo;
 *   9. ela tira o assunto: não volta sozinho (nem ao reabrir, nem ao
 *      recarregar); volta se ela anexar de novo material do módulo;
 *  10. material de dois módulos, teoria primeiro: dois assuntos, na ordem;
 *  11. só páginas de teoria: um assunto, nenhum uso;
 *  12. lista como folha: o assunto entra e a folha abre;
 *  13. "Só gerar o arquivo": nenhuma aula muda;
 *  14. tema do banco que a biblioteca também tem: vai ao módulo dela;
 *  15. "Nova aula hoje", avulsa e em série: o assunto só na aula do dia;
 *  16. série desfeita enquanto monta: nada gravado;
 *   6. a aula apagada: o uso dela não esconde mais nada;
 *      e nenhum erro de JavaScript.
 *
 * Modos envenenados:
 *   node _teste/testa_biblioteca_aula.js --envenenado-aluno
 *     o app.js servido conta o uso de QUALQUER aluno no filtro. Os 3 usados com
 *     um aluno somem também para o outro, e o teste tem de ENXERGAR isso.
 *   node _teste/testa_biblioteca_aula.js --envenenado-acento
 *     o app.js servido compara os títulos sem tirar acento nem caixa: a aula
 *     que já tem "equacoes do segundo grau" ganha "Equações do Segundo Grau"
 *     repetido, e o teste tem de ENXERGAR isso.
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
const VENENO_ACENTO = process.argv.indexOf('--envenenado-acento') !== -1;
const APP_REPO = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const LINHA_ALUNO = 'if (aulas[u.aulaId] === alunoId) usados[u.itemId] = true;';
const LINHA_ACENTO = "return Core.chaveDeBusca(String(titulo || '').trim().replace(/\\s+/g, ' '));";
const trocas = {};
if (VENENO) trocas['/app.js'] = APP_REPO.split(LINHA_ALUNO).join('if (aulas[u.aulaId]) usados[u.itemId] = true;');
if (VENENO_ACENTO) trocas['/app.js'] = APP_REPO.split(LINHA_ACENTO).join("return String(titulo || '').trim().replace(/\\s+/g, ' ');");
const SALVAR = process.env.SALVAR_PRINTS || '';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_aula_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

// ---------------------------------------------------------------- 0 (Node)
secao('0. Fechamento: sem biblioteca, igual a main; o assunto da biblioteca é um assunto como os outros');
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
const PRIMEIRO = { id: 'MAT08-03', titulo: 'Equações do primeiro grau', lingua: 'pt', partes: ['lista'], exercicios: 6 };
/* temasPorDia: { dia: [temas] }; anexosPorDia: { dia: [módulos do anexo antigo] } */
function banco(temasPorDia, anexosPorDia) {
  const al = { id: 'a1', nome: 'Aluno Teste', responsavel: 'Resp', ativo: true,
    precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 130 }] };
  const db = { alunos: [al], series: [], aulas: [], resumos: [], ajustes: {} };
  [2, 9, 16].forEach(d => db.aulas.push({ id: 'x' + d, alunoId: 'a1', data: '2026-06-' + String(d).padStart(2, '0'),
    hora: '15:30', duracaoMin: 90, status: 'realizada', cobravel: true, areas: ['metodo'],
    anexos: (anexosPorDia || {})[d] ? [{ id: 'an' + d, nome: 'x_biblioteca.pdf', tamanho: 10, biblioteca: true, modulos: anexosPorDia[d] }] : [],
    temas: (temasPorDia[d] || []).map(t => Object.assign({}, t)) }));
  return db;
}
const fech = db => CoreN.calcularFechamento(db, 'a1', '2026-06');
function mesmoDocumento(fa, fb) {
  return [{}, { exibirTemasEAreas: true }].every(op =>
    igual(PDFN.gerarFechamento(fa, Object.assign({ sempreResumo: true }, op)), PDFN.gerarFechamento(fb, Object.assign({ sempreResumo: true }, op))) &&
    CoreN.markdownFechamento(fa, op) === CoreN.markdownFechamento(fb, op));
}
const SO_PRIMEIRO = { 2: [PRIMEIRO], 9: [PRIMEIRO], 16: [PRIMEIRO] };
const fSem = fech(banco(SO_PRIMEIRO));
const fSemM = CoreM.calcularFechamento(banco(SO_PRIMEIRO), 'a1', '2026-06');
[{}, { exibirTemasEAreas: true }].forEach(op => {
  const rot = op.exibirTemasEAreas ? ' (exibindo temas)' : '';
  conf('mês sem biblioteca: PDF igual a main' + rot, igual(PDFN.gerarFechamento(fSem, Object.assign({ sempreResumo: true }, op)),
    PDFM.gerarFechamento(fSemM, Object.assign({ sempreResumo: true }, op))), true);
  conf('mês sem biblioteca: texto igual a main' + rot, CoreN.markdownFechamento(fSem, op) === CoreM.markdownFechamento(fSemM, op), true);
});
// anexo antigo (do PR C/D, sem assunto gravado), numa aula sem assunto: não vira tema, sem migração
const ANTIGO = { 9: ['Equações do Segundo Grau', 'Produtos Notáveis e Fatoração'], 16: ['Teorema de Pitágoras'] };
const TEMAS_ANTIGO = { 2: [PRIMEIRO], 16: [PRIMEIRO] };
const fAntigo = fech(banco(TEMAS_ANTIGO, ANTIGO));
conf('anexo antigo: nenhum módulo em "Temas trabalhados"', fAntigo.temasDoMes.map(t => t.titulo).join(' | '), 'Equações do primeiro grau');
conf('anexo antigo: o documento é o mesmo do mês sem os anexos (PDF e texto, com e sem a caixa)',
  mesmoDocumento(fAntigo, fech(banco(TEMAS_ANTIGO))), true);
// o assunto gravado pela biblioteca, igual a um assunto escrito por ela com o mesmo título
const DA_BIB = { titulo: 'Equações do Segundo Grau', fonte: 'biblioteca', modulo: '9ano:equacoes-do-segundo-grau' };
const fBib = fech(banco({ 2: [PRIMEIRO], 9: [DA_BIB], 16: [PRIMEIRO, DA_BIB] }));
conf('o assunto da biblioteca entra em "Temas trabalhados", nas duas datas', JSON.stringify(fBib.temasDoMes.map(t => [t.titulo, t.datas])),
  JSON.stringify([['Equações do primeiro grau', ['2026-06-02', '2026-06-16']], ['Equações do Segundo Grau', ['2026-06-09', '2026-06-16']]]));
conf('e o documento é o mesmo de um assunto escrito por ela (PDF e texto, com e sem a caixa)',
  mesmoDocumento(fBib, fech(banco({ 2: [PRIMEIRO], 9: [{ titulo: 'Equações do Segundo Grau', fonte: 'livre' }],
    16: [PRIMEIRO, { titulo: 'Equações do Segundo Grau', fonte: 'livre' }] }))), true);
const mdSemCaixa = CoreN.markdownFechamento(fBib, {}), mdComCaixa = CoreN.markdownFechamento(fBib, { exibirTemasEAreas: true });
conf('sem "exibir temas e áreas", o texto não traz o assunto; com a caixa, traz', mdSemCaixa.indexOf('Segundo Grau') < 0 && mdComCaixa.indexOf('Equações do Segundo Grau') >= 0, true);
const fDois = fech(banco({ 2: [{ titulo: 'equacoes do segundo grau', fonte: 'livre' }], 9: [DA_BIB] }));
conf('o mesmo título escrito sem acento em outra aula: uma linha só', fDois.temasDoMes.length, 1);

// ---------------------------------------------------------------- navegador
const amb = H.criarAmbiente(PORTA, 'perfil_bib_aula', trocas);
const hojeIso = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
const daquiA = dias => { const d = new Date(); d.setDate(d.getDate() + dias); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const SP = '9ano:equacoes-do-segundo-grau:soma-e-produto:ex:';
const TEO_PIT = '9ano:teorema-de-pitagoras:o-teorema:teo:p01';
const TEO_PN = '9ano:produtos-notaveis-e-fatoracao:produtos-notaveis:teo:p02';
const EQ = 'Equações do Segundo Grau';

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
const lerDados = pag => pag.evaluate(() => Store.carregar());
const temasDe = (pag, aulaId) => lerDados(pag).then(d => {
  const a = d.aulas.filter(x => x.id === aulaId)[0];
  return a ? (a.temas || (a.tema ? [a.tema] : [])) : null;
});
const titulosDe = (pag, aulaId) => temasDe(pag, aulaId).then(t => t ? t.map(x => x.titulo).join(' | ') : null);
const anexosDa = (pag, aulaId) => lerDados(pag).then(d => { const a = d.aulas.filter(x => x.id === aulaId)[0]; return a ? (a.anexos || []).length : -1; });

/* Abre a aula de hoje daquela hora pela agenda. */
async function abrirAulaDeHoje(pag, hora) {
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), hojeIso)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await pausa(120);
  }
  const ok = await pag.evaluate((h, hr) => {
    const alvo = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(p => p.textContent.indexOf(hr) === 0);
    if (!alvo) return false; alvo.click(); return true;
  }, hojeIso, hora);
  await esperar('aula das ' + hora + ' aberta', () => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
  return ok;
}
/* As linhas de assunto da aula aberta: título, detalhe e se tem o botão Material. */
const linhasDoAssunto = pag => pag.evaluate(() => Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula')).map(l => ({
  titulo: l.querySelector('.nome').firstChild.textContent,
  detalhe: (l.querySelector('.detalhe') || {}).textContent || '',
  material: Array.from(l.querySelectorAll('button')).some(b => b.textContent.trim() === 'Material')
})));
const resumoLinhas = ls => ls.map(l => l.titulo + (l.material ? ' [Material]' : '')).join(' | ');
async function tocarMaterial(pag, titulo) {
  return pag.evaluate(t => {
    const l = Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula')).find(x => x.querySelector('.nome').firstChild.textContent === t);
    const b = l && Array.from(l.querySelectorAll('button')).find(x => x.textContent.trim() === 'Material');
    if (!b) return false; b.click(); return true;
  }, titulo);
}
async function fecharAula(pag) {
  await pag.evaluate(() => { const b = document.querySelector('#modal-aula [data-fechar]'); if (b) b.click(); });
  await pausa(250);
}

/* Marca a seleção guardada no aparelho, recarrega o app (a seleção volta) e
 * abre a janela Gerar material. */
async function abrirGerarCom(pag, itens, paginas) {
  await pag.evaluate((i, p) => localStorage.setItem('apoio-educacional:bib-carrinho', JSON.stringify({ itens: i, paginas: p })), itens, paginas);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'biblioteca');
  await esperar('seleção de volta', () => pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-gerar'); return !!b && !b.disabled; }), v => v === true, 10000);
  await pag.click('#bib-carrinho-gerar');
  await esperar('janela Gerar material', () => pag.$eval('#modal-bib-gerar', e => e.classList.contains('aberto')), v => v === true, 5000);
}
/* Anexa numa aula da lista e devolve o aviso final. */
async function anexarEm(pag, aulaId, itens, paginas, extra) {
  await abrirGerarCom(pag, itens, paginas);
  const antes = await anexosDa(pag, aulaId);
  await pag.evaluate((id, ex) => {
    document.querySelector('#bib-gerar-aulas [data-aula="' + id + '"]').click();
    if (ex && ex.folha) document.querySelector('#bib-gerar-folha').click();
    document.querySelector('#aviso-texto').textContent = '';
  }, aulaId, extra || null);
  await pag.click('#bib-gerar-anexar');
  const r = await esperar('anexado na aula ' + aulaId, () => Promise.all([anexosDa(pag, aulaId),
    pag.evaluate(() => document.querySelector('#aviso-texto').textContent)]), v => v && v[0] > antes && /^Material anexado/.test(v[1]), 30000);
  return r.ok ? r.valor[1] : '(não anexou)';
}

(async () => {
  if (VENENO || VENENO_ACENTO) {
    secao('O veneno é de verdade');
    conf('o app.js servido ficou DIFERENTE do repositório', trocas['/app.js'] !== APP_REPO ? 'diferente' : 'IGUAL', 'diferente');
    conf('e o veneno trocou exatamente uma ocorrência', APP_REPO.split(VENENO ? LINHA_ALUNO : LINHA_ACENTO).length - 1, 1);
  }
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);

  // as aulas de hoje, gravadas direto no banco, e o app aberto de novo
  const ids = await pag.evaluate(async h => {
    const d = await Store.carregar();
    const alunos = d.alunos.slice(0, 2);
    // três alunos a mais, para as aulas novas de hoje (a série pula o dia que já tem aula do aluno)
    ['Teste Avulsa', 'Teste Série', 'Teste Desfeita'].forEach((nome, i) => {
      d.alunos.push(Object.assign(JSON.parse(JSON.stringify(alunos[0])), { id: 'aluno-teste-' + i, nome }));
    });
    const aula = (id, alunoId, hora, temas) => ({ id, alunoId, serieId: null, destacada: false, data: h, hora,
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false, anexos: [], temas });
    d.aulas.push(aula('aula-bib-teste', alunos[0].id, '10:00', [{ titulo: 'Bhaskara', fonte: 'livre' },
      // tema autoral que o pacote do 9º ano não tem: o Material segue para o material de sempre
      { id: 'MAT06-05', titulo: 'Frações: o que são e como comparar', lingua: 'pt' },
      // assunto escrito por ela que a biblioteca não tem: sem o botão
      { titulo: 'Revisão para a prova', fonte: 'livre' }]));
    d.aulas.push(aula('aula-acento', alunos[1].id, '11:00', [{ titulo: 'equacoes do segundo grau', fonte: 'livre' }]));
    d.aulas.push(aula('aula-espacos', alunos[1].id, '12:00', [{ titulo: '  Equações   do Segundo Grau ', fonte: 'livre' }]));
    d.aulas.push(aula('aula-vazia', alunos[1].id, '13:00', []));
    d.aulas.push(aula('aula-teoria', alunos[1].id, '14:00', []));
    d.aulas.push(aula('aula-folha', alunos[1].id, '15:00', []));
    d.aulas.push(aula('aula-banco', alunos[1].id, '17:00', []));
    // tema autoral que o pacote também tem (Teorema de Pitágoras)
    d.aulas.push(aula('aula-autoral', alunos[0].id, '16:00', [{ id: 'MAT09-07', titulo: 'Teorema de Pitágoras', lingua: 'pt' }]));
    await Store.salvar(d);
    return { aluno: alunos[0].id, nome: alunos[0].nome, outro: alunos[1].id };
  }, hojeIso);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('S. Sem pacote: nenhuma linha oferece Material');
  /* Sem material autoral, o botão Material é da BIBLIOTECA e de mais ninguém.
   * Sem pacote importado não há biblioteca, então nenhuma das três linhas o
   * tem, nem a que aponta para um tema do banco de matemática. */
  conf('a aula de hoje abriu', await abrirAulaDeHoje(pag, '10:00'), true);
  const semPacote = await esperar('linhas sem pacote', () => linhasDoAssunto(pag), v => v && v.length === 3, 10000);
  conf('nenhuma linha tem Material', resumoLinhas(semPacote.valor || []), 'Bhaskara | Frações: o que são e como comparar | Revisão para a prova');
  await fecharAula(pag);

  const zip = path.join(TMP, 'nono.zip');
  Sintetico.gerar(zip, { compor: true });
  conf('importou o pacote sintético', /^Biblioteca importada\./.test(await importar(pag, zip)), true);
  const zipBanco = path.join(TMP, 'banco.zip');
  Sintetico.gerarBanco(zipBanco);
  conf('importou o pacote sintético do Banco', /^Biblioteca importada\./.test(await importar(pag, zipBanco)), true);

  // ================================================================
  secao('1a. Com pacote: o botão Material só onde a biblioteca tem o assunto');
  conf('a aula de hoje abriu', await abrirAulaDeHoje(pag, '10:00'), true);
  const comPacote = await esperar('linhas com pacote', () => linhasDoAssunto(pag), v => v && v.length === 3 && v[0].material, 10000);
  /* "Frações" tem registro no índice de matemática, mas o pacote sintético não
   * tem módulo de frações: sem material autoral, essa linha fica sem o botão.
   * Quem o ganha é "Bhaskara", que a biblioteca tem pelo apelido. */
  conf('só Bhaskara, que a biblioteca tem pelo apelido',
    resumoLinhas(comPacote.valor || []), 'Bhaskara [Material] | Frações: o que são e como comparar | Revisão para a prova');

  secao('1c. O botão Material abre o módulo do assunto, cheio e já marcado');
  await tocarMaterial(pag, 'Bhaskara');
  const abriu = await esperar('aba Biblioteca no módulo', () => pag.evaluate(() => ({
    aba: (document.querySelector('#abas .aba.ativa') || {}).dataset ? document.querySelector('#abas .aba.ativa').dataset.tela : '',
    campo: document.querySelector('#busca-biblioteca').value,
    aulaFechada: !document.querySelector('#modal-aula').classList.contains('aberto'),
    titulo: (document.querySelector('#bib-corpo .bib-titulo') || {}).textContent || '',
    texto: document.querySelector('#bib-corpo').innerText,
    contexto: (document.querySelector('#bib-contexto') || {}).innerText || ''
  })), v => v && v.aba === 'biblioteca' && v.titulo === EQ, 12000);
  const a = abriu.valor || {};
  conf('a janela da aula fechou e a aba é a Biblioteca', a.aulaFechada + ',' + a.aba, 'true,biblioteca');
  conf('o toque leva direto ao módulo achado pelo apelido, sem busca', a.titulo + '|' + a.campo, EQ + '|');
  conf('e a tela do módulo traz as aulas dele', /Resultados Básicos - Parte I/.test(a.texto), true);
  conf('a faixa diz para qual aula', new RegExp('^Material para a aula de ' + ids.nome).test(a.contexto), true);
  if (SALVAR) await pag.screenshot({ path: path.join(SALVAR, 'aula_1_busca_do_assunto.png') });

  // ================================================================
  secao('2. "Ainda não usei com" já vem com o aluno da aula');
  await tocarLinha(pag, 'Soma e Produto');
  await esperar('lista', () => visiveis(pag), v => v === 8, 8000);
  conf('o filtro já vem com o aluno', await pag.$eval('#bib-filtro-aluno', e => e.value), ids.aluno);
  await esperar('aviso do filtro', () => infoFiltro(pag), v => /^Nenhum exercício/.test(v), 5000);
  conf('nada usado ainda: os 8 aparecem', await visiveis(pag), 8);

  // ================================================================
  secao('3. Gerar: a aula de onde ela veio já vem escolhida, e o módulo vira assunto');
  /* Vindo da aula, o módulo inteiro já está marcado (B7, item 2). Esta seção
   * mede o anexo de TRÊS exercícios escolhidos, então ela desmarca tudo antes
   * e marca os três, que é o que a Nathália faz quando quer uma lista curta. */
  await pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-limpar'); if (b) b.click(); });
  await esperar('seleção zerada', () => pag.evaluate(() => !!document.querySelector('#bib-carrinho-vazio')), v => v === true, 8000);
  for (const n of [1, 5, 6]) await pag.evaluate(i => document.querySelector('input[data-carrinho="itens"][data-id="' + i + '"]').click(), SP + n);
  await pag.click('#bib-carrinho-gerar');
  await esperar('janela Gerar material', () => pag.$eval('#modal-bib-gerar', e => e.classList.contains('aberto')), v => v === true, 5000);
  const escolhida = await pag.evaluate(() => {
    const l = document.querySelector('#bib-gerar-aulas .item-lista.escolhida');
    return { id: l ? l.getAttribute('data-aula') : '', botao: document.querySelector('#bib-gerar-anexar').disabled };
  });
  conf('a aula do contexto está escolhida e o botão ligado', escolhida.id + ',' + escolhida.botao, 'aula-bib-teste,false');
  await pag.evaluate(() => { document.querySelector('#aviso-texto').textContent = ''; });
  await pag.click('#bib-gerar-anexar');
  const usou = await esperar('uso gravado', () => lerUso(pag), v => v && v.filter(u => u.aulaId === 'aula-bib-teste').length === 3, 30000);
  conf('3 usos gravados para a aula, um por exercício', usou.ok, true);
  const aviso3 = await esperar('aviso do anexo', () => pag.evaluate(() => document.querySelector('#aviso-texto').textContent), v => /^Material anexado/.test(v || ''), 10000);
  conf('o aviso diz o assunto registrado', aviso3.valor,
    'Material anexado na aula de ' + ids.nome + ' (' + hojeIso.split('-').reverse().join('/') + '). Assunto registrado: ' + EQ + '. A seleção foi desmarcada.');
  const temas3 = await temasDe(pag, 'aula-bib-teste');
  conf('o assunto dela continua; o módulo entra depois, como assunto novo', temas3.map(t => t.titulo).join(' | '),
    'Bhaskara | Frações: o que são e como comparar | Revisão para a prova | ' + EQ);
  conf('gravado com a fonte e o módulo, sem campo a mais', JSON.stringify(temas3[3]), JSON.stringify({ titulo: EQ, fonte: 'biblioteca', modulo: '9ano:equacoes-do-segundo-grau' }));

  // no veneno do aluno, o 3b não roda: o uso do outro aluno mudaria a conta do filtro
  if (!VENENO) {
  secao('3b. O mesmo título sem acento e sem caixa, ou com espaços a mais: nenhum assunto repetido');
  const avisoAcento = await anexarEm(pag, 'aula-acento', [SP + 2], []);
  const titulosAcento = await titulosDe(pag, 'aula-acento');
  if (VENENO_ACENTO) {
    conf('VENENO ENXERGADO: a aula ficou com o assunto repetido', titulosAcento, 'equacoes do segundo grau | ' + EQ);
    throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  }
  conf('"equacoes do segundo grau" já estava: nada novo', titulosAcento, 'equacoes do segundo grau');
  conf('e o aviso não fala de assunto', /Assunto/.test(avisoAcento), false);
  await anexarEm(pag, 'aula-espacos', [SP + 2], []);
  conf('"  Equações   do Segundo Grau " já estava: nada novo', await titulosDe(pag, 'aula-espacos'), '  Equações   do Segundo Grau ');
  }

  // ================================================================
  secao('4. De volta à lista: os usados somem para aquele aluno');
  await H.irParaAba(pag, 'agenda');
  await H.irParaAba(pag, 'biblioteca');
  // sem o 3b (que recarrega o app), a biblioteca volta na mesma lista
  const naLista = await esperar('biblioteca', () => pag.evaluate(() => document.querySelector('#bib-filtro-aluno') ? 'lista'
    : document.querySelectorAll('#bib-corpo .item-lista').length ? 'modulos' : ''), v => !!v, 8000);
  if (naLista.valor !== 'lista') {
    await pag.evaluate(() => { const c = document.querySelector('#busca-biblioteca'); c.value = ''; c.dispatchEvent(new Event('input')); });
    await pausa(400);
    await tocarLinha(pag, EQ);
    await tocarLinha(pag, 'Soma e Produto');
  }
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
  // o outro aluno usou o exercício 2 duas vezes (3b): só ele some
  await esperar('outro aluno', () => visiveis(pag), v => v === 7, 5000);
  conf('para outro aluno, só o que ele usou some', await visiveis(pag), 7);
  await pag.select('#bib-filtro-aluno', '');
  await esperar('todos', () => visiveis(pag), v => v === 8, 5000);
  conf('para "qualquer aluno", os 8', await visiveis(pag), 8);

  // ================================================================
  secao('5. O fechamento do mês traz o assunto dela e o do módulo');
  const fechTela = await pag.evaluate(async (alunoId, h) => {
    const d = await Store.carregar();
    const f = Core.calcularFechamento(d, alunoId, h.slice(0, 7));
    return { temas: f.temasDoMes.map(t => t.titulo), md: Core.markdownFechamento(f, { exibirTemasEAreas: true }), mdSem: Core.markdownFechamento(f, {}) };
  }, ids.aluno, hojeIso);
  conf('Temas do mês: Bhaskara e o módulo, cada um uma vez', fechTela.temas.filter(t => t === 'Bhaskara' || t === EQ).join(' | '), 'Bhaskara | ' + EQ);
  conf('no texto com "exibir temas e áreas", os dois', /Bhaskara/.test(fechTela.md) && fechTela.md.indexOf(EQ) >= 0, true);
  conf('sem a caixa, nenhum', /Bhaskara/.test(fechTela.mdSem) || fechTela.mdSem.indexOf(EQ) >= 0, false);

  // ================================================================
  secao('7. O Material do assunto da biblioteca abre o módulo direto');
  conf('a aula abriu', await abrirAulaDeHoje(pag, '10:00'), true);
  const comBib = await esperar('linhas', () => linhasDoAssunto(pag), v => v && v.length === 4 && v[3].material, 10000);
  conf('a linha diz de onde veio e tem o Material', comBib.valor && comBib.valor[3].detalhe + ',' + comBib.valor[3].material, 'da biblioteca da OBMEP,true');
  if (SALVAR) await pag.screenshot({ path: path.join(SALVAR, 'aula_3_assunto_da_biblioteca.png') });
  await tocarMaterial(pag, EQ);
  const direto = await esperar('módulo aberto', () => pag.evaluate(() => ({
    aba: document.querySelector('#abas .aba.ativa').dataset.tela,
    campo: document.querySelector('#busca-biblioteca').value,
    texto: document.querySelector('#bib-corpo').innerText,
    contexto: (document.querySelector('#bib-contexto') || {}).innerText || ''
  })), v => v && v.aba === 'biblioteca' && /Soma e Produto das Raízes/.test(v.texto), 8000);
  const dv = direto.valor || {};
  conf('abre a tela do módulo, sem busca', direto.ok && dv.campo === '' && /Resultados Básicos - Parte I/.test(dv.texto), true);
  conf('com a faixa da aula', new RegExp('^Material para a aula de ' + ids.nome).test(dv.contexto), true);
  if (SALVAR) await pag.screenshot({ path: path.join(SALVAR, 'aula_4_modulo_direto.png') });

  // ================================================================
  secao('8. O mesmo material de novo na mesma aula: nenhum assunto novo');
  const aviso8 = await anexarEm(pag, 'aula-bib-teste', [SP + 7], []);
  conf('a aula continua com 4 assuntos', (await temasDe(pag, 'aula-bib-teste')).length, 4);
  conf('e o aviso não fala de assunto', /Assunto/.test(aviso8), false);

  // ================================================================
  secao('9. Ela tira o assunto: não volta sozinho; volta se ela anexar de novo');
  conf('a aula abriu', await abrirAulaDeHoje(pag, '10:00'), true);
  await esperar('linhas', () => linhasDoAssunto(pag), v => v && v.length === 4, 8000);
  await pag.evaluate(t => {
    const l = Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula')).find(x => x.querySelector('.nome').firstChild.textContent === t);
    Array.from(l.querySelectorAll('button')).find(x => x.textContent.trim() === 'Tirar').click();
  }, EQ);
  await esperar('assunto tirado', () => titulosDe(pag, 'aula-bib-teste'), v => v && v.indexOf(EQ) < 0, 5000);
  await fecharAula(pag);
  conf('a aula abriu de novo', await abrirAulaDeHoje(pag, '10:00'), true);
  conf('não voltou ao reabrir', (await linhasDoAssunto(pag)).map(l => l.titulo).indexOf(EQ), -1);
  await fecharAula(pag);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await pausa(500);
  conf('nem ao recarregar o app', (await titulosDe(pag, 'aula-bib-teste')).indexOf(EQ), -1);
  const aviso9 = await anexarEm(pag, 'aula-bib-teste', [SP + 8], []);
  conf('anexar de novo material do módulo nesta aula traz de volta (ação dela)', (await titulosDe(pag, 'aula-bib-teste')).split(' | ').pop(), EQ);
  conf('e o aviso diz', aviso9.indexOf('Assunto registrado: ' + EQ + '.') >= 0, true);

  // ================================================================
  secao('10. Material de dois módulos: dois assuntos, na ordem do material');
  const aviso10 = await anexarEm(pag, 'aula-vazia', [SP + 1], [TEO_PIT]);
  conf('a teoria vem primeiro no material, e o assunto também', await titulosDe(pag, 'aula-vazia'), 'Teorema de Pitágoras | ' + EQ);
  conf('o aviso diz quantos (os nomes estão na aula)', aviso10.indexOf('. 2 assuntos registrados na aula. A seleção foi desmarcada.') >= 0, true);
  if (SALVAR) await pag.screenshot({ path: path.join(SALVAR, 'aula_5_aviso_dois_assuntos.png') });

  // ================================================================
  secao('10b. Exercício do Banco: o nome da fonte não vira assunto');
  const usoAntesBanco = (await lerUso(pag)).length;
  const aviso10b = await anexarEm(pag, 'aula-banco', [SP + 1, 'banco:2020:n2:4'], []);
  conf('só o módulo do Portal vira assunto', await titulosDe(pag, 'aula-banco'), EQ);
  conf('o aviso fala de um assunto', aviso10b.indexOf('Assunto registrado: ' + EQ + '.') >= 0, true);
  conf('o exercício do Banco conta como usado, como sempre', (await lerUso(pag)).length - usoAntesBanco, 2);

  // ================================================================
  secao('11. Só páginas de teoria: um assunto, nenhum uso');
  const usoAntes = (await lerUso(pag)).length;
  await anexarEm(pag, 'aula-teoria', [], [TEO_PN]);
  conf('o módulo da teoria vira assunto', await titulosDe(pag, 'aula-teoria'), 'Produtos Notáveis e Fatoração');
  conf('nenhum uso gravado (uso é de exercício)', (await lerUso(pag)).length, usoAntes);

  // ================================================================
  secao('12. Lista como folha: o assunto entra e a folha abre');
  await anexarEm(pag, 'aula-folha', [SP + 3], [], { folha: true });
  conf('o assunto entrou', await titulosDe(pag, 'aula-folha'), EQ);
  const folha = await esperar('folha aberta', () => lerDados(pag).then(d => d.aulas.filter(x => x.id === 'aula-folha')[0].temNota), v => v === true, 8000);
  conf('e a lista virou folha da aula', folha.ok, true);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('13. "Só gerar o arquivo": nenhuma aula muda');
  const antes13 = JSON.stringify((await lerDados(pag)).aulas);
  await abrirGerarCom(pag, [SP + 1], []);
  await pag.evaluate(() => {
    try { navigator.canShare = () => false; } catch (e) { /* ok */ }
    document.querySelector('#bib-gerar-aulas [data-aula="aula-vazia"]').click();
  });
  await pag.click('#bib-gerar-baixar');
  await esperar('janela fechada', () => pag.$eval('#modal-bib-gerar', e => e.classList.contains('aberto')), v => v === false, 30000);
  await pausa(500);
  conf('as aulas estão iguais', JSON.stringify((await lerDados(pag)).aulas) === antes13, true);

  // ================================================================
  secao('14. Tema do banco que a biblioteca também tem: o Material abre o módulo');
  conf('a aula abriu', await abrirAulaDeHoje(pag, '16:00'), true);
  // o registro do tema vem de um índice à parte: a linha mostra o ano quando ele chega
  await esperar('linha com o botão e o registro', () => linhasDoAssunto(pag), v => v && v.length === 1 && v[0].material && /9º ano/.test(v[0].detalhe), 10000);
  await tocarMaterial(pag, 'Teorema de Pitágoras');
  const autoral = await esperar('biblioteca aberta', () => pag.evaluate(() => ({
    aba: document.querySelector('#abas .aba.ativa').dataset.tela,
    campo: document.querySelector('#busca-biblioteca').value,
    titulo: (document.querySelector('#bib-corpo .bib-titulo') || {}).textContent || '',
    aviso: document.querySelector('#aviso-texto').textContent
  })), v => v && v.aba === 'biblioteca' && v.titulo, 12000);
  conf('vai à biblioteca, no módulo do assunto', autoral.ok && autoral.valor.titulo, 'Teorema de Pitágoras');
  conf('sem busca no caminho', autoral.valor && autoral.valor.campo, '');
  /* O aviso "o seu material continua em Material de aula" era sobre o material
   * autoral, que saiu. O aviso de hoje é o do módulo marcado, e ele começa
   * pelo que SAIU: aqui ela tinha um exercício marcado de antes, e vir da aula
   * substitui a seleção. A frase inteira, e não um "começa com", porque foi
   * uma asserção frouxa deste tipo que deixou passar a perda silenciosa. */
  conf('e o aviso é o do módulo inteiro marcado, dizendo antes o que saiu',
    (autoral.valor && autoral.valor.aviso) || 'VAZIO',
    'Tirei 1 item que estava marcado e marquei o módulo inteiro: 6 exercícios e 3 páginas de teoria. ' +
    'Tire o que não quiser e toque em Gerar material.');
  conf('sem falar de "Material de aula", que não existe mais',
    /Material de aula/.test((autoral.valor || {}).aviso || ''), false);

  secao('14b. O mesmo toque antes de o índice da biblioteca abrir: ainda vai à biblioteca');
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  // a biblioteca demora a abrir (no tablet, com pacotes grandes, ela leva segundos): o botão
  // Material só nasce quando o índice diz que a biblioteca tem o assunto, e o toque tem de
  // chegar ao módulo do mesmo jeito
  await pag.evaluate(() => {
    const original = Store.itensDaBiblioteca;
    Store.itensDaBiblioteca = function () { return new Promise(r => setTimeout(r, 3000)).then(() => original.apply(Store, arguments)); };
  });
  await abrirAulaDeHoje(pag, '16:00');
  const cedo = await esperar('primeiro botão Material', () => pag.evaluate(() => {
    const l = document.querySelector('#corpo-modal-aula .item-assunto-aula');
    const b = l && Array.from(l.querySelectorAll('button')).find(x => x.textContent.trim() === 'Material');
    if (!b) return false;
    b.click(); return true;
  }), v => v === true, 10000);
  const foi = await esperar('biblioteca aberta', () => pag.evaluate(() => ({
    aba: document.querySelector('#abas .aba.ativa').dataset.tela, tema: document.querySelector('#modal-tema').classList.contains('aberto')
  })), v => v && (v.aba === 'biblioteca' || v.tema), 15000);
  conf('tocado assim que o botão apareceu, vai à biblioteca, e não à montagem autoral', cedo.ok && foi.ok && foi.valor.aba === 'biblioteca' && !foi.valor.tema, true);

  // ================================================================
  secao('15. "Nova aula hoje", avulsa e em série: o assunto só na aula do dia');
  async function novaAulaHoje(alunoId, serie) {
    await abrirGerarCom(pag, [SP + 1, SP + 5, SP + 6], []);
    await pag.evaluate(() => document.querySelector('#bib-gerar-aulas [data-aula="nova"]').click());
    await pag.click('#bib-gerar-anexar');
    await esperar('janela de aula nova', () => pag.evaluate(() => document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
    await pag.select('#campo-aluno', alunoId);
    if (serie) {
      await pag.click('#campo-repetir');
      await pausa(250);
      await pag.evaluate(ate => { const c = document.querySelector('#campo-repetir-ate'); c.value = ate; c.dispatchEvent(new Event('change')); }, daquiA(14));
    }
    await pag.click('#salvar-aula');
  }
  await novaAulaHoje('aluno-teste-0', false);
  const avulsa = await esperar('aula avulsa com o assunto', () => lerDados(pag).then(d => d.aulas.filter(x => x.alunoId === 'aluno-teste-0')
    .map(x => (x.temas || []).map(t => t.titulo).join(',') + '/' + (x.anexos || []).length)), v => v && v.join() === EQ + '/2', 30000);
  conf('a aula nova tem o anexo e o assunto', avulsa.ok, true);
  await pausa(600);
  await novaAulaHoje('aluno-teste-1', true);
  const serie = await esperar('série com o assunto na aula do dia', () => lerDados(pag).then(d => d.aulas.filter(x => x.alunoId === 'aluno-teste-1')
    .sort((x, y) => x.data < y.data ? -1 : 1).map(x => x.data + ':' + (x.temas || []).map(t => t.titulo).join(','))), v => v && v.length === 3 && v[0] === hojeIso + ':' + EQ, 40000);
  conf('só a aula de hoje da série ganhou o assunto', serie.ok && serie.valor.slice(1).every(s => /:$/.test(s)), true);

  // ================================================================
  secao('16. Série desfeita enquanto o material é montado: nada gravado');
  // o aviso final da série espera o Desfazer dela vencer
  await esperar('aviso da série vencido', () => pag.evaluate(() => document.querySelector('#aviso-texto').textContent), v => /^Material anexado/.test(v || ''), 20000);
  const anexosAntes16 = await H.contarDeposito(pag, 'anexos');
  await novaAulaHoje('aluno-teste-2', true);
  // o processador mais lento, para o Desfazer dela cair no meio da montagem (no tablet, ela leva segundos)
  await pag.emulateCPUThrottling(20);
  const desfez = await esperar('Desfazer da série', () => pag.evaluate(() => {
    const t = document.querySelector('#aviso-texto').textContent, b = document.querySelector('#aviso-acao');
    if (!/^Aulas repetidas criadas/.test(t) || b.style.display === 'none') return false;
    // o botão Gerar desligado é o sinal de que o material ainda está sendo montado
    const montando = document.querySelector('#bib-gerar-anexar').disabled;
    b.click(); return { montando };
  }), v => !!v, 8000);
  conf('ela desfez a série enquanto o material era montado', desfez.ok && desfez.valor.montando, true);
  // a montagem terminou quando o botão Gerar volta a ligar (a janela está fechada, mas é a mesma)
  await esperar('montagem terminada', () => pag.evaluate(() => {
    const b = document.querySelector('#bib-gerar-anexar'); return !b.disabled && b.textContent === 'Gerar e anexar';
  }), v => v === true, 60000);
  await pag.emulateCPUThrottling(1);
  await pausa(300);
  conf('o arquivo montado não ficou órfão no aparelho', await H.contarDeposito(pag, 'anexos'), anexosAntes16);
  const dados16 = await lerDados(pag);
  conf('nenhuma aula do aluno da série desfeita', dados16.aulas.filter(x => x.alunoId === 'aluno-teste-2').length, 0);
  conf('nenhum uso gravado para ele', (await lerUso(pag)).filter(u => u.alunoId === 'aluno-teste-2').length, 0);

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
  await tocarLinha(pag, EQ);
  await tocarLinha(pag, 'Soma e Produto');
  await esperar('lista', () => pag.evaluate(() => !!document.querySelector('#bib-filtro-aluno')), v => v === true, 8000);
  await pag.select('#bib-filtro-aluno', ids.aluno);
  await esperar('filtro com a aula apagada', () => infoFiltro(pag), v => /^Nenhum exercício/.test(v), 5000);
  conf('os 8 aparecem: uso de aula que não existe não conta', await visiveis(pag), 8);
  conf('o uso continua gravado (a cópia de segurança não perde nada)', (await lerUso(pag)).filter(u => u.aulaId === 'aula-bib-teste').length, 5);

  if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length, 0);
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
