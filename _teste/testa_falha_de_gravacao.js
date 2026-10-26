/* testa_falha_de_gravacao.js
 *
 * B3: a falha de gravação tratada num lugar só (app.js: salvar,
 * falhaDeGravacao, salvarEDepois, comDesfazer, releDoDisco,
 * memoriaSubstituida). O tablet sem espaço é simulado no próprio IndexedDB:
 * a transação é ABORTADA logo depois do pedido, que é o caminho por onde a
 * falta de espaço de verdade chega (o QuotaExceededError vem da transação,
 * store.js:132-150), e não um Store.salvar trocado por um falso. Três chaves,
 * uma por gravação: o documento principal (`dados`), o ponto de retorno
 * (`historico`, add) e a limpeza do ponto usado (`historico`, delete).
 *
 * Banco fictício ("Aluna Alfa Teste"), porque a prova tira print.
 *
 * O que se prova:
 *   1. a gravação que falha mostra a faixa, a mudança fica na memória, o disco
 *      fica com o valor antigo, e o OLHO esconde os valores na hora (ela o
 *      liga com a família ao lado; a falha não pode vazar o que ela mandou
 *      esconder); e a faixa NÃO cobre as abas nem o olho;
 *   2. a rejeição avisada não vira erro de página;
 *   3. "Tentar de novo agora" grava, e a faixa some;
 *   4. sem tocar em nada, a nova tentativa automática de 15 s grava sozinha;
 *   5. "Voltar a este ponto" que grava o ponto e falha depois: o disco fica
 *      com o ponto que ela escolheu (a memória velha não é gravada por cima),
 *      e a mudança pendente que saiu é dita na frase, não some calada;
 *   6. Excluir aula (comDesfazer) com o tablet sem espaço: a janela fecha, a
 *      agenda redesenha e a faixa aparece;
 *   7. Excluir aula quando só o ponto de retorno não cabe: a exclusão é
 *      gravada mesmo assim, o aviso sai sem Desfazer, e nada cai no ouvinte
 *      global;
 *   8. uma promessa rejeitada sem tratamento que NÃO veio do salvar vira uma
 *      frase na tela, e continua aparecendo como erro para os testes;
 *  10. sem navegador: o Store.salvar só é chamado direto nos três lugares
 *      conhecidos; nenhum nome declarado duas vezes no nível do módulo (a
 *      bandeira do B3 chegou a ser a mesma variável do relógio da folha), com
 *      controle positivo; e o releDoDisco não grava a memória.
 *
 * Modos envenenados, um por regra. Cada um tem de enxergar o próprio
 * defeito; se não enxergar, a prova não prova:
 *   --envenenado-sem-tratamento   o salvar() perde a ligação do tratamento
 *                                 central: a falha volta a ser calada.
 *   --envenenado-olho-espera      o olho espera a gravação para redesenhar.
 *   --envenenado-faixa-por-cima   a faixa volta a flutuar fixa no alto.
 *   --envenenado-rele-grava       o releDoDisco grava a memória antes de reler.
 *   --envenenado-rele-calado      a pendência que saiu não é dita.
 *   --envenenado-desfazer-trava   o comDesfazer volta a rejeitar na falha.
 *   --envenenado-ponto-segura     a falha do ponto de retorno volta a segurar
 *                                 a gravação da mudança.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./_bib_navegador.js');
const { conf, secao, pausa, esperar } = H;

const PORTA = 8873;
const MODOS = ['--envenenado-sem-tratamento', '--envenenado-olho-espera', '--envenenado-faixa-por-cima',
  '--envenenado-rele-grava', '--envenenado-rele-calado', '--envenenado-desfazer-trava', '--envenenado-ponto-segura'];
const MODO = MODOS.filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const APP = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
const CSS = fs.readFileSync(path.join(H.RAIZ, 'styles.css'), 'utf8');

const LIGACAO = 'p.then(gravacaoConfirmada, falhaDeGravacao);';
const OLHO_NA_HORA = /desenharTudo\(\);(\r?\n)    salvar\(\);(\r?\n)  \}/;
const RELE_INICIO = /(  function releDoDisco\(mensagem\) \{\r?\n)/;
const FRASE_SAIU = "' A última mudança, que o tablet ainda não tinha conseguido guardar, também saiu.'";
const DESFAZER_CUMPRE = '}, function () { return resultado; });';
const PONTO_NAO_SEGURA = '.then(function () { return true; }, function () { return false; })';
const FAIXA_NO_FLUXO = /\.faixa-gravacao \{(\r?\n)  flex-shrink: 0;\r?\n  margin: 8px 12px 0;/;

/* Cada âncora existe exatamente uma vez, senão o veneno trocaria a coisa
 * errada (ou nada) e a prova afirmaria o que não mediu. */
function umaVez(texto, ancora) {
  if (ancora instanceof RegExp) return (texto.match(new RegExp(ancora.source, 'g')) || []).length === 1;
  return texto.split(ancora).length === 2;
}

const trocas = {};
if (MODO === '--envenenado-sem-tratamento') trocas['/app.js'] = APP.split(LIGACAO).join('');
if (MODO === '--envenenado-olho-espera') trocas['/app.js'] = APP.replace(OLHO_NA_HORA, 'salvar().then(desenharTudo);$1  }');
if (MODO === '--envenenado-rele-grava') trocas['/app.js'] = APP.replace(RELE_INICIO, '$1    salvar();\n');
if (MODO === '--envenenado-rele-calado') trocas['/app.js'] = APP.split(FRASE_SAIU).join("''");
if (MODO === '--envenenado-desfazer-trava') trocas['/app.js'] = APP.split(DESFAZER_CUMPRE).join('});');
if (MODO === '--envenenado-ponto-segura') trocas['/app.js'] = APP.split(PONTO_NAO_SEGURA).join('.then(function () { return true; })');
if (MODO === '--envenenado-faixa-por-cima') {
  trocas['/styles.css'] = CSS.replace(FAIXA_NO_FLUXO, '.faixa-gravacao {$1  position: fixed;$1  top: 12px;$1  left: 12px;$1  right: 12px;$1  z-index: 90;');
}

/* Nomes declarados no nível do módulo (duas casas de recuo, `var` ou
 * `function`) que aparecem mais de uma vez. Em JavaScript dois `var` no mesmo
 * escopo são UMA variável só, sem erro nenhum. */
function nomesRepetidos(texto) {
  const vistos = {}, repetidos = [];
  (texto.match(/^ {2}(?:var|function) [A-Za-z_$][A-Za-z0-9_$]*/gm) || []).forEach(d => {
    const nome = d.replace(/^ {2}(?:var|function) /, '');
    if (vistos[nome] && repetidos.indexOf(nome) < 0) repetidos.push(nome);
    vistos[nome] = true;
  });
  return repetidos;
}

// ---------------------------------------------------------------- 10 (Node)
secao('10. Sem navegador: chamadas diretas, nomes repetidos e o releDoDisco');
const diretas = (APP.match(/Store\.salvar\(/g) || []).length;
/* Três: o próprio salvar(), a carga inicial do iniciar() (catch que mostra
 * "Não foi possível abrir os dados") e o apagarTudo (catch com releDoDisco).
 * O Desfazer da barra flutuante passou a ir pelo salvar(). Uma quarta chamada
 * direta escaparia do tratamento central: passe pelo salvar(), ou acrescente
 * aqui com o motivo. */
conf('três chamadas diretas ao Store.salvar, todas conhecidas', diretas, 3);
conf('o salvar() liga o tratamento central', APP.indexOf(LIGACAO) >= 0, true);
conf('existe o ouvinte global de promessa rejeitada', /addEventListener\('unhandledrejection'/.test(APP), true);
conf('nenhum nome declarado duas vezes no nível do módulo', nomesRepetidos(APP).join(', '), '');
conf('controle: a busca de nomes repetidos enxerga um var a mais',
  nomesRepetidos(APP + '\n  var mudancaNaoGuardada = null;\n').join(', '), 'mudancaNaoGuardada');
const corpoRele = (APP.split('  function releDoDisco(mensagem) {')[1] || '').split(/\r?\n  \}\r?\n/)[0];
conf('o corpo do releDoDisco foi achado', corpoRele.length > 50, true);
conf('o releDoDisco não grava a memória', /salvar\(/.test(corpoRele), false);
[['ligação do tratamento', APP, LIGACAO], ['olho na hora', APP, OLHO_NA_HORA], ['início do releDoDisco', APP, RELE_INICIO],
  ['frase da pendência que saiu', APP, FRASE_SAIU], ['comDesfazer cumpre na falha', APP, DESFAZER_CUMPRE],
  ['ponto de retorno não segura', APP, PONTO_NAO_SEGURA], ['faixa no fluxo', CSS, FAIXA_NO_FLUXO]
].forEach(([nome, texto, ancora]) => conf('âncora de veneno uma vez só: ' + nome, umaVez(texto, ancora), true));

const amb = H.criarAmbiente(PORTA, 'perfil_falha_gravacao', trocas);

/* O documento principal direto do IndexedDB, por fora do aplicativo. */
const principal = pag => pag.evaluate(() => new Promise(res => {
  const r = indexedDB.open('apoio-educacional');
  r.onsuccess = () => {
    const g = r.result.transaction('dados', 'readonly').objectStore('dados').get('principal');
    g.onsuccess = () => {
      const d = g.result || {};
      res({ oculto: !!(d.ajustes && d.ajustes.valoresOcultos), aulas: (d.aulas || []).map(a => a.id).sort().join(',') });
    };
    g.onerror = () => res(null);
  };
  r.onerror = () => res(null);
}));
const noDisco = async pag => { const p = await principal(pag); return p ? p.oculto : null; };
const faixaVisivel = pag => pag.evaluate(() => {
  const f = document.querySelector('#faixa-gravacao');
  return !!(f && !f.hidden && getComputedStyle(f).display !== 'none');
});
const olhoLigado = pag => pag.$eval('#alternar-valores', b => b.classList.contains('ativo'));
// algum valor em reais à mostra, ou só a máscara
const valoresAMostra = pag => pag.evaluate(() => /R\$\s?\d/.test(document.body.innerText));
const aviso = pag => pag.evaluate(() => ({
  aberto: document.querySelector('#aviso').classList.contains('aberto'),
  texto: document.querySelector('#aviso-texto').textContent,
  acao: getComputedStyle(document.querySelector('#aviso-acao')).display !== 'none'
}));
const sem = (pag, chaves) => pag.evaluate(c => { Object.assign(window.__semEspaco, c); }, chaves);
const fim = () => Object.assign(new Error('fim do modo envenenado'), { jaContado: true, fimDoVeneno: true });

(async () => {
  if (MODO) {
    secao('O veneno é de verdade');
    const arq = trocas['/app.js'] !== undefined ? '/app.js' : '/styles.css';
    conf('o ' + arq + ' servido ficou diferente do repositório (' + MODO + ')',
      trocas[arq] !== (arq === '/app.js' ? APP : CSS), true);
  }
  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);
  await pausa(1500);

  /* Banco fictício, e não a carga inicial: a carga inicial traz nomes reais de
   * crianças, e esta prova tira print. Uma aluna de teste, duas aulas de hoje
   * a R$ 100, e a versão vista gravada (nenhuma janela de novidades na tela). */
  await pag.evaluate(() => new Promise(res => {
    const r = indexedDB.open('apoio-educacional');
    r.onsuccess = () => {
      const t = r.result.transaction('dados', 'readwrite');
      const s = t.objectStore('dados');
      const g = s.get('principal');
      g.onsuccess = () => {
        const d = g.result;
        const hoje = new Date().toISOString().slice(0, 10);
        d.alunos = [{ id: 'alfa', nome: 'Aluna Alfa Teste', ativo: true,
          precos: [{ id: 'p1', inicio: '2026-01-01', fim: null, valorHora: 100 }] }];
        d.series = [];
        d.aulas = ['a1', 'a2'].map((id, k) => ({ id: id, alunoId: 'alfa', data: hoje, hora: k ? '17:00' : '15:00',
          duracaoMin: 60, status: 'realizada', cobravel: true, temas: [], areas: [], anexos: [] }));
        d.resumos = [];
        d.ajustes = Object.assign({}, d.ajustes, { versaoVista: '9.9.9', valoresOcultos: false });
        s.put(d, 'principal');
      };
      t.oncomplete = () => res();
    };
  }));
  await H.abrirApp(pag, amb.ORIGEM);
  await pausa(1500);

  /* O tablet sem espaço: com a chave ligada, a gravação faz o pedido e aborta
   * a transação logo em seguida. */
  await pag.evaluate(() => {
    window.__semEspaco = { dados: false, historicoAdd: false, historicoDelete: false };
    const embrulha = (metodo, deposito, chave) => {
      const orig = IDBObjectStore.prototype[metodo];
      IDBObjectStore.prototype[metodo] = function () {
        const req = orig.apply(this, arguments);
        if (window.__semEspaco[chave] && this.name === deposito) this.transaction.abort();
        return req;
      };
    };
    embrulha('put', 'dados', 'dados');
    embrulha('add', 'historico', 'historicoAdd');
    embrulha('delete', 'historico', 'historicoDelete');
  });

  // ================================================================
  secao('1. A gravação que falha avisa, a mudança fica na memória, e o olho esconde na hora');
  conf('o disco começa com os valores à mostra', await noDisco(pag), false);
  conf('e a tela também', await valoresAMostra(pag), true);
  await sem(pag, { dados: true });
  await pag.click('#alternar-valores');
  await pausa(800);
  conf('o olho está ligado na tela', await olhoLigado(pag), true);
  conf('o disco continua com o valor antigo', await noDisco(pag), false);
  const escondeu = !(await valoresAMostra(pag));
  const faixa = await faixaVisivel(pag);
  /* O print do antes é o modo sem tratamento (a falha calada, como na main), e
   * o do depois é o modo normal, no mesmo instante do percurso. */
  if (process.env.SALVAR_PRINTS && (!MODO || MODO === '--envenenado-sem-tratamento')) {
    await pag.screenshot({ path: path.join(process.env.SALVAR_PRINTS,
      (MODO ? 'antes' : 'depois') + '_gravacao_que_falhou.png') });
  }
  if (MODO === '--envenenado-sem-tratamento') {
    secao('VENENO: sem o tratamento central, a falha volta a ser calada');
    conf('envenenado: nenhuma faixa aparece (defeito enxergado)', faixa, false);
    conf('envenenado: a rejeição sai solta, como erro de página', pag.errosDePagina.length > 0, true);
    throw fim();
  }
  if (MODO === '--envenenado-olho-espera') {
    secao('VENENO: o olho espera o disco, e a falha deixa os valores à mostra');
    conf('envenenado: os valores continuam à mostra com o olho ligado (defeito enxergado)', escondeu, false);
    throw fim();
  }
  conf('os valores somem na hora, mesmo sem ter gravado', escondeu, true);
  conf('a faixa aparece', faixa, true);
  conf('e diz que não guardou e que vai tentar de novo',
    await pag.$eval('#faixa-gravacao', f => /Não consegui guardar/.test(f.textContent) && /tento guardar de novo/.test(f.textContent)), true);
  /* Nada do cabeçalho fica por baixo da faixa: o que está no centro de cada
   * aba e do olho é a própria aba e o próprio olho. */
  const cobertos = await pag.evaluate(() => {
    const alvos = Array.from(document.querySelectorAll('#abas .aba')).concat([document.querySelector('#alternar-valores')]);
    return alvos.filter(a => {
      const r = a.getBoundingClientRect();
      const no = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !(no && (no === a || a.contains(no)));
    }).map(a => a.dataset.tela || a.id);
  });
  if (MODO === '--envenenado-faixa-por-cima') {
    secao('VENENO: a faixa fixa no alto cobre o cabeçalho');
    conf('envenenado: abas ou olho ficam por baixo da faixa (defeito enxergado)', cobertos.length > 0, true);
    throw fim();
  }
  conf('nenhuma aba nem o olho ficam por baixo da faixa', cobertos.join(', '), '');

  // ================================================================
  secao('2. A rejeição avisada não vira erro de página');
  conf('nenhum erro de página até aqui', pag.errosDePagina.join(' | '), '');

  // ================================================================
  secao('3. "Tentar de novo agora" grava, e a faixa some');
  await sem(pag, { dados: false });
  await pag.click('#faixa-gravacao-tentar');
  const gravou = await esperar('o disco ganhou a mudança', () => noDisco(pag), v => v === true, 5000);
  conf('o disco agora tem os valores escondidos', gravou.ok, true);
  conf('a faixa sumiu', await faixaVisivel(pag), false);

  // ================================================================
  secao('4. A nova tentativa automática grava sozinha');
  await sem(pag, { dados: true });
  await pag.click('#alternar-valores');
  await pausa(800);
  conf('a faixa voltou', await faixaVisivel(pag), true);
  conf('os valores voltaram à tela na hora', await valoresAMostra(pag), true);
  conf('e o disco ficou com o valor de antes da mudança', await noDisco(pag), true);
  await sem(pag, { dados: false });
  const sozinha = await esperar('a nova tentativa de 15 s', () => noDisco(pag), v => v === false, 20000);
  conf('sem tocar em nada, a mudança chegou ao disco', sozinha.ok, true);
  conf('e a faixa sumiu', await faixaVisivel(pag), false);

  // ================================================================
  secao('5. "Voltar a este ponto" que falha no meio: o disco fica com o ponto, e a frase conta o que saiu');
  /* Um ponto do histórico com os valores à mostra, gravado por fora (é
   * preparação, e não o que se prova). Depois: a mudança pendente (o olho
   * ligado com o tablet sem espaço), e o "Voltar a este ponto" que grava o
   * ponto e falha ao limpar o histórico, que é o caso em que o disco já tem o
   * que ela escolheu e o releDoDisco é chamado. */
  await pag.evaluate(async () => {
    const d = await Store.carregar();
    await Store.registrarHistorico('Ponto de prova', JSON.parse(JSON.stringify(d)));
  });
  await sem(pag, { dados: true });
  await pag.click('#alternar-valores');
  await pausa(800);
  conf('há mudança pendente: olho ligado e faixa', (await olhoLigado(pag)) && (await faixaVisivel(pag)), true);
  conf('e o disco ainda sem ela', await noDisco(pag), false);
  await sem(pag, { dados: false, historicoDelete: true });
  await H.irParaAba(pag, 'ajustes');
  const botao = await esperar('o "Voltar a este ponto" na lista', () => pag.evaluate(() =>
    Array.from(document.querySelectorAll('#lista-historico button')).some(b => b.textContent.trim() === 'Voltar a este ponto')),
  v => v === true, 5000);
  conf('o ponto de prova aparece em Ajustes', botao.ok, true);
  await pag.evaluate(() => {
    Array.from(document.querySelectorAll('#lista-historico button'))
      .find(b => b.textContent.trim() === 'Voltar a este ponto').click();
  });
  const frase5 = await esperar('o aviso da volta que não se completou', () => aviso(pag),
    a => a.aberto && /Não consegui voltar a este ponto/.test(a.texto), 5000);
  const texto5 = (frase5.valor && frase5.valor.texto) || '';
  await sem(pag, { historicoDelete: false });
  /* O disco depois de um tempo maior que a primeira nova tentativa: se a
   * memória velha fosse gravada (agora ou pela tentativa), os valores
   * apareceriam escondidos no disco. */
  await pausa(16000);
  const discoDepois = await noDisco(pag);
  if (MODO === '--envenenado-rele-grava') {
    secao('VENENO: o releDoDisco grava a memória velha por cima do ponto escolhido');
    conf('envenenado: o disco perdeu o ponto que ela escolheu (defeito enxergado)', discoDepois, true);
    throw fim();
  }
  if (MODO === '--envenenado-rele-calado') {
    secao('VENENO: a mudança pendente sai sem uma palavra');
    conf('envenenado: a frase não conta o que saiu (defeito enxergado)', /também saiu/.test(texto5), false);
    throw fim();
  }
  conf('o aviso diz que não se completou', frase5.ok, true);
  conf('e conta que a mudança que não estava guardada também saiu', /também saiu/.test(texto5), true);
  conf('o disco ficou com o ponto escolhido, e nada o regravou depois', discoDepois, false);
  conf('a faixa sumiu, porque não há mais pendência', await faixaVisivel(pag), false);
  conf('e o olho da tela voltou a seguir o banco', await olhoLigado(pag), false);

  // ================================================================
  secao('6. Excluir aula com o tablet sem espaço: a janela fecha, a agenda redesenha, a faixa aparece');
  await H.irParaAba(pag, 'agenda');
  await pausa(300);
  await pag.click('[data-aula-id="a1"]');
  const abriu = await esperar('a janela da aula abriu', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
  conf('a janela da aula abriu', abriu.ok, true);
  await sem(pag, { dados: true });
  await pag.click('#excluir-aula'); // o confirm é aceito pelo arnês
  const fechou = await esperar('a janela fechar', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === false, 5000);
  if (MODO === '--envenenado-desfazer-trava') {
    secao('VENENO: o comDesfazer rejeita na falha, e a janela fica aberta com a aula já excluída');
    conf('envenenado: a janela continua aberta (defeito enxergado)', fechou.ok, false);
    throw fim();
  }
  conf('a janela fechou', fechou.ok, true);
  conf('a aula saiu da agenda', await pag.evaluate(() => !document.querySelector('[data-aula-id="a1"]')), true);
  conf('a faixa aparece', await faixaVisivel(pag), true);
  conf('e o disco ainda tem a aula', (await principal(pag)).aulas, 'a1,a2');
  await sem(pag, { dados: false });
  await pag.click('#faixa-gravacao-tentar');
  const excluiu = await esperar('a exclusão chegar ao disco', () => principal(pag), p => !!p && p.aulas === 'a2', 5000);
  conf('com espaço de volta, a exclusão chega ao disco', excluiu.ok, true);

  // ================================================================
  secao('7. Excluir aula quando só o ponto de retorno não cabe: a exclusão é gravada, sem Desfazer');
  const errosAntes7 = pag.errosDePagina.length;
  await pag.click('[data-aula-id="a2"]');
  await esperar('a janela da aula abriu', () => pag.evaluate(() =>
    document.querySelector('#modal-aula').classList.contains('aberto')), v => v === true, 5000);
  await sem(pag, { historicoAdd: true });
  await pag.click('#excluir-aula');
  const gravada = await esperar('a exclusão chegar ao disco', () => principal(pag), p => !!p && p.aulas === '', 5000);
  await sem(pag, { historicoAdd: false });
  if (MODO === '--envenenado-ponto-segura') {
    secao('VENENO: a falha do ponto de retorno segura a gravação da exclusão');
    conf('envenenado: a exclusão não chega ao disco (defeito enxergado)', gravada.ok, false);
    throw fim();
  }
  conf('a exclusão foi gravada mesmo sem o ponto de retorno', gravada.ok, true);
  const av7 = await aviso(pag);
  conf('o aviso diz o que aconteceu', /Aula excluída/.test(av7.texto), true);
  conf('e sai sem Desfazer, porque não há ponto para onde voltar', av7.acao, false);
  conf('nenhuma faixa (o que importava foi gravado)', await faixaVisivel(pag), false);
  conf('e nada caiu no ouvinte global', pag.errosDePagina.length, errosAntes7);

  // ================================================================
  secao('8. Rejeição que não veio do salvar vira frase, e continua sendo erro');
  const errosAntes = pag.errosDePagina.length;
  /* Por um script da PÁGINA, e não pelo evaluate: a promessa rejeitada que
   * nasce dentro de um evaluate do puppeteer não dispara o evento
   * unhandledrejection na página (medido: nem um ouvinte posto pela própria
   * prova disparava), enquanto a de um script da página dispara. */
  await pag.addScriptTag({ content: "Promise.reject(new Error('rejeição de prova'));" });
  const frase = await esperar('o aviso de ação que não terminou', () => pag.$eval('#aviso', a =>
    a.classList.contains('aberto') && /não terminou como devia/.test(a.textContent)), v => v === true, 5000);
  conf('aparece a frase para ela', frase.ok, true);
  conf('e o erro continua visível para os testes', pag.errosDePagina.length, errosAntes + 1);

  // ================================================================
  secao('9. Nenhum outro erro');
  conf('só o erro de prova da seção 8', pag.errosDePagina.filter(e => !/rejeição de prova/.test(e)).join(' | '), '');
  conf('nenhum pedido deu 404', amb.quatrocentos.join(', '), '');
})().then(() => H.fim(amb)(), e => (e && e.fimDoVeneno ? H.fim(amb)() : H.fim(amb)(e)));
