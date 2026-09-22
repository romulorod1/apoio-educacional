/* testa_limpeza_acervo.js
 *
 * O acervo de 14/09 saiu do repositório (PR F da B5). Prova, sem navegador:
 *   1. os arquivos do acervo não existem mais (banco/acervo*.json, scripts/,
 *      _teste/testa_acervo.js) e ninguém os pede: o sw.js não os lista, o
 *      confere_tudo.sh não roda o teste dele, e o app.js não tem a chave
 *      ACERVO_EM_CONSTRUCAO nem as funções do acervo;
 *   2. os temas autorais continuam no repositório.
 * No Chrome, sem pacote importado:
 *   3. a aba Biblioteca mostra "Em construção" e a aba Temas antiga não existe
 *      mais na página;
 *   4. uma aula com um assunto gravado do acervo ({fonte: 'acervo', acervoId})
 *      abre, o assunto aparece como assunto comum, só com o título, sem botão
 *      Material, e o dado dela fica como estava (sem migração);
 *   5. a escolha de assunto abre sem o atalho "Temas do Acervo Educacional";
 *   6. nenhum erro de JavaScript e nenhum pedido que dê 404.
 *
 * Modo envenenado:
 *   node _teste/testa_limpeza_acervo.js --envenenado-lista
 *     o sw.js servido volta a listar './banco/acervo.json' (que não existe
 *     mais): a instalação do service worker falha, e o teste tem de ENXERGAR.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8798;
const VENENO = process.argv.indexOf('--envenenado-lista') !== -1;
const RAIZ = H.RAIZ;
const ler = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const SW = ler('sw.js');
const APP = ler('app.js');
const trocas = {};
const ANCORA_SW = "var ARQUIVOS = [\n";
if (VENENO) trocas['/sw.js'] = SW.split(ANCORA_SW).join(ANCORA_SW + "  './banco/acervo.json',\n");

// ---------------------------------------------------------------- 1 e 2 (Node)
secao('1. O acervo saiu do repositório e ninguém o pede');
['banco/acervo.json', 'banco/acervo_indice.json', 'scripts', '_teste/testa_acervo.js'].forEach(f =>
  conf(f + ' não existe mais', fs.existsSync(path.join(RAIZ, f)), false));
conf('o sw.js não lista nada do acervo', /acervo\.json|acervo_indice/.test(SW.split('var ARQUIVOS')[1] || ''), false);
conf('o confere_tudo.sh não roda o testa_acervo', ler('_teste/confere_tudo.sh').indexOf('testa_acervo') < 0, true);
conf('o app.js não tem a chave ACERVO_EM_CONSTRUCAO', APP.indexOf('ACERVO_EM_CONSTRUCAO') < 0, true);
const funcoes = ['carregarAcervo', 'moduloAcervoPorAssunto', 'desenharTemas()', 'montarMaterialAcervoParaAula',
  'abrirEscolhaAcervoComoAssunto', 'acervoModulos', 'renderizarTextoRicoAcervo', 'exportarPdfTema'];
conf('o app.js não tem as funções do acervo', funcoes.filter(f => APP.indexOf(f) >= 0).join(', '), '');
conf('o index.html não tem a seção da aba Temas', ler('index.html').indexOf('tela-temas') < 0, true);
conf('o styles.css não tem as regras do acervo', /tema-acervo|mapa-mental/.test(ler('styles.css')), false);
conf('e os chips de filtro da Biblioteca continuam no styles.css', /\.chips-filtro \{[\s\S]*\.chip-filtro\.ativo \{/.test(ler('styles.css')), true);

secao('2. Os temas autorais continuam');
const banco = JSON.parse(ler('temas/banco.json'));
conf('temas/banco.json com os 148 temas de matemática', banco.temas.length, 148);

// ---------------------------------------------------------------- navegador
const amb = H.criarAmbiente(PORTA, 'perfil_limpeza_acervo', trocas);
const hojeIso = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
const ASSUNTO_ACERVO = { id: 'acervo-mat-funcoes', titulo: 'Funções: domínio e imagem', fonte: 'acervo', disciplina: 'matematica', acervoId: 'acervo-mat-funcoes' };

(async () => {
  if (VENENO) {
    secao('O veneno é de verdade');
    conf('o sw.js servido ficou DIFERENTE do repositório', trocas['/sw.js'] !== SW ? 'diferente' : 'IGUAL', 'diferente');
  }
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);

  // o service worker instala: todo arquivo da lista existe
  const sw = await esperar('service worker ativo', () => pag.evaluate(() =>
    navigator.serviceWorker.getRegistration().then(r => !!(r && r.active))), v => v === true, VENENO ? 8000 : 30000);
  if (VENENO) {
    conf('VENENO ENXERGADO: com um arquivo que não existe na lista, o service worker não instala', sw.ok, false);
    throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  }
  conf('o service worker instalou com a lista nova (nenhum arquivo faltando)', sw.ok, true);

  // ================================================================
  secao('3. Biblioteca sem pacote: "Em construção"; a aba Temas não existe');
  await H.irParaAba(pag, 'biblioteca');
  await esperar('Em construção', () => pag.evaluate(() => !!document.querySelector('#biblioteca-em-construcao')), v => v === true, 8000);
  conf('a aba Biblioteca mostra "Em construção"', await pag.evaluate(() =>
    (document.querySelector('#biblioteca-em-construcao') || {}).textContent || ''), 'Em construçãoEsta área está sendo preparada.');
  conf('as abas são Agenda, Alunos, Fechamento, Biblioteca e Ajustes', await pag.evaluate(() =>
    Array.from(document.querySelectorAll('#abas .aba')).map(a => a.textContent.trim()).join(',')), 'Agenda,Alunos,Fechamento,Biblioteca,Ajustes');
  conf('a seção antiga da aba Temas não está na página', await pag.evaluate(() => !!document.querySelector('#tela-temas')), false);

  // ================================================================
  secao('4. Aula com assunto gravado do acervo: assunto comum, sem Material');
  await pag.evaluate(async (h, t) => {
    const d = await Store.carregar();
    d.aulas.push({ id: 'aula-acervo-antigo', alunoId: d.alunos[0].id, serieId: null, destacada: false, data: h, hora: '10:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false, anexos: [], temas: [t] });
    await Store.salvar(d);
  }, hojeIso, ASSUNTO_ACERVO);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), hojeIso)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await pausa(120);
  }
  const abriu = await pag.evaluate(h => {
    const p = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(x => /10:00/.test(x.textContent));
    if (!p) return false; p.click(); return true;
  }, hojeIso);
  conf('a aula abriu', abriu, true);
  const linha = await esperar('linha do assunto', () => pag.evaluate(() => {
    const l = Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula')).find(x => /Funções: domínio e imagem/.test(x.textContent));
    return l ? { nome: l.querySelector('.nome').textContent, botoes: Array.from(l.querySelectorAll('button')).map(b => b.textContent.trim()).join(',') } : null;
  }), v => !!v, 8000);
  conf('o assunto aparece com o título gravado', linha.valor && linha.valor.nome, 'Funções: domínio e imagem');
  conf('sem botão Material (só o Tirar de sempre)', linha.valor && linha.valor.botoes, 'Tirar');
  if (process.env.SALVAR_PRINTS) await pag.screenshot({ path: path.join(process.env.SALVAR_PRINTS, 'b5f_8_aula_assunto_acervo.png') });
  conf('o dado dela ficou como estava (sem migração)', JSON.stringify(await pag.evaluate(() =>
    Store.carregar().then(d => d.aulas.find(a => a.id === 'aula-acervo-antigo').temas[0]))), JSON.stringify(ASSUNTO_ACERVO));

  // ================================================================
  secao('5. Escolha de assunto sem o atalho do acervo');
  const abriuEscolha = await pag.evaluate(() => {
    const b = document.querySelector('#escolher-assunto');
    if (!b) return ''; b.click(); return b.textContent.trim();
  });
  conf('o botão de escolher assunto existe', !!abriuEscolha, true);
  const escolha = await esperar('escolha de assunto aberta', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-tema.aberto');
    return m && /Por matéria/i.test(m.textContent) ? m.textContent : '';
  }), v => !!v, 10000);
  conf('a escolha abriu com "Por matéria"', escolha.ok, true);
  conf('sem "Temas do Acervo Educacional"', (escolha.valor || '').indexOf('Acervo') < 0, true);
  if (process.env.SALVAR_PRINTS) await pag.screenshot({ path: path.join(process.env.SALVAR_PRINTS, 'b5f_5_escolha_assunto.png') });

  // ================================================================
  secao('6. Nenhum erro');
  conf('nenhum erro de JavaScript', pag.errosDePagina.join(' | '), '');
  conf('nenhum pedido deu 404', amb.quatrocentos.join(', '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
