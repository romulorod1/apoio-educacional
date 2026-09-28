/* Ano escolar como dado único da ficha e do mapeamento, em perfil descartável. */
'use strict';
const H = require('./_bib_navegador');
const amb = H.criarAmbiente(8824, 'nath_t04_ano');
const { conf, secao, esperar } = H;

async function banco(pag) {
  return pag.evaluate(() => new Promise(resolve => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const db = req.result;
      const get = db.transaction('dados', 'readonly').objectStore('dados').get('principal');
      get.onsuccess = () => { db.close(); resolve(get.result); };
    };
  }));
}
async function aluno(pag) {
  return (await banco(pag)).alunos.find(a => a.nome === 'Teste Ano Escolar');
}
async function simularAnoLegadoSoNoMapa(pag) {
  await pag.evaluate(() => new Promise(resolve => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const db = req.result;
      const t = db.transaction('dados', 'readwrite');
      const s = t.objectStore('dados');
      const get = s.get('principal');
      get.onsuccess = () => {
        const dados = get.result;
        const a = dados.alunos.find(x => x.nome === 'Teste Ano Escolar');
        delete a.anoEscolar;
        delete a.anoEscolarOutro;
        a.mapeamentos[a.mapeamentos.length - 1].anoEscolar = '08';
        s.put(dados, 'principal');
      };
      t.oncomplete = () => { db.close(); resolve(); };
    };
  }));
}
async function simularConflitoLegado(pag) {
  await pag.evaluate(() => new Promise(resolve => {
    const req = indexedDB.open('apoio-educacional');
    req.onsuccess = () => {
      const db = req.result;
      const t = db.transaction('dados', 'readwrite');
      const s = t.objectStore('dados');
      const get = s.get('principal');
      get.onsuccess = () => {
        const dados = get.result;
        dados.alunos.find(x => x.nome === 'Teste Ano Escolar').anoEscolar = '07';
        s.put(dados, 'principal');
      };
      t.oncomplete = () => { db.close(); resolve(); };
    };
  }));
}
async function abrirFicha(pag) {
  await pag.evaluate(() => {
    const linha = [...document.querySelectorAll('#lista-alunos .item-lista')]
      .find(e => e.textContent.includes('Teste Ano Escolar'));
    if (!linha) throw new Error('Aluno não apareceu na lista');
    linha.click();
  });
  await pag.waitForSelector('#modal-aluno.aberto #campo-ano-escolar');
}
async function selecionar(pag, seletor, ano) {
  await pag.select(seletor, ano);
}
async function salvarFicha(pag) {
  await pag.$eval('#salvar-aluno', e => e.click());
  const r = await esperar('ficha fechou', () => pag.$eval('#modal-aluno', e => !e.classList.contains('aberto')), Boolean, 8000);
  if (!r.ok) throw new Error('Ficha não fechou');
}
async function abrirMapa(pag, novo) {
  await abrirFicha(pag);
  await pag.evaluate(() => [...document.querySelectorAll('.aba-perfil')]
    .find(e => e.textContent.trim() === 'Mapeamento').click());
  await pag.$eval(novo ? '#mapear-aluno' : '#refazer-mapeamento', e => e.click());
  await pag.waitForSelector('#modal-mapeamento.aberto #mapa-ano');
}
async function salvarMapa(pag) {
  await pag.$eval('#salvar-mapeamento', e => e.click());
  const r = await esperar('mapeamento fechou', () => pag.$eval('#modal-mapeamento', e => !e.classList.contains('aberto')), Boolean, 8000);
  if (!r.ok) throw new Error('Mapeamento não fechou');
}

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'alunos');

  secao('Cadastro e edição simples');
  await pag.$eval('#novo-aluno', e => e.click());
  conf('ano não é obrigatório nem presumido', await pag.$eval('#campo-ano-escolar', e => e.value), '');
  await pag.$eval('#campo-nome', e => { e.value = 'Teste Ano Escolar'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await selecionar(pag, '#campo-ano-escolar', '07');
  await salvarFicha(pag);
  conf('cadastro grava 7º ano', (await aluno(pag)).anoEscolar, '07');
  conf('lista mostra ano sem abrir ficha', await pag.$eval('#lista-alunos', e => e.textContent.includes('Teste Ano Escolar') && e.textContent.includes('7º ano')), true);
  await abrirFicha(pag);
  conf('ficha lê ano cadastrado', await pag.$eval('#campo-ano-escolar', e => e.value), '07');
  await selecionar(pag, '#campo-ano-escolar', '08');
  await salvarFicha(pag);
  conf('edição rápida grava 8º ano', (await aluno(pag)).anoEscolar, '08');

  secao('Mapeamento sincroniza a ficha; refazer preserva o anterior');
  await abrirMapa(pag, true);
  conf('mapa parte do ano da ficha', await pag.$eval('#mapa-ano', e => e.value), '08');
  await selecionar(pag, '#mapa-ano', '09');
  await salvarMapa(pag);
  let a = await aluno(pag);
  conf('mapa define 9º ano atual', a.anoEscolar, '09');
  conf('mapa atual acompanha', a.mapeamentos[0].anoEscolar, '09');
  await abrirFicha(pag);
  conf('ficha lê ano do mapa', await pag.$eval('#campo-ano-escolar', e => e.value), '09');
  await selecionar(pag, '#campo-ano-escolar', '06');
  await salvarFicha(pag);
  a = await aluno(pag);
  conf('ficha e mapa atual concordam', a.anoEscolar + '/' + a.mapeamentos[0].anoEscolar, '06/06');
  await abrirMapa(pag, false);
  await selecionar(pag, '#mapa-ano', '08');
  await salvarMapa(pag);
  a = await aluno(pag);
  conf('refazer cria segundo mapa', a.mapeamentos.length, 2);
  conf('primeiro mapa continua histórico', a.mapeamentos[0].anoEscolar, '06');
  await abrirFicha(pag);
  await selecionar(pag, '#campo-ano-escolar', '07');
  await salvarFicha(pag);
  a = await aluno(pag);
  conf('só mapa atual muda com a ficha', a.mapeamentos.map(m => m.anoEscolar).join('/'), '06/07');
  conf('topo acompanha mapa atual', a.anoEscolar, '07');

  secao('Ano livre e não informado');
  await abrirFicha(pag);
  await selecionar(pag, '#campo-ano-escolar', 'outro');
  conf('campo livre aparece', await pag.$eval('#caixa-ano-escolar-outro', e => getComputedStyle(e).display !== 'none'), true);
  await pag.$eval('#campo-ano-escolar-outro', e => { e.value = '1º período'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await salvarFicha(pag);
  a = await aluno(pag);
  conf('ano livre salvo no topo e mapa', a.anoEscolarOutro + '/' + a.mapeamentos[1].anoEscolarOutro, '1º período/1º período');
  await abrirFicha(pag);
  conf('ano livre volta à ficha', await pag.$eval('#campo-ano-escolar-outro', e => e.value), '1º período');
  await selecionar(pag, '#campo-ano-escolar', '');
  await salvarFicha(pag);
  a = await aluno(pag);
  conf('não informado limpa ano corrente', a.anoEscolar + '/' + a.mapeamentos[1].anoEscolar, '/');
  conf('texto livre não fica escondido como dado atual', a.anoEscolarOutro + '/' + a.mapeamentos[1].anoEscolarOutro, '/');
  conf('mapa histórico permanece', a.mapeamentos[0].anoEscolar, '06');

  secao('Registro legado com ano só no mapeamento');
  await simularAnoLegadoSoNoMapa(pag);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.irParaAba(pag, 'alunos');
  await abrirFicha(pag);
  conf('ficha lê ano legado no mapa', await pag.$eval('#campo-ano-escolar', e => e.value), '08');
  await selecionar(pag, '#campo-ano-escolar', '09');
  await salvarFicha(pag);
  a = await aluno(pag);
  conf('edição sincroniza registro legado', a.anoEscolar + '/' + a.mapeamentos[1].anoEscolar, '09/09');

  secao('Conflito legado entre ficha e mapeamento');
  await simularConflitoLegado(pag);
  await pag.reload({ waitUntil: 'networkidle0' });
  await H.irParaAba(pag, 'alunos');
  await abrirFicha(pag);
  conf('ficha dá prioridade ao mapa atual', await pag.$eval('#campo-ano-escolar', e => e.value), '09');
  await salvarFicha(pag);
  a = await aluno(pag);
  conf('salvar reconcilia topo com mapa mesmo sem mudar seletor', a.anoEscolar + '/' + a.mapeamentos[1].anoEscolar, '09/09');
  conf('mapa anterior segue preservado', a.mapeamentos[0].anoEscolar, '06');

  secao('Texto livre preservado ao fazer primeiro mapeamento');
  await pag.$eval('#novo-aluno', e => e.click());
  await pag.$eval('#campo-nome', e => { e.value = 'Teste Ano Livre'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  conf('campo livre oculto no cadastro normal', await pag.$eval('#caixa-ano-escolar-outro', e => getComputedStyle(e).display), 'none');
  await selecionar(pag, '#campo-ano-escolar', 'outro');
  await pag.$eval('#campo-ano-escolar-outro', e => { e.value = '1º período'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await salvarFicha(pag);
  await pag.evaluate(() => [...document.querySelectorAll('#lista-alunos .item-lista')]
    .find(e => e.textContent.includes('Teste Ano Livre')).click());
  await pag.evaluate(() => [...document.querySelectorAll('.aba-perfil')]
    .find(e => e.textContent.trim() === 'Mapeamento').click());
  await pag.$eval('#mapear-aluno', e => e.click());
  await pag.waitForSelector('#modal-mapeamento.aberto #mapa-ano');
  conf('mapeamento lê texto livre da ficha', await pag.$eval('#mapa-ano-outro', e => e.value), '1º período');
  await salvarMapa(pag);
  const livre = (await banco(pag)).alunos.find(x => x.nome === 'Teste Ano Livre');
  conf('primeiro mapa preserva texto livre', livre.anoEscolarOutro + '/' + livre.mapeamentos[0].anoEscolarOutro, '1º período/1º período');

  const backup = await pag.evaluate(async () => {
    const b = await Store.carregar();
    const p = await Store.exportarTudo(b);
    const presente = JSON.stringify(p).includes('Teste Ano Escolar') &&
      JSON.stringify(p).includes('"anoEscolar":"09"');
    await Store.importarTudo(p);
    const restaurado = await Store.carregar();
    const a = restaurado.alunos.find(x => x.nome === 'Teste Ano Escolar');
    const l = restaurado.alunos.find(x => x.nome === 'Teste Ano Livre');
    return { presente, restaurado: a.anoEscolar === '09' &&
      l.anoEscolar === 'outro' && l.anoEscolarOutro === '1º período' };
  });
  conf('backup contém ano escolar', backup.presente, true);
  conf('restauração mantém ano comum e livre', backup.restaurado, true);
  conf('não houve erro de página', pag.errosDePagina.length, 0);
})().then(H.fim(amb), H.fim(amb));
