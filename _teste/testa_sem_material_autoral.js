/* testa_sem_material_autoral.js
 *
 * O material autoral saiu do REPOSITÓRIO (B14, 26/10/2026, decisão D8 do
 * dono). Desde a 1.26 ele estava fora do ar atrás de uma chave; no B14 a chave
 * saiu, e com ela os 148 temas (temas/), as séries do banco, o kit de figuras
 * e as fontes de português, com cópia no Drive. Ficou o ÍNDICE de assuntos de
 * matemática, banco/topicos/matematica.json, com os mesmos ids.
 *
 * O que este arquivo prova:
 *
 * Sem navegador:
 *   1. a chave saiu do app.js, e com ela as funções que só ela alcançava;
 *   2. o material saiu do repositório e do pacote do service worker, e o índice
 *      de assuntos ficou, com os 148 ids de sempre e sem conteúdo;
 *   3. a MIGRAÇÃO não mudou trilha nenhuma: enquanto a base do merge ainda
 *      tiver o banco/indice.json antigo, a escada de cada um dos 148 assuntos
 *      como alvo é calculada com o motor e o índice de antes e com os de hoje,
 *      e as duas têm de ser iguais. Depois do merge do B14 a base não tem mais
 *      o índice antigo, e a seção diz isso com todas as letras, sem fingir que
 *      comparou.
 *
 * No Chrome, sem pacote da biblioteca importado:
 *   4. a janela da aula não tem o botão "Material de aula", e a ajuda da folha
 *      não promete "atalho opcional" nenhum;
 *   5. um assunto de matemática do índice gravado numa aula fica como assunto
 *      comum: sem botão Material (a biblioteca é que o dá, e não há pacote), e
 *      com a etiqueta do ano, que é do índice;
 *   6. MATERIAL JÁ ANEXADO NUMA AULA ANTIGA CONTINUA ABRINDO: o anexo é arquivo
 *      gravado, a linha diz "com material pronto" e o Abrir entrega o arquivo;
 *   7. uma trilha de verdade é gravada, o aplicativo é RECARREGADO, os passos
 *      são lidos de volta do IndexedDB e a tela mostra os mesmos passos na
 *      mesma ordem, sem "Ver os temas soltos";
 *   8. a escolha de assunto continua abrindo, com a matemática na lista;
 *   9. nenhum erro de JavaScript e nenhum pedido que dê 404.
 *
 * O modo --envenenado-liga, que religava a chave no app.js servido e conferia
 * as ausências virando presença, saiu junto com a chave: não há mais o que
 * religar. As ausências do modo normal ficam como conferências comuns.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8799;
const RAIZ = H.RAIZ;
const ler = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const existe = f => fs.existsSync(path.join(RAIZ, f));
const APP = ler('app.js');
const trocas = {};

/* Sem veneno, cada ausência é uma conferência comum. O nome fica para o
 * percurso de baixo continuar lendo do mesmo jeito. */
const venenoVisto = {};
function ausencia(rotulo, obtido, esperado) {
  conf(rotulo, obtido, esperado);
}

// ---------------------------------------------------------------- 1 (Node)
secao('1. A chave saiu, e com ela o que só ela alcançava');
/* O nome da chave é montado em pedaços, para o aceite do B14 ("grep do nome
 * da chave no repositório volta vazio") valer ao pé da letra também para
 * este arquivo, que é quem confere. */
const NOME_DA_CHAVE = 'MATERIAL_' + 'AUTORAL_NO_AR';
conf('o app.js não cita mais a chave do material autoral', APP.indexOf(NOME_DA_CHAVE) >= 0, false);
['function carregarSerie(', 'function abrirMontagem(', 'function desenharMontagem(',
  'function gerarMaterialDoTema(', 'function abrirTemas(', 'function botaoTemasSoltos(',
  'function comNotacao('].forEach(f => {
  conf('o app.js não tem mais ' + f.replace('function ', '').replace('(', ''), APP.indexOf(f) < 0, true);
});
conf('o index.html não carrega mais o kit de figuras', /src="figuras\//.test(ler('index.html')), false);

// ---------------------------------------------------------------- 2 (Node)
secao('2. O material saiu, e o índice de assuntos ficou');
['temas', 'figuras', 'fontes', 'banco/portugues', 'banco/indice.json', 'banco/busca.json'].forEach(f => {
  conf(f + ' saiu do repositório', existe(f), false);
});
const series = fs.readdirSync(path.join(RAIZ, 'banco')).filter(n => /^serie-.*\.json$/.test(n));
conf('nenhuma série do banco ficou', series.join(', ') || 'nenhuma', 'nenhuma');
const indice = JSON.parse(ler('banco/topicos/matematica.json'));
const temasHoje = indice.temas;
conf('o índice de assuntos tem os 148 de matemática', temasHoje.length, 148);
conf('sem conteúdo nenhum (resumo, inglês, exercícios)',
  temasHoje.some(t => (t.pt && t.pt.resumo) || t.en || t.qtd != null || t.exercicios), false);
const SW = ler('sw.js');
const listaSw = (SW.split('var ARQUIVOS = [')[1] || '').split('];')[0];
// só as ENTRADAS da lista (caminho entre aspas): o comentário da lista cita os
// mesmos nomes para contar o que saiu, e ler o trecho inteiro acusaria o comentário
conf('o pacote do service worker não lista mais figuras nem o banco autoral',
  /'\.\/(figuras\/|banco\/indice\.json|banco\/busca\.json|banco\/portugues)/.test(listaSw), false);
conf('e lista o índice de assuntos de matemática', listaSw.indexOf("'./banco/topicos/matematica.json'") >= 0, true);

// ---------------------------------------------------------------- 3 (Node)
secao('3. A migração não mudou trilha nenhuma');

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
  try {
    return execSync('git show ' + base + ':' + arquivo, { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }).toString();
  } catch (e) { return null; }
}

const base = baseDoMerge();
conf('achei a base do merge', base ? 'achei' : 'nenhuma', 'achei');
const indiceAntigoBruto = base ? doGit(base, 'banco/indice.json') : null;
const CoreHoje = require('../core.js');

if (!indiceAntigoBruto) {
  /* Depois do merge do B14: a base não tem mais o índice antigo, e a
   * comparação de migração já foi feita no PR dele. Dito, e não fingido. */
  console.log('   a base do merge não tem mais o banco/indice.json: a comparação da migração ' +
    'foi feita no PR do B14 e não se repete. As guardas do grafo daqui em diante são o ' +
    'testa_trilha_dados e o testa_trilha.');
} else {
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'b14_trilha_'));
  process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });
  const caminhoCore = path.join(TMP, 'core_antes.js');
  fs.writeFileSync(caminhoCore, doGit(base, 'core.js'));
  const CoreAntes = require(caminhoCore);
  const temasAntes = JSON.parse(indiceAntigoBruto).temas;
  conf('os ids de antes e de hoje são os mesmos, na mesma ordem',
    temasAntes.map(t => t.id).join(',') === temasHoje.map(t => t.id).join(','), true);
  /* Os 148 como alvo, com o máximo que a tela usa (6); os cortados entram,
   * porque é deles que sai o "Puxar mais de trás". */
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
  conf('a maioria tem escada de verdade (mais de um passo)', comPasso > 100, true);
  conf('nenhuma das 148 trilhas mudou de sequência entre o índice antigo e o novo',
    diferentes.length ? diferentes.slice(0, 5).join(', ') : 'nenhuma mudou', 'nenhuma mudou');
  /* A comparação sabe reprovar: um pré-requisito a menos muda a sequência. */
  const temasMexidos = JSON.parse(JSON.stringify(temasHoje));
  const alvoMexido = temasMexidos.filter(t => (t.prerequisitos || []).length)[0];
  conf('achei um assunto com pré-requisito para envenenar a comparação', !!alvoMexido, true);
  if (alvoMexido) {
    alvoMexido.prerequisitos = [];
    conf('tirando um pré-requisito, a sequência daquele assunto MUDA',
      sequencia(CoreHoje, temasHoje, alvoMexido.id) !== sequencia(CoreHoje, temasMexidos, alvoMexido.id), true);
  }
}

// ---------------------------------------------------------------- navegador
const amb = H.criarAmbiente(PORTA, 'perfil_sem_autoral', trocas);
const hojeIso = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();

/* Dois assuntos de matemática do índice: um limpo (é ele que não pode ganhar
 * botão Material) e um com PDF anexado de antes (é ele que tem de continuar
 * abrindo). */
const ALVO = temasHoje.filter(t => t.serie === '08')[0] || temasHoje[0];
const ASSUNTO_LIMPO = { id: ALVO.id, titulo: ALVO.pt.titulo, fonte: 'banco', disciplina: 'matematica' };
const OUTRO = temasHoje.filter(t => t.id !== ALVO.id)[0];
const ANEXO_ID = 'anexo-b7-antigo';
const ASSUNTO_COM_MATERIAL = {
  id: OUTRO.id, titulo: OUTRO.pt.titulo, fonte: 'banco', disciplina: 'matematica',
  lingua: 'pt', partes: ['material', 'lista'], exercicios: 7, anexoId: ANEXO_ID
};

(async () => {
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
   * aparece. Até o B14, o botão Material da linha também dependia de
   * `registro`, e só existia no SEGUNDO desenho.
   *
   * Com o predicado "a linha existe", a leitura podia pegar o primeiro
   * desenho. Foi o INSTAVEL do portão das 11:33 de setembro: a asserção
   * amostrava um estado transitório.
   *
   * A etiqueta do ano é a condição exata do assentamento, porque ela vem do
   * mesmo `registro`. */
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
    fetch('banco/topicos/matematica.json').then(x => x.json()).then(j => {
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
    fetch('banco/topicos/matematica.json').then(x => x.json()).then(async j => {
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
  // Desde o T05 (5b8a98f) o cabecalho "Por matéria" e "Outras matérias".
  const escolha = await esperar('escolha de assunto aberta', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-tema.aberto');
    return m && /Outras matérias/i.test(m.textContent) ? m.textContent : '';
  }), v => !!v, 12000);
  conf('a escolha abriu com a lista de matérias', escolha.ok, true);
  conf('a matemática continua na lista', /Matemática/.test(escolha.valor || ''), true);
  venenoVisto.escolhaDeAssunto = escolha.valor || '';
  ausencia('e nenhuma linha promete "material pronto"', /material pronto/i.test(escolha.valor || ''), false);
  await pag.evaluate(() => { const f = document.querySelector('#modal-tema .fechar'); if (f) f.click(); });
  await pausa(200);


  // ================================================================
  secao('9. Nenhum erro');
  conf('nenhum erro de JavaScript', pag.errosDePagina.join(' | '), '');
  conf('nenhum pedido deu 404', amb.quatrocentos.join(', '), '');
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
