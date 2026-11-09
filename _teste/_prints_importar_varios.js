/* _prints_importar_varios.js
 *
 * Os três prints do PR "importar vários pacotes", a 1280x800, com pacotes
 * sintéticos (nenhum nome de aluno, nenhum livro real):
 *   1. o cartão da Biblioteca, com o botão do seletor;
 *   2. o progresso no meio ("Importando 2 de 3: ...");
 *   3. o resumo com uma falha.
 *
 *   PRINTS=<pasta> node _teste/_prints_importar_varios.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const H = require('./_bib_navegador.js');
const Sintetico = require('./_pacote_sintetico.js');
const { esperar } = H;

const SAIDA = process.env.PRINTS;
if (!SAIDA) { console.error('Diga a pasta: PRINTS=<pasta> node _teste/_prints_importar_varios.js'); process.exit(2); }
fs.mkdirSync(SAIDA, { recursive: true });

const amb = H.criarAmbiente(8881, 'perfil_prints_varios', {});
amb.extras['/vazio.html'] = { tipo: 'text/html; charset=utf-8', corpo: '<!doctype html><title>vazio</title>' };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bib_prints_varios_'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ok */ } });

const z = (nome, f) => { const p = path.join(TMP, nome + '.zip'); f(p); return p; };

(async () => {
  await amb.subir();
  const pag = await amb.pagina();
  await pag.setViewport({ width: 1280, height: 800 });
  await pag.goto(amb.ORIGEM + '/vazio.html', { waitUntil: 'load' });
  await H.abrirApp(pag, amb.ORIGEM);
  await H.irParaAba(pag, 'ajustes');
  await pag.evaluate(() => {
    document.querySelector('#cartao-biblioteca').hidden = false;
    document.querySelector('#titulo-cartao-biblioteca').hidden = false;
    // a gravação demora um pouco, para o progresso do meio dar tempo de ser visto
    const o = Store.gravarPacoteBiblioteca;
    Store.gravarPacoteBiblioteca = function () { const a = arguments; return new Promise(r => setTimeout(r, 1500)).then(() => o.apply(Store, a)); };
  });
  const aoPe = () => pag.evaluate(() => { document.querySelector('#importar-biblioteca').scrollIntoView({ block: 'end' }); });

  await aoPe();
  await pag.screenshot({ path: path.join(SAIDA, '1_seletor.png') });

  const m2 = z('m2', p => Sintetico.gerarProva(p, { serie: 'm2', versao: 1 }));
  const enem = z('enem', p => Sintetico.gerarProva(p, { serie: '3em', versao: 1 }));
  const banco = z('banco', p => Sintetico.gerarBanco(p, { versao: 1 }));
  const entrada = await pag.$('#arquivo-biblioteca');
  await entrada.uploadFile(m2, enem, banco);
  await esperar('progresso 2/3', () => pag.evaluate(() => document.querySelector('#estado-importacao-biblioteca').getAttribute('data-progresso')), v => v === '2/3', 30000);
  await aoPe();
  await pag.screenshot({ path: path.join(SAIDA, '2_progresso.png') });
  await esperar('fim da primeira série', () => pag.evaluate(() => !!document.querySelector('#resumo-importacao-biblioteca')), v => v === true, 60000);

  // o resumo com uma falha: um pacote cortado, um que já estava e um novo
  const inteiro = fs.readFileSync(z('m1-inteiro', p => Sintetico.gerarProva(p, { serie: 'm1', versao: 1 })));
  const cortado = path.join(TMP, 'mirim-1-incompleto.zip');
  fs.writeFileSync(cortado, inteiro.subarray(0, Math.floor(inteiro.length * 0.6)));
  await pag.evaluate(() => { document.querySelector('#fechar-resumo-importacao').click(); });
  await pag.evaluate(() => Store.removerPacoteBiblioteca('matematica-sintetico-banco-n2'));
  await entrada.uploadFile(cortado, m2, banco);
  await esperar('fim da segunda série', () => pag.evaluate(() => !!document.querySelector('#resumo-importacao-biblioteca')), v => v === true, 60000);
  await aoPe();
  await pag.screenshot({ path: path.join(SAIDA, '3_resumo_com_falha.png') });
  console.log('prints em ' + SAIDA);
})().then(() => H.fim(amb)(), e => H.fim(amb)(e));
