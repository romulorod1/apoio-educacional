/* figuras/_prova_piloto_base.js
 * Folha de prova do _piloto_base.js: as travas genericas do piloto de tema,
 * cada uma com PAR ENVENENADO.
 *
 * A regra e a do _base_prova_travas.js e existe porque prova que passa sempre e
 * pior do que prova nenhuma: toda trava e provada NOS DOIS SENTIDOS. Um tema
 * (ou uma figura) limpo, que a trava tem que APROVAR, e um tema com exatamente
 * o defeito que ela caca, que ela tem que REPROVAR, e reprovar NOMEANDO o item.
 * A conferencia compara a acusacao inteira, e nao so "falhou": uma trava que
 * acusa o item errado esta quebrada do mesmo jeito.
 *
 * Onde a trava le o DESENHO (escala, hachura), o veneno e uma figura de
 * verdade, desenhada pela receita, porque o defeito mora no que sai impresso.
 * Onde a trava le uma lista (marcas ativas, rotulo na folha, numero riscado,
 * estado do fluxo), o veneno e um registro montado a mao com as coordenadas
 * exatas do defeito: a trava e aritmetica sobre o registro.medido, e montar o
 * registro e a unica forma de plantar 4 pt de folga ou um arco em cima de um
 * numero sem esperar a receita reproduzir o bug antigo. Cada caso desses diz na
 * frase por que o registro e montado.
 *
 * Uso: node _prova_piloto_base.js
 *
 * Regra da casa: nunca usar travessao.
 */
const P = require('./_piloto_base.js');
const PDFGen = P.PDFGen;

let ok = 0, mau = 0;
function conf(rotulo, obtido, esperado) {
  const bom = String(obtido) === String(esperado);
  if (bom) ok++; else mau++;
  console.log((bom ? '  OK    ' : '  FALHA ') + rotulo +
    (bom ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}
/* O par: o limpo tem que sair vazio, o envenenado tem que sair com a acusacao
 * exata. Duas conferencias, sempre, nunca uma. */
function par(nome, limpo, envenenado, acusacao) {
  conf(nome + ': fica quieta no tema limpo', (limpo || []).join('; ') || 'nenhum', 'nenhum');
  conf(nome + ': acusa o item certo no envenenado', (envenenado || []).join('; '), acusacao);
}

/* ================================================================ o tema sintetico
 *
 * Um tema minimo com o que as travas de texto precisam: explicacao com figura,
 * um exercicio com figura que remete a ela, um exercicio sem figura que nao
 * fala dela, e o espelho em ingles. Os venenos sao clones deste com UMA
 * alteracao cada, para o que a trava acusa ser atribuivel aquela alteracao. */
function temaLimpo() {
  return {
    id: 'PROVA-00',
    pt: {
      titulo: 'Tema sintetico de prova',
      explicacao: 'A área do setor é uma fração da área do círculo.\n\n' +
        '@fig circulo raio=6 setor=60 centro=O legenda=A região hachurada é o setor.\n',
      exercicios: [
        {
          n: 1,
          enunciado: 'Na figura, o setor tem raio 12 centímetros e a região hachurada é o setor de 30 graus. Ache a área.\n\n' +
            '@fig circulo id=q1 raio=12 setor=30 centro=O legenda=A região hachurada é o setor.\n',
          resposta: 'A área vale 12 π centímetros quadrados.'
        },
        { n: 2, enunciado: 'Some 2 e 3.', resposta: 'A soma vale 5.' },
        { n: 3, enunciado: 'Multiplique 4 por 5.', resposta: 'O produto vale 20.' }
      ]
    },
    en: {
      titulo: 'Synthetic proof topic',
      explicacao: 'The area of a sector is a fraction of the area of the circle.\n\n' +
        '@fig circulo raio=6 setor=60 centro=O legenda=The hatched region is the sector.\n',
      exercicios: [
        {
          n: 1,
          enunciado: 'In the figure the sector has radius 12 centimetres and the hatched region is the 30 degree sector. Find the area.\n\n' +
            '@fig circulo id=q1 raio=12 setor=30 centro=O legenda=The hatched region is the sector.\n',
          resposta: 'The area is 12 pi square centimetres.'
        },
        { n: 2, enunciado: 'Add 2 and 3.', resposta: 'The sum is 5.' },
        { n: 3, enunciado: 'Multiply 4 by 5.', resposta: 'The product is 20.' }
      ]
    }
  };
}

/* Um registro montado a mao, com so o que a trava le. */
function registro(nome, medido, extra) {
  return Object.assign({ id: nome, receita: null, fase: 'enunciado', marcasAtivas: 0,
    escala: 1, legenda: null, diretiva: '', conferencia: [], marcas: [],
    medido: medido || {} }, extra || {});
}
function texto(txt, x, y, largura, tam) {
  return { txt: txt, x: x, y: y, largura: largura, tam: tam == null ? 8.5 : tam };
}

console.log('prova do _piloto_base.js: cada trava generica com o seu par envenenado');
console.log('(os avisos [figura] abaixo sao dos venenos: aqui se desenha defeito de proposito)\n');

/* As figuras de verdade que os venenos de desenho usam. Desenhar defeito faz o
 * desenhador avisar, e o aviso e o esperado. */
const figSetorComLegenda = P.rascunho('@fig circulo id=q1 raio=12 setor=30 centro=O legenda=A região hachurada é o setor.').figs[0];
const figSetorSemLegenda = P.rascunho('@fig circulo id=v1 raio=6 setor=60 centro=O').figs[0];
const figTrianguloLimpo = P.rascunho('@fig triangulo lado=3 lado=4 lado=5').figs[0];
const figForaSemLegenda = P.rascunho('@fig triangulo angulo=3x+10 angulo=61 angulo=52').figs[0];
const figForaMasExata = P.rascunho('@fig triangulo lado=3 lado=4 lado=5 escala=fora legenda=Figura fora de escala.').figs[0];
console.log('');

/* ================================================================ trava 0 */
console.log('trava 0: o retrato e o do .md de hoje');
{
  const limpo = temaLimpo();
  const veneno = P.clonar(limpo);
  /* O defeito real: alguem edita o .md, acrescenta uma figura e esquece de
   * regerar o retrato. O retrato fica com uma diretiva a menos do que o .md. */
  veneno.pt.exercicios[0].enunciado = veneno.pt.exercicios[0].enunciado.replace(/@fig[^\n]*\n/, '');
  conf('trava 0: o tema limpo tem 4 diretivas nas duas linguas', P.contarDiretivas(limpo), 4);
  conf('trava 0: tirada uma diretiva, a conta acusa a diferenca contra o .md',
    P.contarDiretivas(veneno) === 4 ? 'nao acusou' : 'o retrato tem ' + P.contarDiretivas(veneno) + ' e o .md tem 4',
    'o retrato tem 3 e o .md tem 4');
}

/* ================================================================ trava A */
console.log('\ntrava A: nenhuma palavra portuguesa na folha em ingles');
{
  /* A folha em ingles de verdade: o rodape e o cabecalho saem na lingua do
   * doc, e a trava tem que aprovar "Page 1 of 1" e reprovar a frase do corpo. */
  function folhaCom(linhas, lingua) {
    const d = new PDFGen.Doc();
    d.lingua = lingua || 'en';
    d.novaPagina();
    linhas.forEach(function (t) { d.texto(t, PDFGen.MARG_E, d.y, { tam: 10 }); d.y -= 14; });
    return d.finalizar();
  }
  const MARCA = P.montarMarcaPt(['hachurad', 'região', 'setor ']);
  const limpa = folhaCom(['The hatched region is the sector.', 'Find the area of the circle.']);
  const suja = folhaCom(['The hatched region is the sector.', 'A região hachurada é o setor.']);
  par('trava A', P.palavrasPortuguesasNaFolha(limpa, MARCA),
    [...new Set(P.palavrasPortuguesasNaFolha(suja, MARCA))],
    'A região hachurada é o setor.');
  /* A outra metade da propria trava: o detector tem que ACHAR portugues numa
   * folha portuguesa. Um detector que nao acha nada nao prova nada. */
  conf('trava A: e o mesmo padrao acha portugues na folha em portugues',
    P.palavrasPortuguesasNaFolha(suja, MARCA).length >= 1, true);
  /* E a diretiva nao pode sair impressa como texto. */
  conf('trava C: a folha limpa nao imprime diretiva', P.diretivaImpressa(limpa), false);
  conf('trava C: e a folha com "@fig circulo" no corpo e acusada',
    P.diretivaImpressa(folhaCom(['@fig circulo raio=6'])), true);
}

/* ================================================================ trava B */
console.log('\ntrava B: paridade PT x EN, item a item');
{
  const limpo = temaLimpo();
  /* Veneno 1: a mesma quantidade de figuras, em ORDEM diferente. */
  const ordem = P.clonar(limpo);
  ordem.pt.exercicios[1].enunciado = 'Some 2 e 3.\n\n@fig triangulo lado=3 lado=4 lado=5\n';
  ordem.pt.exercicios[2].enunciado = 'Multiplique 4 por 5.\n\n@fig circulo raio=5 centro=O\n';
  ordem.en.exercicios[1].enunciado = 'Add 2 and 3.\n\n@fig circulo raio=5 centro=O\n';
  ordem.en.exercicios[2].enunciado = 'Multiply 4 by 5.\n\n@fig triangulo lado=3 lado=4 lado=5\n';
  par('trava B, ordem trocada', P.paridadeItemAItem(limpo), P.paridadeItemAItem(ordem),
    'enunciado 2: pt pede "triangulo" e en pede "circulo"; enunciado 3: pt pede "circulo" e en pede "triangulo"');
  /* Veneno 2: uma figura a mais numa lingua so. */
  const aMais = P.clonar(limpo);
  aMais.pt.exercicios[1].enunciado = 'Some 2 e 3.\n\n@fig triangulo lado=3 lado=4 lado=5\n';
  par('trava B, uma figura a mais no portugues', P.paridadeItemAItem(limpo), P.paridadeItemAItem(aMais),
    'enunciado 2: pt pede "triangulo" e en pede ""');
}

/* ================================================================ trava C */
console.log('\ntrava C: sanidade da geracao');
{
  conf('trava C: a figura limpa nao tem falha de conferencia',
    P.figurasReprovadas([figTrianguloLimpo]).join('; ') || 'nenhuma', 'nenhuma');
  /* Registro montado: a trava e um filtro sobre registro.conferencia, e o que
   * ela precisa provar e que uma conferencia cheia chega ao placar com o nome
   * da figura. Quem prova o conferirFigura em si e o _base_prova_travas.js. */
  conf('trava C: uma figura com conferencia cheia e acusada pelo nome',
    P.figurasReprovadas([registro('q9', {}, { conferencia: ['rotulo em cima da linha'] })]).join('; '),
    'q9: rotulo em cima da linha');
  /* Estado global do fluxo. */
  conf('trava C: o fluxo equilibrado passa',
    JSON.stringify(P.estadoDoFluxo({ paginas: [{ ops: ['q 1 0 0 1 0 0 cm', '0 0 m 10 10 l S', 'Q'] }] })),
    JSON.stringify({ desbalanceada: 0, tracejadoAberto: 0 }));
  conf('trava C: um q sem Q e acusado',
    P.estadoDoFluxo({ paginas: [{ ops: ['q 1 0 0 1 0 0 cm', '0 0 m 10 10 l S'] }] }).desbalanceada, 1);
  conf('trava C: um tracejado ligado fora de envelope e acusado',
    P.estadoDoFluxo({ paginas: [{ ops: ['[2 2] 0 d', '0 0 m 10 10 l S'] }] }).tracejadoAberto > 0, true);
}

/* ================================================================ trava D */
console.log('\ntrava D: teto de cinco marcas ativas');
{
  /* Registro montado: a trava le registro.marcasAtivas, que o conferirFigura ja
   * conta, e o veneno e o numero seis. Fazer a receita desenhar seis marcas
   * mudaria a figura e nao a trava. */
  const cinco = registro('q5', {}, { marcasAtivas: 5 });
  const seis = registro('q6', {}, { marcasAtivas: 6 });
  par('trava D', P.acimaDoTeto([cinco, figTrianguloLimpo]), P.acimaDoTeto([cinco, seis]), 'q6:6');
}

/* ================================================================ trava E */
console.log('\ntrava E: escala coerente');
{
  /* Figuras de verdade nos dois venenos: a afirmacao de escala e sobre o
   * desenho, e so o desenho pode desmenti-la. */
  conf('trava E: o triangulo exato e sem marca passa',
    P.escalaIncoerente([figTrianguloLimpo]).join('; ') || 'nenhuma', 'nenhuma');
  conf('trava E: a figura fora de escala SEM legenda e acusada',
    P.escalaIncoerente([figForaSemLegenda]).join('; '),
    'triangulo marcada fora de escala e sem legenda');
  conf('trava E: a figura marcada fora de escala que saiu EXATA e acusada',
    P.escalaIncoerente([figForaMasExata]).join('; '),
    'triangulo marcada fora de escala e saiu exata: lado=3 lado=4 lado=5, todo valor e numero');
  /* O par LIMPO da segunda metade, que faltava: fora de escala, COM legenda e
   * com valor em letra. Esta a trava tem que APROVAR, porque a afirmacao e
   * verdadeira. Sem ele, trocar o `every` por `some` no detector deixava a
   * prova verde: bastava um valor numerico no meio dos de letra para a figura
   * honesta ser acusada e ninguem ver. */
  const figForaHonesta = P.rascunho('@fig triangulo angulo=3x+10 angulo=61 angulo=52 legenda=Figura fora de escala.').figs[0];
  conf('trava E: a figura fora de escala COM legenda e com valor em letra e aprovada',
    P.escalaIncoerente([figForaHonesta]).join('; ') || 'nenhuma', 'nenhuma');
  const figForaMista = P.rascunho('@fig triangulo lado=3 lado=4 lado=x escala=fora legenda=Figura fora de escala.').figs[0];
  conf('trava E: e a que mistura numero com letra tambem, porque ela nao saiu exata',
    P.escalaIncoerente([figForaMista]).join('; ') || 'nenhuma', 'nenhuma');
  /* E a lista de chaves metricas vem da receita, nao deste arquivo. */
  conf('trava E: as chaves metricas do triangulo sao as que o receitas.js declara',
    JSON.stringify(P.valoresMetricos('@fig triangulo lado=3 lado=4 lado=5 cor=teal', 'triangulo').map(function (v) { return v.chave; })),
    JSON.stringify(['lado', 'lado', 'lado']));
  conf('trava E: e receita desconhecida nao afirma nada',
    P.valoresMetricos('@fig inventada lado=3', 'inventada'), null);
}

/* ================================================================ trava F */
console.log('\ntrava F: um terco dos exercicios sem figura nenhuma');
{
  const limpo = temaLimpo();
  const ed = P.contagemEditorial(limpo);
  conf('trava F: no tema limpo, 2 de 3 exercicios ficam sem figura (piso 1)',
    ed.semNada + ' de ' + ed.total + ', piso ' + ed.piso, '2 de 3, piso 1');
  const veneno = P.clonar(limpo);
  veneno.pt.exercicios[1].enunciado = 'Some 2 e 3.\n\n@fig triangulo lado=3 lado=4 lado=5\n';
  veneno.pt.exercicios[2].enunciado = 'Multiplique 4 por 5.\n\n@fig circulo raio=5 centro=O\n';
  const ev = P.contagemEditorial(veneno);
  conf('trava F: com figura em todos, nenhum fica sem e a trava reprova',
    ev.semNada >= ev.piso, false);
}

/* ================================================================ trava 1 */
console.log('\ntrava 1: dois rotulos na mesma linha de base');
{
  /* Registro montado: a trava e a aritmetica de folga entre duas caixas de
   * texto do registro.medido, e plantar 4 pt de folga numa receita significaria
   * reproduzir o defeito da elipse do MATEM3-04 dentro do desenhador. */
  const longe = registro('bom', { textos: [texto('a', 100, 640, 5), texto('F1', 140, 640, 9)] });
  const perto = registro('mau', { textos: [texto('a', 335, 640, 5), texto('F1', 350, 640, 9)] });
  par('trava 1', P.paresNaMesmaLinhaDeBase([longe]).acusa,
    P.paresNaMesmaLinhaDeBase([perto]).acusa, 'mau "a" e "F1" a 10.00 pt');
  conf('trava 1: e ela nao acusa dois textos em linhas de base diferentes',
    P.paresNaMesmaLinhaDeBase([registro('outro', { textos: [texto('a', 335, 640, 5), texto('F1', 350, 620, 9)] })]).acusa.join('; ') || 'nenhum',
    'nenhum');
}

/* ================================================================ trava 2 */
console.log('\ntrava 2: o rotulo do vertice e atribuivel');
{
  /* Registro montado: sao quatro bolinhas e dois rotulos com posicao escolhida,
   * que e o desenho da hiperbole reduzido ao que a trava mede. */
  function bolinha(x, y) {
    return { pts: [{ x: x - 1.5, y: y }, { x: x, y: y + 1.5 }, { x: x + 1.5, y: y }, { x: x, y: y - 1.5 }], cor: [0, 0, 0] };
  }
  const areas = [bolinha(60, 100), bolinha(140, 100), bolinha(20, 100), bolinha(180, 100)];
  const noLugar = registro('bom', {
    textos: [texto('A1', 138, 108, 9), texto('A2', 54, 108, 9)], areas: areas
  });
  const trocado = registro('mau', {
    /* O A1 pousou em cima da bolinha de fora, a 40 pt do vertice dele. */
    textos: [texto('A1', 178, 102, 9), texto('A2', 54, 108, 9)], areas: areas
  });
  conf('trava 2: com os rotulos no lugar, a razao passa do piso de 1,7',
    P.verticeAtribuivel([noLugar]).razao >= P.PISO_DO_VERTICE, true);
  conf('trava 2: com o A1 pousado no vertice errado, a razao cai abaixo do piso',
    P.verticeAtribuivel([trocado]).razao >= P.PISO_DO_VERTICE, false);
}

/* ================================================================ a remissao, frase a frase
 *
 * A expressao de remissao e o coracao das travas 3 e 8, e ela nao entra sem par
 * envenenado de FRASE. Cada linha aqui e uma decisao editorial escrita: o que
 * conta como "o texto manda olhar o papel" e o que e a palavra "figura" em
 * outro sentido. Ampliar a expressao sem acrescentar linha aqui e como se
 * chegou a versao que acusava 62 temas dos 148.
 *
 * As oito primeiras existem por um defeito medido: o apagador do
 * SENTIDO_DE_FORMA come "area da figura" inteiro, e a remissao mais explicita
 * que existe vinha logo DEPOIS do trecho comido. Rodando o apagador antes de
 * procurar, "Calcule a area da figura ao lado." dava NAO. */
console.log('\na remissao, frase a frase');
{
  function deveRemeter(lingua, frase) {
    conf('REMETE  ' + lingua + '  "' + frase + '"', P.remeteAFigura(frase, lingua), true);
  }
  function naoDeveRemeter(lingua, frase) {
    conf('nao      ' + lingua + '  "' + frase + '"', P.remeteAFigura(frase, lingua), false);
  }
  /* Forma forte atras de uma medida: o caso que o apagador matava. */
  deveRemeter('pt', 'Calcule a área da figura ao lado.');
  deveRemeter('pt', 'Calcule o perímetro da figura acima.');
  deveRemeter('pt', 'Meça o contorno da figura mostrada.');
  deveRemeter('pt', 'Qual é a área da figura a seguir?');
  deveRemeter('pt', 'O lado da figura abaixo mede 4 cm.');
  deveRemeter('pt', 'dentro da figura ao lado');
  deveRemeter('en', 'Find the area of the figure below.');
  deveRemeter('en', 'Find the perimeter of the figure alongside.');
  /* Forma forte sozinha. */
  deveRemeter('pt', 'Observe a figura e escreva as medidas.');
  deveRemeter('pt', 'A figura mostra o centro e o raio.');
  deveRemeter('en', 'The figure shows the centre and the radius.');
  /* Forma nua: a forma da casa, com o objeto desenhado como sujeito. */
  deveRemeter('pt', 'A pirâmide reta da figura tem base quadrada de aresta 6 centímetros.');
  deveRemeter('pt', 'A pista de atletismo da figura é formada por um retângulo.');
  deveRemeter('pt', 'Escreva as medidas dos oito ângulos formados na figura.');
  deveRemeter('en', 'Write the measures of the eight angles in the figure.');
  /* A palavra em outro sentido: nenhuma destas pode remeter. */
  naoDeveRemeter('pt', 'Qual figura não tem nenhum canto?');
  naoDeveRemeter('pt', 'Num pictograma, cada figura vale 10 alunos.');
  naoDeveRemeter('pt', 'Qual é a área da figura que sobrou?');
  naoDeveRemeter('pt', 'Compare o perímetro da figura que sobrou com o do retângulo original.');
  naoDeveRemeter('pt', 'Na figura composta, esquecer de retirar o pedaço é o erro comum.');
  naoDeveRemeter('pt', 'Uma figura plana é a que cabe no papel.');
  naoDeveRemeter('pt', 'k é a razão entre um lado da figura original e o correspondente.');
  naoDeveRemeter('pt', 'Marque a seta no desenho.');
  naoDeveRemeter('pt', 'Ler no desenho mental da parábola.');
  naoDeveRemeter('en', 'in the drawing it is always the one facing the right angle');
  /* E o apagador tem que apagar mesmo depois de vogal acentuada, que e onde o
   * \b do JavaScript nao vale. */
  conf('o apagador funciona depois de vogal acentuada',
    P.textoDeRemissao('a área da figura é grande', 'pt').replace(/\s+/g, ' ').trim(), 'a é grande');
  /* A ordem: forma forte no texto CRU, forma nua no texto apagado. Se alguem
   * inverter, esta conferencia cai junto com as oito de cima. */
  conf('a forma forte e achada no texto cru, antes de qualquer apagamento',
    P.formaForte('Calcule a área da figura ao lado.', 'pt'), true);
  conf('e a mesma frase, depois de apagada, ja nao tem a forma nua',
    P.REMETE_NUA.pt.test(P.textoDeRemissao('Calcule a área da figura ao lado.', 'pt')), false);
}

/* ================================================================ trava 3 */
console.log('\ntrava 3: enunciado com figura remete a ela, e sem figura nao fala dela');
{
  const limpo = temaLimpo();
  const semRemeter = P.clonar(limpo);
  semRemeter.pt.exercicios[0].enunciado = semRemeter.pt.exercicios[0].enunciado.replace('Na figura, o setor', 'O setor');
  par('trava 3, enunciado com diretiva que nao remete', P.semRemissao(limpo), P.semRemissao(semRemeter),
    'pt 1 tem figura e nao remete a ela');
  const prometido = P.clonar(limpo);
  prometido.en.exercicios[1].enunciado = 'Add the two numbers in the figure.';
  par('trava 3, enunciado que fala de figura sem ter', P.semRemissao(limpo), P.semRemissao(prometido),
    'en 2 fala da figura e nao tem nenhuma');
}

/* ================================================================ trava 4 */
console.log('\ntrava 4: nenhum dado numerico existe so no desenho');
{
  const limpo = temaLimpo();
  const semONumero = P.clonar(limpo);
  semONumero.pt.exercicios[0].enunciado = semONumero.pt.exercicios[0].enunciado.replace('raio 12 centímetros', 'o raio dado');
  par('trava 4', P.numeroSoNoDesenho(limpo, 'pt', [figSetorComLegenda]),
    P.numeroSoNoDesenho(semONumero, 'pt', [figSetorComLegenda]),
    'pt 1: a figura imprime 12 e o texto nao traz');
}

/* ================================================================ trava 5 */
console.log('\ntrava 5: toda hachura tem glosa');
{
  const limpo = temaLimpo();
  conf('trava 5: a figura hachurada com legenda e com o enunciado glosando passa',
    P.hachuraSemGlosa(limpo, 'pt', [figSetorComLegenda]).join('; ') || 'nenhuma', 'nenhuma');
  conf('trava 5: a figura hachurada SEM legenda e acusada',
    P.hachuraSemGlosa(limpo, 'pt', [figSetorSemLegenda]).join('; '), 'pt v1 hachurada sem legenda');
  const semGlosaNoTexto = P.clonar(limpo);
  semGlosaNoTexto.pt.exercicios[0].enunciado = semGlosaNoTexto.pt.exercicios[0].enunciado
    .replace('a região hachurada é o setor de 30 graus', 'a região é o setor de 30 graus');
  conf('trava 5: o enunciado sem a palavra da hachura e acusado',
    P.hachuraSemGlosa(semGlosaNoTexto, 'pt', [figSetorComLegenda]).join('; '),
    'pt q1: o enunciado nao diz que ha regiao hachurada');
  /* A trava so vale se souber separar hachura de malha e de tique: as duas
   * saem em varredura no fluxo, como a hachura. */
  conf('trava 5: o setor hachurado e lido como hachurado', P.ehHachurada(figSetorComLegenda), true);
  conf('trava 5: e o triangulo sem hachura nao', P.ehHachurada(figTrianguloLimpo), false);
  const comPlano = P.rascunho('@fig circulo eixos=sim raio=5 centro=2;1;C coordenadas=sim').figs[0];
  conf('trava 5: e o plano com tiques e eixos nao passa por hachurado',
    P.ehHachurada(comPlano), false);
  /* Os aneis alternam 45 e 135 de proposito, para cada anel se distinguir do
   * vizinho. A primeira versao do detector chamava esse par de malha e devolvia
   * vazio: 56 segmentos de varredura e nenhuma hachura vista. */
  const comAneis = P.rascunho('@fig circulo raio=6 aneis=2;4;6 centro=O legenda=A região hachurada é o anel.').figs[0];
  conf('trava 5: a figura de aneis, hachurada a 45 e 135, e lida como hachurada',
    P.ehHachurada(comAneis), true);
  conf('trava 5: e as duas inclinacoes dela sao vistas, nao uma so',
    P.inclinacoesDeHachura(comAneis).sort(function (a, b) { return a - b; }).join(' '), '45 135');
  const semLegendaAneis = P.rascunho('@fig circulo id=v2 raio=6 aneis=2;4;6 centro=O').figs[0];
  conf('trava 5: e a mesma figura de aneis sem legenda e acusada',
    P.hachuraSemGlosa(limpo, 'pt', [semLegendaAneis]).join('; '), 'pt v2 hachurada sem legenda');
}

/* ================================================================ trava 6 */
console.log('\ntrava 6: nenhum numero de escala e riscado por arco');
{
  /* Registro montado: o arco de 1,2 pt tem centro em (100, 100) e raio 30, e o
   * "-12" mora exatamente em cima dele. Foi assim que os 11 numeros por lingua
   * do MATEM3-03 saiam riscados, e nenhuma trava do kit acusava. */
  const arco = { cx: 100, cy: 100, raio: 30, de: 0, varre: 360, abertura: 360, w: 1.2 };
  const limpa = registro('bom', { arcos: [arco], textos: [texto('-12', 40, 100, 11, 8)] });
  const riscada = registro('mau', { arcos: [arco], textos: [texto('-12', 125, 100, 11, 8)] });
  par('trava 6', P.numerosRiscadosPorArco([limpa]), P.numerosRiscadosPorArco([riscada]),
    'mau "-12" em (125.00, 100.00)');
  conf('trava 6: um arco fino de 0,6 pt (malha, tique) nao conta como circunferencia',
    P.numerosRiscadosPorArco([registro('fino', {
      arcos: [Object.assign({}, arco, { w: 0.6 })], textos: [texto('-12', 125, 100, 11, 8)]
    })]).length, 0);
}

/* ================================================================ trava 7 */
console.log('\ntrava 7: nenhum rotulo impresso em cima de outro');
{
  /* Registro montado: o "(3, 4)" subiu para onde o "s" da reta mora e a folha
   * imprimiu "(3 s 4)". A trava 1 nao pega este, porque as linhas de base sao
   * diferentes. */
  const separados = registro('bom', { textos: [texto('(3, 4)', 100, 100, 26), texto('s', 160, 106, 4)] });
  const emCima = registro('mau', { textos: [texto('(3, 4)', 100, 100, 26), texto('s', 112, 103, 4)] });
  conf('trava 7: dois rotulos separados passam',
    P.rotulosSobrepostos([separados]).join('; ') || 'nenhum', 'nenhum');
  conf('trava 7: dois rotulos com as caixas cruzadas sao acusados pelo nome',
    P.rotulosSobrepostos([emCima]).join('; '), 'mau "(3, 4)" e "s" (4.00 por 5.08 pt)');
  conf('trava 7: e o par de cima nao passa pela trava 1, que so ve a mesma linha de base',
    P.paresNaMesmaLinhaDeBase([emCima]).acusa.length, 0);
}

/* ================================================================ trava 8 */
console.log('\ntrava 8: figura prometida e ausente no tema inteiro');
{
  const limpo = temaLimpo();
  /* O tema inteiro perde as diretivas e continua falando de figura: sao os
   * onze temas que motivaram a varredura. */
  const veneno = P.clonar(limpo);
  ['pt', 'en'].forEach(function (lg) {
    veneno[lg].explicacao = veneno[lg].explicacao.replace(/@fig[^\n]*\n/g, '');
    veneno[lg].exercicios.forEach(function (e) {
      e.enunciado = e.enunciado.replace(/@fig[^\n]*\n/g, '');
      e.resposta = String(e.resposta).replace(/@fig[^\n]*\n/g, '');
    });
  });
  par('trava 8', P.figuraPrometidaEAusente(limpo), P.figuraPrometidaEAusente(veneno),
    'pt 1 promete figura e o tema nao tem nenhuma; en 1 promete figura e o tema nao tem nenhuma');
  /* E a trava 8 nao pode acusar um tema que tem figura em algum lugar, mesmo
   * que o item que fala dela nao a carregue: esse e o trabalho da trava 3. */
  const soNaExplicacao = P.clonar(limpo);
  soNaExplicacao.pt.exercicios[0].enunciado = soNaExplicacao.pt.exercicios[0].enunciado.replace(/@fig[^\n]*\n/, '');
  conf('trava 8: com figura na explicacao, o tema nao e acusado pela trava do tema',
    P.figuraPrometidaEAusente(soNaExplicacao).join('; ') || 'nenhum', 'nenhum');
}

console.log('\n' + ok + ' conferencias passaram, ' + mau + ' falharam.');
process.exit(mau ? 1 : 0);
