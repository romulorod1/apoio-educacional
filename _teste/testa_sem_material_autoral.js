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
 *   3. A TRILHA ANTES E DEPOIS. Para cada um dos 148 temas como alvo, a
 *      sequência de passos do Core.trilhaDerivada da BASE DO MERGE e a de hoje
 *      são a mesma, passo a passo, e o banco/indice.json não mudou. É a prova
 *      que o brief pede: a trilha de aprendizado, a lacuna e o mapeamento
 *      andam sobre o GRAFO dos temas (id, ano, prerequisitos), que fica; o que
 *      saiu foi o material deles.
 *
 * No Chrome, sem pacote da biblioteca importado:
 *   4. a janela da aula não tem mais o botão "Material de aula", e a ajuda da
 *      folha não promete mais "atalho opcional" nenhum;
 *   5. um assunto de matemática do banco gravado numa aula fica como assunto
 *      comum: sem botão Material (a biblioteca é que o dá, e não há pacote), e
 *      com a etiqueta do ano, que é grafo e não material;
 *   6. MATERIAL JÁ ANEXADO NUMA AULA ANTIGA CONTINUA ABRINDO: o anexo é arquivo
 *      gravado, a linha diz "com material pronto" e o Abrir entrega o arquivo;
 *   7. a trilha monta pela tela com os mesmos passos que o motor dá, e o
 *      "Ver os temas soltos", que só levava ao material autoral, saiu;
 *   8. a escolha de assunto continua abrindo, com a matemática na lista, e sem
 *      prometer "material pronto";
 *   9. nenhum erro de JavaScript e nenhum pedido que dê 404.
 *
 * Modo envenenado:
 *   node _teste/testa_sem_material_autoral.js --envenenado-liga
 *     o app.js servido volta com MATERIAL_AUTORAL_NO_AR = true. O botão
 *     "Material de aula" reaparece na janela da aula, e o teste tem de
 *     ENXERGAR isso. Sem este modo, as asserções de ausência acima passariam
 *     também num app.js em que o botão nunca fosse desenhado por outro motivo
 *     (um seletor errado, por exemplo), e não provariam nada sobre a chave.
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
 * linha e a trava do portão reprovam juntas. */
const corpoCarregarSerie = (APP.split('function carregarSerie(')[1] || '').split('\n  }\n')[0]
  .split('\n').filter(l => !/^\s*(\/\*|\*|\/\/)/.test(l)).join('\n');
conf('carregarSerie continua produzindo o literal banco/serie-', /'banco\/serie-'\s*\+/.test(corpoCarregarSerie), true);
conf('o pdf.js continua com o gerarMaterialTema', ler('pdf.js').indexOf('function gerarMaterialTema(') >= 0, true);
conf('o sw.js continua listando o índice dos temas', ler('sw.js').indexOf("'./banco/indice.json'") >= 0, true);

// ---------------------------------------------------------------- 3 (Node)
secao('3. A trilha antes e depois: a mesma sequência de passos');

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
    d.aulas.push(comum, antiga);
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

  const botoesDaFolha = await pag.evaluate(() =>
    Array.from(document.querySelectorAll('#linha-folha button')).map(b => b.textContent.trim()).join(' | '));
  if (VENENO) {
    conf('VENENO ENXERGADO: com a chave ligada, o botão "Material de aula" volta',
      botoesDaFolha, 'Escrever à mão na folha | Material de aula | Anexar PDF | Anexar foto');
    throw Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });
  }
  conf('a folha em branco continua sendo o primeiro botão, e não há "Material de aula"',
    botoesDaFolha, 'Escrever à mão na folha | Anexar PDF | Anexar foto');
  const ajuda = await pag.$eval('#ajuda-folha', e => e.textContent);
  conf('o texto continua dizendo que a folha é o começo', /folha em branco é sempre o começo/i.test(ajuda), true);
  conf('e não promete mais "atalho opcional" de material', /atalho opcional/i.test(ajuda), false);
  conf('e não cita mais "Material de aula"', /Material de aula/.test(ajuda), false);

  // ================================================================
  secao('5. Assunto do banco: assunto comum, sem Material');
  const linhaLimpa = await esperar('linha do assunto limpo', () => pag.evaluate(t => {
    const l = Array.from(document.querySelectorAll('#corpo-modal-aula .item-assunto-aula')).find(x => x.textContent.indexOf(t) >= 0);
    return l ? {
      nome: l.querySelector('.nome').textContent.trim(),
      detalhe: (l.querySelector('.detalhe') || {}).textContent || '',
      botoes: Array.from(l.querySelectorAll('button')).map(b => b.textContent.trim()).join(',')
    } : null;
  }, ASSUNTO_LIMPO.titulo), v => !!v, 10000);
  conf('o assunto aparece com o título gravado', linhaLimpa.valor && linhaLimpa.valor.nome, ASSUNTO_LIMPO.titulo);
  conf('sem botão Material (só o Tirar de sempre)', linhaLimpa.valor && linhaLimpa.valor.botoes, 'Tirar');
  conf('e a etiqueta do ano continua, porque ano é grafo',
    linhaLimpa.valor && /ano|médio/i.test(linhaLimpa.valor.detalhe), true);
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
  const esperada = CoreHoje.trilhaDerivada(temasHoje, ALVO.id, { maximo: 6 }).passos.map(p => p.titulo).join(' > ');
  const daTela = await pag.evaluate(alvo => new Promise(r => {
    // o motor que ESTÁ NA PÁGINA, lendo o índice que a página baixou
    fetch('banco/indice.json').then(x => x.json()).then(j => {
      const temas = j.temas || j;
      r(Core.trilhaDerivada(temas, alvo, { maximo: 6 }).passos.map(p => p.titulo).join(' > '));
    });
  }), ALVO.id);
  conf('o motor da página dá a mesma sequência de passos do motor do teste', daTela, esperada);
  /* Uma trilha de verdade, guardada no aluno, aberta na tela: é lá dentro que
   * o "Ver os temas soltos" morava, e a ausência só prova alguma coisa com a
   * janela da trilha ABERTA. Os passos são os do motor, sem tocar em nada. */
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
      r({ passos: der.passos.map(p => p.titulo).join(' > '), alunoId: aluno.id });
    });
  }), ALVO.id);
  conf('a trilha guardada tem os passos do motor', gravada.passos, esperada);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.abrirApp(pag, amb.ORIGEM);
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
    return {
      passos: Array.from(m.querySelectorAll('.item-passo-trilha .nome')).map(x => x.textContent.replace(/^\d+\.\s*/, '').trim()).join(' > '),
      soltos: !!document.querySelector('#trilha-temas-soltos'),
      texto: m.textContent
    };
  });
  conf('a trilha mostra os mesmos passos, na mesma ordem', naTrilha.passos, esperada);
  conf('o botão "Ver os temas soltos" não existe mais dentro da trilha', naTrilha.soltos, false);
  conf('e o texto de ajuda não fala mais em temas soltos', /temas soltos/i.test(naTrilha.texto), false);
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
  conf('e nenhuma linha promete "material pronto"', /material pronto/i.test(escolha.valor || ''), false);
  await pag.evaluate(() => { const f = document.querySelector('#modal-tema .fechar'); if (f) f.click(); });
  await pausa(200);

  // ================================================================
  secao('9. Nenhum erro');
  conf('nenhum erro de JavaScript', pag.errosDePagina.join(' | '), '');
  conf('nenhum pedido deu 404', amb.quatrocentos.join(', '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
