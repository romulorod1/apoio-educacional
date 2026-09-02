/* figuras/_prova_fundacao.js
 * Gera o PDF de prova da etapa 1 e confere o que a folha tem que provar.
 *
 * Passa pelo caminho de verdade, o gerarMaterialTema do pdf.js, e nao por uma
 * montagem de teste: o que se quer provar aqui e a marcacao ligada de ponta a
 * ponta, e uma montagem paralela provaria outra coisa.
 *
 * Regra da casa: nunca usar travessao.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');
const FigBase = require('./base.js');
const FigReceitas = require('./receitas.js');

/* Tema sintetico, escrito aqui e nao no banco: o banco e de outro dono e esta
 * folha existe so para a etapa 1 sair impressa. Os enunciados vem com a
 * diretiva colada no fim por um espaco, que e exatamente como o itens_numerados
 * do verificar.py entrega o exercicio ao gerador (atual += ' ' + linha.strip()). */
const tema = {
  id: 'PROVA-FIG',
  pt: {
    titulo: 'Triângulos: a soma dos ângulos internos',
    resumo: 'Prova da fundação das figuras.',
    explicacao: [
      '#### A soma dos três ângulos internos',
      '',
      'Num triângulo qualquer, a soma dos três ângulos internos vale sempre 180 graus.',
      'Esta linha vem grudada na diretiva de propósito, sem linha em branco entre as duas:',
      'se o laço que junta parágrafo não parar na diretiva, ela sai impressa aqui como texto.',
      '@fig triangulo angulo=52 angulo=61 angulo=67',
      '',
      'Repare que o maior ângulo fica em frente ao maior lado, e que os três valores do desenho',
      'são os mesmos do texto: a figura foi construída pela lei dos senos a partir deles, então',
      'quem conferir com transferidor encontra 52, 61 e 67 de verdade.',
      '',
      '@fig triangulo lado=3 lado=4 lado=5',
      '',
      'O triângulo de lados 3, 4 e 5 é retângulo, e aqui ele sai em escala fiel: o cateto maior',
      'aparece maior. A mesma receita atende a explicação e o exercício, com a mesma sintaxe.'
    ].join('\n'),
    exercicios: [
      {
        n: 1, bloco: 'Desigualdade triangular',
        enunciado: 'Existe triângulo de lados 4, 7 e 12? Justifique. ' +
          '@fig triangulo id=t1 lado=4 lado=7 lado=12',
        resposta: 'Não existe. Os dois lados menores somam 4 + 7 = 11, que é menor que 12, ' +
          'então eles não se alcançam e o triângulo não fecha.'
      },
      {
        n: 2, bloco: 'Desigualdade triangular',
        /* De propósito sem figura nenhuma: e o exercicio de texto limpo entre
         * duas figuras, que e o que prova que o tracejado da figura de cima nao
         * vazou para o resto da folha. */
        enunciado: 'Dois ângulos de um triângulo medem 52 graus e 61 graus. Quanto mede o terceiro?',
        resposta: '180 menos 52 menos 61 dá 67 graus.'
      },
      {
        /* Os valores NAO podem repetir os da figura da explicacao (52, 61 e 67).
         * Repetindo, a figura do exercicio fica identica a do exemplo ja
         * resolvido, que traz o 67 impresso, e o desenho entrega a resposta. A
         * trava do base.js acusa isso, e acusava esta prova com razao: o fixture
         * e mais velho que a trava. Agora sao 48, 57 e 75. */
        n: 3, bloco: 'Soma dos ângulos internos',
        enunciado: 'Determine o valor de x na figura. ' +
          '@fig triangulo id=t3 angulo=48 angulo=57 incognita=C',
        resposta: 'x mede 75 graus. @fig id=t3 fase=gabarito'
      },
      {
        n: 4, bloco: 'Soma dos ângulos internos',
        enunciado: 'Determine o valor de x na figura. ' +
          '@fig triangulo id=t4 angulo=38 angulo=104 incognita=C giro=22',
        resposta: 'x mede 38 graus. @fig id=t4 fase=gabarito'
      }
    ]
  }
};
tema.en = tema.pt;

const bytes = PDFGen.gerarMaterialTema({
  tema: tema, lingua: 'pt',
  incluirMaterial: true, incluirLista: true, incluirGabarito: true,
  aluno: 'Nathália', data: '02/09/2026'
});
const saida = path.join(__dirname, '_prova_fundacao.pdf');
fs.writeFileSync(saida, bytes);
console.log('PDF: ' + saida + '  (' + Math.round(bytes.length / 1024) + ' KB)');

/* ================================================================ conferências
 *
 * A folha impressa e o gate da etapa, mas estas travas pegam o que o olho nao
 * pega: q sem Q, tracejado ligado fora de envelope e diretiva impressa. */

let ok = 0, mau = 0;
function conf(rotulo, obtido, esperado) {
  const bom = String(obtido) === String(esperado);
  if (bom) ok++; else mau++;
  console.log((bom ? '  OK    ' : '  FALHA ') + rotulo +
    (bom ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}

/* A trava mais importante da etapa: o fluxo de conteudo nao e comprimido, entao
 * uma diretiva impressa apareceria aqui dentro de um (...) Tj. Por isso o texto
 * do tema acima nao escreve a marcacao por extenso em lugar nenhum. */
const cru = Buffer.from(bytes).toString('latin1');
conf('nenhuma diretiva saiu impressa como texto', /@fig/.test(cru), false);

/* Reexecuta o mesmo material com um Doc próprio, para poder olhar os operadores
 * de cada página antes do finalizar() juntar tudo. */
const doc = new PDFGen.Doc();
doc.novaPagina();
doc.registrarFiguras(tema.pt.explicacao);
doc.markdown(tema.pt.explicacao, { tam: 10 });
tema.pt.exercicios.forEach(function (ex) { doc.registrarFiguras(ex.enunciado); });
doc.novaPagina();
tema.pt.exercicios.forEach(function (ex) {
  doc.y -= 15;
  const partes = doc.partesDeFigura(ex.enunciado);
  partes.forEach(function (p) {
    if (p.tipo === 'figura') doc.figura(p.diretiva, { x: 60, largura: PDFGen.MARG_D - 60 });
  });
});

let desequilibrio = 0, tracejadoSolto = 0;
doc.paginas.forEach(function (pag, n) {
  let profundidade = 0, tracejadoNaRaiz = false;
  pag.ops.forEach(function (linha) {
    String(linha).split(/\s+/).forEach(function (tok, i, toks) {
      if (tok === 'q') profundidade++;
      if (tok === 'Q') profundidade--;
      if (tok === 'd' && profundidade === 0) {
        const padrao = String(linha).slice(0, String(linha).lastIndexOf('d'));
        if (!/\[\s*\]/.test(padrao)) tracejadoNaRaiz = true;
      }
    });
  });
  if (profundidade !== 0) desequilibrio++;
  if (tracejadoNaRaiz) tracejadoSolto++;
});
conf('todo q tem o seu Q em todas as páginas', desequilibrio, 0);
conf('nenhum tracejado ligado fora de envelope', tracejadoSolto, 0);
conf('não sobrou aviso de figura', (doc.avisosFigura || []).join(' | '), '');

const desenhadas = doc.figurasDesenhadas || [];
conf('desenhou as duas figuras da explicação e as três dos enunciados', desenhadas.length, 5);
desenhadas.forEach(function (r) {
  conf('  ' + (r.id || r.receita) + ': escala única em x e y', typeof r.escala, 'number');
  conf('  ' + (r.id || r.receita) + ': dentro do teto de cinco marcas', r.marcasAtivas <= 5, true);
});

/* O teto de cinco marcas e medido, e nao intencao: com as letras de vértice a
 * mesma figura passa de seis e o registro acusa. */
const cheio = new PDFGen.Doc();
cheio.novaPagina();
cheio.figura(FigBase.lerDiretiva('@fig triangulo angulo=52 angulo=61 incognita=C vertices=A;B;C'), {});
const reg = (cheio.figurasDesenhadas || [])[0];
conf('a figura com seis marcas é acusada', reg && reg.marcasAtivas > 5 && reg.avisos.length > 0, true);

/* A figura não racha na quebra de página: a reserva acontece antes do primeiro
 * traço, e quando o garanteEspaco vira a folha as coordenadas são recalculadas a
 * partir do cursor novo. Sem isso, metade do triângulo cairia na folha seguinte
 * ou por cima do rodapé, que é desenhado em outro momento do fluxo. */
{
  const pePagina = new PDFGen.Doc();
  pePagina.novaPagina();
  pePagina.y = PDFGen.Y_LIMITE + 40;          // sobra menos do que a figura pede
  const antes = pePagina.paginas.length;
  const r = pePagina.figura(FigBase.lerDiretiva('@fig triangulo angulo=52 angulo=61'), {});
  conf('a figura virou a página em vez de rachar', pePagina.paginas.length, antes + 1);
  conf('e o registro anota a quebra', r.quebrouPagina, true);
  conf('a figura ficou inteira acima do limite do rodapé', r.caixa.y >= PDFGen.Y_LIMITE, true);
  conf('e inteira abaixo do topo do conteúdo', r.caixa.y + r.caixa.altura <= PDFGen.Y_TOPO, true);
}

/* A legenda é restrita a dois casos, e o aviso de escala é um deles. */
{
  const comAviso = new PDFGen.Doc();
  comAviso.novaPagina();
  const r = comAviso.figura(FigBase.lerDiretiva('@fig triangulo angulo=52 angulo=61 escala=fora'), {});
  /* O desenhador NAO escreve mais a frase sozinho. Ele escrevia
   * 'Figura fora de escala.' cravado em portugues, e era a unica frase do kit
   * inteiro que saia IMPRESSA na folha: a folha em INGLES do exercicio 15 do
   * piloto saiu com a frase portuguesa. Nenhuma conferencia de conta pegaria
   * isso. Agora a legenda vem do tema, nas duas linguas, e quem nao passa e
   * avisado em vez de receber texto inventado. */
  conf('escala=fora nao inventa legenda', r.legenda, null);
  conf('e nenhuma frase portuguesa sai impressa sozinha',
    /Figura fora de escala\./.test(comAviso.pag.ops.join(' ')), false);
  conf('mas a falta da legenda e avisada',
    (r.avisos || []).some(function (a) { return /fora de escala/i.test(String(a)); }), true);
}

/* Cada ângulo sai no SEU vértice, inclusive quando um deles é expressão. */
{
  const alg = new PDFGen.Doc();
  alg.novaPagina();
  const r = alg.figura(FigBase.lerDiretiva('@fig triangulo angulo=3x+10 angulo=61 angulo=52'), {});
  const textos = r.rotulos.map(function (x) { return x.texto; }).join(' ');
  conf('a expressão vai para a folha como veio', /3x\+10/.test(textos), true);
  conf('e a figura sai avisada de fora de escala', r.foraDeEscala, true);
}

/* O null da geometria chega até a folha como resultado didático. */
conf('4, 7 e 12 não fecham triângulo', FigBase.geo.trianguloPorLados(4, 7, 12), null);
conf('a receita triangulo existe', FigReceitas.existe('triangulo'), true);
/* A lista de chaves era cravada aqui e ficou velha assim que o triangulo passou
 * a aceitar ceviana, congruentes, encontro e externo: a prova reprovava sem
 * haver defeito, que e o tipo de alarme falso que ensina a ignorar alarme.
 *
 * Duas listas da mesma coisa em dois arquivos divergem no dia em que alguem
 * mexe numa so. Entao a prova deixa de guardar lista propria e passa a exigir o
 * que de fato importa: que a receita DECLARE toda chave que ela usa, e que
 * chave nao declarada seja recusada. */
conf('a receita declara as chaves dela', Array.isArray(FigReceitas.chavesDe('triangulo')), true);
{
  const declaradas = FigReceitas.chavesDe('triangulo');
  ['angulo', 'lado', 'id', 'fase', 'incognita', 'legenda', 'escala', 'giro', 'vertices',
   'ceviana', 'congruentes', 'encontro', 'externo'].forEach(function (c) {
    conf('  a chave "' + c + '" esta declarada', declaradas.indexOf(c) >= 0, true);
  });
  const inventada = new PDFGen.Doc();
  inventada.novaPagina();
  inventada.figura(FigBase.lerDiretiva('@fig triangulo angulo=52 angulo=61 naoexiste=7'), {});
  conf('  e chave nao declarada e recusada com aviso',
    (inventada.avisosFigura || []).some(function (a) { return /naoexiste/.test(String(a)); }), true);
}

console.log('\n' + ok + ' conferências passaram, ' + mau + ' falharam.');
process.exit(mau ? 1 : 0);
