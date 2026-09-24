/* testa_biblioteca_kits.js
 *
 * A PROVA DE QUE kits.json E exclusoes.json SÃO ADITIVOS DE VERDADE.
 *
 * O contrato (seção 8d) diz que os dois arquivos novos entram no pacote sem
 * nova versão de esquema, e que o aplicativo publicado os confere e os ignora.
 * O DESENHO_kits.md argumenta isso lendo o biblioteca.js. Este arquivo não lê
 * o biblioteca.js: ele IMPORTA um pacote de brinquedo com os dois arquivos no
 * aplicativo servido do repositório, pela mesma tela de Ajustes que ela usa, e
 * mede o que ficou gravado no tablet. Leitura vira teste.
 *
 * O que prova, em modo normal:
 *   0. o aplicativo servido é o publicado e não mudou: nenhum arquivo do
 *      aplicativo difere do commit 2b647e6 (o merge do PR #55, que é o 1.26.0),
 *      a VERSAO é 1.26.0, o cache é o v41, e o servidor não troca arquivo
 *      nenhum. Sem isto, "importou sem mudar o app" não quer dizer nada;
 *   1. o pacote de brinquedo leva mesmo os dois arquivos, dentro da lista do
 *      manifest, com hash, e contagens.kits;
 *   2. o pacote SEM os dois arquivos entra, e o que ele grava fica medido;
 *   3. o pacote COM os dois arquivos entra na versão seguinte, e grava
 *      exatamente as mesmas contagens: os dois arquivos não mudam uma linha
 *      do que o tablet guarda;
 *   4. o manifest gravado leva contagens.kits, e o conteúdo dos dois arquivos
 *      NÃO é guardado em lugar nenhum: nenhum depósito biblioteca_kits existe
 *      (isso é a etapa 2), e o registro do pacote não tem campo kits nem
 *      exclusoes. Conferido e ignorado, que é o que o contrato promete;
 *   5. o kits.json passa DENTRO da conferência, e não por fora dela: tirá-lo
 *      da lista do manifest faz o aplicativo recusar o pacote inteiro, e
 *      estragar o hash dele também. Aditivo não é invisível;
 *   6. a biblioteca continua navegável depois do pacote com kits, e a página
 *      não solta erro de JavaScript.
 *
 * Modo envenenado:
 *   node _teste/testa_biblioteca_kits.js --envenenado-app-recusa
 *     o servidor entrega um biblioteca.js que RECUSA todo arquivo de raiz que
 *     ele não conhece. Ou seja, um aplicativo que NÃO é indiferente ao
 *     kits.json. O teste inverte a expectativa e tem de ENXERGAR a recusa: se
 *     ele continuasse dizendo "importou", a afirmação da seção 3 não estaria
 *     medindo nada.
 *
 *   node _teste/testa_biblioteca_kits.js --pacote-real <caminho do zip>
 *     importa um pacote DE VERDADE (o 9º ano v5, com os 33 kits) em vez do de
 *     brinquedo, e confere o que ficou gravado contra o que o manifest dele
 *     diz. Não entra no portão porque depende de um arquivo que não está no
 *     repositório: o pacote mora fora, e é assim que tem de ser.
 *
 *   node _teste/testa_biblioteca_kits.js --envenenado-app-recusa --controle
 *     o mesmo veneno, com as expectativas do modo normal. Serve para mostrar a
 *     LINHA DA REPROVAÇÃO: esta corrida tem de falhar, e por isso ela não está
 *     no portão. É o controle da prova, no mesmo espírito do
 *     Consolidado\scripts\controle_da_prova.sh: prova que passa nas duas
 *     versões não prova nada.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { conf, secao, esperar } = H;

const VENENO_APP = process.argv.indexOf('--envenenado-app-recusa') !== -1;
const CONTROLE = process.argv.indexOf('--controle') !== -1;
const I_REAL = process.argv.indexOf('--pacote-real');
const PACOTE_REAL = I_REAL !== -1 ? process.argv[I_REAL + 1] : null;
const PORTA = 8804;

/* O commit em que o 1.26.0 subiu (merge do PR #55). A promessa do contrato é
 * sobre ESTE aplicativo, então a prova compara os arquivos dele com este
 * commit, e não com a memória de quem escreve. */
const COMMIT_1_26_0 = '2b647e6';
const ARQUIVOS_DO_APP = ['app.js', 'store.js', 'index.html', 'styles.css', 'sw.js',
  'biblioteca.js', 'zip.js', 'busca.js', 'core.js', 'pdf.js', 'draw.js', 'cartao.js'];

const BIB_REPO = fs.readFileSync(path.join(H.RAIZ, 'biblioteca.js'), 'utf8');
/* A quebra de linha sai do PRÓPRIO arquivo, e não do teclado de quem escreveu.
 * O repositório está em CRLF, e âncora de várias linhas cravada com \n casa
 * zero vezes e envenena nada: foi assim que o escopo do carregarSerie mediu o
 * app.js inteiro no PR #55. A contagem de ocorrências logo abaixo é o que
 * transforma isso em reprovação em vez de silêncio. */
const NL = BIB_REPO.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
const TRECHO_OBRIGATORIOS = [
  "      OBRIGATORIOS.forEach(function (n) {",
  "        if (!porNome[n]) throw Recusa('O pacote está incompleto: falta ' + n + '.', 'defeito');",
  "      });"].join(NL);
const RECUSA_DESCONHECIDO = [
  "      nomesZip.forEach(function (n) {",
  "        if (!/^assets\\//.test(n) && OBRIGATORIOS.indexOf(n) < 0) throw Recusa('O pacote tem arquivo que este aplicativo não conhece: ' + n + '.', 'defeito');",
  "      });", TRECHO_OBRIGATORIOS].join(NL);
const trocas = {};
if (VENENO_APP) trocas['/biblioteca.js'] = BIB_REPO.split(TRECHO_OBRIGATORIOS).join(RECUSA_DESCONHECIDO);

const amb = H.criarAmbiente(PORTA, 'perfil_bib_kits', trocas);
amb.extras['/vazio.html'] = { tipo: 'text/html; charset=utf-8', corpo: '<!doctype html><title>vazio</title>' };

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_kits_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });
function zip(nome, opcoes) {
  const p = path.join(TMP, nome + '.zip');
  const feito = Sintetico.gerar(p, opcoes);
  return { caminho: p, manifest: feito.manifest };
}

const lerEstado = pag => pag.evaluate(() => {
  const c = document.querySelector('#estado-importacao-biblioteca');
  return c ? c.innerText.trim() : null;
});

async function importar(pag, arquivo, rotulo) {
  await pag.evaluate(() => {
    document.querySelector('#estado-importacao-biblioteca').innerHTML = '';
    document.querySelector('#cartao-biblioteca').hidden = false;
  });
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(arquivo);
  const r = await esperar(rotulo, () => Promise.all([lerEstado(pag), pag.$eval('#importar-biblioteca', b => b.disabled)]),
    v => !!v && !!v[0] && !/Conferindo|Gravando/.test(v[0]) && v[1] === false, 60000);
  return (r.valor && r.valor[0]) || '';
}

/* As contagens do que o tablet guardou, que é a medida deste teste. */
async function gravado(pag) {
  const d = {};
  for (const n of ['biblioteca_pacotes', 'biblioteca_itens', 'biblioteca_teoria', 'biblioteca_assets']) {
    d[n] = await H.contarDeposito(pag, n);
  }
  return d;
}

(async () => {
  console.log(VENENO_APP
    ? (CONTROLE
      ? 'CONTROLE: o biblioteca.js servido RECUSA arquivo de raiz desconhecido, e as expectativas são as do modo normal. ESTA CORRIDA TEM DE REPROVAR.'
      : 'MODO ENVENENADO (app recusa): o biblioteca.js servido recusa arquivo de raiz desconhecido; o teste tem que enxergar a recusa do pacote com kits.')
    : 'MODO NORMAL: um pacote com kits.json e exclusoes.json importa no 1.26.0 sem uma linha de mudança no aplicativo.');

  // ================================================================
  secao('0. O aplicativo servido é o publicado, e não mudou');
  let diferentes = null;
  try {
    diferentes = execFileSync('git', ['diff', '--name-only', COMMIT_1_26_0, '--'].concat(ARQUIVOS_DO_APP),
      { cwd: H.RAIZ, encoding: 'utf8' }).trim();
  } catch (e) {
    diferentes = 'o git não respondeu: ' + (e.message || e);
  }
  conf('nenhum arquivo do aplicativo difere do ' + COMMIT_1_26_0 + ' (o 1.26.0)', diferentes, '');
  const appJs = fs.readFileSync(path.join(H.RAIZ, 'app.js'), 'utf8');
  const swJs = fs.readFileSync(path.join(H.RAIZ, 'sw.js'), 'utf8');
  conf('a VERSAO do app.js é a 1.26.0', /var VERSAO = '1\.26\.0';/.test(appJs), true);
  conf('o cache do sw.js é o v41', /var CACHE = 'apoio-educacional-v41';/.test(swJs), true);
  const trocados = Object.keys(trocas);
  conf('o servidor troca só o que o veneno pede', trocados.join(',') || '(nada)', VENENO_APP ? '/biblioteca.js' : '(nada)');
  if (VENENO_APP) {
    conf('o veneno mudou mesmo o biblioteca.js servido', trocas['/biblioteca.js'] !== BIB_REPO ? 'diferente' : 'IGUAL', 'diferente');
    conf('e trocou exatamente uma ocorrência', BIB_REPO.split(TRECHO_OBRIGATORIOS).length - 1, 1);
    if (trocas['/biblioteca.js'] === BIB_REPO) throw Object.assign(new Error('veneno não aplicado'), { jaContado: true });
  }

  if (PACOTE_REAL) {
    // ==============================================================
    secao('R. O pacote de verdade, com os 33 kits, no 1.26.0');
    const bytes = fs.statSync(PACOTE_REAL).size;
    const zipReal = fs.readFileSync(PACOTE_REAL);
    const manifestoReal = JSON.parse(require('zlib').inflateRawSync(
      (() => { // lê o manifest.json do zip sem dependência nova
        let i = 0;
        for (;;) {
          const assinatura = zipReal.readUInt32LE(i);
          if (assinatura !== 0x04034b50) throw new Error('nao achei o manifest.json no comeco do zip');
          const metodo = zipReal.readUInt16LE(i + 8);
          const tamComp = zipReal.readUInt32LE(i + 18);
          const nomeLen = zipReal.readUInt16LE(i + 26);
          const extraLen = zipReal.readUInt16LE(i + 28);
          const nome = zipReal.slice(i + 30, i + 30 + nomeLen).toString('utf8');
          const dados = zipReal.slice(i + 30 + nomeLen + extraLen, i + 30 + nomeLen + extraLen + tamComp);
          if (nome === 'manifest.json') return metodo === 8 ? dados : Buffer.concat([dados]);
          i += 30 + nomeLen + extraLen + tamComp;
        }
      })()).toString('utf8'));
    const c = manifestoReal.contagens;
    console.log('   pacote: ' + path.basename(PACOTE_REAL) + ', ' + Math.round(bytes / 1048576) + ' MB, versão ' + manifestoReal.versao);
    console.log('   contagens do manifest: ' + JSON.stringify(c));
    conf('o pacote real diz quantos kits traz', typeof c.kits, 'number');
    await amb.subir();
    const pagR = await amb.pagina();
    await H.abrirApp(pagR, amb.ORIGEM);
    await H.irParaAba(pagR, 'ajustes');
    const msgR = await importar(pagR, PACOTE_REAL, 'importação do pacote real');
    console.log('   tela: ' + msgR.replace(/\n/g, ' | '));
    conf('a tela diz que importou', /^Biblioteca importada\./.test(msgR), true);
    const g = await gravado(pagR);
    console.log('   gravado: ' + JSON.stringify(g));
    conf('exercícios gravados = os do manifest', g.biblioteca_itens, c.itens);
    conf('aulas de teoria gravadas = as do manifest', g.biblioteca_teoria, c.aulas_teoria);
    conf('imagens gravadas = 2 por exercício mais as páginas de teoria',
      g.biblioteca_assets, c.itens * 2 + c.paginas_teoria);
    const regR = await pagR.evaluate(() => Store.listarPacotesBiblioteca().then(l => ({
      kits: l[0] && l[0].manifest.contagens.kits, campos: Object.keys(l[0] || {}).sort().join(',') })));
    conf('o manifest gravado leva contagens.kits', regR.kits, c.kits);
    conf('e o registro não guarda kit nenhum', /(^|,)(kits|exclusoes)(,|$)/.test(regR.campos), false);
    const depR = await pagR.evaluate(() => new Promise(r => {
      const q = indexedDB.open('apoio-educacional');
      q.onsuccess = () => { const n = Array.from(q.result.objectStoreNames).sort().join(','); q.result.close(); r(n); };
    }));
    conf('nenhum depósito biblioteca_kits no 1.26.0', depR.indexOf('biblioteca_kits') >= 0, false);
    await H.irParaAba(pagR, 'biblioteca');
    const listou = await esperar('a aba da biblioteca desenhou', () => pagR.evaluate(() =>
      document.querySelector('#tela-biblioteca') ? document.querySelector('#tela-biblioteca').innerText : ''),
    v => typeof v === 'string' && v.indexOf('Equações do Segundo Grau') >= 0, 30000);
    conf('os módulos do 9º ano aparecem na aba da biblioteca', listou.ok, true);
    if (pagR.errosDePagina.length) console.log('   erros de página: ' + pagR.errosDePagina.join(' | ').slice(0, 400));
    conf('nenhum erro de JavaScript na página', pagR.errosDePagina.length, 0);
    return;
  }

  // ================================================================
  secao('1. O pacote de brinquedo leva os dois arquivos da seção 8d');
  const comKits = zip('com-kits-v2', { versao: 2, kits: true });
  const m = comKits.manifest;
  conf('kits.json está na lista do manifest, com hash sha256', /^sha256:[0-9a-f]{64}$/.test(m.arquivos['kits.json'] || ''), true);
  conf('exclusoes.json também', /^sha256:[0-9a-f]{64}$/.test(m.arquivos['exclusoes.json'] || ''), true);
  conf('o manifest diz quantos kits', m.contagens.kits, Sintetico.KITS.length);
  conf('e as exclusões fecham com o manifest', m.contagens.itens_excluidos, Sintetico.EXCLUSOES.length);
  conf('o esquema continua 1', m.esquema, 1);

  await amb.subir();
  const pag = await amb.pagina();
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'ajustes');

  // ================================================================
  secao('2. O mesmo pacote SEM os dois arquivos entra, e vira a régua');
  const semKits = zip('sem-kits-v1', { versao: 1 });
  conf('este não tem kits.json', semKits.manifest.arquivos['kits.json'] === undefined, true);
  let msg = await importar(pag, semKits.caminho, 'importação do pacote sem kits');
  console.log('   tela: ' + msg.replace(/\n/g, ' | '));
  conf('a tela diz que importou', /^Biblioteca importada\./.test(msg), true);
  const semKitsGravado = await gravado(pag);
  console.log('   gravado sem kits: ' + JSON.stringify(semKitsGravado));
  conf('gravou os 60 exercícios', semKitsGravado.biblioteca_itens, 60);

  // ================================================================
  secao('3. O pacote COM os dois arquivos importa, no 1.26.0, sem mudar o app');
  msg = await importar(pag, comKits.caminho, 'importação do pacote com kits');
  console.log('   tela: ' + msg.replace(/\n/g, ' | '));
  const ESPERA_IMPORTOU = !(VENENO_APP && !CONTROLE);
  if (ESPERA_IMPORTOU) {
    conf('a tela diz que importou', /^Biblioteca importada\./.test(msg), true);
    conf('e nenhuma recusa apareceu', /não confere|incompleto|fora da lista|não conhece/.test(msg), false);
  } else {
    conf('o aplicativo envenenado RECUSA o pacote com kits', /não conhece/.test(msg), true);
    conf('e não diz que importou', /^Biblioteca importada\./.test(msg), false);
  }
  const comKitsGravado = await gravado(pag);
  console.log('   gravado com kits: ' + JSON.stringify(comKitsGravado));
  if (ESPERA_IMPORTOU) {
    conf('os dois arquivos novos não mudam NADA do que o tablet guarda',
      JSON.stringify(comKitsGravado), JSON.stringify(semKitsGravado));
    conf('e tudo passou a ser da versão 2', await pag.evaluate(() => new Promise(r => {
      const q = indexedDB.open('apoio-educacional');
      q.onsuccess = () => { const g = q.result.transaction('biblioteca_itens', 'readonly').objectStore('biblioteca_itens').getAll();
        g.onsuccess = () => { const v = {}; g.result.forEach(x => { v[x.versao] = (v[x.versao] || 0) + 1; }); q.result.close(); r(JSON.stringify(v)); }; };
    })), '{"2":60}');
  } else {
    conf('o tablet continua com a versão 1 intacta', JSON.stringify(comKitsGravado), JSON.stringify(semKitsGravado));
  }

  // ================================================================
  secao('4. Conferido e ignorado: o manifest vai, o conteúdo não fica');
  const registro = await pag.evaluate(() => Store.listarPacotesBiblioteca().then(l => {
    const p = l[0] || {};
    return { versao: p.versao, kits: (p.manifest && p.manifest.contagens && p.manifest.contagens.kits),
      excluidos: (p.manifest && p.manifest.contagens && p.manifest.contagens.itens_excluidos),
      campos: Object.keys(p).sort().join(',') };
  }));
  if (ESPERA_IMPORTOU) {
    conf('o manifest gravado leva contagens.kits', registro.kits, Sintetico.KITS.length);
    conf('e contagens.itens_excluidos', registro.excluidos, Sintetico.EXCLUSOES.length);
  }
  conf('o registro do pacote NÃO tem campo kits nem exclusoes',
    /(^|,)(kits|exclusoes)(,|$)/.test(registro.campos), false);
  const depositos = await pag.evaluate(() => new Promise(r => {
    const q = indexedDB.open('apoio-educacional');
    q.onsuccess = () => { const n = Array.from(q.result.objectStoreNames).sort().join(','); q.result.close(); r(n); };
  }));
  conf('nenhum depósito biblioteca_kits existe no 1.26.0 (isso é a etapa 2)',
    depositos.indexOf('biblioteca_kits') >= 0, false);
  conf('e o banco continua com os onze depósitos de sempre', depositos,
    'anexos,biblioteca_assets,biblioteca_etiquetas,biblioteca_itens,biblioteca_pacotes,biblioteca_teoria,biblioteca_uso,dados,historico,midias,notas');

  // ================================================================
  /* Esta seção fala do aplicativo PUBLICADO, então ela não roda contra o
   * biblioteca.js envenenado: ali a recusa viria da linha do veneno, que entra
   * antes da conferência do hash, e a saída diria outra coisa sem que nada
   * tivesse sido medido. */
  secao('5. Aditivo não é invisível: o kits.json passa DENTRO da conferência');
  if (VENENO_APP) {
    console.log('   fora desta corrida: o aplicativo servido não é o publicado.');
  } else {
  const foraDoManifest = zip('kits-fora-v3', { versao: 3, kits: true, veneno: 'kits-fora-do-manifest' });
  conf('o veneno tirou o kits.json da lista e o deixou no zip',
    foraDoManifest.manifest.arquivos['kits.json'] === undefined, true);
  msg = await importar(pag, foraDoManifest.caminho, 'importação com kits.json fora da lista');
  conf('o aplicativo recusa o pacote inteiro', /fora da lista do manifest: kits\.json/.test(msg), true);
  const hashErrado = zip('kits-hash-v3', { versao: 3, kits: true, veneno: 'kits-hash' });
  msg = await importar(pag, hashErrado.caminho, 'importação com o hash do kits.json errado');
  conf('e recusa quando o hash do kits.json não bate', /O arquivo kits\.json do pacote não confere com o manifest\./.test(msg), true);
  const aindaGravado = await gravado(pag);
  conf('e depois das duas recusas o tablet não mudou',
    JSON.stringify(aindaGravado), JSON.stringify(comKitsGravado));
  }

  // ================================================================
  secao('6. A biblioteca continua navegável, e a página não solta erro');
  await H.irParaAba(pag, 'biblioteca');
  const naTela = await esperar('a aba da biblioteca desenhou', () => pag.evaluate(() =>
    document.querySelector('#tela-biblioteca') ? document.querySelector('#tela-biblioteca').innerText : ''),
  v => typeof v === 'string' && v.indexOf('Equações do Segundo Grau') >= 0, 20000);
  conf('o módulo do pacote aparece na aba da biblioteca', naTela.ok, true);
  if (pag.errosDePagina.length) console.log('   erros de página: ' + pag.errosDePagina.join(' | ').slice(0, 400));
  conf('nenhum erro de JavaScript na página', pag.errosDePagina.length, 0);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
