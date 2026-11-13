/* testa_livros_mapa_epub_regras.js
 *
 * Item 12a, parte 0 (o mapa de capítulos para EPUB), sem navegador, sobre o
 * biblioteca.js de verdade. Um EPUB SINTÉTICO de quatro partes em que dois
 * capítulos começam na MESMA parte, cada um na sua âncora (como no FME de
 * teoria). Nenhum livro real.
 *
 * O que se prova:
 *   1. sumarioDoLivro: o EPUB sem sumário mostra o do mapa, por parte e
 *      âncora, em ordem de parte e, na mesma parte, na ordem do mapa, com o
 *      mapa_n; o título lixo e a parte fora da espinha ficam de fora; o EPUB
 *      com sumário próprio fica com ele; o PDF segue a regra de antes;
 *   2. entradaDoMapa: com a âncora por onde ela entrou na parte, vale o
 *      capítulo que começa nela (o "Abrir no livro" do primeiro capítulo da
 *      parte não mostra os assuntos do segundo); sem âncora, ou com uma âncora
 *      que nenhum capítulo tem, a regra de sempre;
 *   3. mapaDoLivro leva a parte, o fim e a âncora de cada entrada, que o
 *      "Abrir no livro" usa (abrirLivro com { capitulo, ancora }).
 *
 * Venenos (a prova TEM de reprovar, e reprova pelo motivo):
 *   --envenenado-sumario-so-do-pacote  o EPUB volta a mostrar só o sumário do
 *                                      pacote (vazio): o mapa ignorado na tela;
 *   --envenenado-cobre-sem-ancora      a âncora não escolhe o capítulo: o
 *                                      primeiro da parte mostra o segundo.
 *
 *   node _teste/testa_livros_mapa_epub_regras.js [--envenenado-...]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Module = require('module');

const RAIZ = path.join(__dirname, '..');
const TROCAS = {
  '--envenenado-sumario-so-do-pacote': ['return sumario.length ? sumario : sumarioDoMapaDoEpub(meta);', 'return sumario;'],
  '--envenenado-cobre-sem-ancora': ["if (formato === 'epub' && ancora) {", 'if (false) {']
};
const MODO = Object.keys(TROCAS).filter(m => process.argv.indexOf(m) !== -1)[0] || '';
const desconhecidos = process.argv.filter(a => /^--envenenado-/.test(a) && !TROCAS[a]);

let passes = 0, falhas = 0;
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else falhas++;
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo + (ok ? '' : '  [obtido: ' + String(obtido).slice(0, 300) + ' | esperado: ' + esperado + ']'));
  return ok;
}
function secao(t) { console.log('\n=== ' + t + ' ==='); }

const TEXTO = fs.readFileSync(path.join(RAIZ, 'biblioteca.js'), 'utf8');
function carregar(troca) {
  const caminho = path.join(RAIZ, 'biblioteca.js');
  let texto = TEXTO;
  if (troca) texto = texto.split(troca[0]).join(troca[1]);
  const m = new Module(caminho, module);
  m.filename = caminho;
  m.paths = Module._nodeModulePaths(path.dirname(caminho));
  m._compile(texto, caminho);
  return m.exports;
}

secao('0. A prova se confere');
conf('nenhum veneno desconhecido foi pedido', desconhecidos.join(','), '');
Object.keys(TROCAS).forEach(m => conf('o ponto de ' + m + ' existe uma vez no biblioteca.js', TEXTO.split(TROCAS[m][0]).length - 1, 1));
const B = carregar(MODO ? TROCAS[MODO] : null);

// o EPUB de prova: quatro partes; "Primeiro" e "Segundo" começam na parte 2, em p2 e p5
const ESPINHA = ['capa.xhtml', 'texto/p2.xhtml', 'texto/p3.xhtml', 'texto/p4.xhtml'];
const MAPA = [
  { n: 1, titulo: 'Primeiro do mapa', capitulo: 2, capitulo_fim: 2, ancora: 'p2', assuntos: [{ id: 'MATEM1-01' }], origem: 'mapa' },
  { n: 2, titulo: 'Segundo do mapa', capitulo: 2, capitulo_fim: 2, ancora: 'p5', assuntos: [{ id: 'MATEM1-02' }], origem: 'mapa' },
  { n: 3, titulo: 'Terceiro do mapa', capitulo: 3, capitulo_fim: 4, assuntos: [{ id: 'MATEM1-01' }], origem: 'mapa' },
  { n: 4, titulo: 'Quarto do mapa', capitulo: 4, capitulo_fim: 4, ancora: 'p11', assuntos: [{ id: 'MATEM1-02' }], origem: 'mapa' }
];
const meta = extra => Object.assign({ id: 'epub-prova', formato: 'epub', titulo: 'EPUB de prova', epub: { espinha: ESPINHA },
  sumario: [], sumario_origem: 'nenhum', mapa: MAPA, mapa_origem: 'mapa' }, extra || {});
const resumo = s => s.map(e => [e.n, e.titulo, e.capitulo, e.ancora || '-', e.mapa_n === undefined ? '' : e.mapa_n].join('|')).join(' ; ');

secao('1. O sumário do EPUB sem sumário sai do mapa');
conf('o EPUB sem sumário mostra os quatro capítulos do mapa, por parte e âncora',
  resumo(B.sumarioDoLivro(meta())),
  '1|Primeiro do mapa|2|p2|1 ; 2|Segundo do mapa|2|p5|2 ; 3|Terceiro do mapa|3|-|3 ; 4|Quarto do mapa|4|p11|4');
conf('o sumário do mapa tem a forma do sumário de EPUB (nível 1, sem página)',
  B.sumarioDoLivro(meta()).every(e => e.nivel === 1 && e.pagina === undefined), true);
// o mapa fora de ordem: a parte manda; na mesma parte, a ordem do mapa (o gerador já ordena pela âncora)
const foraDeOrdem = [MAPA[3], MAPA[0], MAPA[2], MAPA[1]];
conf('fora de ordem, a parte manda e, na mesma parte, a ordem do mapa',
  resumo(B.sumarioDoLivro(meta({ mapa: foraDeOrdem }))).replace(/\|\d+ ; /g, ' ; ').replace(/\|\d+$/, ''),
  '1|Primeiro do mapa|2|p2 ; 2|Segundo do mapa|2|p5 ; 3|Terceiro do mapa|3|- ; 4|Quarto do mapa|4|p11');
const comRuins = MAPA.concat([{ n: 5, titulo: 'page12', capitulo: 3, capitulo_fim: 3, assuntos: [] },
  { n: 6, titulo: 'Fora da espinha', capitulo: 9, capitulo_fim: 9, assuntos: [] },
  { n: 7, titulo: 'Só de PDF', pagina: 3, pagina_fim: 4, assuntos: [] }]);
conf('o título lixo, a parte fora da espinha e a entrada só de página ficam de fora',
  B.sumarioDoLivro(meta({ mapa: comRuins })).map(e => e.titulo).join(','), 'Primeiro do mapa,Segundo do mapa,Terceiro do mapa,Quarto do mapa');
const proprio = [{ n: 1, nivel: 1, titulo: 'Começo', capitulo: 1 }, { n: 2, nivel: 1, titulo: 'Meio', capitulo: 3 }];
conf('o EPUB com sumário próprio fica com ele', B.sumarioDoLivro(meta({ sumario: proprio, sumario_origem: 'navegacao' })).map(e => e.titulo).join(','), 'Começo,Meio');
conf('o EPUB sem sumário e sem mapa: vazio', B.sumarioDoLivro(meta({ mapa: [] })).length, 0);
conf('o mapa de obra inteira não vira sumário', B.sumarioDoLivro(meta({ mapa: [{ n: 1, titulo: 'Obra', capitulo: 1, capitulo_fim: 4, obra_inteira: true, assuntos: [] }] })).length, 0);
const pdf = { formato: 'pdf', paginas: 10, sumario: [], mapa: [{ n: 1, titulo: 'Cap A', pagina: 2, pagina_fim: 5, assuntos: [] }] };
conf('o PDF segue a regra de antes (o mapa vira sumário por página)', B.sumarioDoLivro(pdf).map(e => e.titulo + '@' + e.pagina).join(','), 'Cap A@2');

secao('2. A âncora escolhe o capítulo na parte de vários');
const mapa = B.mapaDoLivro(meta(), {});
const n = e => (e ? e.n : 'nenhuma');
conf('pela âncora p2 (o "Abrir no livro" do primeiro): o capítulo 1', n(B.entradaDoMapa(mapa, 'epub', 2, 'p2')), 1);
conf('pela âncora p5: o capítulo 2', n(B.entradaDoMapa(mapa, 'epub', 2, 'p5')), 2);
conf('na parte 4 pela âncora p11: o capítulo 4', n(B.entradaDoMapa(mapa, 'epub', 4, 'p11')), 4);
conf('sem âncora na parte 2: a regra de sempre (a que começa mais perto, a última)', n(B.entradaDoMapa(mapa, 'epub', 2)), 2);
conf('com uma âncora que nenhum capítulo tem (um link de dentro do livro): a regra de sempre', n(B.entradaDoMapa(mapa, 'epub', 2, 'p4')), 2);
conf('a âncora de outra parte não vale nesta: a parte 3 com p2 fica no capítulo 3', n(B.entradaDoMapa(mapa, 'epub', 3, 'p2')), 3);
conf('o PDF ignora a âncora', n(B.entradaDoMapa([{ n: 1, pagina: 1, pagina_fim: 4 }, { n: 2, pagina: 3, pagina_fim: 6 }], 'pdf', 3, 'p2')), 2);

secao('3. O mapa leva parte, fim e âncora ao "Abrir no livro"');
conf('mapaDoLivro: parte, fim e âncora de cada entrada',
  mapa.map(e => [e.n, e.capitulo, e.capitulo_fim, e.ancora || '-'].join('/')).join(' '), '1/2/2/p2 2/2/2/p5 3/3/4/- 4/4/4/p11');
conf('livrosComAssunto do MATEM1-02 acha o 2 e o 4, com a âncora',
  B.livrosComAssunto([{ id: 'epub-prova', meta: meta({ series: ['em1'] }) }], {}, 'MATEM1-02', 'em1')
    .map(a => a.entrada.n + '@' + a.entrada.capitulo + '#' + a.entrada.ancora).join(','), '2@2#p5,4@4#p11');

if (MODO) {
  secao('VENENO ' + MODO);
  const esperado = MODO === '--envenenado-sumario-so-do-pacote' ? 'o sumário do mapa' : 'a âncora escolhe';
  conf('o veneno reprovou a prova (' + esperado + ')', falhas > 0, true);
  const ok = falhas > 0;
  console.log('\n' + (ok ? 1 : 0) + ' verificacoes passaram, ' + (ok ? 0 : 1) + ' falharam');
  process.exit(ok ? 0 : 1);
}
console.log('\n' + passes + ' verificacoes passaram, ' + falhas + ' falharam');
process.exit(falhas ? 1 : 0);
