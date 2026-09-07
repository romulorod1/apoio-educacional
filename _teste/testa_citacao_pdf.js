/* P1, P2 e P3: o bloco de citacao, o italico, as alternativas e o gabarito
 * estruturado, medidos no PDF gerado.
 *
 * Molde do _teste/testa_material.js: gera a folha, extrai as pecas de texto dos
 * operadores "Td (...) Tj" e os "Tf" que dizem em qual fonte cada peca saiu, e
 * AFIRMA. Um gerador que so nao estoura nao e conferencia.
 *
 * As fixtures sao inline de proposito, e nao lidas de temas/banco.json nem de
 * banco/: as duas frentes vizinhas estao mexendo nesses arquivos, e um teste que
 * le o dado de outra frente reprova por mudanca que nao e dele. O que este
 * arquivo prova e o pdf.js.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const PDFGen = require('../pdf.js');

const RAIZ = path.join(__dirname, '..');

let passes = 0, falhas = 0;
const erros = [];
function conf(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (ok) passes++; else { falhas++; erros.push(rotulo + ' | obtido: ' + obtido + ' | esperado: ' + esperado); }
  console.log((ok ? '  OK   ' : '  FALHA') + ' ' + rotulo +
    (ok ? '' : '  [obtido: ' + obtido + ' | esperado: ' + esperado + ']'));
}

// ================= leitura do PDF =================

/* Cada peca de texto desenhada, com a FONTE em que ela saiu. O operador Tf vale
 * do ponto em que aparece ate o proximo, dentro do mesmo BT, que e como o
 * pdf.js escreve simbolo no meio da linha. */
function pecas(bruto) {
  const saida = [];
  bruto.split('\n').forEach(function (linha) {
    if (linha.slice(0, 3) !== 'BT ') return;
    const rx = /\/(F\d)\s+[\d.]+\s+Tf|\(((?:[^()\\]|\\.)*)\)\s+Tj/g;
    let fonte = null, m;
    while ((m = rx.exec(linha))) {
      if (m[1]) fonte = m[1];
      /* O escapar() do pdf.js protege a barra e os parenteses, que sao os tres
       * caracteres que o operador de texto do PDF nao aceita crus. Sem desfazer
       * isso aqui, a alternativa "a)" chegaria como "a\)" e a conferencia
       * procuraria uma peca que nunca existiu. */
      else saida.push({ fonte: fonte, txt: m[2].replace(/\\([\\()])/g, '$1') });
    }
  });
  return saida;
}

/* Todo o texto da folha numa string so, na ordem de desenho. Serve para
 * procurar frase, ja que cada palavra sai numa peca.
 *
 * O espaco em branco e normalizado porque a peca pode terminar com o espaco que
 * separa ela da seguinte (o credito sai em tres pedacos, "Escrito para este
 * banco. ", o titulo em italico e ", 2026."), e a juncao acrescenta outro. */
function corrido(bruto) {
  return pecas(bruto).map(function (p) { return p.txt; }).join(' ').replace(/\s+/g, ' ');
}

function quantasVezes(agulha, palheiro) {
  return palheiro.split(agulha).length - 1;
}

/* Os fluxos de conteudo, um por pagina, na ordem. O pdf.js nao comprime, entao
 * o fluxo e o proprio texto dos operadores. */
function fluxos(bruto) {
  return bruto.split('\nstream\n').slice(1).map(function (s) { return s.split('\nendstream')[0]; });
}

/* Fio vertical do bloco de citacao: x1 igual a x2 em MARG_E + 26. */
const RX_FIO = /66\.00 [\d.]+ m 66\.00 [\d.]+ l S/g;
function fiosDaCitacao(trecho) {
  return (trecho.match(RX_FIO) || []).length;
}

function gerar(op) {
  return Buffer.from(PDFGen.gerarMaterialTema(op)).toString('latin1');
}

// ================= a fixture de portugues =================

const FONTES = {
  'escrito_manha-na-varanda': {
    titulo: 'Manhã na varanda',
    autor: 'escrito para o exercício',
    credito: 'Escrito para este banco. *Manhã na varanda*, 2026.'
  },
  'escrito_bilhete-da-geladeira': {
    titulo: 'Bilhete da geladeira',
    autor: 'escrito para o exercício',
    credito: 'Escrito para este banco. *Bilhete da geladeira*, 2026.'
  }
};

/* Doze linhas nao vazias e uma em branco no meio: a linha em branco desce meia
 * entrelinha e NAO conta na numeracao, entao a decima linha impressa continua
 * sendo a de numero 10. */
const CONTEUDO_APOIO = [
  'A varanda acordava antes da casa, e eu com ela.',
  'O primeiro barulho era o do portão do vizinho.',
  'Depois vinha o cheiro de pão vindo da esquina.',
  'Minha avó dizia que a manhã tem pressa de ninguém.',
  'Eu não entendia a frase, mas gostava de ouvir.',
  'Ela repetia isso todo dia, sempre com a mesma voz.',
  '',
  'Hoje eu acordo cedo e a varanda continua ali.',
  'O portão do vizinho continua rangendo do mesmo jeito.',
  'O cheiro de pão também, e é ele que me traz de volta.',
  'A frase da minha avó só fez sentido muitos anos depois.',
  'A manhã não tem pressa; quem tem sou eu.',
  'E é por isso que eu ainda me sento aqui.'
];

const CONTEUDO_BILHETE = [
  'Filha, deixei a janta pronta na panela de baixo.',
  'Não esquece de tirar o cachorro antes de escurecer.',
  'Volto tarde.'
];

const EXPLICACAO = [
  '### Quem conta a história',
  '',
  'Um exemplo com *alfa*, outro com **beta** e um terceiro com ***gama***.',
  '',
  'Um asterisco *sem par no fim da linha não pode sair impresso na folha.',
  '',
  '* Item de lista aberto com estrela, e não com itálico.',
  '- Outro item, com hífen, para o par ficar completo.',
  '',
  '@fonte escrito_manha-na-varanda linhas=1-6',
  '> A varanda acordava antes da casa, e eu com ela.',
  '> O primeiro barulho era o do portão do vizinho.',
  '> Depois vinha o cheiro de pão vindo da esquina.',
  '> Minha avó dizia que a manhã tem pressa de ninguém.',
  '> Eu não entendia a frase, mas gostava de ouvir.',
  '> Ela repetia isso todo dia, sempre com a mesma voz.',
  '',
  'O narrador olha para trás, e é daí que vem a dúvida dele.'
].join('\n');

const TEMA_POR = {
  id: 'POR07-FIXTURE', materia: 'portugues', serie: '07', unidade: 'leitura',
  duracaoMin: 60, dificuldade: 2, prerequisitos: [],
  topicos: ['POR07-T01'], bncc: ['EF67LP28'], vestibular: [],
  fontes: FONTES,
  pt: {
    titulo: 'Quem conta a história',
    resumo: 'Narrador e distância de tempo.',
    explicacao: EXPLICACAO,
    textos: [
      { fonte: 'escrito_manha-na-varanda', linhas: [1, 12], conteudo: CONTEUDO_APOIO }
    ],
    exercicios: [
      {
        n: 1, bloco: 'Fundamentos', texto: 0, tipo: 'aberta',
        enunciado: 'Explique por que a frase da avó só fez sentido depois.',
        resposta: 'que o aluno perceba a distância de tempo entre os dois momentos',
        gabarito: {
          espera_se: 'que o aluno perceba a distância de tempo entre a criança que ouvia a frase e o adulto que a entende.',
          aceita_se: ['dizer que ela cresceu e passou a ter pressa', 'apontar a repetição das manhãs sem falar em idade'],
          nao_aceita: ['dizer que a avó explicou a frase', 'dizer que a história acontece toda no presente'],
          /* Âncora que atravessa a quebra de linha da fonte: ela termina uma
           * linha e começa a seguinte, que é o caso que a comparação com
           * espaços normalizados existe para aceitar. */
          ancora: 'sempre com a mesma voz. Hoje eu acordo cedo e a varanda continua ali.'
        }
      },
      {
        n: 2, bloco: 'Fundamentos', texto: 0, tipo: 'fechada',
        enunciado: 'A expressão "a manhã tem pressa de ninguém" indica',
        alternativas: [
          { letra: 'a', texto: 'que a manhã passa mais rápido do que a tarde.' },
          { letra: 'b', texto: 'que o tempo da manhã não corre atrás de ninguém.' },
          { letra: 'c', texto: 'que a avó acordava sempre atrasada.' },
          { letra: 'd', texto: 'que o vizinho abria o portão antes de todos.' }
        ],
        resposta: 'b',
        gabarito: {
          letra: 'b',
          porque: 'a frase nega a pressa, e não a compara com outro período do dia.',
          ancora: 'a manhã tem pressa de ninguém'
        }
      },
      {
        n: 3, bloco: 'Leitura', texto: 0, tipo: 'aberta',
        enunciado: 'Compare o tom do texto com o do bilhete abaixo.',
        /* Trecho próprio do item (G6): fonte diferente da do texto de apoio,
         * então o crédito dele SAI. */
        trecho: {
          fonte: 'escrito_bilhete-da-geladeira', linhas: [20, 22], conteudo: CONTEUDO_BILHETE
        },
        resposta: 'que o aluno perceba que o bilhete é seco e o texto é saudoso',
        gabarito: {
          espera_se: 'que o aluno perceba que o bilhete só informa, e o texto lembra.',
          aceita_se: ['dizer que o bilhete é curto e prático'],
          nao_aceita: ['dizer que os dois têm o mesmo tom'],
          ancora: 'Volto tarde.'
        }
      },
      {
        n: 4, bloco: 'Leitura', texto: 0, tipo: 'aberta',
        enunciado: 'Releia as duas primeiras linhas e diga quem acorda primeiro.',
        /* Trecho da MESMA fonte do texto de apoio do item: o crédito não se
         * repete, senão a folha traria o mesmo rodapé duas vezes na mesma
         * questão. */
        trecho: {
          fonte: 'escrito_manha-na-varanda', linhas: [1, 2],
          conteudo: [CONTEUDO_APOIO[0], CONTEUDO_APOIO[1]]
        },
        resposta: 'a varanda',
        gabarito: { espera_se: 'que o aluno responda a varanda, e não o narrador.',
          aceita_se: ['dizer que é a varanda'], nao_aceita: ['dizer que é a avó'],
          ancora: 'A varanda acordava antes da casa' }
      }
    ]
  }
};

/* Tema de matemática LEGADO, inline: negrito, expoente, tabela, lista e nenhum
 * itálico. É o par que prova que a folha antiga não mudou. */
const TEMA_MAT = {
  id: 'MAT06-FIXTURE', serie: '06', unidade: 'numeros',
  duracaoMin: 50, dificuldade: 2, prerequisitos: [],
  pt: {
    titulo: 'Potências de dez',
    resumo: 'Como escrever números grandes.',
    explicacao: [
      '### O que é uma potência',
      '',
      'Uma potência é uma **multiplicação de fatores iguais**: 10^{3} é 10 · 10 · 10.',
      '',
      '- O expoente diz quantas vezes o fator aparece.',
      '- A base é o fator que se repete.',
      '',
      '| Escrita | Valor |',
      '| --- | --- |',
      '| 10^{2} | 100 |',
      '| 10^{3} | 1.000 |',
      '',
      'Com π o texto muda de fonte, e é por isso que a Symbol entra na folha.'
    ].join('\n'),
    exercicios: [
      { n: 1, bloco: 'Fundamentos', enunciado: 'Escreva 10^{4} como multiplicação.',
        resposta: '10 · 10 · 10 · 10 = 10.000' },
      { n: 2, bloco: 'Fundamentos', enunciado: 'Quanto vale **10^{0}**?', resposta: '1' }
    ]
  }
};

/* Oitenta linhas: mais do que cabe numa folha, para o fio ter que fechar numa
 * página e reabrir na seguinte. */
const OITENTA = [];
for (let i = 1; i <= 80; i++) OITENTA.push('Linha ' + i + ' do texto comprido que atravessa a folha.');
const TEMA_LONGO = {
  id: 'POR07-LONGO', materia: 'portugues', serie: '07', unidade: 'leitura',
  fontes: FONTES,
  pt: {
    titulo: 'Texto comprido', resumo: 'Duas páginas de bloco.',
    explicacao: 'Sem citação aqui.',
    textos: [{ fonte: 'escrito_manha-na-varanda', linhas: [1, 80], conteudo: OITENTA }],
    exercicios: [{ n: 1, bloco: 'Leitura', texto: 0, enunciado: 'Leia o texto.',
      resposta: 'leitura' }]
  }
};

// ================= as folhas =================

console.log('=== as folhas da fixture de português ===');

const completa = gerar({
  tema: TEMA_POR, lingua: 'pt',
  incluirMaterial: true, incluirLista: true, incluirGabarito: true,
  aluno: 'Aluna', data: '10/06/2026'
});
fs.writeFileSync(path.join(__dirname, 'citacao_prova.pdf'), Buffer.from(completa, 'latin1'));
console.log('  _teste/citacao_prova.pdf: ' + Math.round(completa.length / 1024) + ' KB');

const soLista = gerar({ tema: TEMA_POR, lingua: 'pt', incluirLista: true, aluno: 'Aluna' });
const soMaterial = gerar({ tema: TEMA_POR, lingua: 'pt', incluirMaterial: true });
const soGabarito = gerar({ tema: TEMA_POR, lingua: 'pt', incluirGabarito: true, aluno: 'Aluna' });
/* Seleção que deixa de fora a PRIMEIRA questão do texto de apoio: o texto tem
 * que sair mesmo assim, na primeira questão selecionada que o usa. */
const selecao = gerar({ tema: TEMA_POR, lingua: 'pt', incluirLista: true, escolhidos: [2, 3, 4] });
const legado = gerar({
  tema: TEMA_MAT, lingua: 'pt',
  incluirMaterial: true, incluirLista: true, incluirGabarito: true,
  aluno: 'Aluna', data: '10/06/2026'
});
const longa = gerar({ tema: TEMA_LONGO, lingua: 'pt', incluirLista: true });

const AS_QUATRO = [
  ['completa', completa], ['só lista', soLista],
  ['só gabarito', soGabarito], ['seleção', selecao]
];

console.log('\n=== P2: número de linha, crédito, alternativas e gabarito ===');

{
  const txt = pecas(soLista).map(function (p) { return p.txt; });
  /* Os números de linha saem como peça de texto sozinha. O texto de apoio vai da
   * linha 1 à 12, então saem o 1 (primeira linha do trecho) e os múltiplos de 5;
   * o 2 e o 3 não saem, senão a folha estaria numerando linha por linha. */
  conf('o número 1 sai no bloco', txt.indexOf('1') >= 0, true);
  conf('o número 5 sai no bloco', txt.indexOf('5') >= 0, true);
  conf('o número 10 sai no bloco', txt.indexOf('10') >= 0, true);
  conf('o número 2 NÃO sai no bloco', txt.indexOf('2') >= 0, false);
  conf('o número 3 NÃO sai no bloco', txt.indexOf('3') >= 0, false);
  /* O trecho próprio do item começa na linha 20 da fonte dele, e é esse número
   * que sai: o número é o da FONTE, e não o da folha. */
  conf('o trecho próprio numera pela fonte dele (20)', txt.indexOf('20') >= 0, true);
}

{
  const t = corrido(soLista);
  conf('o subtítulo do texto de apoio traz o título da fonte',
    quantasVezes('Manhã na varanda', t) >= 1, true);
  conf('o crédito do texto de apoio sai uma vez',
    quantasVezes('Escrito para este banco. Manhã na varanda , 2026.', t), 1);
  conf('o texto de apoio sai UMA vez na folha da lista',
    quantasVezes('A varanda acordava antes da casa, e eu com ela.', t), 2);
  conf('o crédito do trecho de outra fonte sai',
    quantasVezes('Escrito para este banco. Bilhete da geladeira , 2026.', t), 1);
}

{
  /* O texto de apoio sai UMA vez por folha: na folha completa ele aparece na
   * explicação (bloco de seis linhas) e na lista (bloco de doze), e nada mais. */
  const t = corrido(completa);
  conf('na folha completa a primeira linha do texto sai só onde deve',
    quantasVezes('O primeiro barulho era o do portão do vizinho.', t), 3);
  const tSel = corrido(selecao);
  conf('a seleção sem a questão 1 continua trazendo o texto de apoio',
    quantasVezes('A varanda acordava antes da casa, e eu com ela.', tSel) >= 1, true);
  conf('a seleção sem a questão 1 traz o crédito do texto de apoio',
    quantasVezes('Escrito para este banco. Manhã na varanda , 2026.', tSel), 1);
}

{
  const txt = pecas(soLista).map(function (p) { return p.txt; });
  ['a)', 'b)', 'c)', 'd)'].forEach(function (letra) {
    conf('a alternativa ' + letra + ' sai como peça própria', txt.indexOf(letra) >= 0, true);
  });
  conf('não sai uma quinta alternativa', txt.indexOf('e)') >= 0, false);
  /* Uma linha por alternativa: as quatro saem em quatro linhas de base
   * diferentes, e não emendadas numa só. */
  const linhasDasLetras = {};
  soLista.split('\n').forEach(function (linha) {
    // no fluxo do PDF o parentese do rotulo sai escapado: "Td (a\)) Tj"
    const m = /([\d.]+) ([\d.]+) Td \(([a-e])\\\)\) Tj/.exec(linha);
    if (m) linhasDasLetras[m[3]] = m[2];
  });
  conf('as quatro alternativas saem em quatro linhas diferentes',
    new Set(Object.keys(linhasDasLetras).map(function (k) { return linhasDasLetras[k]; })).size, 4);
}

{
  const t = corrido(soGabarito);
  ['Espera-se', 'Aceita-se', 'Não se aceita', 'No texto'].forEach(function (r) {
    conf('o rótulo "' + r + '" sai no gabarito', quantasVezes(r, t) >= 1, true);
  });
  conf('a letra da questão fechada sai no gabarito', quantasVezes(' b ', ' ' + t + ' ') >= 1, true);
  conf('o porquê da questão fechada sai no gabarito',
    quantasVezes('a frase nega a pressa', t) >= 1, true);
  /* A âncora sai como mini-citação em itálico: F4 é a Helvetica-Oblique. */
  const emItalico = pecas(soGabarito).filter(function (p) { return p.fonte === 'F4'; })
    .map(function (p) { return p.txt; }).join(' ');
  conf('a âncora do gabarito sai em /F4',
    quantasVezes('Volto tarde.', emItalico) >= 1, true);
  conf('a mini-citação da âncora tem fio', fiosDaCitacao(soGabarito) >= 1, true);
  /* O gabarito não repete o texto de apoio: a âncora basta. */
  conf('o gabarito não repete o texto de apoio inteiro',
    quantasVezes('O primeiro barulho era o do portão do vizinho.', t), 0);
}

{
  /* Envenenado: tema sem o mapa de fontes tem que LANÇAR com o id na mensagem,
   * em vez de imprimir "[id]" no rodapé do trecho da folha da aluna. */
  const semFontes = JSON.parse(JSON.stringify(TEMA_POR));
  delete semFontes.fontes;
  let mensagem = '(não lançou)';
  try {
    PDFGen.gerarMaterialTema({ tema: semFontes, lingua: 'pt', incluirLista: true });
  } catch (e) {
    mensagem = String(e && e.message ? e.message : e);
  }
  conf('tema sem fontes lança erro com o id da fonte na mensagem',
    mensagem.indexOf('escrito_manha-na-varanda') >= 0, true);
  conf('e o erro diz o que faltou',
    mensagem.indexOf('fonte sem metadados no tema') >= 0, true);
}

console.log('\n=== P3: itálico ===');

{
  const p = pecas(completa);
  function fonteDe(palavra) {
    const achado = p.filter(function (x) { return x.txt === palavra; });
    return achado.length ? achado[0].fonte : '(não saiu)';
  }
  conf('*alfa* sai em /F4 (Helvetica-Oblique)', fonteDe('alfa'), 'F4');
  conf('**beta** sai em /F2 (Helvetica-Bold)', fonteDe('beta'), 'F2');
  conf('***gama*** sai em /F5 (Helvetica-BoldOblique)', fonteDe('gama'), 'F5');
  conf('a folha de português registra a Helvetica-Oblique',
    completa.indexOf('/BaseFont /Helvetica-Oblique') >= 0, true);
  conf('a folha de português registra a Helvetica-BoldOblique',
    completa.indexOf('/BaseFont /Helvetica-BoldOblique') >= 0, true);
}

AS_QUATRO.concat([['legado', legado], ['comprida', longa], ['só material', soMaterial]])
  .forEach(function (par) {
  conf('nenhum asterisco impresso na folha ' + par[0],
    /Td \([^)]*\*/.test(par[1]), false);
});

{
  /* O asterisco sem par vira italico do ponto dele ate o fim da linha, e nao
   * asterisco impresso: a peca seguinte a ele sai em /F4. */
  const p = pecas(completa);
  const semPar = p.filter(function (x) { return x.txt === 'sem' && x.fonte === 'F4'; });
  conf('o asterisco sem par vira itálico e não sai impresso', semPar.length >= 1, true);

  /* O par do de cima: "* " no COMEÇO da linha é marcador de item de lista e não
   * chega ao tokenizador de estilo. Quem o consome é o ramo do marcador no
   * Doc.prototype.markdown. Sem esta trava, o comentário do partirEstilo que diz
   * isso seria uma afirmação que ninguém confere.
   *
   * A conta é feita na folha só de explicação: na folha completa o gabarito
   * aberto também desenha marcador nas listas de "Aceita-se" e "Não se aceita",
   * e o número deixaria de dizer alguma coisa sobre o item de lista. */
  const pMaterial = pecas(soMaterial);
  const naLista = pMaterial.filter(function (x) { return x.txt === 'estrela,'; });
  conf('o item aberto por "* " sai como lista', naLista.length, 1);
  conf('e o texto dele NÃO sai em itálico', naLista.length ? naLista[0].fonte : '(não saiu)', 'F1');
  /* O marcador de tópico é o byte 0x95 do WinAnsi, que é como o pdf.js grava o
   * bullet; lido em latin1 ele volta como \x95. Os dois itens da explicação, o
   * de estrela e o de hífen, desenham um cada. */
  conf('os dois itens de lista saem com o marcador de tópico',
    pMaterial.filter(function (x) { return x.txt === '\x95'; }).length, 2);
}

{
  /* Defesa: linha de citação sem @fonte antes desenha o bloco SEM número e SEM
   * crédito, em vez de sair com o sinal ">" impresso no meio do parágrafo. Em
   * matéria com catálogo o verificador já reprova isso na fonte do tema. */
  const doc = new PDFGen.Doc();
  doc.novaPagina();
  doc.markdown('Antes do bloco.\n\n> Uma linha citada sem diretiva.\n> Outra linha citada.\n\nDepois.',
    { tam: 10 });
  const solto = Buffer.from(doc.finalizar()).toString('latin1');
  const txt = pecas(solto).map(function (x) { return x.txt; });
  conf('o bloco sem @fonte desenha o texto citado',
    corrido(solto).indexOf('Uma linha citada sem diretiva.') >= 0, true);
  conf('o bloco sem @fonte não sai com o sinal ">" impresso',
    /Td \([^)]*>/.test(solto), false);
  conf('o bloco sem @fonte não numera', txt.indexOf('1') >= 0, false);
  conf('o bloco sem @fonte tem fio mesmo assim', fiosDaCitacao(solto) >= 1, true);
}

{
  conf('a folha de matemática NÃO registra a Helvetica-Oblique',
    legado.indexOf('Helvetica-Oblique') >= 0, false);
  conf('a folha de matemática NÃO registra a Helvetica-BoldOblique',
    legado.indexOf('Helvetica-BoldOblique') >= 0, false);
  conf('a folha de matemática NÃO lista /F4 nos recursos',
    /\/F4 \d+ 0 R/.test(legado), false);
  conf('a folha de matemática NÃO lista /F5 nos recursos',
    /\/F5 \d+ 0 R/.test(legado), false);
  /* E a folha de matemática continua carregando a Symbol quando o tema tem pi:
   * sem esta linha, a de cima passaria numa folha que perdeu todas as fontes. */
  conf('a folha de matemática continua registrando a Symbol',
    legado.indexOf('/BaseFont /Symbol') >= 0, true);
}

console.log('\n=== o fio do bloco ===');

{
  const paginas = fluxos(soLista);
  const comTexto = paginas.filter(function (f) {
    return corrido(f).indexOf('A varanda acordava antes da casa') >= 0;
  });
  conf('a página do texto de apoio existe', comTexto.length >= 1, true);
  conf('a página do texto de apoio tem fio em x = 66,00',
    comTexto.length ? fiosDaCitacao(comTexto[0]) >= 1 : false, true);

  const paginasLongas = fluxos(longa).filter(function (f) { return fiosDaCitacao(f) >= 1; });
  conf('no texto de 80 linhas o fio aparece em duas páginas', paginasLongas.length, 2);
  /* E o bloco atravessa mesmo a virada: as duas páginas trazem linha do texto. */
  conf('as duas páginas do bloco trazem texto citado',
    paginasLongas.filter(function (f) { return corrido(f).indexOf('do texto comprido') >= 0; }).length, 2);
}

{
  /* Linha da fonte que não cabe em LARGURA_CITACAO: a continuação recua mais
   * 12 pt (de x = 76,00 para x = 88,00) e NÃO repete o número, senão o número
   * passaria a apontar uma linha da FOLHA em vez de uma linha da fonte. O
   * verificador impede isso medindo cada linha de fontes/; aqui é defesa.
   *
   * O par que prova que a medida não é um acidente: a linha curta ao lado sai
   * inteira em x = 76,00 e leva o número dela. */
  const doc = new PDFGen.Doc();
  doc.novaPagina();
  doc.fontes = FONTES;
  const comprida = [];
  for (let i = 0; i < 30; i++) comprida.push('palavra' + i);
  doc.citacao({
    fonte: 'escrito_manha-na-varanda', linhas: [9, 10],
    conteudo: [comprida.join(' '), 'Uma linha curta que cabe.']
  }, { tam: 10, credito: false });
  const largo = Buffer.from(doc.finalizar()).toString('latin1');
  const txt = pecas(largo).map(function (x) { return x.txt; });
  conf('a linha larga demais numera uma vez só', txt.filter(function (t) { return t === '9'; }).length, 1);
  conf('e a linha seguinte, que é múltipla de 5, leva o número dela',
    txt.indexOf('10') >= 0, true);
  conf('a continuação recua mais 12 pt', /\n[^\n]* 88\.00 [\d.]+ Td \(/.test(largo), true);
  conf('e a primeira linha começa no recuo do bloco',
    /\n[^\n]* 76\.00 [\d.]+ Td \(/.test(largo), true);
}

console.log('\n=== P1: a folha antiga não mudou nem um byte ===');

/* O mesmo mecanismo do _teste/compara_pdfs_base.js, com a fixture inline: o
 * pdf.js da BASE DO MERGE gera a folha do tema legado e os bytes tem que ser os
 * mesmos. Comparar com "git show HEAD:pdf.js" nao afirmaria nada, porque no
 * portao o commit ja esta feito e os dois lados sao iguais por construcao.
 *
 * A copia vai para a RAIZ do repositorio porque o pdf.js resolve
 * "./figuras/receitas.js" pelo proprio caminho, e de uma pasta temporaria o
 * modulo de figuras nao carregaria: a comparacao passaria a comparar duas
 * folhas sem desenho nenhum. Ela sai no finally, inclusive quando o teste
 * estoura. */
{
  const COPIA = path.join(RAIZ, '_pdf_base_do_teste.js');
  let base = null, cabeca = null;
  try {
    base = execFileSync('git', ['merge-base', 'HEAD', 'main'],
      { cwd: RAIZ, encoding: 'utf8' }).trim();
    cabeca = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: RAIZ, encoding: 'utf8' }).trim();
  } catch (e) {
    base = null;
  }
  if (!base || base === cabeca) {
    /* Rodando em main depois do merge nao existe base distinta do HEAD. Isso e
     * dito em voz alta e conta como passou: teste que passa em silencio sem
     * dizer o que fez e o que ensinou o portao a mentir. */
    console.log('  sem base para comparar: o HEAD é a própria base do merge');
    conf('sem base para comparar (rodando na base do merge)', true, true);
  } else {
    try {
      fs.writeFileSync(COPIA, execFileSync('git', ['show', base + ':pdf.js'],
        { cwd: RAIZ, maxBuffer: 64 * 1024 * 1024 }));
      const antigo = require(COPIA);
      const antes = Buffer.from(antigo.gerarMaterialTema({
        tema: TEMA_MAT, lingua: 'pt',
        incluirMaterial: true, incluirLista: true, incluirGabarito: true,
        aluno: 'Aluna', data: '10/06/2026'
      }));
      const agora = Buffer.from(legado, 'latin1');
      let pos = 0;
      const n = Math.min(antes.length, agora.length);
      while (pos < n && antes[pos] === agora[pos]) pos++;
      conf('a folha do tema legado sai byte a byte igual à da base do merge',
        antes.equals(agora) ? 'igual' :
          (antes.length + ' bytes na base contra ' + agora.length +
           ', primeiro byte diferente em ' + pos), 'igual');
    } finally {
      try { fs.unlinkSync(COPIA); } catch (e) { /* a cópia já saiu */ }
    }
  }
}

console.log('\n' + '='.repeat(60));
/* Texto escrito para o exercício traz o próprio título na primeira linha (notícia,
 * artigo). O subtítulo do texto de apoio repetiria a linha 1 logo acima dela, e na
 * folha isso lê como erro de impressão (achado da revisão adversarial do piloto).
 * Quando a linha 1 é o título, o subtítulo em negrito 11 não sai; quando não é,
 * continua saindo. O subtítulo é a única peça em /F2 11 Tf com o título dentro. */
console.log('\n=== texto cujo título é a primeira linha ===');
{
  const RX_SUBTITULO = /\/F2 11 Tf [^\n]*Manh/;
  const comTitulo = JSON.parse(JSON.stringify(TEMA_POR));
  comTitulo.pt.textos[0].conteudo = ['Manhã na varanda', ''].concat(CONTEUDO_APOIO);
  comTitulo.pt.textos[0].linhas = [1, 13];
  const brutoCom = gerar({ tema: comTitulo, lingua: 'pt', incluirLista: true });
  const brutoSem = gerar({ tema: TEMA_POR, lingua: 'pt', incluirLista: true });
  conf('quando a linha 1 é o título, o subtítulo em negrito 11 não sai', RX_SUBTITULO.test(brutoCom), false);
  conf('e o título sai mesmo assim, como linha 1 do bloco e no crédito',
    quantasVezes('Manhã na varanda', corrido(brutoCom)), 2);
  conf('quando a linha 1 não é o título, o subtítulo continua saindo', RX_SUBTITULO.test(brutoSem), true);
}

console.log(passes + ' verificações passaram, ' + falhas + ' falharam.');
if (falhas) { console.log('\nFALHAS:'); erros.forEach(function (e) { console.log(' - ' + e); }); }
console.log('='.repeat(60));
process.exit(falhas ? 1 : 0);
