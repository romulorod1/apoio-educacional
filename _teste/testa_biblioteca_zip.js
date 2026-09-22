/* testa_biblioteca_zip.js
 *
 * O leitor de zip (zip.js) e a conferência do pacote (biblioteca.js), sem
 * navegador. O Node 18+ tem DecompressionStream, crypto.subtle e Blob, que
 * são os mesmos que o Chrome do tablet usa.
 *
 * Prova nos dois sentidos:
 *   - o pacote sintético limpo abre, com entradas stored e deflate, e o que sai
 *     é byte a byte o que entrou;
 *   - um zip escrito pelo zipfile do Python (o mesmo módulo do gerador da B1)
 *     também abre;
 *   - cada veneno é RECUSADO, com a mensagem certa, e nenhum passa calado;
 *   - sem DecompressionStream, a recusa diz para atualizar o Chrome.
 *
 *   node _teste/testa_biblioteca_zip.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const Zip = require('../zip.js');
const Biblioteca = require('../biblioteca.js');
const Sintetico = require('./_pacote_sintetico.js');

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

async function recusa(zip) {
  try { await Biblioteca.abrirPacote(zip); return null; }
  catch (e) { return e; }
}

(async () => {
  secao('pacote limpo');
  const limpo = Sintetico.gerar(null);
  const z = Zip.ler(limpo.zip);
  const metodos = {};
  z.entradas.forEach(e => { metodos[e.metodo] = (metodos[e.metodo] || 0) + 1; });
  conf('o zip tem entradas stored (0)', metodos[0] > 0, true);
  conf('e entradas deflate (8)', metodos[8] > 0, true);
  const aberto = await Biblioteca.abrirPacote(limpo.zip);
  conf('o pacote limpo abre', !!aberto, true);
  conf('manifest: pacote', aberto.manifest.pacote, 'matematica-sintetico-9ano');
  conf('itens: todos', aberto.itens.length, limpo.itens.length);
  conf('teoria: todas as aulas', aberto.teoria.length, limpo.teoria.length);
  conf('assets: um por recorte e por página', aberto.assets.length,
    limpo.itens.length * 2 + limpo.teoria.reduce((s, t) => s + t.paginas.length, 0));
  // byte a byte: um SVG deflate e uma página stored, comparados com a origem
  const umEx = aberto.assets.find(a => /soma-e-produto\/ex-02\.svg$/.test(a.caminho));
  const umaPag = aberto.assets.find(a => /teo-p02\.svg$/.test(a.caminho));
  const bEx = Buffer.from(await umEx.blob.arrayBuffer());
  const bPag = Buffer.from(await umaPag.blob.arrayBuffer());
  conf('SVG deflate sai byte a byte igual à origem', Buffer.compare(bEx, limpo.arquivos[umEx.caminho].dados), 0);
  conf('página stored sai byte a byte igual à origem', Buffer.compare(bPag, limpo.arquivos[umaPag.caminho].dados), 0);
  conf('a imagem sai como Blob com o tipo certo', umEx.blob.type + ' ' + (umEx.bytes === undefined), 'image/svg+xml true');
  conf('tipo do asset', umEx.tipo, 'image/svg+xml');
  conf('resumo: primeira linha', Biblioteca.resumo(aberto.manifest, aberto.bytesTotais)[0],
    'Matemática, 9º ano, Pacote sintético de teste');
  conf('resumo: contagens', Biblioteca.resumo(aberto.manifest, aberto.bytesTotais)[1],
    '3 módulos; 6 aulas de teoria (21 páginas); 60 exercícios, 60 com solução');

  secao('zip escrito pelo zipfile do Python');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_zip_'));
  try {
    const pasta = path.join(tmp, 'p');
    for (const e of z.entradas) {
      const b = await Zip.extrair(z, e);
      const alvo = path.join(pasta, e.nome);
      fs.mkdirSync(path.dirname(alvo), { recursive: true });
      fs.writeFileSync(alvo, b);
    }
    const saidaPy = path.join(tmp, 'py.zip');
    execFileSync('python', ['-c',
      'import os,sys,zipfile\n' +
      'src,dst=sys.argv[1],sys.argv[2]\n' +
      'with zipfile.ZipFile(dst,"w",zipfile.ZIP_DEFLATED) as z:\n' +
      '  for r,_,fs in os.walk(src):\n' +
      '    for f in sorted(fs):\n' +
      '      p=os.path.join(r,f); n=os.path.relpath(p,src).replace(os.sep,"/")\n' +
      '      z.write(p,n,compress_type=zipfile.ZIP_STORED if n.endswith(".json") and "apelidos" in n else zipfile.ZIP_DEFLATED)\n',
      pasta, saidaPy]);
    const doPy = await Biblioteca.abrirPacote(fs.readFileSync(saidaPy));
    conf('o zip do Python abre e confere', doPy.itens.length, limpo.itens.length);
  } catch (e) {
    conf('o zip do Python abre e confere', 'erro: ' + e.message, limpo.itens.length);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  secao('venenos: cada um tem de ser recusado');
  const esperado = {
    'corrompido-deflate': /soma-e-produto\/ex-02\.svg do pacote está corrompido/,
    'corrompido-stored': /teo-p02\.svg do pacote está corrompido/,
    'hash': /ex-02\.svg do pacote não confere com o manifest/,
    'sobrando': /fora da lista do manifest: assets\/9ano\/intruso\.svg/,
    'faltando': /incompleto: falta assets\/9ano\/nao-existe/,
    'asset-citado': /cita .*-sumiu\.svg, que não está no pacote/,
    'esquema': /esquema 2/,
    'asset-fora': /imagem fora da pasta assets: figs\/fora\.svg/
  };
  const TIPO = { 'corrompido-deflate': 'download', 'corrompido-stored': 'download', 'hash': 'defeito',
    'sobrando': 'defeito', 'faltando': 'defeito', 'asset-citado': 'defeito', 'esquema': 'atualizar', 'asset-fora': 'defeito' };
  for (const v of Sintetico.VENENOS) {
    const e = await recusa(Sintetico.gerar(null, { veneno: v }).zip);
    conf('veneno ' + v + ': recusado', !!(e && e.recusa), true);
    conf('veneno ' + v + ': pelo motivo certo', e && esperado[v].test(e.message), true);
    conf('veneno ' + v + ': do tipo ' + TIPO[v], e && e.tipo, TIPO[v]);
    if (e && !esperado[v].test(e.message)) console.log('         mensagem: ' + e.message);
  }
  conf('todo veneno tem motivo esperado escrito aqui', Sintetico.VENENOS.every(v => esperado[v]), true);

  secao('arquivos que não são pacote');
  let e = await recusa(Buffer.from('isto nao e um zip, e so texto qualquer com tamanho'));
  conf('texto qualquer: recusado como não-pacote', e && /não é um pacote/.test(e.message) && e.tipo, 'nao_pacote');
  e = await recusa(Sintetico.montarZip([{ nome: 'leia.txt', dados: Buffer.from('oi'), metodo: 8 }]));
  conf('zip sem manifest: recusado', e && /falta o manifest\.json/.test(e.message), true);
  const cortado = limpo.zip.subarray(0, limpo.zip.length - 40);
  e = await recusa(cortado);
  conf('zip cortado no fim: recusado como download incompleto', e && e.message,
    'O pacote está incompleto: o fim do arquivo não chegou.');
  conf('e é do tipo "baixe de novo"', e && e.tipo, 'download');
  e = await recusa(Sintetico.montarZip([
    { nome: 'manifest.json', dados: Buffer.from(JSON.stringify({ esquema: 1, pacote: 'x', versao: 1, arquivos: { constructor: 'sha256:' + '0'.repeat(64) } })), metodo: 8 }]));
  conf('manifest listando "constructor" sem o arquivo: recusado como faltando', e && /falta constructor/.test(e.message), true);

  secao('falha do navegador no meio da conferência não vira defeito do pacote');
  const digest = crypto.subtle.digest;
  crypto.subtle.digest = () => Promise.reject(new TypeError('Array buffer allocation failed'));
  try {
    e = await recusa(limpo.zip);
    conf('o erro sai como erro comum, sem a marca de recusa', e && (e.recusa ? 'recusa ' + e.tipo : 'comum ' + e.name), 'comum TypeError');
  } finally {
    crypto.subtle.digest = digest;
  }

  secao('navegador sem DecompressionStream');
  const guardado = global.DecompressionStream;
  global.DecompressionStream = undefined;
  try {
    e = await recusa(limpo.zip);
    conf('recusa com a mensagem de atualizar o Chrome', e && e.message, Biblioteca.SEM_NAVEGADOR);
  } finally {
    global.DecompressionStream = guardado;
  }

  console.log('\n' + passes + ' passaram, ' + falhas + ' falharam.');
  process.exit(falhas ? 1 : 0);
})().catch(e => {
  console.error('erro:', e.stack);
  console.log('\n' + passes + ' passaram, ' + (falhas + 1) + ' falharam.');
  process.exit(1);
});
