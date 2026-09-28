/* testa_sugestoes_matematica_navegador.js
 *
 * Teste em navegador Chrome com perfil isolado para seleção de assuntos e
 * ponto inicial em Matemática (T05):
 * 1. Aluno 7º ano: exibe 'Sugestões de Matemática para o 7º ano'.
 * 2. Aluno 'fora': exibe 'Matemática (Fora da escola)' sem afirmar 'ano não cadastrado'
 *    e sem impor sugestões de séries alheias.
 * 3. Aluno 'outro' (Preparatório): exibe 'Matemática (Preparatório)' sem afirmar 'ano não cadastrado'.
 * 4. Aluno sem ano: exibe com indicação honesta 'ano não cadastrado' e ajuda amigável.
 * 5. Campo de busca / digitação preserva foco e digitação durante atualizações.
 */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8839, 'nath_t05_matematica');
const { conf, secao, esperar, pausa } = H;

async function configurarDadosTeste(pag) {
  return pag.evaluate(() => new Promise(resolve => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const db = req.result;
      const t = db.transaction('dados', 'readwrite');
      const s = t.objectStore('dados');
      const get = s.get('principal');
      get.onsuccess = () => {
        const dados = get.result || {};
        dados.alunos = [
          { id: 'aluno-setimo', nome: 'Lucas Sétimo', anoEscolar: '07' },
          { id: 'aluno-fora', nome: 'Beatriz Fora', anoEscolar: 'fora' },
          { id: 'aluno-outro', nome: 'Mariana Outro', anoEscolar: 'outro', anoEscolarOutro: 'Preparatório' },
          { id: 'aluno-sem-ano', nome: 'Carlos Sem Ano', anoEscolar: '' }
        ];
        dados.aulas = [
          { id: 'aula-setimo', alunoId: 'aluno-setimo', data: '2026-09-28', hora: '14:00', duracaoMin: 60, status: 'realizada' },
          { id: 'aula-fora', alunoId: 'aluno-fora', data: '2026-09-28', hora: '15:00', duracaoMin: 60, status: 'realizada' },
          { id: 'aula-outro', alunoId: 'aluno-outro', data: '2026-09-28', hora: '16:00', duracaoMin: 60, status: 'realizada' },
          { id: 'aula-sem-ano', alunoId: 'aluno-sem-ano', data: '2026-09-28', hora: '17:00', duracaoMin: 60, status: 'realizada' }
        ];
        s.put(dados, 'principal');
      };
      t.oncomplete = () => { db.close(); resolve(); };
    };
  }));
}

async function abrirAssuntoPeloNome(pag, primeiroNome) {
  // Clica na pílula da aula pelo nome do aluno
  await pag.evaluate(nome => {
    const pils = [...document.querySelectorAll('.pilula')];
    const pil = pils.find(p => p.textContent.includes(nome));
    if (pil) pil.click();
  }, primeiroNome);

  await esperar('janela da aula aberta', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-aula');
    return !!(m && m.classList.contains('aberto'));
  }), v => v === true, 10000);

  // Clica no botão de escolher assunto
  await pag.evaluate(() => {
    const btn = document.querySelector('#escolher-assunto');
    if (btn) btn.click();
  });

  await esperar('catálogo de assuntos aberto e carregado', () => pag.evaluate(() => {
    const m = document.querySelector('#modal-tema');
    const corpo = document.querySelector('#corpo-modal-tema');
    return !!(m && m.classList.contains('aberto') && corpo && !corpo.textContent.includes('Carregando'));
  }), v => v === true, 15000);
}

async function fecharModalTemaEAula(pag) {
  await pag.evaluate(() => {
    const btnCancTema = document.querySelector('#rodape-modal-tema button');
    if (btnCancTema) btnCancTema.click();
  });
  await pausa(300);
  await pag.evaluate(() => {
    const btnCancAula = document.querySelector('#modal-aula .modal-rodape [data-fechar]');
    if (btnCancAula) btnCancAula.click();
  });
  await pausa(300);
}

(async function () {
  try {
    await amb.subir();
    const pag = await amb.pagina();

    secao('1. Inicialização e configuração de alunos de teste');
    await pag.goto(amb.ORIGEM + '/index.html', { waitUntil: 'networkidle0' });
    await esperar('o aplicativo abriu', () => pag.evaluate(() =>
      !!document.querySelector('#abas .aba') && typeof Store === 'object'
    ), v => v === true, 30000);

    await configurarDadosTeste(pag);
    await pag.reload({ waitUntil: 'networkidle0' });
    await esperar('aplicativo recarregou com as pílulas de aula', () => pag.evaluate(() =>
      document.querySelectorAll('.pilula').length >= 4
    ), v => v === true, 30000);
    await pausa(500);

    secao('2. Aluno do 7º ano (série curricular mapeável)');
    await abrirAssuntoPeloNome(pag, 'Lucas');
    const textoSetimo = await pag.evaluate(() => document.querySelector('#lista-assuntos').textContent);
    conf('título contextualizado para 7º ano', textoSetimo.includes('Sugestões de Matemática para o 7º ano'), true);
    conf('não diz ano não cadastrado para 7º ano', textoSetimo.includes('ano não cadastrado'), false);
    await fecharModalTemaEAula(pag);

    secao('3. Aluno "Fora da escola"');
    await abrirAssuntoPeloNome(pag, 'Beatriz');
    const textoFora = await pag.evaluate(() => document.querySelector('#lista-assuntos').textContent);
    conf('título reconhece Fora da escola', textoFora.includes('Matemática (Fora da escola)'), true);
    conf('não afirma falsamente ano não cadastrado para Fora da escola', textoFora.includes('ano não cadastrado'), false);
    conf('não impõe sugestões curriculares de 6º ou 7º ano', textoFora.includes('Sugestões de Matemática para o'), false);
    await fecharModalTemaEAula(pag);

    secao('4. Aluno "Outro" com texto livre (Preparatório)');
    await abrirAssuntoPeloNome(pag, 'Mariana');
    const textoOutro = await pag.evaluate(() => document.querySelector('#lista-assuntos').textContent);
    conf('título reconhece etapa livre Preparatório', textoOutro.includes('Matemática (Preparatório)'), true);
    conf('não afirma falsamente ano não cadastrado para etapa livre', textoOutro.includes('ano não cadastrado'), false);
    conf('oferece atalho do catálogo completo', textoOutro.includes('Abrir o catálogo de Matemática por ano'), true);
    await fecharModalTemaEAula(pag);

    secao('5. Aluno sem ano informado');
    await abrirAssuntoPeloNome(pag, 'Carlos');
    const textoSemAno = await pag.evaluate(() => document.querySelector('#lista-assuntos').textContent);
    conf('indica honestamente ano não cadastrado', textoSemAno.includes('ano não cadastrado'), true);
    conf('apresenta ajuda amigável explicando ausência do ano', textoSemAno.includes('O ano escolar não está informado'), true);

    secao('6. Preservação de digitação e foco na busca');
    await pag.type('#busca-assunto', 'equação');
    await pausa(400);
    const valorDigitado = await pag.evaluate(() => document.querySelector('#busca-assunto').value);
    conf('digitação no campo de busca permanece intacta', valorDigitado, 'equação');

    conf('não houve erros de página no console', pag.errosDePagina.length, 0);

    await fecharModalTemaEAula(pag);
    await H.fim(amb)();
  } catch (e) {
    await H.fim(amb)(e);
  }
})();
