/* testa_sem_material_autoral.js
 *
 * O material autoral saiu do ar (item 1 do B7). Os 148 temas de matemática
 * traziam explicação, exercícios autorais e gabarito; a Nathália deu retorno
 * negativo desse material, e com a biblioteca da OBMEP importada o caminho bom
 * passou a ser o da biblioteca.
 *
 * O que este arquivo prova, e o que ele NÃO deixa acontecer:
 *
 * Sem navegador:
 *   1. a chave MATERIAL_AUTORAL_NO_AR existe no app.js e está DESLIGADA;
 *   2. nada foi apagado: os 148 temas continuam no banco, as onze séries de
 *      matemática continuam no repositório, o carregarSerie continua produzindo
 *      o literal 'banco/serie-' (a trava do portão depende dele) e o
 *      PDFGen.gerarMaterialTema continua no pdf.js;
 *   3. GUARDA PERMANENTE do motor e do grafo. O teste AFIRMA que o core.js e o
 *      banco/indice.json estão idênticos byte a byte à base do merge, e só
 *      depois compara, para os 148 temas como alvo, a sequência do
 *      Core.trilhaDerivada da base com a de hoje. Enquanto a primeira asserção
 *      disser "idêntico", a comparação é tautologia DECLARADA e não prova nada
 *      sobre este PR; no dia em que alguém encostar no motor ou no grafo, ela
 *      reprova primeiro e a comparação passa a valer. A seção 3 explica isso
 *      por extenso, porque a primeira versão deste arquivo vendeu a tautologia
 *      como se fosse a prova do brief.
 *
 * No Chrome, sem pacote da biblioteca importado:
 *   4. a janela da aula não tem mais o botão "Material de aula", e a ajuda da
 *      folha não promete mais "atalho opcional" nenhum;
 *   5. um assunto de matemática do banco gravado numa aula fica como assunto
 *      comum: sem botão Material (a biblioteca é que o dá, e não há pacote), e
 *      com a etiqueta do ano, que é grafo e não material;
 *   6. MATERIAL JÁ ANEXADO NUMA AULA ANTIGA CONTINUA ABRINDO: o anexo é arquivo
 *      gravado, a linha diz "com material pronto" e o Abrir entrega o arquivo;
 *   7. O QUE DE FATO PROTEGE A TRILHA NESTE PR, junto com o fato do git da
 *      seção 3: uma trilha de verdade é gravada no banco, o aplicativo é
 *      RECARREGADO, os passos são LIDOS DE VOLTA do IndexedDB e conferidos, a
 *      ficha do aluno abre a trilha guardada e a tela mostra os mesmos passos
 *      na mesma ordem. A ordem da escada ainda é conferida por uma régua que
 *      não é o motor: todo pré-requisito de um passo que esteja na mesma
 *      escada vem antes dele, calculado a partir do índice cru. E o "Ver os
 *      temas soltos", que só levava ao material autoral, saiu;
 *   8. a escolha de assunto continua abrindo, com a matemática na lista, e sem
 *      prometer "material pronto";
 *   9. nenhum erro de JavaScript e nenhum pedido que dê 404.
 *
 * Modo envenenado:
 *   node _teste/testa_sem_material_autoral.js --envenenado-liga
 *     o app.js servido volta com MATERIAL_AUTORAL_NO_AR = true, o percurso é o
 *     MESMO do modo normal do começo ao fim, e no fim o teste confere as SETE
 *     ausências virando presença: o botão "Material de aula" na janela da
 *     aula, o "atalho opcional" na ajuda da folha, o botão Material na linha
 *     do assunto, o "material pronto" na ajuda do assunto, o "Ver os temas
 *     soltos" dentro da trilha E a ajuda do fim dela, o "material pronto" na
 *     escolha de assunto, e o título padrão da janela de tema, que mora no
 *     index.html e é reescrito pelo iniciar() quando a chave está ligada.
 *
 *     Uma ausência sem par não prova nada sobre a chave: ela passaria igual
 *     num app.js em que aquele pedaço de tela nunca fosse desenhado por outro
 *     motivo, um seletor errado por exemplo. Por isso são seis, e por isso o
 *     balanço sai junto no fim, em vez de o primeiro achado encerrar a corrida
 *     e deixar os outros cinco sem conferência.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8799;
const VENENO = process.argv.indexOf('--envenenado-liga') !== -1;
const RAIZ = H.RAIZ;
const ler = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const APP = ler('app.js');

const DESLIGADA = 'var MATERIAL_AUTORAL_NO_AR = false;';
const LIGADA = 'var MATERIAL_AUTORAL_NO_AR = true;';
const trocas = {};
if (VENENO) trocas['/app.js'] = APP.split(DESLIGADA).join(LIGADA);

/* O VENENO COBRE AS SEIS AUSÊNCIAS, E NÃO UMA.
 *
 * A primeira versão deste modo conferia o botão da folha e saía num throw ali
 * mesmo. As outras cinco ausências que a chave governa ficavam sem par: elas
 * passariam igual num app.js em que aquele pedaço de tela nunca fosse
 * desenhado por outro motivo, e o cabeçalho do arquivo prometia uma cobertura
 * que o modo não dava.
 *
 * Agora o percurso é o MESMO nos dois modos, do começo ao fim. Cada ausência
 * passa por aqui: no modo normal ela é conferida na hora; no modo envenenado
 * ela é só ANOTADA, e a conferência das seis sai junta no fim, para que uma
 * que deixe de virar presença apareça ao lado das outras cinco em vez de
 * esconder as seguintes atrás de um throw. */
const venenoVisto = {};
function ausencia(rotulo, obtido, esperadoSemVeneno) {
  if (VENENO) return;                 // no veneno quem confere é o balanço final
  conf(rotulo, obtido, esperadoSemVeneno);
}

// ---------------------------------------------------------------- 1 (Node)
secao('1. A chave existe e está desligada');
conf('o app.js tem a chave MATERIAL_AUTORAL_NO_AR', APP.indexOf('MATERIAL_AUTORAL_NO_AR') >= 0, true);
conf('e ela aparece uma vez só como declaração, desligada', APP.split(DESLIGADA).length - 1, 1);
conf('e não há nenhuma declaração ligada', APP.indexOf(LIGADA) < 0, true);

// ---------------------------------------------------------------- 2 (Node)
secao('2. Nada foi apagado');
const banco = JSON.parse(ler('temas/banco.json'));
conf('temas/banco.json continua com os 148 temas', banco.temas.length, 148);
const indice = JSON.parse(ler('banco/indice.json'));
const temasHoje = indice.temas || indice;
conf('banco/indice.json continua com os 148 temas', temasHoje.length, 148);
const series = fs.readdirSync(path.join(RAIZ, 'banco')).filter(n => /^serie-.*\.json$/.test(n));
conf('as séries de matemática continuam no repositório', series.length >= 11, true);
/* A MESMA linha que o portão confere, e pelo mesmo caminho: o literal tem de
 * estar no CÓDIGO de carregarSerie, e não num comentário. Sem material autoral
 * ninguém mais chama carregarSerie pela tela, e é justamente por isso que a
 * conferência fica aqui: o dia em que alguém a apagar por parecer morta, esta
 * linha e a trava do portão reprovam juntas.
 *
 * CRLF. Este checkout tem core.autocrlf=true e nenhum .gitattributes, então o
 * app.js chega com \r\n e um delimitador escrito com \n NÃO CASA. A primeira
 * versão desta trava cortava por '\n  }\n' e o "corpo" virava todo o resto do
 * arquivo, 234.865 caracteres, sem nenhum sinal: a asserção passava porque o
 * literal estava em ALGUM lugar do app.js, não porque estivesse no código
 * desta função. Normalizar antes de cortar resolve, e as duas asserções de
 * escopo abaixo impedem que o corte volte a inchar calado. O comentário logo
 * acima da função (app.js:8009) também contém o literal, e é justamente dele
 * que o escopo precisa se defender. */
const APP_LF = APP.replace(/\r\n/g, '\n');
const depoisDaAssinatura = APP_LF.split('function carregarSerie(')[1] || '';
const corpoBruto = depoisDaAssinatura.split('\n  }\n')[0];
const corpoCarregarSerie = corpoBruto
  .split('\n').filter(l => !/^\s*(\/\*|\*|\/\/)/.test(l)).join('\n');
conf('achei a assinatura de carregarSerie no app.js', depoisDaAssinatura.length > 0, true);
conf('e o corte parou no fim da função, em vez de levar o resto do arquivo',
  corpoBruto.length > 0 && corpoBruto.length < 3000, true);
/* A SEGUNDA METADE TEM DE PODER FALHAR.
 *
 * A primeira versão desta linha perguntava se o corpo contém
 * 'function carregarSerie(' e afirmava que não. Isso é verdade por
 * CONSTRUÇÃO: corpoBruto nasce de um split por essa mesma string, e
 * String.split nunca deixa o delimitador nas partes. Era -1 sempre, e o
 * rótulo prometia "não tem a próxima função" sem medir nada disso.
 *
 * A pergunta certa é por uma função IRMÃ, no mesmo nível da IIFE: dois espaços
 * de indentação depois de uma quebra de linha. Dentro do corpo de verdade não
 * existe nenhuma (a única `function` de lá é a `function (r)` do `.then`, na
 * mesma linha do fetch), e a primeira apareceria no instante em que o corte
 * passasse do fim da função, que é exatamente o defeito a pegar. */
conf('o escopo é mesmo o desta função (tem a linha da url e não invade a função seguinte)',
  /var url = /.test(corpoBruto) && corpoBruto.indexOf('\n  function ') < 0, true);
conf('carregarSerie continua produzindo o literal banco/serie-', /'banco\/serie-'\s*\+/.test(corpoCarregarSerie), true);
conf('o pdf.js continua com o gerarMaterialTema', ler('pdf.js').indexOf('function gerarMaterialTema(') >= 0, true);
conf('o sw.js continua listando o índice dos temas', ler('sw.js').indexOf("'./banco/indice.json'") >= 0, true);

// ---------------------------------------------------------------- 3 (Node)
secao('3. Guarda permanente: o motor e o grafo da trilha não foram tocados');

/* O QUE ESTA SEÇÃO É, E O QUE ELA NÃO É.
 *
 * Ela NÃO é a evidência de que este PR preservou a trilha. Não pode ser: neste
 * PR o core.js e o banco/indice.json estão idênticos byte a byte à base do
 * merge, então a comparação dos 148 temas roda o MESMO programa sobre o MESMO
 * dado dos dois lados e não tem como reprovar. Comparar f(x) com f(x) e chamar
 * isso de prova é enfeite, e foi assim que a primeira versão deste arquivo
 * vendeu a seção.
 *
 * O que ela É: uma guarda PERMANENTE, que dorme enquanto os dois arquivos não
 * mudarem e acorda sozinha no dia em que mudarem. Por isso a identidade byte a
 * byte é AFIRMADA aqui embaixo, e não suposta: enquanto as duas primeiras
 * asserções disserem "idêntico", a comparação abaixo é tautologia declarada;
 * no primeiro PR que encostar no motor ou no grafo, elas reprovam, o leitor é
 * mandado para cá, e a comparação dos 148 passa a valer de verdade.
 *
 * O que protege a trilha NESTE PR é outra coisa, e está em dois lugares: o
 * fato do git, que as duas asserções abaixo medem, e a seção 7, que abre no
 * Chrome uma trilha de verdade GRAVADA no banco e confere os passos que a tela
 * mostra contra o motor. */

function baseDoMerge() {
  const tentativas = ['git merge-base HEAD origin/main', 'git merge-base HEAD main',
    'git rev-parse --verify -q origin/main', 'git rev-parse --verify -q main'];
  for (let i = 0; i < tentativas.length; i++) {
    try {
      const s = execSync(tentativas[i], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      if (s) return s;
    } catch (e) { /* tenta a próxima */ }
  }
  return '';
}
function doGit(base, arquivo) {
  return execSync('git show ' + base + ':' + arquivo, { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }).toString();
}

const base = baseDoMerge();
conf('achei a base do merge para comparar', base ? 'achei' : 'nenhuma', 'achei');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'b7_trilha_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

/* O motor de ANTES sai do git, e não de uma cópia guardada à mão: cópia
 * guardada à mão envelhece calada e a comparação vira o arquivo consigo mesmo. */
let CoreAntes = null, temasAntes = null;
if (base) {
  const caminhoCore = path.join(TMP, 'core_antes.js');
  fs.writeFileSync(caminhoCore, doGit(base, 'core.js'));
  CoreAntes = require(caminhoCore);
  const bruto = JSON.parse(doGit(base, 'banco/indice.json'));
  temasAntes = bruto.temas || bruto;
}
const CoreHoje = require('../core.js');

if (base) {
  /* A IDENTIDADE É AFIRMADA, NÃO SUPOSTA.
   *
   * Sem estas duas asserções, a comparação dos 148 logo abaixo é uma tautologia
   * silenciosa: o leitor vê "nenhuma trilha mudou" e acredita que alguma coisa
   * foi medida. Com elas, o arquivo diz em voz alta o que está acontecendo. Se
   * um PR futuro encostar no core.js ou no banco/indice.json, estas duas
   * reprovam PRIMEIRO, com a mensagem mandando ler o comentário da seção, e a
   * comparação dos 148 deixa de ser tautologia e passa a ser a prova de que a
   * mexida não mudou nenhuma das 148 escadas.
   *
   * A conta é do próprio git, contra a ÁRVORE DE TRABALHO e não contra o
   * último commit, para que mudança ainda não commitada também apareça. É o
   * git que resolve o CRLF, pelos filtros dele; comparar os textos na mão aqui
   * acusaria diferença em todo arquivo do checkout. */
  const mexidos = (() => {
    try {
      return execSync('git diff --name-only ' + base + ' -- core.js banco/indice.json',
        { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch (e) { return 'NAO CONSEGUI MEDIR'; }
  })();
  conf('o core.js e o banco/indice.json estão idênticos byte a byte à base do merge, ' +
    'então a comparação abaixo é tautologia DECLARADA; no dia em que esta asserção ' +
    'reprovar, ela passa a valer de verdade e o motivo está no comentário da seção 3',
    mexidos || 'nenhum', 'nenhum');
  conf('o banco/indice.json de hoje é o mesmo da base', JSON.stringify(temasAntes) === JSON.stringify(temasHoje), true);
  /* Os 148 temas como alvo, e não uma amostra: é barato, e a lacuna que a
   * Nathália marcar amanhã pode cair em qualquer um deles. O máximo é o mesmo
   * que a tela usa (6), e os cortados entram na comparação porque é deles que
   * sai o "Puxar mais de trás". */
  const sequencia = (Core, temas, alvo) => {
    const d = Core.trilhaDerivada(temas, alvo, { maximo: 6 });
    return d.passos.map(p => p.temaId + '@' + p.serie + '/' + p.duracaoMin).join('>') +
      ' | cortados: ' + d.cortados.map(p => p.temaId).join('>');
  };
  const diferentes = [];
  let comPasso = 0;
  temasHoje.forEach(t => {
    const antes = sequencia(CoreAntes, temasAntes, t.id);
    const depois = sequencia(CoreHoje, temasHoje, t.id);
    if (antes !== depois) diferentes.push(t.id);
    if (depois.indexOf('>') >= 0) comPasso++;
  });
  conf('os 148 temas entraram na comparação', temasHoje.length, 148);
  conf('e a maioria tem escada de verdade (mais de um passo)', comPasso > 100, true);
  conf('nenhuma trilha mudou de sequência entre a base e hoje',
    diferentes.length ? diferentes.slice(0, 5).join(', ') : 'nenhuma mudou', 'nenhuma mudou');

  /* A COMPARAÇÃO SABE REPROVAR. Sem este par, "nenhuma mudou" seria verdade
   * também se sequencia() devolvesse sempre a mesma string. Um tema com um
   * pré-requisito a menos tem de sair com sequência diferente. */
  const temasMexidos = JSON.parse(JSON.stringify(temasHoje));
  const alvoMexido = temasMexidos.filter(t => (t.prerequisitos || []).length)[0];
  conf('achei um tema com pré-requisito para envenenar a comparação', !!alvoMexido, true);
  if (alvoMexido) {
    alvoMexido.prerequisitos = [];
    conf('tirando um pré-requisito, a sequência daquele tema MUDA',
      sequencia(CoreHoje, temasHoje, alvoMexido.id) !== sequencia(CoreHoje, temasMexidos, alvoMexido.id), true);
  }
}

// ---------------------------------------------------------------- navegador
const amb = H.criarAmbiente(PORTA, 'perfil_sem_autoral', trocas);
const hojeIso = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();

/* Dois assuntos de matemática do banco, os dois com registro no índice: um
 * limpo (é ele que não pode ganhar botão Material) e um com PDF anexado de
 * antes (é ele que tem de continuar abrindo). */
const ALVO = temasHoje.filter(t => t.serie === '08')[0] || temasHoje[0];
const ASSUNTO_LIMPO = { id: ALVO.id, titulo: ALVO.pt.titulo, fonte: 'banco', disciplina: 'matematica' };
const OUTRO = temasHoje.filter(t => t.id !== ALVO.id)[0];
const ANEXO_ID = 'anexo-b7-antigo';
const ASSUNTO_COM_MATERIAL = {
  id: OUTRO.id, titulo: OUTRO.pt.titulo, fonte: 'banco', disciplina: 'matematica',
  lingua: 'pt', partes: ['material', 'lista'], exercicios: 7, anexoId: ANEXO_ID
};

(async () => {
  if (VENENO) {
    secao('O veneno é de verdade');
    conf('o app.js servido ficou DIFERENTE do repositório', trocas['/app.js'] !== APP ? 'diferente' : 'IGUAL', 'diferente');
    conf('e o veneno ligou a chave', trocas['/app.js'].indexOf(LIGADA) >= 0, true);
  }
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);

  // ================================================================
  secao('4. A janela da aula sem o botão "Material de aula"');
  await pag.evaluate(async (h, limpo, comMat, anexoId) => {
    const d = await Store.carregar();
    const alunoId = d.alunos[0].id;
    const comum = { id: 'aula-b7-limpa', alunoId: alunoId, serieId: null, destacada: false, data: h, hora: '09:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false,
      anexos: [], temas: [limpo] };
    const antiga = { id: 'aula-b7-anexo', alunoId: alunoId, serieId: null, destacada: false, data: h, hora: '11:00',
      duracaoMin: 60, status: 'realizada', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false,
      anexos: [{ id: anexoId, nome: 'material-antigo.pdf', tamanho: 2048 }], temas: [comMat] };
    /* Uma aula AINDA SEM ASSUNTO. A ajuda que promete material só é desenhada
     * neste estado (app.js: `if (!quantos)`), e é ela a sexta ausência que a
     * chave governa. Sem esta aula, a leitura vinha vazia e a asserção de
     * ausência passava sem ver nada: foi o veneno das seis que denunciou. */
    const vazia = { id: 'aula-b7-sem-assunto', alunoId: alunoId, serieId: null, destacada: false, data: h, hora: '14:00',
      duracaoMin: 60, status: 'prevista', cobravel: true, notaTexto: '', notaPrivada: '', temNota: false,
      anexos: [], temas: [] };
    d.aulas.push(comum, antiga, vazia);
    await Store.salvarAnexo(anexoId, {
      nome: 'material-antigo.pdf', tipo: 'application/pdf',
      blob: new Blob([new Uint8Array(2048)], { type: 'application/pdf' })
    });
    await Store.salvar(d);
  }, hojeIso, ASSUNTO_LIMPO, ASSUNTO_COM_MATERIAL, ANEXO_ID);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'agenda');
  for (let i = 0; i < 24; i++) {
    if (await pag.evaluate(h => !!document.querySelector('[data-dia="' + h + '"]'), hojeIso)) break;
    await pag.click(i < 12 ? '#mes-seguinte' : '#mes-anterior');
    await pausa(120);
  }
  const abrirAulaDe = async hora => {
    await pag.evaluate(() => { const f = document.querySelector('#modal-aula .fechar'); if (f) f.click(); });
    await pausa(150);
    const ok = await pag.evaluate((h, hh) => {
      const p = Array.from(document.querySelectorAll('[data-dia="' + h + '"] .pilula')).find(x => x.textContent.indexOf(hh) >= 0);
      if (!p) return false; p.click(); return true;
    }, hojeIso, hora);
    if (!ok) throw Object.assign(new Error('não achei a aula das ' + hora), { jaContado: false });
    await esperar('a janela da aula das ' + hora, () => pag.evaluate(() =>
      !!document.querySelector('#modal-aula.aberto #linha-folha')), v => v === true, 10000);
    await pausa(250);
  };
  await abrirAulaDe('09:00');

  /* Lido ANTES de qualquer janela de tema abrir, porque todo caminho que abre
   * aquela janela escreve o título por cima: depois disso o padrão já não está
   * mais lá para ser medido. */
  venenoVisto.tituloPadraoDoTema = await pag.evaluate(() =>
    (document.querySelector('#titulo-modal-tema') || {}).textContent || 'SEM TITULO');
  ausencia('o título padrão da janela de tema não fala mais em material',
    venenoVisto.tituloPadraoDoTema, 'Assunto da aula');

  const botoesDaFolha = await pag.evaluate(() =>
    Array.from(document.querySelectorAll('#linha-folha button')).map(b => b.textContent.trim()).join(' | '));
  venenoVisto.botoesDaFolha = botoesDaFolha;
  ausencia('a folha em branco continua sendo o primeiro botão, e não há "Material de aula"',
    botoesDaFolha, 'Escrever à mão na folha | Anexar PDF | Anexar foto');
  const ajuda = await pag.$eval('#ajuda-folha', e => e.textContent);
  venenoVisto.ajudaDaFolha = ajuda;
  conf('o texto continua dizendo que a folha é o começo', /folha em branco é sempre o começo/i.test(ajuda), true);
  ausencia('e não promete mais "atalho opcional" de material', /atalho opcional/i.test(ajuda), false);
  ausencia('e não cita mais "Material de aula"', /Material de aula/.test(ajuda), false);

  // ================================================================
  secao('5. Assunto do banco: assunto comum, sem Material');
  /* ESPERAR A LINHA ASSENTAR, E NÃO A LINHA EXISTIR.
   *
   * A linha é desenhada duas vezes: uma antes de o índice dos temas chegar, em
   * que `registro` ainda é nulo, e outra depois, quando a etiqueta do ano
   * aparece. O botão Material da linha depende de `registro`
   * (`temAutoral = MATERIAL_AUTORAL_NO_AR && !!registro`), então ele só existe
   * no SEGUNDO desenho.
   *
   * Com o predicado "a linha existe", a leitura podia pegar o primeiro
   * desenho. No modo normal isso nunca aparecia, porque o esperado é "Tirar",
   * que vale nos dois momentos; no modo envenenado o esperado é
   * "Material,Tirar", e o veneno reprovava de vez em quando. Foi o INSTAVEL do
   * portão das 11:33, e é a mesma família de defeito que este PR conserta: a
   * asserção amostrava um estado transitório.
   *
   * A etiqueta do ano é a condição exata do assentamento, porque ela vem do
   * mesmo `registro`, e vale nos DOIS modos. */
  const linhaLimpa = await esperar('linha do assunto limpo, já com a etiqueta do ano', () => pag.evaluate(t => {
    const l = Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula')).find(x => x.textContent.indexOf(t) >= 0);
    return l ? {
      nome: l.querySelector('.nome').textContent.trim(),
      detalhe: (l.querySelector('.detalhe') || {}).textContent || '',
      botoes: Array.from(l.querySelectorAll('button')).map(b => b.textContent.trim()).join(',')
    } : null;
  }, ASSUNTO_LIMPO.titulo), v => !!v && /ano|médio/i.test(v.detalhe), 10000);
  conf('o assunto aparece com o título gravado', linhaLimpa.valor && linhaLimpa.valor.nome, ASSUNTO_LIMPO.titulo);
  venenoVisto.botoesDoAssunto = linhaLimpa.valor && linhaLimpa.valor.botoes;
  venenoVisto.detalheDoAssunto = linhaLimpa.valor && linhaLimpa.valor.detalhe;
  ausencia('sem botão Material (só o Tirar de sempre)', linhaLimpa.valor && linhaLimpa.valor.botoes, 'Tirar');
  conf('e a etiqueta do ano continua, porque ano é grafo',
    linhaLimpa.valor && /ano|médio/i.test(linhaLimpa.valor.detalhe), true);
  /* A promessa de material mora na aula AINDA SEM ASSUNTO, que é onde ela
   * escolhe. Sem pacote da biblioteca e sem material autoral não há material
   * nenhum a oferecer, e a frase tem de parar no fechamento do mês. */
  await abrirAulaDe('14:00');
  const ajudaDoAssunto = await pag.evaluate(() => {
    const a = Array.from(document.querySelectorAll('#corpo-modal-aula .ajuda'))
      .find(x => /fechamento do mês/i.test(x.textContent));
    return a ? a.textContent.trim() : 'NAO ACHEI A AJUDA DO ASSUNTO';
  });
  venenoVisto.ajudaDoAssunto = ajudaDoAssunto;
  conf('a ajuda do assunto está na tela da aula sem assunto',
    /fechamento do mês/i.test(ajudaDoAssunto), true);
  ausencia('e ela não promete mais material pronto daqui',
    ajudaDoAssunto, 'O assunto entra no fechamento do mês.');
  await abrirAulaDe('09:00');
  conf('o dado dela ficou como estava (sem migração)', JSON.stringify(await pag.evaluate(() =>
    Store.carregar().then(d => d.aulas.find(a => a.id === 'aula-b7-limpa').temas[0]))), JSON.stringify(ASSUNTO_LIMPO));

  // ================================================================
  secao('6. Material já anexado numa aula antiga continua abrindo');
  await abrirAulaDe('11:00');
  const linhaAnexo = await esperar('linha do assunto com material', () => pag.evaluate(t => {
    const l = Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula')).find(x => x.textContent.indexOf(t) >= 0);
    return l ? {
      tags: Array.from(l.querySelectorAll('.tag')).map(x => x.textContent.trim()).join(','),
      botoes: Array.from(l.querySelectorAll('button')).map(b => b.textContent.trim()).join(',')
    } : null;
  }, ASSUNTO_COM_MATERIAL.titulo), v => !!v, 10000);
  conf('a linha continua dizendo "com material pronto"', linhaAnexo.valor && linhaAnexo.valor.tags, 'com material pronto');
  conf('e continua sem botão Material, que é o comportamento de sempre de quem já tem PDF',
    linhaAnexo.valor && linhaAnexo.valor.botoes, 'Tirar');
  const anexoNaTela = await pag.evaluate(() => {
    const l = document.querySelector('#lista-anexos .item-lista');
    return l ? { nome: l.querySelector('.nome').textContent.trim(), botoes: Array.from(l.querySelectorAll('button')).map(b => b.textContent.trim()).join(',') } : null;
  });
  conf('o anexo está listado na aula', anexoNaTela && anexoNaTela.nome, 'material-antigo.pdf');
  conf('com os botões Abrir e Remover', anexoNaTela && anexoNaTela.botoes, 'Abrir,Remover');
  const abriuAnexo = await pag.evaluate(id => Store.lerAnexo(id).then(r => (r && r.blob ? r.blob.size : -1)), ANEXO_ID);
  conf('e o arquivo continua gravado, com os bytes dele', abriuAnexo, 2048);
  await pag.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#lista-anexos button')).find(x => x.textContent.trim() === 'Abrir');
    if (b) b.click();
  });
  await pausa(600);
  conf('tocar em Abrir não quebra nada', pag.errosDePagina.join(' | '), '');
  await pag.evaluate(() => { const f = document.querySelector('#modal-aula .fechar'); if (f) f.click(); });
  await pausa(200);

  // ================================================================
  secao('7. A trilha continua andando, sem "Ver os temas soltos"');
  const derivada = CoreHoje.trilhaDerivada(temasHoje, ALVO.id, { maximo: 6 });
  const esperada = derivada.passos.map(p => p.titulo).join(' > ');

  /* UMA RÉGUA QUE NÃO É O PRÓPRIO MOTOR.
   *
   * Comparar a sequência da página com a sequência do node é comparar o
   * core.js com ele mesmo: é o MESMO arquivo servido para os dois, e um
   * defeito dentro de trilhaDerivada move os dois lados junto. Essa asserção
   * continua abaixo, porque ela prova a LIGAÇÃO (a página carregou o core.js,
   * baixou o índice e conseguiu rodar), mas ela não julga o resultado.
   *
   * Quem julga o resultado é esta conta aqui, feita a partir do índice CRU: a
   * trilha é uma escada de pré-requisitos, então todo pré-requisito de um
   * passo que também esteja na escada tem de vir ANTES dele. É a propriedade
   * que define o que trilhaDerivada promete, calculada sem chamar
   * trilhaDerivada. */
  const porId = {};
  temasHoje.forEach(t => { porId[t.id] = t; });
  const ordem = {};
  derivada.passos.forEach((p, i) => { ordem[p.temaId] = i; });
  const foraDeOrdem = derivada.passos.filter(p => {
    const pre = (porId[p.temaId] || {}).prerequisitos || [];
    return pre.some(q => ordem[q] !== undefined && ordem[q] > ordem[p.temaId]);
  }).map(p => p.temaId);
  conf('a trilha tem passos para conferir', derivada.passos.length > 1, true);
  conf('e nenhum passo vem antes de um pré-requisito dele que está na mesma escada',
    foraDeOrdem.length ? foraDeOrdem.join(', ') : 'nenhum fora de ordem', 'nenhum fora de ordem');

  const daTela = await pag.evaluate(alvo => new Promise(r => {
    // o motor que ESTÁ NA PÁGINA, lendo o índice que a página baixou
    fetch('banco/indice.json').then(x => x.json()).then(j => {
      const temas = j.temas || j;
      r(Core.trilhaDerivada(temas, alvo, { maximo: 6 }).passos.map(p => p.titulo).join(' > '));
    });
  }), ALVO.id);
  conf('a página carrega o motor e o índice e consegue derivar a mesma escada (ligação, não veredito)',
    daTela, esperada);
  /* Uma trilha de verdade, guardada no aluno, aberta na tela: é lá dentro que
   * o "Ver os temas soltos" morava, e a ausência só prova alguma coisa com a
   * janela da trilha ABERTA. */
  const gravada = await pag.evaluate(alvo => new Promise(r => {
    fetch('banco/indice.json').then(x => x.json()).then(async j => {
      const temas = j.temas || j;
      const d = await Store.carregar();
      const aluno = d.alunos[0];
      const der = Core.trilhaDerivada(temas, alvo, { maximo: 6 });
      aluno.trilhas = [Core.criarTrilha({
        alunoId: aluno.id, lacunaId: null, titulo: der.alvo.pt ? der.alvo.pt.titulo : der.alvo.titulo,
        alvoId: alvo, materia: 'matematica', passos: der.passos
      })];
      await Store.salvar(d);
      /* NÃO devolve os passos que acabou de calcular. Quem afirma o que ficou
       * gravado é a leitura de volta, depois do reload, logo abaixo: devolver
       * der.passos aqui e compará-los com o motor seria o teste conferindo o
       * que ele mesmo escreveu, e um criarTrilha que largasse os passos pelo
       * caminho passaria verde. */
      r({ alunoId: aluno.id, quantos: der.passos.length });
    });
  }), ALVO.id);
  conf('a trilha foi gravada com passos', gravada.quantos > 1, true);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);

  /* LIDA DE VOLTA DO BANCO, numa sessão nova do aplicativo: o reload derrubou
   * o db em memória, então isto sai mesmo do IndexedDB. Prova que criarTrilha
   * guardou os passos e que o Store os devolveu inteiros. */
  const doBanco = await pag.evaluate(id => Store.carregar().then(d => {
    const a = (d.alunos || []).find(x => x.id === id);
    const t = a && (a.trilhas || [])[0];
    if (!t) return 'NENHUMA TRILHA GRAVADA';
    return (t.passos || []).map(p => p.titulo).join(' > ');
  }), gravada.alunoId);
  conf('a trilha lida de volta do banco tem os passos do motor, na ordem', doBanco, esperada);

  await H.irParaAba(pag, 'alunos');
  // a ficha DAQUELE aluno: a lista sai por nome, e o primeiro da lista pode ser outro
  const abriuFicha = await pag.evaluate(id => {
    const l = document.querySelector('#lista-alunos .item-lista[data-aluno="' + id + '"]');
    if (!l) return false; l.click(); return true;
  }, gravada.alunoId);
  conf('a ficha do aluno abriu', abriuFicha, true);
  await pausa(800);
  const temCartao = await esperar('o cartão da trilha no painel da ficha',
    () => pag.evaluate(() => !!document.querySelector('#painel-trilhas .item-trilha-ativa .abrir-trilha')), v => v === true, 10000);
  conf('o painel da ficha mostra a trilha guardada', temCartao.ok, true);
  await pag.evaluate(() => document.querySelector('#painel-trilhas .item-trilha-ativa .abrir-trilha').click());
  const abriuTrilha = await esperar('a janela da trilha',
    () => pag.evaluate(() => !!document.querySelector('#modal-trilha.aberto .item-passo-trilha')), v => v === true, 10000);
  conf('a trilha guardada abriu na tela', abriuTrilha.ok, true);
  const naTrilha = await pag.evaluate(() => {
    const m = document.querySelector('#modal-trilha.aberto');
    /* A AJUDA, E NÃO O TEXTO DO MODAL INTEIRO.
     *
     * Ler `m.textContent` para medir a ajuda é medir o botão de novo: com a
     * chave ligada o rótulo "Ver os temas soltos" está dentro do modal, então
     * a palavra aparece no texto mesmo que a ajuda não seja desenhada. Foi o
     * que a demonstração de reprovação mostrou: apagar o ajudaDoFim não fazia
     * a asserção cair, porque ela estava lendo o botão. O alvo certo são as
     * `.ajuda` do corpo, que é onde o ajudaDoFim mora. */
    const ajudas = Array.from(m.querySelectorAll('.ajuda')).map(x => x.textContent).join(' | ');
    return {
      passos: Array.from(m.querySelectorAll('.item-passo-trilha .nome')).map(x => x.textContent.replace(/^\d+\.\s*/, '').trim()).join(' > '),
      soltos: !!document.querySelector('#trilha-temas-soltos'),
      ajudas: ajudas,
      texto: m.textContent
    };
  });
  conf('a trilha mostra os mesmos passos, na mesma ordem', naTrilha.passos, esperada);
  venenoVisto.soltosNaTrilha = naTrilha.soltos;
  venenoVisto.ajudasDaTrilha = naTrilha.ajudas;
  ausencia('o botão "Ver os temas soltos" não existe mais dentro da trilha', naTrilha.soltos, false);
  ausencia('e a ajuda do fim da trilha não fala mais em temas soltos',
    /temas soltos/i.test(naTrilha.ajudas), false);
  ausencia('nem o resto do texto da janela', /temas soltos/i.test(naTrilha.texto), false);
  conf('o "+ Acrescentar passo" continua lá', await pag.evaluate(() => !!document.querySelector('#acrescentar-passo')), true);
  await pag.evaluate(() => { const f = document.querySelector('#modal-trilha .fechar'); if (f) f.click(); });
  await pausa(200);
  await pag.evaluate(() => { const f = document.querySelector('#modal-aluno .fechar'); if (f) f.click(); });
  await pausa(200);

  // ================================================================
  secao('8. A escolha de assunto continua, sem prometer material');
  await H.irParaAba(pag, 'agenda');
  await abrirAulaDe('09:00');
  await pag.evaluate(() => { const b = document.querySelector('#escolher-assunto'); if (b) b.click(); });
  const escolha = await esperar('escolha de assunto aberta', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-tema.aberto');
    return m && /Por matéria/i.test(m.textContent) ? m.textContent : '';
  }), v => !!v, 12000);
  conf('a escolha abriu com "Por matéria"', escolha.ok, true);
  conf('a matemática continua na lista', /Matemática/.test(escolha.valor || ''), true);
  venenoVisto.escolhaDeAssunto = escolha.valor || '';
  ausencia('e nenhuma linha promete "material pronto"', /material pronto/i.test(escolha.valor || ''), false);
  await pag.evaluate(() => { const f = document.querySelector('#modal-tema .fechar'); if (f) f.click(); });
  await pausa(200);

  // ================================================================
  if (VENENO) {
    secao('VENENO: com a chave ligada, as SETE ausências viram presenças');
    /* Cada uma destas é o par de uma ausência conferida no modo normal, no
     * mesmo ponto do mesmo percurso. Se alguma deixar de virar presença, a
     * ausência correspondente lá em cima passou a valer por outro motivo que
     * não a chave, e é isso que este balanço existe para pegar. */
    conf('1. o botão "Material de aula" volta à janela da aula',
      venenoVisto.botoesDaFolha, 'Escrever à mão na folha | Material de aula | Anexar PDF | Anexar foto');
    conf('2. a ajuda da folha volta a prometer o atalho opcional',
      /atalho opcional/i.test(venenoVisto.ajudaDaFolha || ''), true);
    conf('3. a linha do assunto volta a ter o botão Material',
      venenoVisto.botoesDoAssunto, 'Material,Tirar');
    conf('4. a ajuda do assunto volta a dizer que o material sai dali',
      /material pronto/i.test(venenoVisto.ajudaDoAssunto || ''), true);
    conf('5. o "Ver os temas soltos" volta para dentro da trilha',
      venenoVisto.soltosNaTrilha, true);
    /* O BOTÃO E A AJUDA SÃO DOIS RAMOS DIFERENTES, governados pela mesma chave
     * mas escritos em lugares distintos do app.js: o botão em `if
     * (MATERIAL_AUTORAL_NO_AR) barraDoFim.push(...)` e a ajuda no ternário do
     * `ajudaDoFim`, logo abaixo. Sem este par, a ausência do texto lá em cima
     * era a única das oito sem contraparte, e passaria verde se o ajudaDoFim
     * deixasse de ser desenhado por qualquer outro motivo. O valor já estava
     * sendo capturado e nunca era lido. */
    conf('5b. e a AJUDA do fim da trilha volta a falar em temas soltos',
      /temas soltos/i.test(venenoVisto.ajudasDaTrilha || ''), true);
    conf('6. a escolha de assunto volta a prometer "material pronto"',
      /material pronto/i.test(venenoVisto.escolhaDeAssunto || ''), true);
    /* A SÉTIMA, que mora no index.html e por isso não enxerga a constante.
     * Com a chave ligada, o arranque reescreve o título padrão da janela de
     * tema para o texto da base. É o pedaço que faltava para "trocar false por
     * true devolve tudo" ser literal, e não quase. */
    conf('7. o título padrão da janela de tema volta a ser o da base',
      venenoVisto.tituloPadraoDoTema, 'Material de aula');
    throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  }

  // ================================================================
  secao('9. Nenhum erro');
  conf('nenhum erro de JavaScript', pag.errosDePagina.join(' | '), '');
  conf('nenhum pedido deu 404', amb.quatrocentos.join(', '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
