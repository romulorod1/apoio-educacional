/* cartao.js
 * O cartão do mês: o mesmo fechamento que ela já escreve, desenhado numa
 * imagem quadrada de 1080 por 1080 que aparece DENTRO da conversa do WhatsApp
 * em vez de virar um retângulo cinza para baixar.
 *
 * Roda no navegador por <script> (exporta Cartao no global) e no Node.
 *
 * Regra da casa: nunca usar travessão. Nem no código, nem no que é desenhado.
 *
 * ============================================================ ponto de entrada
 *
 * Este arquivo não se liga sozinho em lugar nenhum. Quem ligar precisa de três
 * coisas, nesta ordem:
 *
 *   1) index.html: <script src="cartao.js"></script> antes do app.js, e a
 *      mesma linha entrando na lista ARQUIVOS do sw.js (com nome de cache novo).
 *      Ela dá aula na casa das famílias, muitas vezes sem sinal: arquivo que o
 *      index carrega e o cache não guarda vira 503 sem rede.
 *
 *   2) A tela de fechamento, num botão ao lado dos que já existem:
 *
 *        var f = Core.calcularFechamento(db, alunoId, mes);
 *        var frases = Cartao.frasesDoResumo(f.resumoTexto);   // ela toca numa
 *        var tela = document.createElement('canvas');         // a prévia
 *        Cartao.desenhar(tela, f, { frase: frases[0] });
 *
 *      O canvas volta com 1080 por 1080 de verdade. Mostrar na tela é só CSS
 *      (width: 100%), e é essa mesma imagem que a família recebe: o documento
 *      promete "vê antes de mandar, sempre", então a prévia não pode ser um
 *      desenho diferente do arquivo.
 *
 *   3) Para mandar, o entregarArquivo() que o app.js já tem:
 *
 *        tela.toBlob(function (b) {
 *          entregarArquivo('cartao-' + f.mes + '.png', b, 'Cartão do mês');
 *        }, 'image/png');
 *
 * Nada aqui toca o banco. Não há campo novo, não há versão nova de IndexedDB:
 * o cartão é uma leitura do que o Core.calcularFechamento já devolve.
 *
 * ============================================================ o que NÃO entra
 *
 * O documento pergunta a ela: "tem algo que você nunca mandaria numa imagem?".
 * Enquanto ela não responde, este arquivo assume o caminho mais conservador,
 * porque imagem se encaminha com um toque e não dá para voltar atrás:
 *
 *   - Dinheiro nenhum. Nem valor da hora, nem total do mês, nem faixa de preço.
 *     A conta continua no PDF do fechamento, que ela manda de propósito para
 *     quem paga. Um cartão que circula no grupo da família com o preço dentro
 *     é um preço público.
 *
 *     Esta promessa não vale só para os campos que o código preenche. A frase
 *     é texto livre dela, e o resumo do mês é justamente onde ela escreve coisa
 *     como "combinamos R$ 137,50 a hora a partir do dia quinze". Frase assim
 *     não entra na lista de escolha e não é desenhada nem quando chega pronta
 *     por opcoes.frase. A frase dela não se reescreve, que é regra da casa:
 *     ou sai inteira, ou não sai. Ver temValorEmReais() mais abaixo e o campo
 *     fraseOmitida, que é por onde a tela pode avisar antes de mandar.
 *   - Nada do que o próprio core.js marca como "só para ela": o que ela deu e
 *     não cobrou, o horário desmarcado. Mostrar isso a quem paga transforma
 *     gentileza em dívida.
 *   - Nada de datas de aula, nome de responsável, anotação de aula ou nota.
 *
 * Sobra o que a família quer ver: o nome, o mês, quantos encontros JÁ
 * ACONTECERAM, os assuntos desses encontros e a frase que ELA escolheu. Se ela
 * responder que quer mais alguma coisa, o lugar de acrescentar é o montar()
 * aqui embaixo.
 *
 * ============================================================ o que já foi
 *
 * A aula nasce marcada como realizada, inclusive a que está lá na frente no
 * calendário, e por isso o cartão contava o mês inteiro como dado. Medido no
 * dia três de setembro, com três encontros dados e oito marcados à frente, a
 * família lia onze.
 *
 * O número grande é qtdEncontrosFeitos, o campo que o core passou a devolver
 * justamente para separar o que aconteceu do que vai acontecer. O que está
 * marcado à frente não some do cartão, que seria o mesmo erro ao contrário:
 * ele aparece na segunda linha da legenda, dito com todas as letras. Pela mesma
 * razão, a lista "O QUE TRABALHAMOS" pula a aula futura: o título está no
 * passado, e assunto de aula que ainda não aconteceu não foi trabalhado.
 *
 * Fechamento antigo, sem os campos novos, continua lendo o que sempre leu. Mês
 * vencido tem previsto e realizado iguais, e o cartão dele sai idêntico.
 *
 * ============================================================ tamanho fixo
 *
 * O cartão tem 1080 por 1080 sempre, então o conteúdo não pode crescer: ele se
 * ajusta. A lista completa continua no PDF do fechamento, que não tem esse
 * limite, e o cartão diz em voz alta quantos assuntos ficaram de fora. Ver o
 * cortarUm() mais abaixo para a ordem exata em que as coisas são cortadas.
 *
 * As fontes da identidade (Lora e Poppins) vêm da rede. Enquanto elas não
 * estiverem no repositório e no cache do sw.js, o cartão sai na fonte do
 * sistema, e sai igual: nenhuma largura deste arquivo está escrita à mão, toda
 * medida vem do measureText na hora de desenhar. Conferido lado a lado, com a
 * Lora e sem ela, o arranjo das duas imagens é o mesmo até o pixel.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Cartao = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ============================================================ a paleta
   *
   * As mesmas tintas do resto do aplicativo, copiadas do COR do pdf.js e do
   * :root do styles.css e escritas aqui em hexadecimal porque o canvas fala
   * hexadecimal e o pdf.js fala fração de zero a um. Copiadas, e não
   * importadas, porque este arquivo precisa desenhar sem o pdf.js carregado:
   * o cartão é imagem, não é folha.
   *
   * Contraste medido com a fórmula de luminância relativa da WCAG, contra o
   * fundo marfim #FBF9F5 que é o mesmo do corpo do aplicativo:
   *
   *     navy   #1F3A5F  sobre marfim   10,92:1     sobre branco  11,48:1
   *     texto  #26313F  sobre marfim   12,53:1     sobre branco  13,18:1
   *     teal   #2E7D6B  sobre marfim    4,69:1     sobre branco   4,93:1
   *     muted  #6B7280  sobre marfim    4,60:1     sobre branco   4,83:1
   *
   * Todos passam dos 4,5:1 que a WCAG pede para texto NORMAL, e o menor deles
   * é o muted com 4,60. Passar no critério de texto normal importa mesmo o
   * cartão sendo todo de letra grande: a imagem chega no WhatsApp e é vista de
   * relance, encolhida na conversa, antes de alguém abrir. Os dois fundos
   * entram na conta porque o cartão tem dois: o marfim da folha e o branco das
   * duas caixas, a da contagem e a da frase dela.
   *
   * O gold é a única tinta abaixo da linha: 2,14:1 sobre o marfim. Ele só
   * pinta a bolinha que antecede um assunto e a barrinha lateral da caixa da
   * frase, ou seja, decoração ao lado de um texto que já diz tudo sozinho.
   * Nenhuma informação do cartão depende de enxergar o gold, então a WCAG
   * 1.4.11 não se aplica a ele aqui. Está escrito para quem for mexer não
   * confiar no gold para dizer coisa nova.
   */
  var COR = {
    navy: '#1F3A5F',
    teal: '#2E7D6B',
    gold: '#C9A961',
    muted: '#6B7280',
    fio: '#DCE2E8',
    ivory: '#FBF9F5',
    branco: '#FFFFFF',
    texto: '#26313F'
  };

  /* As duas famílias, cada uma com o fim da fila sendo um nome genérico.
   *
   * Lora e Poppins são as fontes da identidade e é o que o protótipo aprovado
   * usa, mas elas vêm da rede, e ela dá aula sem sinal. A pilha termina em
   * serif e em sans-serif de propósito: sem as duas primeiras o cartão sai com
   * a fonte do sistema e continua sendo o mesmo desenho, porque toda medida
   * daqui é tirada do measureText no momento de desenhar e nenhuma largura
   * está escrita à mão. */
  var SERIF = "'Lora', Georgia, 'Times New Roman', serif";
  var SANS = "'Poppins', 'Segoe UI', Roboto, system-ui, sans-serif";

  var LADO = 1080;
  var MARG = 72;
  var DIR = LADO - MARG;          // 1008
  var UTIL = DIR - MARG;          // 936

  var Y_FIO_CAB = 128;
  var Y_FIO_ROD = 1000;
  var Y_NOME = 226;
  var Y_MES = 268;
  var PILULA_Y = 296, PILULA_H = 80;
  var Y_OLHO = 402;               // a linha "O QUE TRABALHAMOS"
  var TOPO_LISTA = 440;
  var BASE_FRASE = 968;           // o fundo da caixa da frase, 32 acima do fio
  var TETO_FRASE = 470;           // até onde a caixa da frase pode subir
  var VAO_FRASE = 26;             // papel entre o fim da lista e a caixa da frase

  /* Quanto uma linha da lista pode ganhar de respiro quando sobra espaço.
   *
   * Existe porque os dois protótipos que ela viu têm ritmos diferentes: no mês
   * simples os assuntos ficam de 46 em 46 px e no mês cheio de 33 em 33. Não
   * são dois desenhos, é o mesmo desenho com folga diferente. Sem isto, um mês
   * de três assuntos sairia espremido no alto com meio cartão vazio embaixo. */
  var RESPIRO_MAX = 14;
  var DESCE_MAX = 40;             // e o resto da sobra desce o bloco inteiro
  /* Sem a caixa da frase o cartão perde um terço do conteúdo de uma vez, e os
   * 40 px de sempre deixavam a lista encostada no alto com 250 px de marfim
   * vazio embaixo do último item. Aqui a lista pode descer bem mais, porque
   * ela passa a ser o corpo inteiro do cartão e não a metade de cima dele. */
  var DESCE_SEM_FRASE = 96;

  /* ============================================================ ferramentas */

  function txt(v) { return v == null ? '' : String(v); }

  function fonte(tam, peso, familia, italico) {
    return (italico ? 'italic ' : '') + (peso || '400') + ' ' + tam + 'px ' + (familia || SERIF);
  }

  /* Chave de agrupamento de assunto: sem acento e sem caixa, para 'frações'
   * numa aula e 'Frações' na seguinte não virarem duas linhas no cartão. É a
   * mesma ideia do chaveDeBusca do core.js, refeita aqui porque este arquivo
   * desenha sem o core carregado. O normalize tem guarda porque ele é o único
   * pedaço daqui que um motor muito antigo poderia não ter. */
  function chave(s) {
    var t = txt(s).toLowerCase().trim();
    try { t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) { /* sem normalize, agrupa por caixa só */ }
    return t.replace(/\s+/g, ' ');
  }

  var EXTENSO = ['', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete',
    'oito', 'nove', 'dez', 'onze', 'doze'];
  function porExtenso(n) { return EXTENSO[n] || String(n); }

  /* Os doze nomes de disciplina do banco/topicos/indice.json, mais a
   * matemática, que não está no índice porque ela é o banco inteiro do resto do
   * aplicativo. Copiados e não lidos porque o índice chega por fetch e o cartão
   * precisa desenhar offline e no Node. Quem chamar pode passar
   * opcoes.rotuloDisciplina e ganhar o rótulo de qualquer outra. */
  var DISCIPLINAS = {
    matematica: 'Matemática',
    portugues: 'Português',
    redacao: 'Redação',
    ingles: 'Inglês',
    ciencias: 'Ciências',
    historia: 'História',
    geografia: 'Geografia',
    fisica: 'Física',
    quimica: 'Química',
    biologia: 'Biologia',
    literatura: 'Literatura',
    'filosofia-sociologia': 'Filosofia e Sociologia',
    estudo: 'Método de estudo'
  };

  /* ============================================================ temValorEmReais
   *
   *   Cartao.temValorEmReais('Combinamos R$ 137,50 a hora') -> true
   *
   * A promessa lá de cima, "dinheiro nenhum", valia só para os campos que o
   * código preenche. A frase é texto livre, e o resumo do mês é exatamente onde
   * ela escreve o combinado de preço: sem isto, "Combinamos R$ 137,50 a hora a
   * partir do dia quinze" virava opção na lista e podia ir para a imagem que a
   * família encaminha com um toque.
   *
   * O que barra: o cifrão, um número seguido de "reais", um valor por hora.
   * O que NÃO barra, de propósito: "números reais", que é assunto de matemática
   * e apareceria em todo mês de nono ano se a palavra sozinha bastasse. Valor
   * escrito só por extenso e sem a palavra reais também passa, e por isso ele
   * não é a única defesa: ela vê o cartão antes de mandar, sempre.
   */
  var SINAIS_DE_REAIS = [
    /R\s?\$/i,
    /(?:^|[^0-9a-zà-ÿ])(?:\d[\d.,]*|um|uma|dois|duas|três|quatro|cinco|seis|sete|oito|nove|dez|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|trezentos|quatrocentos|quinhentos|mil)(?:\s+e\s+[a-zà-ÿ]+){0,4}\s+reais\b/i,
    /(?:^|[^0-9a-zà-ÿ])(?:um|uma)\s+real\b/i,
    /\d[\d.,]*\s*(?:por|a)\s+hora\b/i,
    /\d[\d.,]*\s*\/\s*h(?:ora)?\b/i
  ];
  function temValorEmReais(texto) {
    var s = txt(texto);
    for (var i = 0; i < SINAIS_DE_REAIS.length; i++) {
      if (SINAIS_DE_REAIS[i].test(s)) return true;
    }
    return false;
  }

  /* ============================================================ frasesDoResumo
   *
   *   Cartao.frasesDoResumo(fechamento.resumoTexto) -> ['...', '...']
   *
   * O documento promete: "a frase sai do resumo que você já escreveu. Toque
   * numa e ela vai para o cartão." Então quem escolhe é ela, e a lista de
   * opções é o resumo dela partido em frases, sem uma palavra trocada.
   *
   * Corta em ponto, exclamação e interrogação seguidos de espaço, e também em
   * quebra de linha. O corte não acontece quando o ponto está entre dígitos
   * (1.500) nem quando a próxima frase começaria em minúscula, que é o sinal
   * de que o ponto era abreviatura e não fim.
   *
   * Fragmento com menos de 12 caracteres não vira opção: é sobra de pontuação,
   * não é frase. Frase que fala de valor em reais também não vira opção, porque
   * o cartão vai para a família e a promessa do topo do arquivo é dinheiro
   * nenhum. Nada é reescrito e nada é encurtado aqui; o que ela escreveu chega
   * inteiro ou não chega. */
  function frasesDoResumo(texto) {
    var s = txt(texto).replace(/\r/g, '');
    var saida = [], atual = '';
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      atual += c;
      var quebra = false;
      if (c === '\n') quebra = true;
      else if (c === '.' || c === '!' || c === '?') {
        var ant = s[i - 1], prox = s[i + 1];
        var entreDigitos = ant >= '0' && ant <= '9' && prox >= '0' && prox <= '9';
        if (!entreDigitos && (prox === undefined || /\s/.test(prox))) {
          var resto = s.slice(i + 1).replace(/^\s+/, '');
          // minúscula depois do ponto quer dizer abreviatura, não fim de frase
          if (!resto || resto[0] !== resto[0].toLowerCase() || !/[a-zà-ÿ]/i.test(resto[0])) quebra = true;
        }
      }
      if (quebra) { saida.push(atual); atual = ''; }
    }
    if (atual) saida.push(atual);
    return saida.map(function (f) { return f.trim(); })
      .filter(function (f) { return f.length >= 12; })
      .filter(function (f) { return !temValorEmReais(f); });
  }

  /* ============================================================ montar
   *
   *   Cartao.montar(fechamento, opcoes) -> dados
   *
   * Lê o que o Core.calcularFechamento devolveu e escreve o conteúdo do cartão,
   * sem medir nada e sem cortar nada. Tudo o que vier faltando é ausência
   * tolerada: aluno sem assunto, mês sem área, fechamento sem resumo, assunto
   * sem disciplina. O cartão de um mês vazio ainda sai, com o nome, o mês e a
   * contagem de encontros.
   *
   * O agrupamento por disciplina não vem do temasDoMes, e sim do fechamento.
   * linhas: o temasDoMes já agrupou por título e nesse caminho a disciplina do
   * assunto se perdeu. Assunto sem disciplina é de matemática, que é a mesma
   * convenção do disciplinaDoAssunto do app.js e o que todo registro antigo é.
   */
  function montar(fechamento, opcoes) {
    opcoes = opcoes || {};
    var f = fechamento || {};
    var rotuloDisc = opcoes.rotuloDisciplina || function (c) { return DISCIPLINAS[c] || ''; };

    var nome = txt(f.alunoNome || (f.aluno && f.aluno.nome) || '').trim();
    var mes = txt(f.mesExtenso || f.mes || '').trim();

    /* Um passo por assunto, guardando a disciplina e em quantos dias distintos
     * ele apareceu. O objeto é sem protótipo porque a chave vem de texto que
     * ela pode digitar no campo Outro, e um assunto chamado 'constructor' não
     * pode derrubar a conta. */
    var vistos = Object.create(null);
    var ordem = [];
    var diasPorDisc = Object.create(null);
    var linhas = (f.linhas || []);
    var futuraTinhaTema = false;

    for (var i = 0; i < linhas.length; i++) {
      var l = linhas[i] || {};
      if (l.status === 'cancelada') continue;
      /* Aula marcada à frente não empresta assunto para a lista: o rótulo dela
       * é "O QUE TRABALHAMOS", no passado, e a família não teria como saber que
       * uma das linhas ainda vai acontecer. Registro antigo não tem o campo
       * futura e continua entrando inteiro, como sempre entrou. */
      if (l.futura) {
        if ((l.temas || []).length) futuraTinhaTema = true;
        continue;
      }
      var temas = l.temas || [];
      for (var j = 0; j < temas.length; j++) {
        var t = temas[j] || {};
        var titulo = txt(t.titulo).trim();
        if (!titulo) continue;
        var disc = txt(t.disciplina) || 'matematica';
        var k = disc + '' + chave(titulo);
        if (!vistos[k]) {
          vistos[k] = { titulo: titulo, disciplina: disc, dias: [] };
          ordem.push(vistos[k]);
        }
        if (l.data && vistos[k].dias.indexOf(l.data) < 0) vistos[k].dias.push(l.data);
        if (!diasPorDisc[disc]) diasPorDisc[disc] = [];
        if (l.data && diasPorDisc[disc].indexOf(l.data) < 0) diasPorDisc[disc].push(l.data);
      }
    }

    /* Sem linhas (fechamento vindo de outro caminho, ou aula antiga sem tema
     * detalhado) ainda dá para desenhar: o temasDoMes tem título e datas, só
     * não tem disciplina, e assunto sem disciplina é de matemática.
     *
     * A saída não vale quando a lista ficou vazia porque as aulas com assunto
     * estavam TODAS à frente: o temasDoMes é do mês inteiro e não sabe separar
     * o que aconteceu, então cair nele aqui traria de volta pela porta dos
     * fundos o assunto da aula que ainda não houve. */
    if (!ordem.length && !futuraTinhaTema && (f.temasDoMes || []).length) {
      (f.temasDoMes || []).forEach(function (t) {
        var titulo = txt(t && t.titulo).trim();
        if (!titulo) return;
        var reg = { titulo: titulo, disciplina: 'matematica', dias: (t.datas || []).slice() };
        ordem.push(reg);
        if (!diasPorDisc.matematica) diasPorDisc.matematica = [];
        reg.dias.forEach(function (d) {
          if (diasPorDisc.matematica.indexOf(d) < 0) diasPorDisc.matematica.push(d);
        });
      });
    }

    /* "Mostra os assuntos que mais apareceram": ordem por número de dias, e o
     * alfabeto desempata para o cartão do mesmo mês sair sempre igual. */
    ordem.sort(function (a, b) {
      return b.dias.length - a.dias.length || a.titulo.localeCompare(b.titulo, 'pt-BR', { numeric: true });
    });

    /* Agrupa por disciplina, mantendo as disciplinas na ordem de quem teve mais
     * encontros. A matemática empata para cima porque é o caso comum. */
    var porDisc = Object.create(null), ordemDisc = [];
    ordem.forEach(function (t) {
      if (!porDisc[t.disciplina]) {
        porDisc[t.disciplina] = {
          chave: t.disciplina,
          nome: rotuloDisc(t.disciplina) || DISCIPLINAS[t.disciplina] || '',
          encontros: (diasPorDisc[t.disciplina] || []).length,
          temas: []
        };
        ordemDisc.push(porDisc[t.disciplina]);
      }
      porDisc[t.disciplina].temas.push(t.titulo);
    });
    ordemDisc.sort(function (a, b) {
      return b.encontros - a.encontros || b.temas.length - a.temas.length ||
        a.nome.localeCompare(b.nome, 'pt-BR');
    });

    var areas = (f.areasDoMes || []).map(function (a) {
      return txt(a && a.rotulo).trim();
    }).filter(function (r) { return !!r; });

    var frase = opcoes.frase !== undefined && opcoes.frase !== null
      ? txt(opcoes.frase).trim()
      : (frasesDoResumo(f.resumoTexto)[0] || '');

    /* Última tranca do "dinheiro nenhum": a lista de escolha já não oferece uma
     * frase com valor em reais, mas opcoes.frase entra por fora dela. A frase
     * não é reescrita, ela apenas não é desenhada, e fica dito aqui por quê
     * para a tela poder avisar antes de mandar. */
    var fraseOmitida = '';
    if (frase && temValorEmReais(frase)) {
      fraseOmitida = 'A frase fala de um valor em reais, e o cartão vai para a família.';
      frase = '';
    }

    /* Quantos encontros JÁ aconteceram, que é o número grande do cartão, e
     * quantos estão marcados à frente, que é a segunda linha da legenda.
     *
     * A leitura tolera ausência, em três degraus. Com os campos novos, usa os
     * campos novos. Sem eles mas com linhas que sabem o que é futuro, refaz a
     * conta pelas linhas. Sem nem isso, cai no qtdEncontros de sempre, que é o
     * mês inteiro: num mês vencido, que é quando o fechamento antigo foi feito,
     * o mês inteiro e o que aconteceu são o mesmo número. */
    var contaEncontro = function (l) {
      return !!(l && (l.cobravel || l.status !== 'cancelada'));
    };
    var feitos = f.qtdEncontrosFeitos;
    var previstos = f.qtdEncontrosPrevistos;
    if (typeof feitos !== 'number') {
      var sabeOFuturo = false;
      for (var q = 0; q < linhas.length; q++) if (linhas[q] && linhas[q].futura) sabeOFuturo = true;
      if (sabeOFuturo) {
        feitos = linhas.filter(function (l) { return contaEncontro(l) && !l.futura; }).length;
        if (typeof previstos !== 'number') {
          previstos = linhas.filter(function (l) { return contaEncontro(l) && l.futura; }).length;
        }
      } else if (typeof f.qtdEncontros === 'number') {
        feitos = f.qtdEncontros;
      } else {
        feitos = linhas.filter(contaEncontro).length;
      }
    }
    if (typeof previstos !== 'number') previstos = 0;

    return {
      nome: nome,
      mes: mes,
      encontrosFeitos: feitos,
      encontrosPrevistos: previstos,
      disciplinas: ordemDisc,
      totalTemas: ordem.length,
      areas: areas,
      frase: frase,
      fraseOmitida: fraseOmitida,
      assinatura: 'Nathália Wajsenzon · Apoio Educacional'
    };
  }

  /* ============================================================ o orçamento
   *
   * O cartão tem tamanho fixo, então quando o mês teve muita coisa alguma coisa
   * tem que sair. A ordem do corte não é arbitrária: corta primeiro o que menos
   * informa a família, e nunca corta calado.
   *
   * O orçamento começa com TUDO e vai tirando de um em um, sempre a coisa que
   * menos informa a família, até caber. O que ficou de fora vira a linha "e
   * mais N assuntos, na lista completa do fechamento", que é a promessa que o
   * documento faz e é o que impede o cartão de mentir por omissão.
   *
   * A ordem do corte, do primeiro ao último:
   *
   *   1) a quarta área e as seguintes. Área é o "além do conteúdo", e da quarta
   *      em diante ela vira lista, não vira retrato.
   *   2) o quarto assunto e os seguintes de cada matéria, tirando sempre da
   *      matéria que está com mais assuntos na tela. Assim três matérias com
   *      quatro assuntos cada perdem um de cada uma, e não quatro de uma só.
   *   3) a terceira área, e só ela: o piso é duas, e o piso existe porque uma
   *      área sozinha embaixo de "além do conteúdo" parece descuido, e não
   *      resumo. Foi o que o mês cheio de três matérias fez quando este piso
   *      não existia, e é a diferença deste desenho para o protótipo aprovado.
   *   4) os assuntos até sobrar um por matéria.
   *   5) a segunda área.
   *   6) as próprias matérias, que viram contagem na linha de sobra. Aqui é o
   *      pior mês possível, com uma dezena de matérias, e o cartão prefere
   *      mostrar poucas por inteiro a mostrar todas pela metade.
   *   7) a seção das áreas inteira, e por último a dos assuntos.
   *
   * O passo 2 é a diferença entre este corte e o de tamanho fixo por matéria:
   * cortar da mais cheia mantém o cartão parecido com o mês que ele descreve.
   *
   * A frase dela NUNCA entra nesta ordem. Ela vem primeiro, inteira, e o que
   * sobra de altura é que vira orçamento da lista: a frase é a única parte do
   * cartão escrita por ela, e cortar palavra dela para caber mais assunto do
   * banco seria trocar o que importa pelo que enche.
   *
   * Os dois tetos existem para o pior caso não virar um laço longo: nenhum mês
   * mostra mais de dez assuntos por matéria nem mais de oito áreas, porque
   * nesse tamanho já não cabe de qualquer jeito. */
  var TETO_TEMAS = 10;
  var TETO_AREAS = 8;
  var AREAS_CONFORTO = 3;         // daqui para cima, área é a primeira a sair
  var AREAS_PISO = 2;             // e daqui para baixo ela é a última
  var TEMAS_CONFORTO = 3;

  var H = {
    disciplina: 32,
    tema: 33,
    espaco: 6,
    resto: 30,
    titulo: 46,
    area: 32,
    restoArea: 26
  };

  /* Monta a lista de linhas para um orçamento dado. O orçamento é
   * { d: quantas matérias aparecem com nome, t: [teto de assuntos de cada
   * matéria], a: quantas áreas }. Devolve também quantos assuntos e quantas
   * áreas ficaram de fora, porque é isso que a linha "e mais N" precisa dizer. */
  function listaCom(dados, orc) {
    var L = [];
    var foraTema = 0, foraArea = 0;
    var umaSo = dados.disciplinas.length === 1;

    dados.disciplinas.forEach(function (d, i) {
      var teto = orc.t[i] || 0;
      if (i >= orc.d) { foraTema += d.temas.length; return; }
      /* Com uma disciplina só, o nome dela não vira título: o cartão do mês
       * simples é uma lista de assuntos e ponto. É assim nos dois protótipos. */
      if (!umaSo && d.nome) {
        L.push({
          tipo: 'disciplina', texto: d.nome,
          extra: d.encontros + (d.encontros === 1 ? ' encontro' : ' encontros'),
          h: H.disciplina
        });
      }
      d.temas.forEach(function (t, k) {
        if (k < teto) L.push({ tipo: 'tema', texto: t, h: H.tema, recuado: !umaSo });
        else foraTema++;
      });
      if (!umaSo) L.push({ tipo: 'espaco', h: H.espaco });
    });

    if (foraTema) {
      L.push({
        tipo: 'resto', h: H.resto,
        texto: 'e mais ' + foraTema + (foraTema === 1 ? ' assunto' : ' assuntos') +
          ', na lista completa do fechamento'
      });
    }

    if (orc.a > 0 && dados.areas.length) {
      L.push({ tipo: 'titulo', texto: 'ALÉM DO CONTEÚDO', h: H.titulo });
      dados.areas.forEach(function (r, i) {
        if (i < orc.a) L.push({ tipo: 'area', texto: r, h: H.area });
        else foraArea++;
      });
      if (foraArea) {
        L.push({
          tipo: 'resto', h: H.restoArea,
          texto: 'e mais ' + foraArea + (foraArea === 1 ? ' área' : ' áreas')
        });
      }
    } else if (dados.areas.length) {
      foraArea = dados.areas.length;
    }

    return { linhas: L, foraTema: foraTema, foraArea: foraArea };
  }

  function alturaDe(L) {
    var t = 0;
    for (var i = 0; i < L.length; i++) t += L[i].h;
    return t;
  }

  /* Qual matéria está com mais assuntos na tela, para o corte tirar dela. O
   * empate vai para a última, porque as matérias já vêm ordenadas por número de
   * encontros e a de menos encontros é a que menos custa encurtar. */
  function maisCheia(capsT) {
    var alvo = -1, maior = 0;
    for (var i = 0; i < capsT.length; i++) if (capsT[i] >= maior) { maior = capsT[i]; alvo = i; }
    return maior > 0 ? alvo : -1;
  }

  /* O corte, um passo de cada vez, na ordem escrita lá em cima. Devolve false
   * quando não há mais nada para tirar. */
  function cortarUm(orc) {
    var i = maisCheia(orc.t);
    if (orc.a > AREAS_CONFORTO) { orc.a--; return true; }
    if (i >= 0 && orc.t[i] > TEMAS_CONFORTO) { orc.t[i]--; return true; }
    if (orc.a > AREAS_PISO) { orc.a--; return true; }
    if (i >= 0 && orc.t[i] > 1) { orc.t[i]--; return true; }
    if (orc.a > 1) { orc.a--; return true; }
    if (orc.d > 1) { orc.d--; return true; }
    if (orc.a > 0) { orc.a = 0; return true; }
    if (i >= 0) { orc.t[i] = 0; return true; }
    return false;
  }

  /* ============================================================ oQueCabe
   *
   *   Cartao.oQueCabe(dados, disponivel) -> {linhas, foraTema, foraArea, orcamento}
   *
   * Começa com tudo e corta até caber na altura disponível. Separado do
   * planejar para poder ser medido sozinho: o que acontece com 1, 5, 12 e 40
   * assuntos é uma pergunta sobre esta função e não sobre o desenho.
   *
   * O laço tem teto de passos porque ele roda com dado que vem do banco dela e
   * um laço infinito num tablet offline é uma tela branca sem explicação. O
   * teto é generoso e o cortarUm já devolve false quando esgota. */
  function oQueCabe(dados, disponivel) {
    var orc = {
      d: dados.disciplinas.length,
      a: Math.min(TETO_AREAS, dados.areas.length),
      t: dados.disciplinas.map(function (d) { return Math.min(TETO_TEMAS, d.temas.length); })
    };
    var passos = 0, teto = 400;
    var atual = listaCom(dados, orc);
    while (alturaDe(atual.linhas) > disponivel && passos++ < teto) {
      if (!cortarUm(orc)) break;
      atual = listaCom(dados, orc);
    }
    atual.orcamento = { d: orc.d, a: orc.a, t: orc.t.slice() };
    return atual;
  }

  /* ============================================================ quebrar
   *
   * Quebra por palavra, medindo de verdade. Quando uma palavra sozinha não cabe
   * na largura (endereço colado, nome químico), ela sai na linha dela mesmo
   * estourando, porque partir palavra no meio é pior de ler do que uma linha
   * um pouco mais larga, e nenhuma palavra do vocabulário dela chega perto
   * disso na largura de 828 px. */
  function quebrar(medir, texto, largura, tam, peso, familia, italico) {
    var palavras = txt(texto).split(/\s+/).filter(function (p) { return !!p; });
    var linhas = [], atual = '';
    for (var i = 0; i < palavras.length; i++) {
      var tenta = atual ? atual + ' ' + palavras[i] : palavras[i];
      if (atual && medir(tenta, tam, peso, familia, italico) > largura) {
        linhas.push(atual);
        atual = palavras[i];
      } else atual = tenta;
    }
    if (atual) linhas.push(atual);
    return linhas;
  }

  /* Encurta um texto de UMA linha até caber, com reticências.
   *
   * Só é usado em título de assunto vindo do banco de temas, nunca na frase
   * dela: o que ela escreveu não pode mudar de sentido nem sumir, e a lista
   * completa dos assuntos continua saindo inteira no PDF do fechamento. */
  function encurtar(medir, texto, largura, tam, peso, familia) {
    var s = txt(texto);
    if (medir(s, tam, peso, familia) <= largura) return s;
    var corte = s.length;
    while (corte > 1 && medir(s.slice(0, corte) + '...', tam, peso, familia) > largura) corte--;
    var recorte = s.slice(0, corte);
    var espaco = recorte.lastIndexOf(' ');
    if (espaco > corte * 0.5) recorte = recorte.slice(0, espaco);
    return recorte.replace(/[\s,;.]+$/, '') + '...';
  }

  /* ============================================================ planejar
   *
   *   Cartao.planejar(dados, medir) -> plano
   *
   * Onde cada coisa pousa, em pixel, sem tocar em canvas nenhum. Separado do
   * desenho de propósito: assim o arranjo de 1, 5, 12 ou 40 assuntos se
   * confere no Node com uma régua de mentira, sem navegador.
   *
   * medir(texto, tam, peso, familia, italico) -> largura em px.
   */
  function planejar(dados, medir) {
    var plano = { lado: LADO, dados: dados };

    /* ---- a frase dela vem primeiro, e inteira.
     *
     * O tamanho grande é o do protótipo. Ele só encolhe se a frase escolhida
     * for tão longa que a caixa passe do teto, e mesmo encolhida ela sai por
     * completo: a caixa cresce para baixo do topo, comendo espaço da lista. */
    var frase = null;
    if (dados.frase) {
      var tamanhos = [27, 25, 23, 21, 19];
      for (var i = 0; i < tamanhos.length; i++) {
        var tam = tamanhos[i];
        var entre = Math.round(tam * 1.41);
        var ls = quebrar(medir, dados.frase, UTIL - 108, tam, '400', SERIF, true);
        var alt = 46 + ls.length * entre;
        var topo = BASE_FRASE - alt;
        if (topo >= TETO_FRASE || i === tamanhos.length - 1) {
          if (topo < TETO_FRASE) { topo = TETO_FRASE; alt = BASE_FRASE - TETO_FRASE; }
          frase = { linhas: ls, tam: tam, entre: entre, topo: topo, altura: alt };
          break;
        }
      }
    }
    plano.frase = frase;

    /* ---- e a lista se ajusta ao que sobrou. */
    var limite = (frase ? frase.topo - VAO_FRASE : BASE_FRASE);
    var disponivel = limite - TOPO_LISTA;

    var escolhido = oQueCabe(dados, disponivel);

    /* ---- respiro: a sobra vira entrelinha, até o teto, e o resto desce o
     * bloco inteiro. É o que faz o mês de três assuntos parecer o protótipo do
     * mês simples em vez de um bloco espremido no alto. */
    var L = escolhido.linhas;
    var sobra = disponivel - alturaDe(L);
    var expansiveis = 0;
    for (var e = 0; e < L.length; e++) if (L[e].tipo === 'tema' || L[e].tipo === 'area') expansiveis++;
    var respiro = expansiveis ? Math.min(RESPIRO_MAX, Math.floor(sobra / expansiveis)) : 0;
    if (respiro < 0) respiro = 0;
    var tetoDesce = frase ? DESCE_MAX : DESCE_SEM_FRASE;
    var desce = Math.min(tetoDesce, Math.max(0, Math.floor((sobra - respiro * expansiveis) / 2)));

    var y = TOPO_LISTA + desce;
    var postas = [];
    for (var k = 0; k < L.length; k++) {
      var item = {};
      for (var p in L[k]) if (Object.prototype.hasOwnProperty.call(L[k], p)) item[p] = L[k][p];
      item.y = y;
      y += item.h + ((item.tipo === 'tema' || item.tipo === 'area') ? respiro : 0);
      postas.push(item);
    }

    plano.linhas = postas;
    plano.mostraOlho = postas.length > 0;
    /* A linha "O QUE TRABALHAMOS" desce junto com a lista. Presa em 402 ela
     * ficava colada na caixa da contagem, que termina em 376, e ao mesmo tempo
     * longe do primeiro assunto: o olho lia o rótulo como parte da caixa de
     * cima. Ela pertence à lista, então anda com ela. */
    plano.yOlho = Y_OLHO + desce;
    plano.foraTema = escolhido.foraTema;
    plano.foraArea = escolhido.foraArea;
    plano.limiteLista = limite;
    plano.fundoLista = y;
    plano.respiro = respiro;
    plano.orcamento = escolhido.orcamento;

    /* ---- a pílula dos encontros.
     *
     * O número grande é o que JÁ aconteceu. O que está marcado à frente vira a
     * segunda linha, com todas as letras: sumir com ele seria o mesmo erro ao
     * contrário, o cartão calando o que a família vê na agenda. Num mês vencido
     * não há nada à frente e a pílula volta a ser a de sempre, de uma linha só.
     *
     * A legenda diz o número de disciplinas só quando há mais de uma, porque no
     * caso comum a informação seria ruído. */
    var n = dados.encontrosFeitos;
    if (typeof n !== 'number') n = 0;
    var previstos = dados.encontrosPrevistos || 0;

    var legenda = previstos
      ? (n === 1 ? 'encontro até aqui' : 'encontros até aqui')
      : (n === 1 ? 'encontro no mês' : 'encontros no mês');
    if (dados.disciplinas.length > 1) {
      legenda += ', em ' + porExtenso(dados.disciplinas.length) + ' disciplinas';
    }
    var legenda2 = previstos
      ? 'mais ' + previstos + (previstos === 1 ? ' marcado à frente' : ' marcados à frente')
      : '';

    /* A legenda é medida, e não chutada: com duas linhas ela ganhou palavra e a
     * largura que sobra ao lado do número grande é a mesma de antes. Encolhe
     * até caber, e o piso de 16 px existe para nunca virar letra ilegível numa
     * imagem que se vê encolhida na conversa. */
    var numero = String(n);
    var xLegenda = MARG + 34 + medir(numero, 44, '600', SERIF) + 60;
    var largLegenda = DIR - xLegenda;
    var tamLegenda = legenda2 ? 22 : 24;
    while (tamLegenda > 16 &&
      (medir(legenda, tamLegenda, '400', SERIF) > largLegenda ||
        (legenda2 && medir(legenda2, tamLegenda, '400', SERIF) > largLegenda))) {
      tamLegenda -= 1;
    }

    plano.pilula = {
      numero: numero,
      legenda: legenda,
      legenda2: legenda2,
      tam: tamLegenda,
      x: xLegenda,
      largura: largLegenda,
      /* Uma linha fica no meio da pílula; duas se repartem dentro dos mesmos
       * 80 px de altura, sem encostar na borda de cima nem na de baixo. */
      y: PILULA_Y + (legenda2 ? 34 : 52),
      y2: legenda2 ? PILULA_Y + 64 : 0
    };

    return plano;
  }

  /* ============================================================ desenho */

  function caminhoArredondado(ctx, x, y, l, a, r) {
    r = Math.min(r, l / 2, a / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + l, y, x + l, y + a, r);
    ctx.arcTo(x + l, y + a, x, y + a, r);
    ctx.arcTo(x, y + a, x, y, r);
    ctx.arcTo(x, y, x + l, y, r);
    ctx.closePath();
  }

  function bolinha(ctx, cx, cy, r, cor) {
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Texto com espaçamento entre letras, desenhado letra a letra porque o
   * letterSpacing do canvas é recente demais para ser exigido de um tablet.
   * Devolve a largura total, que é o que o alinhamento à direita precisa. */
  function comEspacamento(ctx, texto, x, y, folga, desenhar) {
    var s = txt(texto), larg = 0, cx = x;
    for (var i = 0; i < s.length; i++) {
      var w = ctx.measureText(s[i]).width;
      if (desenhar) ctx.fillText(s[i], cx, y);
      cx += w + folga;
      larg += w + folga;
    }
    return larg > 0 ? larg - folga : 0;
  }

  /* ============================================================ desenhar
   *
   *   Cartao.desenhar(canvas, fechamento, opcoes) -> plano
   *
   * Recebe o canvas (ou um contexto 2D, para quem já tiver um), põe 1080 por
   * 1080 nele e desenha. Devolve o plano, para quem quiser saber o que ficou de
   * fora sem refazer a conta.
   */
  function desenhar(alvo, fechamento, opcoes) {
    opcoes = opcoes || {};
    var ctx;
    if (alvo && typeof alvo.getContext === 'function') {
      /* O tamanho é do cartão e não do elemento: quem mostra a prévia controla
       * o tamanho na tela por CSS, e o arquivo que a família recebe continua
       * sendo 1080 por 1080. */
      alvo.width = LADO;
      alvo.height = LADO;
      ctx = alvo.getContext('2d');
    } else ctx = alvo;
    if (!ctx) throw new Error('cartao.js: precisa de um canvas ou de um contexto 2D');

    function medir(t, tam, peso, familia, italico) {
      ctx.font = fonte(tam, peso, familia, italico);
      return ctx.measureText(txt(t)).width;
    }

    var dados = opcoes.dados || montar(fechamento, opcoes);
    var plano = planejar(dados, medir);

    if (ctx.textAlign !== undefined) ctx.textAlign = 'left';
    if (ctx.textBaseline !== undefined) ctx.textBaseline = 'alphabetic';

    // ---- fundo
    ctx.fillStyle = COR.ivory;
    ctx.fillRect(0, 0, LADO, LADO);

    // ---- a marca d'água, atrás de tudo e quase invisível
    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.strokeStyle = COR.navy;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(858, 700, 172, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COR.navy;
    ctx.font = fonte(136, '600', SERIF);
    var largNW = ctx.measureText('NW').width;
    ctx.fillText('NW', 858 - largNW / 2, 750);
    ctx.restore();

    // ---- cabeçalho
    ctx.fillStyle = COR.navy;
    ctx.font = fonte(33, '600', SERIF);
    ctx.fillText('Nathália Wajsenzon', MARG, 104);

    ctx.fillStyle = COR.teal;
    ctx.font = fonte(19, '500', SANS);
    var largSelo = comEspacamento(ctx, 'APOIO EDUCACIONAL', 0, 0, 3.2, false);
    comEspacamento(ctx, 'APOIO EDUCACIONAL', DIR - largSelo, 100, 3.2, true);

    ctx.strokeStyle = COR.navy;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(MARG, Y_FIO_CAB);
    ctx.lineTo(DIR, Y_FIO_CAB);
    ctx.stroke();

    // ---- nome e mês
    var tamNome = 68;
    var nome = dados.nome || 'Aluno';
    while (tamNome > 34 && medir(nome, tamNome, '600', SERIF) > UTIL) tamNome -= 2;
    if (medir(nome, tamNome, '600', SERIF) > UTIL) nome = nome.split(/\s+/)[0];
    ctx.fillStyle = COR.navy;
    ctx.font = fonte(tamNome, '600', SERIF);
    ctx.fillText(nome, MARG, Y_NOME);

    ctx.fillStyle = COR.teal;
    ctx.font = fonte(23, '500', SANS);
    comEspacamento(ctx, (dados.mes || '').toUpperCase(), MARG, Y_MES, 2.4, true);

    // ---- a pílula dos encontros
    ctx.fillStyle = COR.branco;
    ctx.strokeStyle = COR.fio;
    ctx.lineWidth = 2;
    caminhoArredondado(ctx, MARG, PILULA_Y, UTIL, PILULA_H, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COR.teal;
    caminhoArredondado(ctx, MARG, PILULA_Y, 6, PILULA_H, 3);
    ctx.fill();

    ctx.fillStyle = COR.navy;
    ctx.font = fonte(44, '600', SERIF);
    ctx.fillText(plano.pilula.numero, MARG + 34, PILULA_Y + 54);
    ctx.fillStyle = COR.muted;
    ctx.font = fonte(plano.pilula.tam, '400', SERIF);
    ctx.fillText(plano.pilula.legenda, plano.pilula.x, plano.pilula.y);
    if (plano.pilula.legenda2) {
      ctx.fillText(plano.pilula.legenda2, plano.pilula.x, plano.pilula.y2);
    }

    // ---- a lista
    function olho(texto, y) {
      ctx.fillStyle = COR.teal;
      ctx.font = fonte(19, '600', SANS);
      comEspacamento(ctx, texto, MARG, y, 2.8, true);
    }
    if (plano.mostraOlho) olho('O QUE TRABALHAMOS', plano.yOlho);

    plano.linhas.forEach(function (l) {
      if (l.tipo === 'disciplina') {
        ctx.fillStyle = COR.navy;
        ctx.font = fonte(25, '600', SERIF);
        ctx.fillText(l.texto, MARG, l.y);
        var w = ctx.measureText(l.texto).width;
        ctx.fillStyle = COR.muted;
        ctx.font = fonte(19, '400', SANS);
        ctx.fillText(l.extra, MARG + w + 16, l.y - 1);
      } else if (l.tipo === 'tema') {
        var xb = l.recuado ? MARG + 20 : MARG + 12;
        var xt = xb + 22;
        bolinha(ctx, xb, l.y - 8, 5, COR.gold);
        ctx.fillStyle = COR.texto;
        ctx.font = fonte(27, '400', SERIF);
        ctx.fillText(encurtar(medir, l.texto, DIR - xt, 27, '400', SERIF), xt, l.y);
      } else if (l.tipo === 'area') {
        bolinha(ctx, MARG + 12, l.y - 8, 5, COR.teal);
        ctx.fillStyle = COR.texto;
        ctx.font = fonte(26, '400', SERIF);
        ctx.fillText(encurtar(medir, l.texto, DIR - (MARG + 38), 26, '400', SERIF), MARG + 38, l.y);
      } else if (l.tipo === 'resto') {
        ctx.fillStyle = COR.muted;
        ctx.font = fonte(21, '400', SERIF);
        ctx.fillText(l.texto, MARG, l.y - 4);
      } else if (l.tipo === 'titulo') {
        olho(l.texto, l.y + 10);
      }
    });

    // ---- a frase dela
    if (plano.frase) {
      ctx.fillStyle = COR.branco;
      ctx.strokeStyle = COR.fio;
      ctx.lineWidth = 2;
      caminhoArredondado(ctx, MARG, plano.frase.topo, UTIL, plano.frase.altura, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = COR.gold;
      caminhoArredondado(ctx, MARG, plano.frase.topo, 6, plano.frase.altura, 3);
      ctx.fill();

      ctx.fillStyle = COR.navy;
      ctx.font = fonte(plano.frase.tam, '400', SERIF, true);
      var ly = plano.frase.topo + Math.round(plano.frase.tam * 1.85);
      plano.frase.linhas.forEach(function (linha) {
        ctx.fillText(linha, MARG + 38, ly);
        ly += plano.frase.entre;
      });
    }

    // ---- rodapé
    ctx.strokeStyle = COR.fio;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARG, Y_FIO_ROD);
    ctx.lineTo(DIR, Y_FIO_ROD);
    ctx.stroke();
    ctx.fillStyle = COR.muted;
    ctx.font = fonte(20, '400', SANS);
    ctx.fillText(dados.assinatura, MARG, 1034);

    return plano;
  }

  return {
    LADO: LADO,
    COR: COR,
    SERIF: SERIF,
    SANS: SANS,
    DISCIPLINAS: DISCIPLINAS,
    oQueCabe: oQueCabe,
    frasesDoResumo: frasesDoResumo,
    temValorEmReais: temValorEmReais,
    montar: montar,
    planejar: planejar,
    quebrar: quebrar,
    encurtar: encurtar,
    desenhar: desenhar
  };
});
