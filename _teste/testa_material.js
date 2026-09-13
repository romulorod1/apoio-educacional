/* Gera o PDF de um tema de verdade e confere o resultado.
 *
 * Este arquivo já esteve no portão de merge sem afirmar nada: ele gerava os
 * quatro PDFs, imprimia o tamanho e saía. Como não imprimia linha de resumo, o
 * confere_tudo.sh, que aprovava por AUSÊNCIA de falha, marcava "ok" toda vez.
 * Um gerador que só não estoura não é conferência: agora ele afirma.
 */
const fs = require('fs');
const path = require('path');
const PDFGen = require('../pdf.js');

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}

const banco = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'temas', 'banco.json'), 'utf8'));
const tema = banco.temas.find(t => t.id === 'MAT06-05');
console.log('tema:', tema.pt.titulo, '|', tema.pt.exercicios.length, 'exercicios');

function gerar(nome, minKB, op) {
  const bytes = PDFGen.gerarMaterialTema(Object.assign({ tema }, op));
  fs.writeFileSync(path.join(__dirname, nome), bytes);
  const kb = Math.round(bytes.length / 1024);
  console.log('  ' + nome + ': ' + kb + ' KB');
  const bruto = Buffer.from(bytes).toString('latin1');

  conf(nome + ': é um PDF de verdade',
    bruto.slice(0, 5) === '%PDF-' && bruto.trim().slice(-5) === '%%EOF', true);
  /* Piso de tamanho por folha. Um gerador que perde uma seção inteira continua
   * escrevendo um PDF válido: sem piso, a perda passa calada. */
  conf(nome + ': tem pelo menos ' + minKB + ' KB', kb >= minKB, true);

  /* Marcação que vazou para a folha. O "@fig" já saiu impresso por extenso uma
   * vez, e o "^{" sairia igual se a tubulação rica não pegasse a linha. */
  ['@fig', '^{', '_{', '**'].forEach(function (m) {
    const escapado = m.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
    const rx = new RegExp('Td \\([^)]*' + escapado);
    conf(nome + ': a marcação "' + m + '" não sai impressa', rx.test(bruto), false);
  });

  /* E a mesma pergunta feita de forma GENÉRICA: qualquer arroba seguida de letra
   * no texto desenhado. A lista literal acima só pega a diretiva que alguém
   * lembrou de escrever nela, e foi exatamente assim que o buraco do "@eq"
   * sobreviveu: o conserto de então foi feito só para o "@fig", a lista ficou
   * com "@fig" dentro, e a folha saiu com "@eq \begin{bmatrix} ..." impresso no
   * meio do exercício, em silêncio. Quando nascer "@tabela", o buraco não
   * reabre.
   *
   * A linha de base foi medida antes de a trava ser escrita, e não presumida.
   * A primeira medida estava CONTADA EM DOBRO, e o número errado chegou a sair
   * daqui para outras duas frentes: o temas/banco.json e os banco/serie-*.json
   * são o MESMO corpo de 148 temas, um inteiro e o outro repartido por série, e
   * somar os dois deu 252 "@fig" e 20 "@eq" onde há 126 e 10. A conta certa,
   * medida em 08/09/2026: 126 "@fig" e 10 "@eq" nos 148 temas de matemática, 12
   * "@fonte" nos 6 temas de português, e nenhuma outra arroba seguida de letra
   * em nenhum dos dois. No texto DESENHADO das folhas, zero.
   *
   * Por isso a asserção é zero e não "não cresceu além de N": não há ocorrência
   * legítima para preservar. Se um dia um tema precisar escrever um endereço de
   * e-mail na folha, o número muda AQUI, com a data e o motivo ao lado. */
  conf(nome + ': nenhuma arroba seguida de letra no texto desenhado',
    arrobasDesenhadas(bytes).join(', ') || 0, 0);

  return bytes;
}

/* As peças de texto realmente desenhadas na folha, que é o que a aluna lê. */
function pecasDeTexto(bytes) {
  const cru = Buffer.from(bytes).toString('latin1');
  const rx = /Td \(((?:[^()\\]|\\.)*)\) Tj/g;
  let m; const pecas = [];
  while ((m = rx.exec(cru))) pecas.push(m[1]);
  return pecas;
}
/* Devolve a arroba achada MAIS a frase em que ela apareceu, e não só o token.
 *
 * O motivo é de quem vai ler a falha daqui a meses: "achei @tabela" não diz se
 * nasceu uma diretiva nova que ninguém ensinou a desenhar, ou se um tema passou a
 * citar um endereço de e-mail legítimo, e as duas coisas pedem consertos
 * opostos. Com a frase inteira, quem lê distingue as duas em um segundo. Pedido
 * pela frente 1 em 08/09/2026, prevendo o corpus de português, em que arroba
 * aparece em endereço, em citação de rede social e em texto moderno. */
function arrobasDesenhadas(bytes) {
  const achadas = [];
  pecasDeTexto(bytes).forEach(function (p) {
    (p.match(/@[A-Za-z][A-Za-z0-9]*/g) || []).forEach(function (a) {
      const frase = p.trim().replace(/\s+/g, ' ');
      achadas.push(a + ' em "' + (frase.length > 90 ? frase.slice(0, 90) + '...' : frase) + '"');
    });
  });
  return [...new Set(achadas)];
}

/* Quanto traço vetorial a folha tem. O colchete da matriz é DESENHADO, e não
 * glifo de fonte, então ele aparece nesta contagem e nunca no texto: é ela que
 * separa "a fórmula foi desenhada" de "a fórmula sumiu da folha". */
function tracosDaFolha(bytes) {
  const cru = Buffer.from(bytes).toString('latin1');
  return (cru.match(/(?:^|\s)[ml](?=\s)/g) || []).length;
}

/* Todas as palavras escritas na folha, contadas.
 *
 * O rodapé de página fica de fora: uma fórmula a mais empurra a lista para uma
 * página a mais, e aí "Página 1 de 2" vira "Página 1 de 3" nas duas folhas que
 * se comparam. Isso é a paginação mudando, e não texto perdido. */
/* A marca d'água sai da conta junto com o rodapé, e não por conveniência.
 *
 * A palavra da marca é descartada POR PROJETO quando uma placa branca fatia a
 * caixa de tinta dela, e a placa de uma fórmula faz exatamente isso. Medido
 * pela frente 1: chamando esta função com o par das alternativas, ela acusava
 * "NW (0 de 1)". Hoje passaria por sorte, porque o veneno cai onde a placa não
 * encosta na marca; mover o veneno um centímetro reprovaria a suíte sem haver
 * defeito, e alarme falso em portão é o que treina a ignorar alarme. */
const FORA_DA_CONTA = { 'NW': 1, 'APOIO': 1, 'EDUCACIONAL': 1 };
function bagDePalavras(pecas) {
  const bag = {};
  pecas.forEach(function (p) {
    if (/^P.gina \d+ de \d+$/.test(p) || /^Page \d+ of \d+$/.test(p)) return;
    String(p).split(/\s+/).forEach(function (w) {
      if (w && !FORA_DA_CONTA[w]) bag[w] = (bag[w] || 0) + 1;
    });
  });
  return bag;
}

/* Que palavras da folha SEM a diretiva sumiram da folha COM a diretiva.
 *
 * É a conferência que mede a presença do que importa, e não a ausência do
 * defeito. Contagem e não igualdade: a folha com a fórmula tem palavras A MAIS,
 * e é assim que tem que ser, porque o renderizador escreve os números da matriz
 * como texto. O que não pode é ter palavra A MENOS. */
function faltandoNaFolha(bytesComDiretiva, bytesSemDiretiva) {
  const tem = bagDePalavras(pecasDeTexto(bytesComDiretiva));
  const quer = bagDePalavras(pecasDeTexto(bytesSemDiretiva));
  const perdidas = [];
  Object.keys(quer).forEach(function (w) {
    if ((tem[w] || 0) < quer[w]) perdidas.push(w + ' (' + (tem[w] || 0) + ' de ' + quer[w] + ')');
  });
  return perdidas;
}

const completo = gerar('tema_completo.pdf', 60, {
  lingua: 'pt', incluirMaterial: true, incluirLista: true, incluirGabarito: true,
  aluno: 'Marcelo', data: '10/06/2026'
});
const soLista = gerar('tema_so_lista.pdf', 12, {
  lingua: 'pt', incluirLista: true, aluno: 'Marcelo', espacoParaResposta: 26
});
const selecao = gerar('tema_selecao.pdf', 8, {
  lingua: 'pt', incluirLista: true, incluirGabarito: true, escolhidos: [1, 8, 13, 17, 18]
});
const ingles = gerar('tema_ingles.pdf', 40, {
  lingua: 'en', incluirMaterial: true, incluirLista: true
});

console.log('\n=== o que cada folha tem que conter ===');

/* A folha completa tem as três seções; a de lista só tem uma. Sem isto, perder o
 * gabarito inteiro passaria pelo piso de tamanho sem acusar nada. */
conf('a folha completa é maior que a de só lista', completo.length > soLista.length * 2, true);
conf('a seleção de 5 exercícios é menor que a lista dos 18', selecao.length < soLista.length, true);

const txtPt = Buffer.from(completo).toString('latin1');
const txtEn = Buffer.from(ingles).toString('latin1');
conf('a folha em português traz o nome do aluno', /Td \([^)]*Marcelo/.test(txtPt), true);

/* Palavra portuguesa presa no gerador e impressa na folha em inglês. Já
 * aconteceu duas vezes: o desenhador de figuras escrevia "Figura fora de
 * escala." cravado, e a moldura escrevia "Página N de M" no rodapé das nove
 * páginas da folha inglesa (e das de todos os 146 temas).
 *
 * A segunda passou por baixo da primeira versão desta conferência, que era uma
 * LISTA DE PALAVRAS escolhida a dedo: "Página" não estava nela. Lista de
 * palavras só pega o que quem escreveu já imaginou.
 *
 * Agora a conferência é estrutural: varre TODA peça de texto desenhada na folha
 * inglesa e recusa marca de português, seja ela qual for. As duas exceções são
 * nome próprio e marca, que não se traduzem.
 *
 * As marcas têm que ser INEQUÍVOCAS. Uma versão anterior usava "Exerc" e
 * acusava a folha inglesa por causa de "Exercises": "Exerc" é prefixo das duas
 * línguas. Alarme falso aqui é o que treina a ignorar o alarme. */
{
  const NAO_TRADUZ = ['Nathália Wajsenzon', 'APOIO EDUCACIONAL',
    'Nathália Wajsenzon · Apoio Educacional', 'NW'];
  const MARCA_PT = /ção|ções|ário|Página|Aluno|Gabarito|Exercícios|Figura|Resposta|ê|õ|ç/;

  const pecasEn = [];
  const rxEn = /Td \(((?:[^()\\]|\\.)*)\) Tj/g;
  let mEn;
  while ((mEn = rxEn.exec(txtEn))) pecasEn.push(mEn[1]);

  const suspeitas = pecasEn.filter(function (t) {
    return NAO_TRADUZ.indexOf(t) < 0 && MARCA_PT.test(t);
  });
  conf('nenhuma marca de português na folha em inglês',
    suspeitas.length ? JSON.stringify([...new Set(suspeitas)].slice(0, 5)) : 0, 0);

  // e a numeração de página tem que estar na língua da folha
  conf('a folha em inglês numera em inglês', /Td \(Page \d+ of \d+\)/.test(txtEn), true);
  conf('a folha em português numera em português', /Td \(P.gina \d+ de \d+\)/.test(txtPt), true);
}

/* Todo caractere escrito tem que ser desenhável. É a mesma trava que o
 * verificar.py aplica na fonte dos temas, aqui aplicada na SAÍDA, que é o que a
 * aluna recebe. */
if (typeof PDFGen.caracteresQueNaoDesenha === 'function') {
  const escritos = [];
  const rx = /Td \(((?:[^()\\]|\\.)*)\) Tj/g;
  let m;
  while ((m = rx.exec(txtPt))) escritos.push(m[1]);
  const ruins = PDFGen.caracteresQueNaoDesenha(escritos.join(' '));
  conf('nenhum caractere indesenhável na folha gerada', ruins.length, 0);
}

console.log('\n=== a diretiva dentro do exercício, com par envenenado ===');

/* A diretiva "@eq" funcionava na EXPLICAÇÃO e saía impressa como LaTeX cru
 * quando estava dentro de um exercício ou de uma resposta, sem aviso nenhum. Na
 * folha da criança aparecia, escrito por extenso:
 *
 *   Escreva o elemento da segunda linha e primeira coluna da matriz.
 *   @eq A = \begin{bmatrix} 1 & 2 \\ 3 & 5 \end{bmatrix}
 *
 * Medido em 07/09/2026 sobre uma cópia do MATEM2-04: material 3 ocorrências,
 * lista 2, gabarito 1 e explicação 0. É o mesmo defeito que o pdf.js registra
 * ter acontecido com o "@fig", e que foi consertado SÓ para o "@fig".
 *
 * A trava é um par envenenado, e não uma contagem de zero solta: sem o controle
 * positivo, "não achei @eq na folha" seria satisfeito por uma folha em que a
 * fórmula simplesmente desapareceu, que é trocar um defeito visível por um
 * invisível. */
{
  const MATRIZ = '\\begin{bmatrix} 1 & 2 \\\\ 3 & 5 \\end{bmatrix}';
  const TRANSPOSTA = '\\begin{bmatrix} 1 & 3 \\\\ 2 & 5 \\end{bmatrix}';

  /* O envenenado e o limpo saem da MESMA função, e a única diferença entre eles
   * é a diretiva: assim a comparação é folha com folha, e não folha com
   * lembrança. A diretiva vai colada no fim do texto, que é a forma como o
   * gerar_banco.py entrega uma diretiva escrita em linha própria dentro do
   * item. */
  /* O veneno é dosado por LUGAR, e não ligado e desligado de uma vez.
   *
   * Com uma dose só, dois dos quatro controles positivos ficavam verdes pelo
   * motivo errado: o veneno também plantava uma "@eq" na explicação, e era ELA
   * que produzia o traço a mais na folha completa e na folha em inglês. As duas
   * conferências diziam "a fórmula do item foi desenhada" medindo a fórmula da
   * explicação, que é o caminho que já funcionava antes deste PR. */
  function preparar(onde) {
    const t = JSON.parse(JSON.stringify(tema));
    const noItem = (onde === 'item' || onde === 'ambos');
    const naExplicacao = (onde === 'explicacao' || onde === 'ambos');
    ['pt', 'en'].forEach(function (lg) {
      if (!t[lg] || !t[lg].exercicios || !t[lg].exercicios.length) return;
      const ex = t[lg].exercicios;
      if (noItem) {
        ex[0].enunciado = ex[0].enunciado + ' @eq ' + MATRIZ;
        ex[0].resposta = ex[0].resposta + ' @eq ' + TRANSPOSTA;
      }
      if (naExplicacao) t[lg].explicacao = t[lg].explicacao + '\n\n@eq ' + MATRIZ + '\n';
    });
    return t;
  }

  const venenoso = preparar('item');
  const limpo = preparar('nenhum');
  const cruVenenoso = JSON.stringify(venenoso);
  const cruLimpo = JSON.stringify(limpo);

  /* O veneno pegou? Veneno que não casa nada deixa o modo envenenado verde
   * afirmando o contrário do que promete, e isso já aconteceu neste portão. */
  conf('o veneno mudou mesmo o tema', cruVenenoso !== cruLimpo, true);
  conf('e ele plantou 4 diretivas @eq no ITEM (2 por língua)',
    (cruVenenoso.match(/@eq/g) || []).length, 4);
  conf('e nenhuma na explicação, que é o caminho que já funcionava',
    (JSON.stringify(venenoso.pt.explicacao).match(/@eq/g) || []).length, 0);
  conf('e o tema limpo não ficou com nenhuma', (cruLimpo.match(/@eq/g) || []).length, 0);

  /* E o detector detecta: sem esta linha, "zero ocorrências" nas folhas abaixo
   * seria satisfeito por um detector quebrado. */
  conf('o detector genérico acha arroba seguida de letra quando ela existe',
    arrobasDesenhadas(Buffer.from('BT /F1 10 Tf 1 1 Td (veja @eq e @tabela) Tj ET', 'latin1'))
      .join(' | '),
    '@eq em "veja @eq e @tabela" | @tabela em "veja @eq e @tabela"');
  /* E ele traz a FRASE junto, que é o que separa "nasceu uma diretiva nova" de
   * "um tema passou a citar um endereço": os dois pedem consertos opostos, e a
   * contagem sozinha não distingue. */
  conf('e ele traz a frase inteira, não só o token',
    arrobasDesenhadas(Buffer.from(
      'BT /F1 10 Tf 1 1 Td (Escreva para contato@figuras.com em caso de duvida) Tj ET', 'latin1'))
      .join(' | '),
    '@figuras em "Escreva para contato@figuras.com em caso de duvida"');

  const FOLHAS = [
    ['material completo', { lingua: 'pt', incluirMaterial: true, incluirLista: true, incluirGabarito: true }],
    ['só a lista', { lingua: 'pt', incluirLista: true, espacoParaResposta: 26 }],
    ['só o gabarito', { lingua: 'pt', incluirGabarito: true }],
    ['a folha em inglês', { lingua: 'en', incluirMaterial: true, incluirLista: true, incluirGabarito: true }]
  ];
  FOLHAS.forEach(function (par) {
    const rotulo = par[0], op = par[1];
    const comEq = PDFGen.gerarMaterialTema(Object.assign({ tema: venenoso }, op));
    const semEq = PDFGen.gerarMaterialTema(Object.assign({ tema: limpo }, op));

    // veneno: a marcação não pode sair impressa em lugar nenhum da folha
    conf(rotulo + ': nenhuma arroba seguida de letra sai impressa',
      arrobasDesenhadas(comEq).join(', ') || 0, 0);
    /* E nem o LaTeX cru sem a arroba, que passaria pela linha de cima: o dia em
     * que alguém "consertar" isto apagando só os três caracteres da diretiva, a
     * folha continua com "\begin{bmatrix} 1 & 2" escrito. */
    conf(rotulo + ': nem o LaTeX cru sai impresso',
      /bmatrix|\\begin|\\frac/.test(pecasDeTexto(comEq).join(' ')), false);

    // controle positivo: a fórmula está DESENHADA, e não apenas ausente
    conf(rotulo + ': a fórmula foi desenhada (mais traço que a folha sem @eq)',
      tracosDaFolha(comEq) > tracosDaFolha(semEq), true);
  });

  /* E o texto do exercício continua na folha: sem isto, "o LaTeX sumiu" seria
   * satisfeito por um item que perdeu o enunciado junto com a fórmula. */
  const listaComEq = PDFGen.gerarMaterialTema({
    tema: venenoso, lingua: 'pt', incluirLista: true, espacoParaResposta: 26
  });
  const listaSemEq = PDFGen.gerarMaterialTema({
    tema: limpo, lingua: 'pt', incluirLista: true, espacoParaResposta: 26
  });
  const primeiraPalavra = String(tema.pt.exercicios[0].enunciado).split(/\s+/)[0];
  conf('o enunciado do exercício envenenado continua escrito na folha',
    pecasDeTexto(listaComEq).indexOf(primeiraPalavra) >= 0, true);
  conf('e ele já estava escrito na folha limpa, que é a comparação justa',
    pecasDeTexto(listaSemEq).indexOf(primeiraPalavra) >= 0, true);

  /* E a conferência que mede a PRESENÇA e não a ausência: TODA palavra da folha
   * sem a diretiva continua na folha com a diretiva, na mesma ordem.
   *
   * Sem ela a suíte inteira passava com a frase sumindo da folha, porque "não
   * saiu LaTeX cru" e "avisou" continuavam verdadeiros enquanto o texto depois
   * da fórmula era descartado. Medir a ausência do defeito não é medir a
   * presença do que importa. */
  conf('e nenhuma palavra da folha limpa se perdeu na folha envenenada',
    faltandoNaFolha(listaComEq, listaSemEq).join(' ') || 'nada faltou', 'nada faltou');

  /* A explicação continua sendo o CONTROLE: ela já funcionava antes deste PR, e
   * é medida sozinha, sem o veneno do item por perto. */
  const soExplicacao = PDFGen.gerarMaterialTema({
    tema: preparar('explicacao'), lingua: 'pt', incluirMaterial: true
  });
  const semNada = PDFGen.gerarMaterialTema({
    tema: limpo, lingua: 'pt', incluirMaterial: true
  });
  conf('CONTROLE: a explicação desenha a fórmula dela',
    tracosDaFolha(soExplicacao) > tracosDaFolha(semNada), true);
  conf('CONTROLE: e não imprime arroba nenhuma',
    arrobasDesenhadas(soExplicacao).join(', ') || 0, 0);
}

console.log('\n=== a arroba no banco inteiro, e não num tema só ===');

/* A trava acima roda sobre UM tema, o MAT06-05, em quatro variantes. Um "@eq"
 * vazando no MATEM2-04 não seria pego por ela.
 *
 * A cobertura completa é em duas camadas, e o argumento é que uma folha só pode
 * imprimir uma arroba que exista na FONTE:
 *
 *   camada 1: nenhuma arroba seguida de letra na fonte dos 154 temas além das
 *   três diretivas conhecidas (@fig, @eq, @fonte). Isto pega o e-mail, o
 *   "@tabela" que ainda não nasceu e o erro de digitação, em qualquer tema;
 *   camada 2: todo tema que TRAZ diretiva gera as folhas de verdade e não pode
 *   imprimir arroba nenhuma. Hoje são 12 temas (6 de matemática com @fig ou
 *   @eq, e os 6 de português com @fonte).
 *
 * Juntas cobrem os 154: quem não tem arroba na fonte não pode imprimir arroba,
 * e quem tem passa pela camada 2. Gerar as 308 folhas do banco a cada portão
 * custaria minutos e não acrescentaria caso nenhum.
 *
 * O argumento vale para o texto DO TEMA, e só para ele. O que entra na folha
 * por fora do banco não passa por camada nenhuma: `aluno: 'contato@equipe.com'`
 * sai impresso no cabeçalho e as duas camadas são cegas para isso. Fica escrito
 * porque a cobertura é forte o suficiente para alguém confundi-la com total. */
{
  const DIRETIVAS = { '@fig': 1, '@eq': 1, '@fonte': 1 };
  /* A camada 1 numa função, e não solta no laço, para poder ser CHAMADA com
   * tema estragado. Sem isso ela era a única contagem deste arquivo sem o par
   * "o detector detecta": afrouxando a lista branca para aceitar qualquer
   * arroba, tudo continuava verde, e é ela que sustenta o argumento de
   * cobertura para 142 dos 154 temas. */
  function arrobasEstranhas(tema) {
    const achadas = [];
    (JSON.stringify(tema).match(/@[A-Za-z][A-Za-z0-9]*/g) || []).forEach(function (a) {
      if (!DIRETIVAS[a]) achadas.push(a);
    });
    return [...new Set(achadas)];
  }

  const bancos = [
    ['matemática', banco],
    ['português', JSON.parse(fs.readFileSync(
      path.join(__dirname, '..', 'temas', 'banco-portugues.json'), 'utf8'))]
  ];
  let temasVistos = 0, comDiretiva = [];
  const estranhas = [];
  bancos.forEach(function (par) {
    (par[1].temas || []).forEach(function (t) {
      temasVistos++;
      arrobasEstranhas(t).forEach(function (a) { estranhas.push(t.id + ': ' + a); });
      if (/@(fig|eq|fonte)/.test(JSON.stringify(t))) comDiretiva.push(t);
    });
  });
  conf('os dois bancos somam 154 temas', temasVistos, 154);
  conf('nenhuma arroba na fonte que não seja @fig, @eq ou @fonte',
    [...new Set(estranhas)].slice(0, 5).join(', ') || 0, 0);
  /* A trava da trava: se a varredura parasse de achar as diretivas conhecidas,
   * ela teria virado uma varredura sobre nada e passaria sempre. */
  conf('e a varredura acha os temas que trazem diretiva', comDiretiva.length >= 12, true);

  /* E o controle positivo da camada 1: ela tem que ACUSAR o que existe para
   * achar. A diretiva que ainda não nasceu e o endereço de e-mail são os dois
   * casos concretos: o primeiro é o buraco do "@eq" se repetindo com outro
   * nome, e o segundo é a única arroba legítima que um tema poderia querer. */
  conf('a camada 1 acusa uma diretiva que ainda não existe',
    arrobasEstranhas({ id: 'X', pt: { explicacao: 'Olhe a @tabela linhas=3.' } }).join(','),
    '@tabela');
  conf('e acusa um endereço de e-mail escrito num tema',
    arrobasEstranhas({ id: 'X', pt: { explicacao: 'Escreva para contato@equipe.com hoje.' } })
      .join(','), '@equipe');
  conf('e não acusa as três diretivas conhecidas',
    arrobasEstranhas({ id: 'X', pt: {
      explicacao: '@fig triangulo lado=3\n\n@eq x = 1\n\n@fonte f1 linhas=1-2'
    } }).join(',') || 0, 0);

  const vazando = [];
  comDiretiva.forEach(function (t) {
    ['pt', 'en'].forEach(function (lg) {
      if (!t[lg]) return;
      let bytes;
      try {
        bytes = PDFGen.gerarMaterialTema({
          tema: t, lingua: lg, incluirMaterial: true, incluirLista: true, incluirGabarito: true
        });
      } catch (e) {
        vazando.push(t.id + '/' + lg + ' estourou: ' + (e && e.message));
        return;
      }
      const achadas = arrobasDesenhadas(bytes);
      if (achadas.length) vazando.push(t.id + '/' + lg + ': ' + achadas.join(' '));
    });
  });
  conf('e nenhum tema com diretiva imprime arroba na folha',
    vazando.slice(0, 5).join(' | ') || 0, 0);
}

console.log('\n=== o navegador recebe o kit de figuras inteiro ===');

/* No Node os módulos se acham por require. No NAVEGADOR não: cada um procura o
 * global do vizinho (FigMarcas, FigDesenho, Formula) e, não achando, desiste em
 * silêncio. Faltando um arquivo no index.html, a figura sai SEM MARCA NENHUMA,
 * sem erro e sem aviso, e só se descobre na folha impressa.
 *
 * Aconteceu: o index.html declarava só o base.js e o receitas.js, e os outros
 * três nunca chegavam ao tablet. Conferido rodando os arquivos num contexto sem
 * require, que é o que o navegador faz.
 *
 * O sw.js precisa da mesma lista: ela dá aula na casa das famílias, muitas vezes
 * sem sinal, e o que não está no cache não existe quando falta rede. */
{
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  /* O kit sai do index.html de HOJE, e não de uma lista escrita à mão aqui.
   * Lista literal só confere o que alguém lembrou de escrever nela: um sexto
   * arquivo de figuras entrando em produção fora do cache passava batido, e a
   * lista ainda precisou ser editada à mão na última vez que o kit cresceu. */
  const KIT = [...new Set((html.match(/src="figuras\/[\w.-]+\.js"/g) || [])
    .map(function (s) { return s.replace(/.*figuras\//, '').replace(/"$/, ''); }))].sort();

  /* E o index.html tem que carregar TODO módulo de figuras/ que existe no disco
   * (os arquivos sem prefixo "_" e sem "testa_", que são as provas). Sem esta
   * linha a conferência abaixo ficaria vazia quando o index.html perdesse os
   * <script>: laço sobre lista vazia passa sempre, calado. */
  const modulos = fs.readdirSync(path.join(__dirname, '..', 'figuras'))
    .filter(function (f) {
      return f.endsWith('.js') && !f.startsWith('_') && !f.startsWith('testa_');
    }).sort();
  conf('o index.html carrega todo módulo de figuras/ que existe no disco',
    modulos.filter(function (m) { return KIT.indexOf(m) < 0; }).join(', ') || 0, 0);

  /* A lista do sw.js é RECORTADA antes da busca, e sem os comentários dela. A
   * versão anterior procurava o nome no arquivo inteiro com indexOf, e um
   * comentário do próprio sw.js que cita './figuras/solidos.js' passou a
   * satisfazer a trava sozinho: dava para apagar a linha da lista ARQUIVOS que
   * esta suíte passava inteira, com o arquivo fora do pacote offline. */
  const bloco = (sw.match(/var ARQUIVOS = \[[\s\S]*?\n\];/) || [''])[0]
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
  const noCache = new Set((bloco.match(/'[^']*'/g) || [])
    .map(function (s) { return s.slice(1, -1).replace(/^\.\//, ''); }));
  conf('o sw.js tem uma lista ARQUIVOS com entradas', noCache.size > 0, true);

  KIT.forEach(function (arq) {
    const existe = fs.existsSync(path.join(__dirname, '..', 'figuras', arq));
    conf('figuras/' + arq + ' existe', existe, true);
    if (!existe) return;
    conf('  o sw.js guarda ' + arq + ' na lista ARQUIVOS', noCache.has('figuras/' + arq), true);
  });

  /* E o pdf.js tem que continuar servindo SEM o kit ao lado: quem gera um
   * fechamento de mês não carrega desenhador de triângulo. */
  conf('o pdf.js gera folha sem depender do kit',
    (function () {
      try {
        const d = new PDFGen.Doc();
        d.novaPagina();
        d.markdown('Um parágrafo comum, sem figura nenhuma.', { tam: 10 });
        return d.finalizar().length > 500;
      } catch (e) { return false; }
    })(), true);
}

console.log('\n' + '='.repeat(60));
console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(e => console.log(' - ' + e)); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
