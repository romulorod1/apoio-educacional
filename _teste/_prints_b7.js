/* _prints_b7.js
 *
 * Os prints do marco visual do B7, tirados do APLICATIVO DE VERDADE no Chrome,
 * que é o caminho do tablet. Nenhum mockup, nenhuma montagem, nenhum rótulo
 * desenhado por cima: o que está na imagem é o que a tela desenhou.
 *
 *   node _teste/_prints_b7.js <pasta-de-saida>
 *
 * Os nomes dos arquivos são NEUTROS de propósito (b7_01 a b7_13). Quem olha as
 * telas de fora não pode receber, no nome do arquivo, a resposta da pergunta
 * que se faz a ele. O que cada um mostra está no CHECKLIST_b7.md.
 *
 * O pacote é o SINTÉTICO, gerado na hora: o real mora no Drive e não entra no
 * repositório. Uma das telas precisa do aplicativo no estado ANTERIOR (com o
 * material autoral no ar), e ela sai de um segundo servidor que serve o mesmo
 * app.js com a chave ligada, sem cópia nenhuma em disco.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, pausa, esperar } = H;

const SAIDA = process.argv[2];
if (!SAIDA) { console.error('uso: node _teste/_prints_b7.js <pasta-de-saida>'); process.exit(2); }
fs.mkdirSync(SAIDA, { recursive: true });

const PORTA = 8802;
const PORTA_ANTES = 8803;
const APP_REPO = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const LIGADA = APP_REPO.split('var MATERIAL_AUTORAL_NO_AR = false;').join('var MATERIAL_AUTORAL_NO_AR = true;');

const amb = H.criarAmbiente(PORTA, 'perfil_prints_b7', {});
const ambAntes = H.criarAmbiente(PORTA_ANTES, 'perfil_prints_b7_antes', { '/app.js': LIGADA });
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'b7_prints_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });
const hojeIso = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();

const EX = '9ano:teorema-de-pitagoras:aplicacoes:ex:';
let n = 0;
async function tirar(pag, seletor) {
  n++;
  const nome = 'b7_' + String(n).padStart(2, '0') + '.png';
  const alvo = seletor ? await pag.$(seletor) : pag;
  await (alvo || pag).screenshot({ path: path.join(SAIDA, nome) });
  console.log('   ' + nome);
  return nome;
}

async function importar(pag, arquivo) {
  await H.irParaAba(pag, 'ajustes');
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar('importação', () => pag.evaluate(() => {
    const c = document.querySelector('#estado-importacao-biblioteca'); return c ? c.innerText.trim() : '';
  }), v => /^Biblioteca importada\.|não foi importado/.test(v || ''), 90000);
  return r.valor || '';
}
async function semearAulas(pag) {
  return pag.evaluate(async h => {
    const d = await Store.carregar();
    const aluno = d.alunos[0];
    const aula = (id, hora, temas, anexos) => ({ id, alunoId: aluno.id, serieId: null, destacada: false,
      data: h, hora, duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '',
      temNota: false, anexos: anexos || [], temas });
    /* Dois assuntos de propósito: um que a biblioteca tem (o módulo casa pelo
     * título) e um que ela não tem. O primeiro é gravado como tema do banco,
     * com id, para o estado ANTERIOR ter o que oferecer de material autoral. */
    d.aulas.push(aula('aula-b7-com', '08:00', [
      { id: 'MAT09-07', titulo: 'Teorema de Pitágoras', fonte: 'banco', disciplina: 'matematica' },
      { titulo: 'Revisão para a prova de recuperação', fonte: 'livre' }
    ]));
    /* O ESTADO QUE O DESLIGAMENTO CRIOU, e que não existia antes: um assunto
     * vindo do BANCO DE TEMAS que a biblioteca não cobre. O subtítulo diz a
     * matéria e o ano, porque isso é grafo e continua sendo lido, e não há
     * botão nenhum. Português do 7º ano é o caso puro: tinha material autoral
     * e a biblioteca da OBMEP é só de matemática. */
    d.aulas.push(aula('aula-b7-sem-material', '09:00', [
      { id: 'POR07-01', titulo: 'Conto de mistério: pistas, suspeitos e dedução',
        fonte: 'banco', disciplina: 'portugues' },
      { id: 'MAT09-07', titulo: 'Teorema de Pitágoras', fonte: 'banco', disciplina: 'matematica' }
    ]));
    d.aulas.push(aula('aula-b7-anexo', '10:00', [
      { id: 'MAT06-05', titulo: 'Frações: o que são e como comparar', fonte: 'banco', disciplina: 'matematica',
        lingua: 'pt', partes: ['material', 'lista', 'gabarito'], exercicios: 7, anexoId: 'anexo-print-b7' }
    ], [{ id: 'anexo-print-b7', nome: 'Fracoes_o_que_sao_e_como_comparar_MAT06-05.pdf', tamanho: 61440 }]));
    await Store.salvarAnexo('anexo-print-b7', { nome: 'Fracoes_o_que_sao_e_como_comparar_MAT06-05.pdf',
      tipo: 'application/pdf', blob: new Blob([new Uint8Array(61440)], { type: 'application/pdf' }) });
    await Store.salvar(d);
    return aluno.nome;
  }, hojeIso);
}
async function abrirAula(pag, hora) {
  await pag.evaluate(() => { const f = document.querySelector('#modal-aula .fechar'); if (f) f.click(); });
  await pausa(200);
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), hojeIso)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await pausa(120);
  }
  await pag.evaluate((h, hr) => {
    const p = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(x => x.textContent.indexOf(hr) === 0);
    if (p) p.click();
  }, hojeIso, hora);
  await esperar('a aula das ' + hora, () => pag.evaluate(() =>
    !!document.querySelector('#modal-aula.aberto #linha-folha')), v => v === true, 12000);
  await pausa(500);
}
/* A janela da aula é mais alta do que a tela e rola por dentro. Um print do
 * alto dela cortaria justamente a fileira da folha, que é o que se quer olhar:
 * este rola até o alvo antes de fotografar. */
async function rolarAte(pag, seletor) {
  await pag.evaluate(s => {
    const e = document.querySelector(s);
    if (e) e.scrollIntoView({ block: 'center' });
  }, seletor);
  await pausa(500);
}
const tocarLinha = (pag, nome) => pag.evaluate(x => {
  const l = Array.from(document.querySelectorAll('#bib-corpo .item-lista')).find(y => y.querySelector('.nome').textContent.trim() === x);
  if (!l) return false; l.click(); return true;
}, nome);

(async () => {
  const zip = path.join(TMP, 'nono.zip');
  Sintetico.gerar(zip, {});

  // ---------------------------------------------------------------- o de antes
  secao('A janela da aula no estado anterior (material autoral no ar)');
  await ambAntes.subir();
  const antes = await ambAntes.pagina();
  await H.abrirApp(antes, ambAntes.ORIGEM);
  await semearAulas(antes);
  await antes.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(antes, ambAntes.ORIGEM);
  await abrirAula(antes, '08:00');
  await esperar('a linha do assunto com o registro', () => antes.evaluate(() =>
    document.querySelectorAll('#corpo-modal-aula .item-assunto-aula button').length), v => v >= 3, 20000);
  await rolarAte(antes, '#linha-folha');
  await tirar(antes, '#modal-aula .modal');
  await ambAntes.encerrar();

  // ---------------------------------------------------------------- o de hoje
  secao('O aplicativo de hoje');
  await amb.subir();
  const pag = await amb.pagina();
  const perguntas = [];
  pag.on('dialog', d => { perguntas.push(d.message()); });
  await H.abrirApp(pag, amb.ORIGEM);
  const nome = await semearAulas(pag);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);

  // 2. a janela da aula de hoje, sem pacote ainda
  await abrirAula(pag, '08:00');
  await pausa(1200);
  await rolarAte(pag, '#linha-folha');
  await tirar(pag, '#modal-aula .modal');

  // 3. a aula antiga com material anexado
  await abrirAula(pag, '10:00');
  await pausa(1200);
  await rolarAte(pag, '#lista-anexos');
  await tirar(pag, '#modal-aula .modal');

  // com o pacote importado
  conf('importou o pacote sintético', /^Biblioteca importada\./.test(await importar(pag, zip)), true);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);

  // 4. a linha do assunto: um que a biblioteca tem e um que ela não tem
  await abrirAula(pag, '08:00');
  await esperar('o botão Material na linha do assunto', () => pag.evaluate(() =>
    Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula button'))
      .some(b => b.textContent.trim() === 'Material')), v => v === true, 20000);
  await pausa(900);
  await rolarAte(pag, '#lista-temas-aula');
  await tirar(pag, '#modal-aula .modal');
  // 5. só o bloco dos assuntos, de perto
  await tirar(pag, '#lista-temas-aula');

  /* 6. O assunto que veio do BANCO e a biblioteca não cobre, ao lado de um que
   * ela cobre. É o estado novo mais arriscado: o de português tem matéria e
   * ano no subtítulo e não tem botão nenhum. */
  await abrirAula(pag, '09:00');
  await esperar('as duas linhas do banco', () => pag.evaluate(() =>
    document.querySelectorAll('#corpo-modal-aula .item-assunto-aula').length), v => v === 2, 15000);
  await esperar('o Material na linha que a biblioteca cobre', () => pag.evaluate(() =>
    Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula button'))
      .some(b => b.textContent.trim() === 'Material')), v => v === true, 20000);
  await pausa(900);
  await rolarAte(pag, '#lista-temas-aula');
  await tirar(pag, '#lista-temas-aula');

  // 6. o caminho curto: o módulo inteiro já marcado
  await pag.evaluate(() => {
    const l = Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula')).find(x => /Teorema/.test(x.textContent));
    const b = l && Array.from(l.querySelectorAll('button')).find(x => x.textContent.trim() === 'Material');
    if (b) b.click();
  });
  await esperar('o módulo aberto', () => pag.evaluate(() =>
    (document.querySelector('#bib-corpo .bib-titulo') || {}).textContent || ''), v => v === 'Teorema de Pitágoras', 20000);
  await pausa(900);
  await tirar(pag, '.conteudo');

  // 7. a tela onde ela tira: a lista, com as caixas marcadas
  await tocarLinha(pag, 'Aplicações do Teorema');
  await esperar('a lista', () => pag.evaluate(() => document.querySelectorAll('#bib-corpo .bib-celula').length), v => v === 6, 15000);
  await pausa(1500);
  await tirar(pag, '.conteudo');

  // 8. a janela Gerar material, onde ela tira a teoria
  // o aviso do módulo marcado já foi mostrado no print de cima: aqui ele só tapa
  await pag.evaluate(() => { const a = document.querySelector('#aviso'); if (a) a.classList.remove('aberto'); });
  await pausa(200);
  await pag.click('#bib-carrinho-gerar');
  await esperar('a janela Gerar', () => pag.evaluate(() =>
    document.querySelector('#modal-bib-gerar').classList.contains('aberto')), v => v === true, 10000);
  await pausa(500);
  await tirar(pag, '#modal-bib-gerar .modal');
  await pag.evaluate(() => { const b = document.querySelector('#modal-bib-gerar [data-fechar]'); if (b) b.click(); });
  await pausa(400);

  // 9 e 10. a tela cheia, não marcada e marcada
  await pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-limpar'); if (b) b.click(); });
  await pausa(700);
  // o aviso do "Desmarcar tudo" fica 9 segundos na tela: ele é ruído do roteiro,
  // e não da tela que se vai julgar
  await pag.evaluate(() => { const a = document.querySelector('#aviso'); if (a) a.classList.remove('aberto'); });
  await pausa(200);
  await pag.evaluate(i => document.querySelector('#bib-corpo .bib-cartao[data-id="' + i + '"]').click(), EX + '3');
  await esperar('o visor', () => pag.evaluate(() =>
    document.querySelector('#modal-biblioteca').classList.contains('aberto')), v => v === true, 12000);
  await pausa(1200);
  await tirar(pag, '#modal-biblioteca .modal');
  await pag.click('#bib-marcar-visor');
  await pausa(900);
  await tirar(pag, '#modal-biblioteca .modal');
  await pag.click('#bib-fechar-visor');
  await pausa(600);

  // 11 e 12. o cabeçalho do módulo, antes e depois de marcar
  await pag.evaluate(() => { const b = document.querySelector('.bib-voltar'); if (b) b.click(); });
  await pausa(600);
  await pag.evaluate(() => { const b = document.querySelector('#bib-carrinho-limpar'); if (b) b.click(); });
  await pausa(700);
  /* Sai a faixa da aula de origem: estas duas telas são as da NAVEGAÇÃO LIVRE,
   * onde nada vem marcado por padrão, e a faixa da aula contaria outra história. */
  await pag.evaluate(() => { const b = document.querySelector('#bib-sair-contexto'); if (b) b.click(); });
  await pausa(700);
  await pag.evaluate(() => { const a = document.querySelector('#aviso'); if (a) a.classList.remove('aberto'); });
  await esperar('o cabeçalho do módulo', () => pag.evaluate(() => !!document.querySelector('#bib-marcar-modulo')), v => v === true, 10000);
  await pausa(600);
  await tirar(pag, '.conteudo');
  await pag.click('#bib-marcar-modulo');
  await pausa(800);
  await tirar(pag, '.conteudo');

  // 13. Ajustes, o cartão da Biblioteca com o Remover
  await H.irParaAba(pag, 'ajustes');
  await esperar('o cartão do pacote', () => pag.evaluate(() =>
    !!document.querySelector('#lista-pacotes-biblioteca button[data-remover-pacote]')), v => v === true, 12000);
  await pausa(600);
  await tirar(pag, '#cartao-biblioteca');

  /* 14. A CONFIRMAÇÃO. O confirm() do navegador não entra em screenshot, então
   * a pergunta é desenhada na própria tela, com o texto LITERAL que o app
   * passa ao confirm, numa caixa sem estilo nenhum: o que se julga aqui é o
   * TEXTO, e não a moldura do sistema. */
  const textoDaPergunta = await pag.evaluate(() => new Promise(r => {
    const original = window.confirm;
    window.confirm = function (msg) { window.confirm = original; r(msg); return false; };
    document.querySelector('#lista-pacotes-biblioteca button[data-remover-pacote]').click();
  }));
  await pag.evaluate(t => {
    const caixa = document.createElement('div');
    caixa.id = 'caixa-da-pergunta';
    caixa.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9999;' +
      'max-width:520px;padding:18px 20px;background:#fff;border:1px solid #888;border-radius:6px;' +
      'box-shadow:0 8px 40px rgba(0,0,0,.35);font:14px/1.45 system-ui,sans-serif;white-space:pre-wrap;color:#111';
    caixa.textContent = t;
    const barra = document.createElement('div');
    barra.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:16px';
    ['Cancelar', 'OK'].forEach(r => {
      const b = document.createElement('button');
      b.textContent = r;
      b.style.cssText = 'padding:6px 16px;font:14px system-ui,sans-serif';
      barra.appendChild(b);
    });
    caixa.appendChild(barra);
    document.body.appendChild(caixa);
  }, textoDaPergunta);
  await pausa(400);
  await tirar(pag, '#caixa-da-pergunta');
  await pag.evaluate(() => { const c = document.querySelector('#caixa-da-pergunta'); if (c) c.remove(); });

  /* 15. Ajustes depois de remover: a tela inteira, e não só o cartão. É nela
   * que se lê o espaço que voltou, em dois lugares: o aviso do rodapé e a
   * linha "Espaço usado pelo aplicativo", que o desenharAjustes refaz. */
  const espacoAntes = await pag.evaluate(() => (document.querySelector('#info-espaco') || {}).textContent || '');
  await pag.evaluate(() => document.querySelector('#lista-pacotes-biblioteca button[data-remover-pacote]').click());
  await esperar('removido', () => pag.evaluate(() =>
    (document.querySelector('#aviso-texto') || {}).textContent || ''), v => /Série removida/.test(v || ''), 30000);
  await pausa(1200);
  await rolarAte(pag, '#cartao-biblioteca');
  await tirar(pag, '.conteudo');
  const espacoDepois = await pag.evaluate(() => (document.querySelector('#info-espaco') || {}).textContent || '');
  console.log('   espaço antes: ' + espacoAntes + ' | depois: ' + espacoDepois);

  // 16. a aba Biblioteca de volta ao "Em construção"
  await H.irParaAba(pag, 'biblioteca');
  await esperar('Em construção', () => pag.evaluate(() => !!document.querySelector('#biblioteca-em-construcao')), v => v === true, 15000);
  await pausa(600);
  await tirar(pag, '.conteudo');

  conf('a pergunta da remoção tem texto', textoDaPergunta.length > 80, true);
  conf('a linha do espaço usado existe antes e depois de remover',
    !!espacoAntes && !!espacoDepois, true);
  conf('nenhum erro de JavaScript', pag.errosDePagina.join(' | '), '');
  console.log('\nprints em ' + SAIDA + ' (' + n + ' imagens), aluno do exemplo: ' + nome);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
