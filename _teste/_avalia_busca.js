/* _avalia_busca.js
 * Roda o buscador contra as buscas reais e mede quantas acertam.
 * Não é o teste que trava a entrega: é a régua para saber se uma mudança
 * na regra melhorou ou piorou o conjunto.
 *
 *   node _teste/_avalia_busca.js            resumo
 *   node _teste/_avalia_busca.js -v         mostra o que errou
 */
const B = require('../busca.js');
const ix = require('../banco/busca.json').temas;
const banco = require('../temas/banco.json');
const corpus = require('./_buscas_reais.json').buscas;

const tit = {}, serie = {};
banco.temas.forEach(t => { tit[t.id] = t.pt.titulo; serie[t.id] = t.serie; });

/* O texto do esperado nomeia o tema do jeito que se fala, e nem sempre bate
 * letra a letra com o título do banco (1o contra 1º, com ou sem o ano entre
 * parênteses, um pedaço do título a menos). Então o que vale é: as palavras
 * de conteúdo do título aparecem no que se esperava. */
function tokens(s) {
  return B.palavrasDe(s || '');
}
function bate(titulo, esperado) {
  const esp = tokens(esperado);
  const tit = tokens(titulo).filter(w => w.length >= 4);
  if (!tit.length) return false;
  const dentro = tit.filter(w => esp.indexOf(w) >= 0).length;
  return dentro / tit.length >= 0.7;
}

function avaliar() {
  let bom = 0, fora = 0, vazio = 0, tempo = 0;
  const ruins = [];
  corpus.forEach(c => {
    const t0 = process.hrtime.bigint();
    const r = B.procurar(ix, c.q);
    tempo += Number(process.hrtime.bigint() - t0) / 1e6;
    const itens = (r && r.itens) || [];
    if (!itens.length) { vazio++; ruins.push({ tipo: 'VAZIO', c, deu: [] }); return; }
    const pos = itens.findIndex(x => bate(tit[x.id], c.esperado));
    if (pos >= 0 && pos < 3) bom++;
    else { fora++; ruins.push({ tipo: pos < 0 ? 'FORA' : 'POS' + pos, c, deu: itens.slice(0, 3) }); }
  });
  return { bom, fora, vazio, ruins, tempo };
}

const r = avaliar();
console.log('=== ' + corpus.length + ' buscas reais ===');
console.log('acertou no top 3: ' + r.bom + '   errou de posição: ' + r.fora + '   tela vazia: ' + r.vazio);
console.log('média por busca: ' + (r.tempo / corpus.length).toFixed(2) + ' ms');

if (process.argv.indexOf('-v') >= 0) {
  console.log();
  r.ruins.forEach(x => {
    console.log(x.tipo.padEnd(6) + ' "' + x.c.q + '"');
    console.log('       deu: ' + (x.deu.map(d => tit[d.id] + ' [' + serie[d.id] + '/' + d.onde + ']').join('  ·  ') || 'nada'));
    console.log('       queria: ' + (x.c.esperado || '').slice(0, 90));
  });
}
module.exports = { avaliar };
