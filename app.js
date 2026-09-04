/* app.js
 * Interface do controle de aulas do Apoio Educacional.
 */
(function () {
  'use strict';

  var VERSAO = '1.13.0';

  var db = null;
  var mesAtual = Core.mesDe(Core.hojeIso());
  var editorAtual = null;
  var aulaEmEdicao = null;
  var alunoEmEdicao = null;
  /* Redesenha o resumo de etapas do alto da aba Dados. Quem marca a etapa é o
   * quadro da aba Mapeamento, e ele avisa aqui para as duas abas nunca
   * mostrarem etapas diferentes do mesmo aluno. */
  var resumoEtapas = null;
  var midiasCarregadas = {};
  var tempoAviso = null;

  /* O que mudou em cada versão, para ela não descobrir por acaso.
   * Escrito para quem usa, não para quem programa: cada item diz o que ela
   * ganha, e onde encontrar. */
  var NOVIDADES = [
    {
      versao: '1.13.0',
      itens: [
        'O dinheiro do mês passou a mostrar o que já aconteceu. Antes, no dia primeiro, a ' +
          'tela já somava o mês inteiro como se todas as aulas tivessem sido dadas. Agora o ' +
          'número grande é o que foi feito até hoje, e o que está marcado à frente aparece ' +
          'embaixo, menor. Você não precisa confirmar aula por aula: o aplicativo olha a data ' +
          'sozinho.',
        'O cartão do mês. No fechamento, um botão novo transforma o mesmo mês numa imagem ' +
          'quadrada, que aparece dentro da conversa do WhatsApp em vez de virar um arquivo para ' +
          'baixar. Você escolhe a frase, que sai do feedback que já escreveu, e vê exatamente a ' +
          'imagem antes de mandar. Não vai valor nenhum no cartão.',
        'A tela para abrir na frente da família. O mês inteiro de um aluno numa tela só, em ' +
          'dois modos: um com tudo, para você escrever o fechamento sem abrir aula por aula, e ' +
          'outro sem valores, sem as suas anotações e sem nenhum outro aluno, para virar o ' +
          'tablet e mostrar.',
        'A janela da aula mudou de ordem. A primeira coisa que você vê é o que aconteceu no ' +
          'último encontro com aquele aluno, para não precisar procurar no calendário. E a ' +
          'anotação virou duas: o que rendeu hoje, que entra no fechamento, e só minha, que não ' +
          'sai em lugar nenhum. O que você já tinha escrito continua sendo a primeira.',
        'O mapeamento agora sabe que nem toda matéria é matemática. A parte que é sobre o ' +
          'aluno, como a rotina de estudo e o jeito de aprender, você responde uma vez só. A ' +
          'parte que é sobre a matéria se repete por matéria. E a lista de lacunas de anos ' +
          'anteriores só aparece em matemática, que é onde ela é verdade.',
        'Em que etapa o aluno está. As quatro que você já usa, apoio total, apoio parcial, ' +
          'supervisão e autonomia, marcadas em três frentes: conteúdo, autonomia e confiança, ' +
          'cada uma com a data em que mudou. Ela fica parada na ficha, não pergunta nada em ' +
          'aula nenhuma, e você toca em mudou de etapa quando perceber.',
        'Para onde o aluno está indo. Um bloco de objetivo no mapeamento, com a data da prova ' +
          'quando houver, e a aula passa a mostrar quantas semanas faltam. O ano escolar também ' +
          'deixou de ser uma lista fechada: agora aceita cursinho e aluno fora da escola.',
        'Cada aluno, desde quando e por quanto. Uma lista só sua, com desde quando cada um ' +
          'estuda com você, quanto paga, há quanto tempo está nesse valor e quanto representa ' +
          'do seu mês, com uma sugestão de reajuste ao lado. O número é sugestão e o campo é ' +
          'seu.',
        'O que você deu e não cobrou. Duas linhas discretas somando as horas que você deu de ' +
          'graça no mês e as que ficaram reservadas e foram desmarcadas. É número para você, e ' +
          'não vai para a família.'
      ]
    },
    {
      versao: '1.12.0',
      itens: [
        'A lacuna virou trilha. No mapeamento do aluno, o botãozinho ao lado de cada lacuna de ' +
          'ano anterior deixou de ser "temas" e passou a ser "trilha": ele monta a sequência de ' +
          'assuntos que precisa vir antes daquele em que o aluno travou, na ordem, e diz quantos ' +
          'encontros deve levar. Antes o botão abria dezoito temas em ordem de relevância, ' +
          'começando pelo 8º ano e pulando para o 4º, e a ordem ficava por sua conta.',
        'Antes de montar, você confirma onde ele precisa chegar: a tela mostra os fins possíveis ' +
          'daquela lacuna, cada um com o ano, já com o mais provável sugerido. É um toque por ' +
          'trilha, e não por aula. Sem ele, uma lacuna de Funções num aluno do 2º ano do médio ' +
          'podia virar uma trilha de matrizes.',
        'A proposta é sua para mexer: cada passo tem seta para subir, seta para descer e Tirar, ' +
          'e no pé tem Acrescentar passo. Nada de arrastar, que é o gesto que falha na tela ' +
          'grande. O assunto que você já deu para esse aluno nasce riscado, com a data, e volta ' +
          'para a fila com um toque.',
        'Quando a trilha começa mais perto do objetivo do que você gostaria, a tela diz isso com ' +
          'todas as letras e oferece Puxar mais de trás, um assunto por vez. E quando o assunto ' +
          'não depende de nenhum outro, ela também diz: não há escada, dá para atacar direto.',
        'Na aula, o próximo passo aparece em cima do assunto, num botão grande. Um toque registra ' +
          'o assunto da aula e marca o passo como dado, com a data daquela aula: é o mesmo toque ' +
          'que você já dava, e a trilha anda sozinha. Nenhuma pergunta nova no fim da aula. Se ' +
          'depois você mudar a aula para cancelada ou falta, o passo volta para a fila.',
        'Na ficha do aluno, na aba Mapeamento, ficam as trilhas: as ativas com os passos em ' +
          'ordem e a data de cada um, com caixa de marcar para consertar à mão, e as encerradas ' +
          'com as datas. Dá para encerrar antes do fim, com um motivo se quiser, e criar uma ' +
          'trilha do zero escolhendo o assunto direto no banco. Trilha encerrada não some: é a ' +
          'prova do trabalho.',
        'O caminho antigo continua onde estava: dentro da trilha há "Ver os temas soltos", que ' +
          'abre exatamente a mesma lista de temas de antes.'
      ]
    },
    {
      versao: '1.11.1',
      itens: [
        'O documento que a família recebe voltou a ser o que era: a tabela de aulas, o total ' +
          'e o seu feedback. As listas de temas e de áreas trabalhadas ficam de fora até você ' +
          'marcar a caixa Exibir os temas e as áreas trabalhadas, que fica logo acima dos ' +
          'botões de exportar. Marque quando o registro estiver do jeito que você quer; o ' +
          'aplicativo lembra.'
      ]
    },
    {
      versao: '1.11.0',
      itens: [
        'O assunto da aula aparece agora assim que você abre a aula, logo abaixo de ' +
          'Conteúdo da aula. Antes ele ficava guardado dentro do botão de material e só ' +
          'existia quando saía um PDF. Agora é ao contrário: primeiro você registra o que ' +
          'foi trabalhado, e é isso que entra no fechamento que a família lê.',
        'Registrar o assunto não obriga mais a gerar material. Você escolhe, ele fica ' +
          'gravado na hora, sem passar pelo Salvar, e a folha pronta continua a um toque: ' +
          'quando o assunto tem material no banco, aparece um botão na linha dele.',
        'As outras doze matérias entraram, com 2.513 assuntos ao todo: português, redação, ' +
          'inglês, ciências, história, geografia, física, química, biologia, literatura, ' +
          'filosofia e sociologia e método de estudo. Dá para procurar em todas de uma vez ' +
          'no campo de cima, ou abrir matéria por matéria. E escrever o assunto com as suas ' +
          'palavras continua sendo a primeira linha da tela, para o dia em que o banco não ' +
          'tiver o que você deu.'
      ]
    },
    {
      versao: '1.10.2',
      itens: [
        'O vão entre o fio do cabeçalho e o título encolheu pela metade em todos os ' +
          'documentos. Você tinha notado no fechamento do mês: eram quase 15 milímetros de ' +
          'papel em branco antes da primeira palavra, contra 7 do material de aula. Agora os ' +
          'quatro documentos têm o mesmo espaço.'
      ]
    },
    {
      versao: '1.10.1',
      itens: [
        'A segunda seção do fechamento deixou de se chamar Resumo do mês e passou a se chamar ' +
          'Feedback, como você pediu. É o mesmo campo, no mesmo lugar, e o que você já escreveu ' +
          'continua lá.'
      ]
    },
    {
      versao: '1.10.0',
      itens: [
        'Mais dois assuntos ganharam figura: o círculo do 8º ano e as cônicas do 3º ano do ' +
          'ensino médio. No círculo, a primeira figura mostra a circunferência desenrolada em ' +
          'cima de uma régua, que é de onde o π aparece: cabem três diâmetros e sobra um ' +
          'pedaço. Nas cônicas, a elipse, a hipérbole e a parábola aparecem com os focos ' +
          'marcados e com os segmentos que a definição de cada uma compara.',
        'Sete exercícios do círculo repetiam os números dos exemplos já resolvidos duas ' +
          'páginas antes, e dava para responder folheando para trás. Ganharam números novos, ' +
          'com a conta refeita no gabarito.',
        'Um exercício de cônicas perguntava no singular e o gabarito respondia com dois ' +
          'pontos, porque a parábola tem mesmo dois pontos àquela distância do foco. O ' +
          'enunciado passou para o plural.',
        'A hachura, que é o risquinho que marca a região que o exercício pede, ficou mais ' +
          'grossa. Na espessura antiga ela sumia na fotocópia, e em seis figuras do círculo é ' +
          'ela que diz qual pedaço está sendo cobrado.'
      ]
    },
    {
      versao: '1.9.0',
      itens: [
        'As folhas de matemática ganharam figuras. Começou pelo assunto de triângulos e ' +
          'quadriláteros do 7º ano: o exercício traz o desenho com o ângulo pedido marcado, os ' +
          'lados iguais com tracinhos e os lados paralelos com setinhas, do jeito que a prova ' +
          'do colégio escreve. As figuras estão em escala: dá para conferir com transferidor.',
        'As fórmulas passaram a sair como fórmula de verdade: fração com o traço no meio, ' +
          'raiz cobrindo o que está dentro, somatório com os limites em cima e embaixo. Antes ' +
          'só expoente e índice tinham esse cuidado.',
        'A figura nunca mais fica sozinha no topo de uma página, longe da frase que a ' +
          'explica: as duas viram a folha juntas.',
        'As linhas das tabelas ficaram mais escuras e um pouco mais grossas, para não sumirem ' +
          'na fotocópia.',
        'A folha em inglês agora numera as páginas em inglês (Page 1 of 3), e nenhuma palavra ' +
          'em português sobra nela.',
        'No assunto de triângulos e quadriláteros, seis exercícios que repetiam os exemplos ' +
          'resolvidos da explicação ganharam números novos, e a legenda do painel de ' +
          'quadriláteros foi corrigida: ela afirmava justamente o erro que o exercício 18 ' +
          'cobra.',
        'Dois consertos de texto no material, valendo para todos os assuntos: um número que ' +
          'começava a linha no meio de uma frase virava item de lista (26 lugares em 20 ' +
          'assuntos), e a última palavra de alguns itens caía sozinha na margem (5 assuntos).'
      ]
    },
    {
      versao: '1.8.0',
      itens: [
        'A busca do material de aula ficou muito melhor. Antes, procurar por "equação do ' +
        'primeiro grau" não achava nada, porque no banco o assunto está escrito como ' +
        '"Equações do 1º grau". Agora acha, e digitar mais palavras não atrapalha mais.',
        'Acento e maiúscula deixaram de importar: "fracao" acha o mesmo que "fração".',
        'A busca também procura dentro dos exercícios e da explicação, e não só no nome do ' +
        'assunto. Procurar por "pitágoras" traz o Teorema de Pitágoras e mais quatro assuntos ' +
        'que usam Pitágoras nos exercícios, com uma etiqueta dizendo de onde cada um veio.',
        'Ela entende o nome que o aluno usa. "Bhaskara" acha equação do 2º grau, mesmo essa ' +
        'palavra não estando escrita em lugar nenhum. Vale também para PA, PG, MMC e ' +
        'análise combinatória.',
        'Dá para escrever o ano junto do assunto: "fração 7 ano" deixa só o 7º ano na lista.',
        'Erro de digitação de uma letra é corrigido sozinho, e o aplicativo avisa que corrigiu.',
        'A busca agora atravessa os anos escolares, porque o assunto que trava o aluno costuma ' +
        'ser de um ano atrás. Cada resultado de outro ano vem com o ano marcado.',
        'Quando você procura um assunto que ainda não existe no banco, em vez da tela vazia ' +
        'aparece o que há de mais perto, e o que você digitou fica anotado em Ajustes.',
        'As contas do material passaram a ser escritas com símbolos, e não por extenso. Onde ' +
        'estava "o montante é C vezes (1 mais i) elevado a t" agora está a fórmula de verdade, ' +
        'com o expoente no lugar certo.',
        'Três consertos no PDF: a tabela não escreve mais uma coluna por cima da outra, o ' +
        'subtítulo não fica mais sozinho no pé da página longe do seu conteúdo, e a folga ' +
        'entre o cabeçalho e o título diminuiu.'
      ]
    },
    {
      versao: '1.7.0',
      itens: [
        'A ficha do aluno ganhou a aba Mapeamento: pontos fortes, pontos de atenção, lacunas ' +
        'de anos anteriores, rotina de estudo e como ele aprende melhor. Vale para qualquer ' +
        'aluno, não só para os novos: nunca é tarde para mapear.',
        'Ao cadastrar um aluno novo, dá para já agendar o encontro de mapeamento. Esse encontro ' +
        'abre com um roteiro sugerido e com a ficha para preencher na hora.',
        'Aluno mapeado passa a mostrar, ao abrir qualquer aula dele, um lembrete com as ' +
        'prioridades, as lacunas e os pontos de atenção. Dá para copiar esse lembrete para a ' +
        'anotação da aula com um toque.',
        'Cada lacuna marcada leva direto aos temas do banco que tratam daquele assunto.',
        'O mapeamento pode ser refeito quantas vezes você quiser. O anterior fica guardado com ' +
        'a data, para você ver o que mudou de um semestre para o outro.',
        'A aula recém-criada agora abre sozinha, já com a folha, o material de aula e os anexos ' +
        'à mão.',
        'Se você marcar duas aulas no mesmo horário, o aplicativo avisa. Não impede: só avisa.',
        'O fechamento do mês mostra o ano escolar e o colégio do aluno, e a aula não cobrada ' +
        'deixou de exibir valor por hora, que só confundia.'
      ]
    },
    {
      versao: '1.6.0',
      itens: [
        'Dentro da aula, o botão "Material de aula" abre um banco com 146 temas de matemática, ' +
        'do 2º ano do fundamental ao 3º do médio, em português ou em inglês.',
        'Cada tema traz explicação, lista de exercícios e gabarito. Você escolhe o que entra, ' +
        'e monta a lista marcando e desmarcando questão por questão. O material sai em PDF ' +
        'anexado àquela aula.',
        'A folha em branco continua como sempre foi: o tema é um atalho, para quando quiser, ' +
        'e nunca substitui o seu planejamento.',
        'Uma mesma aula pode receber vários temas: uma revisão de prova continua sendo um ' +
        'encontro só, e o fechamento do mês lista os assuntos trabalhados. Se precisar, ' +
        'ainda dá para dividir uma aula em duas metades no mesmo dia.',
        'A aula agora tem uma lista de áreas trabalhadas, de organização e método a postura ' +
        'e emocional, e o que você marcar aparece no fechamento do mês.'
      ]
    },
    {
      versao: '1.5.0',
      itens: [
        'A ficha do aluno virou uma janela com três abas: Dados, Valores e Histórico.',
        'A aba Histórico mostra as últimas aulas daquele aluno, com a anotação de cada uma, ' +
        'sem precisar abrir o calendário e procurar uma por uma.',
        'Na aba Dados dá para registrar desde quando o aluno estuda com você, e guardar ' +
        'observações pedagógicas separadas das observações gerais.',
        'Esta janela de novidades, que aparece sozinha quando o aplicativo é atualizado.'
      ]
    },
    {
      versao: '1.4.0',
      itens: [
        'O botão redondo no alto da tela esconde todos os valores em dinheiro. ' +
        'Serve para quando o tablet está aberto na casa da família.',
        'O PDF e o texto do fechamento continuam saindo com os valores normalmente.'
      ]
    },
    {
      versao: '1.3.0',
      itens: [
        'A versão nova do aplicativo passa a chegar já na primeira vez que você abre com internet.'
      ]
    },
    {
      versao: '1.2.0',
      itens: [
        'O aplicativo avisa quando passam catorze dias sem cópia de segurança, ' +
        'com um botão para salvar na hora.'
      ]
    },
    {
      versao: '1.1.0',
      itens: [
        'A folha de aula não trava mais ao alternar entre a caneta e o texto.',
        'O texto na folha passou a ter um painel próprio, com várias linhas e tamanho de letra.',
        'Dá para anexar PDF, inclusive aula exportada do Samsung Notes.',
        'Novo botão Repetir para trás, para registrar aulas que já aconteceram antes do cadastro.'
      ]
    }
  ];

  function compararVersao(a, b) {
    var pa = String(a || '0').split('.').map(Number);
    var pb = String(b || '0').split('.').map(Number);
    for (var i = 0; i < 3; i++) {
      var x = pa[i] || 0, y = pb[i] || 0;
      if (x !== y) return x - y;
    }
    return 0;
  }

  /* Mostra o que mudou desde a última versão que ela viu.
   * Quem abre o aplicativo pela primeira vez não recebe nada: não faz sentido
   * contar novidades para quem nunca viu o que veio antes. */
  function mostrarNovidades() {
    db.ajustes = db.ajustes || {};
    var vista = db.ajustes.versaoVista;
    if (vista === VERSAO) return;

    var primeiraVez = !vista && !db.aulas.length;
    var novas;
    if (vista) {
      novas = NOVIDADES.filter(function (n) { return compararVersao(n.versao, vista) > 0; });
    } else {
      /* Quem nunca viu a janela nao tem versao de referencia, entao o recorte e por
       * quantidade. Era "as duas ultimas versoes", e isso encolheu junto com o
       * ritmo: duas correcoes seguidas de um item cada abriam a janela com dois
       * marcadores, que nao paga o incomodo de interromper quem abriu o aplicativo
       * para dar aula. Agora junta versoes ate somar tres itens, e para em quatro
       * versoes para nao virar historico. */
      novas = [];
      var itens = 0;
      for (var i = 0; i < NOVIDADES.length && novas.length < 4; i++) {
        novas.push(NOVIDADES[i]);
        itens += (NOVIDADES[i].itens || []).length;
        if (itens >= 3) break;
      }
    }

    if (primeiraVez || !novas.length) {
      db.ajustes.versaoVista = VERSAO;
      salvar();
      return;
    }

    var corpo = $('#corpo-modal-novidades');
    corpo.innerHTML = '';
    corpo.appendChild(el('p', {
      class: 'ajuda', style: 'margin-top:0',
      texto: 'Você está agora na versão ' + VERSAO + '. Nada do que você já tinha foi alterado.'
    }));
    novas.forEach(function (n) {
      var caixa = el('div', { class: 'cartao compacto' });
      caixa.appendChild(el('div', {
        class: 'tag serie', texto: 'versão ' + n.versao, style: 'margin-bottom:8px'
      }));
      var ul = el('ul', { class: 'lista-novidades' });
      n.itens.forEach(function (t) { ul.appendChild(el('li', { texto: t })); });
      caixa.appendChild(ul);
      corpo.appendChild(caixa);
    });

    $('#entendi-novidades').onclick = function () {
      db.ajustes.versaoVista = VERSAO;
      fecharModal('modal-novidades');
      salvar();
    };
    abrirModal('modal-novidades');
  }

  var CORES_ALUNO = ['#2E7D6B', '#1F3A5F', '#C9A961', '#7A5EA6', '#B4453C',
    '#2F7DA3', '#8A6D2F', '#4A7C3F', '#A64B7E', '#3F6F8C'];

  // ================= utilidades de tela =================

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function el(tag, atributos, filhos) {
    var e = document.createElement(tag);
    if (atributos) {
      Object.keys(atributos).forEach(function (k) {
        if (k === 'class') e.className = atributos[k];
        else if (k === 'texto') e.textContent = atributos[k];
        else if (k === 'html') e.innerHTML = atributos[k];
        else if (k.indexOf('ao') === 0 && typeof atributos[k] === 'function') {
          e.addEventListener(k.slice(2).toLowerCase(), atributos[k]);
        } else if (atributos[k] !== null && atributos[k] !== undefined && atributos[k] !== false) {
          e.setAttribute(k, atributos[k]);
        }
      });
    }
    (filhos || []).forEach(function (f) {
      if (f === null || f === undefined) return;
      e.appendChild(typeof f === 'string' ? document.createTextNode(f) : f);
    });
    return e;
  }

  /* Os enunciados do banco escrevem expoente e indice como x^{2} e a_{1}, que
   * e a marcacao que o gerador de PDF entende. Na tela isso apareceria cru, e
   * ela leria "Calcule 2^{5}" em vez de "Calcule 2 elevado a 5". Aqui a mesma
   * marcacao vira sobrescrito e subscrito de verdade, que o navegador desenha
   * melhor do que o PDF. */
  function comNotacao(texto) {
    var partes = [];
    var resto = String(texto == null ? '' : texto);
    var re = /([\^_])\{([^}]*)\}/;
    var m;
    while ((m = re.exec(resto))) {
      if (m.index) partes.push(document.createTextNode(resto.slice(0, m.index)));
      partes.push(el(m[1] === '^' ? 'sup' : 'sub', { texto: m[2] }));
      resto = resto.slice(m.index + m[0].length);
    }
    if (resto) partes.push(document.createTextNode(resto));
    return partes;
  }

  /* Janela sobre janela.
   *
   * Todos os fundos nascem no mesmo nível no styles.css, então quem pinta por
   * cima é o último do documento, e não o último a abrir. Isso já deixava o
   * seletor de temas atrás do mapeamento, e ia piorar com a trilha, que abre o
   * seletor de dentro dela. Aqui cada abertura sobe um degrau e cada fechamento
   * devolve o degrau, então a de cima é sempre a última que ela abriu. */
  var degrauModal = 50;

  function abrirModal(id) {
    var e = $('#' + id);
    if (!e.classList.contains('aberto')) {
      degrauModal += 2;
      e.style.zIndex = String(degrauModal);
    }
    e.classList.add('aberto');
  }

  function fecharModal(id) {
    var e = $('#' + id);
    e.classList.remove('aberto');
    e.style.zIndex = '';
    /* Fechar o mapeamento é DESISTIR dele, venha o toque do Cancelar, do × ou
     * do fundo da janela. A memória volta a ser o que está no disco, senão a
     * ficha continuaria mostrando a lacuna que ela acabou de cancelar. Quem
     * salva de verdade limpa a marca antes de fechar, e aí não há o que voltar. */
    if (id === 'modal-mapeamento') descartarMapeamentoEmEdicao();
    /* A tela do mês fechando por qualquer caminho, inclusive o fecharTudo() do
     * desfazer, tem que devolver o aplicativo inteiro: sem isto o corpo ficaria
     * com a marca do modo da família e a agenda continuaria escondida. */
    if (id === 'modal-mes') encerrarMesNumaTela();
    if (!$$('.fundo-modal.aberto').length) degrauModal = 50;
  }

  function avisar(texto, rotuloAcao, aoAgir) {
    var caixa = $('#aviso');
    $('#aviso-texto').textContent = texto;
    var botao = $('#aviso-acao');
    if (aoAgir) {
      botao.style.display = '';
      botao.textContent = rotuloAcao || 'Desfazer';
      botao.onclick = function () { esconderAviso(); aoAgir(); };
    } else {
      botao.style.display = 'none';
      botao.onclick = null;
    }
    caixa.classList.add('aberto');
    clearTimeout(tempoAviso);
    tempoAviso = setTimeout(esconderAviso, aoAgir ? 9000 : 3600);
  }
  function esconderAviso() { $('#aviso').classList.remove('aberto'); }

  function confirmar(pergunta) { return window.confirm(pergunta); }

  /* Valores na tela.
   *
   * Ela dá aula na casa das famílias, com o tablet aberto em cima da mesa. A
   * agenda mostra quanto ela tem a receber no mês, e isso fica à vista de
   * qualquer pessoa que passe. O botão do olho esconde os valores da interface.
   *
   * Só a tela é afetada. O PDF do fechamento e o arquivo de texto sempre saem
   * com os números, porque é justamente o que a família precisa receber. */
  var valoresOcultos = false;
  var MASCARA = 'R$ ' + '•••••';

  function dinheiro(v) {
    return valoresOcultos ? MASCARA : Core.fmtMoeda(v);
  }

  function alternarValores() {
    valoresOcultos = !valoresOcultos;
    db.ajustes = db.ajustes || {};
    db.ajustes.valoresOcultos = valoresOcultos;
    atualizarBotaoOlho();
    salvar().then(desenharTudo);
  }

  function atualizarBotaoOlho() {
    var b = $('#alternar-valores');
    if (!b) return;
    b.textContent = valoresOcultos ? '●̸' : '◉';
    b.setAttribute('title', valoresOcultos ? 'Mostrar os valores' : 'Esconder os valores');
    b.setAttribute('aria-label', b.getAttribute('title'));
    b.classList.toggle('ativo', valoresOcultos);
  }

  /* Fecha os painéis e solta o que estava sendo editado. Usado quando o estado
   * inteiro é trocado, para nada continuar apontando para registro que sumiu. */
  function fecharTudo() {
    if (editorAtual) { editorAtual.destruir(); editorAtual = null; }
    $$('.fundo-modal').forEach(function (m) { fecharModal(m.id); });
    aulaEmEdicao = null;
    alunoEmEdicao = null;
    /* O painel de trilhas guarda o aluno e a função que o redesenha. Deixá-lo
     * aqui fazia atualizarPainelTrilhas() mandar desenhar num nó que já saiu do
     * documento, apontando para um registro que o estado novo não tem. */
    painelTrilhasAtivo = null;
  }

  // ================= gravação e desfazer =================

  /* O que vai para o disco.
   *
   * O mapeamento aberto para editar é o PRÓPRIO registro guardado no aluno: o
   * objeto de trabalho e o que está no db são o mesmo, de propósito, para que
   * "Ver" um mapeamento antigo e voltar não perca o que ela digitou. O preço
   * disso é que qualquer gravação feita enquanto a janela está aberta levaria
   * junto o que ela ainda não confirmou.
   *
   * Isso deixou de ser teórico quando a lacuna passou a montar trilha: guardar
   * a trilha grava, e ela guardava a trilha DE DENTRO do mapeamento aberto.
   * Medido: marcar a lacuna Pitágoras, montar a trilha de Frações, guardar e
   * depois tocar em Cancelar deixava "fracoes,pitagoras" no disco; e desmarcar
   * Frações e cancelar apagava "fracoes" do disco. O Cancelar mentia nos dois
   * sentidos.
   *
   * A saída escolhida é a primeira das duas: gravar sobre uma cópia do aluno
   * que NÃO carrega o mapeamento em edição, em vez de salvar o mapeamento junto
   * e avisar. Salvar junto tornaria permanente, por efeito colateral, uma
   * marcação que ela ainda estava pensando; aqui Cancelar volta a ser verdade,
   * e "Salvar mapeamento" continua sendo o único caminho que grava mapeamento.
   *
   * A cópia é rasa e serve só para esta gravação: o IndexedDB clona o valor por
   * conta própria, então trocar uma referência já basta e nada da memória viva
   * é mexido. Fora do mapeamento aberto, devolve o db como sempre. */
  function dbParaGravar() {
    if (!mapeamentoEmEdicao) return db;
    var i = -1, j = -1;
    (db.alunos || []).forEach(function (a, k) { if (a.id === mapeamentoEmEdicao.alunoId) i = k; });
    if (i < 0) return db;
    var lista = db.alunos[i].mapeamentos || [];
    lista.forEach(function (m, k) { if (m.id === mapeamentoEmEdicao.id) j = k; });
    if (j < 0) return db;

    var mapeamentos = lista.slice();
    mapeamentos[j] = mapeamentoEmEdicao.disco;
    var alunos = db.alunos.slice();
    var copia = {};
    Object.keys(db.alunos[i]).forEach(function (k) { copia[k] = db.alunos[i][k]; });
    copia.mapeamentos = mapeamentos;
    alunos[i] = copia;

    var saida = {};
    Object.keys(db).forEach(function (k) { saida[k] = db[k]; });
    saida.alunos = alunos;
    return saida;
  }

  function salvar() { return Store.salvar(dbParaGravar()); }

  /* Grava um ponto de retorno antes de mexer em várias aulas de uma vez,
   * e depois oferece o desfazer na barra flutuante.
   *
   * O rótulo aceita uma função porque quem chama nem sempre sabe o texto antes
   * de a ação rodar: quantos passos da trilha voltaram para a fila só se sabe
   * depois de mexer nas aulas, e esse número precisa aparecer no MESMO aviso
   * que oferece o Desfazer. */
  function comDesfazer(rotulo, acao) {
    var antes = JSON.parse(JSON.stringify(dbParaGravar()));
    var resultado = acao();
    var texto = (typeof rotulo === 'function') ? rotulo() : rotulo;
    return Store.registrarHistorico(texto, antes).then(function () {
      return salvar();
    }).then(function () {
      avisar(texto, 'Desfazer', function () {
        db = antes;
        // Um painel aberto ainda aponta para o registro antigo, que sai do ar
        // ao voltar o estado. Fecha tudo e limpa as referências.
        mapeamentoEmEdicao = null;
        fecharTudo();
        Store.salvar(db).then(function () {
          desenharTudo();
          avisar('Alteração desfeita.');
        });
      });
      return resultado;
    });
  }

  // ================= arquivos =================

  function entregarArquivo(nome, blob, titulo) {
    try {
      var arquivo = new File([blob], nome, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        navigator.share({ files: [arquivo], title: titulo || nome }).catch(function () { baixar(nome, blob); });
        return;
      }
    } catch (e) { /* sem compartilhamento, cai para o download */ }
    baixar(nome, blob);
  }

  function baixar(nome, blob) {
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: nome });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }

  function bytesDeDataUrl(dataUrl) {
    var base64 = String(dataUrl).split(',')[1] || '';
    var bin = atob(base64);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  /* Converte qualquer imagem para JPEG com fundo branco e tamanho controlado.
   * Fundo branco porque o JPEG não guarda transparência, e é o que entra no PDF. */
  function prepararImagem(arquivo) {
    return new Promise(function (resolve, reject) {
      var leitor = new FileReader();
      leitor.onload = function () {
        var img = new Image();
        img.onload = function () {
          var maxLado = 1600;
          var escala = Math.min(1, maxLado / Math.max(img.width, img.height));
          var l = Math.max(1, Math.round(img.width * escala));
          var a = Math.max(1, Math.round(img.height * escala));
          var c = document.createElement('canvas');
          c.width = l; c.height = a;
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, l, a);
          ctx.drawImage(img, 0, 0, l, a);
          resolve({ dataUrl: c.toDataURL('image/jpeg', 0.86), w: l, h: a });
        };
        img.onerror = function () { reject(new Error('Não foi possível ler a imagem.')); };
        img.src = leitor.result;
      };
      leitor.onerror = function () { reject(leitor.error); };
      leitor.readAsDataURL(arquivo);
    });
  }

  // ================= dados de exemplo =================

  /* Carga inicial, montada só com o que está documentado.
   *
   * Os doze nomes e as horas vêm do fechamento de julho de 2026, que é dado real.
   * O valor por hora NÃO é preenchido, porque não está registrado quem paga
   * R$ 100 e quem paga R$ 150: inventar isso estragaria todos os fechamentos.
   * A única exceção é o Marcelo, cujo valor de R$ 100 por hora está documentado
   * no fechamento de junho (10:30 de aula e R$ 1.050,00).
   *
   * As aulas de junho do Marcelo também são reais, tiradas daquele mesmo
   * fechamento. Nenhuma outra aula é criada: as datas dos demais não existem
   * em lugar nenhum, e chutar datas geraria cobrança errada. */
  var ALUNOS_INICIAIS = [
    { nome: 'Daniel', horasJulho: 11, nota: 'Em julho houve aulas de 1 hora e de 2 horas.' },
    { nome: 'Marcelo', horasJulho: 7, nota: 'Em julho foram 7 encontros de 1 hora.' },
    { nome: 'Guilherme', horasJulho: 5, nota: '' },
    { nome: 'Lucas', horasJulho: 5, nota: '' },
    { nome: 'Cecília', horasJulho: 5, nota: 'Em julho houve aulas de 1 hora e meia.' },
    { nome: 'Mariah', horasJulho: 3, nota: '' },
    { nome: 'Paula', horasJulho: 3, nota: '' },
    { nome: 'Marina', horasJulho: 3, nota: '' },
    { nome: 'Mateus', horasJulho: 2, nota: '' },
    { nome: 'Eduardo', horasJulho: 2, nota: '' },
    { nome: 'Rafael', horasJulho: 1, nota: '' },
    { nome: 'Theo', horasJulho: 1, nota: '' }
  ];

  function cargaInicial() {
    var novo = Store.bancoVazio();
    novo.ajustes.cargaInicial = true;

    var marcelo = null;
    ALUNOS_INICIAIS.forEach(function (base, i) {
      var aluno = {
        id: Core.uid(),
        nome: base.nome,
        responsavel: '',
        cor: CORES_ALUNO[i % CORES_ALUNO.length],
        ativo: true,
        daCargaInicial: true,
        obs: 'Julho de 2026: ' + base.horasJulho + ' hora' + (base.horasJulho === 1 ? '' : 's') +
          ' de aula.' + (base.nota ? ' ' + base.nota : ''),
        precos: []
      };
      if (base.nome === 'Marcelo') {
        // único valor por hora que está documentado
        aluno.precos.push({ id: Core.uid(), inicio: '2026-01-01', fim: null, valorHora: 100 });
        marcelo = aluno;
      }
      novo.alunos.push(aluno);
    });

    // Junho do Marcelo, exatamente como no fechamento que ela já escreveu.
    Core.criarSerie(novo, {
      alunoId: marcelo.id, dias: [1, 3, 5], hora: '15:30', duracaoMin: 60,
      inicio: '2026-06-01', fim: '2026-06-30'
    });

    // No mês real ela não deu aula em 03, 12 e 29.
    ['2026-06-03', '2026-06-12', '2026-06-29'].forEach(function (d) {
      var a = Core.achaAula(novo, marcelo.id, d);
      if (a) Core.excluirAulas(novo, a.id, 'esta');
    });
    // E o encontro do dia 10 foi de uma hora e meia.
    var dez = Core.achaAula(novo, marcelo.id, '2026-06-10');
    if (dez) Core.aplicarEdicaoAula(novo, dez.id, { duracaoMin: 90 }, 'esta');

    novo.resumos.push({
      alunoId: marcelo.id, mes: '2026-06',
      texto: 'Marcelo está se tornando um homenzinho. Muito legal acompanhar o crescimento dele de perto.\n' +
        'Marcelo já consegue identificar o que ele quer fazer e está começando a se posicionar quanto a isso. ' +
        'Vale lembrar, no entanto, que a vida não é feita apenas do que queremos fazer, mas também das coisas ' +
        'que devem ser feitas.\n' +
        'Como combinado, estamos praticando a interpretação de textos e as respostas discursivas mais elaboradas, ' +
        'mas sem deixar de lado o conteúdo e as tarefas de casa.\n' +
        'Marcelo tem se distraído um pouco mais durante as aulas e me cobrou, no nosso último encontro, ' +
        'uma aula mais “legal”. Vou levar umas propostas diferentes para atrair mais a atenção dele.'
    });

    return novo;
  }

  // ================= início =================

  function iniciar() {
    Store.tornarPersistente();
    Store.carregar().then(function (carregado) {
      if (carregado && (carregado.alunos.length || carregado.aulas.length)) {
        db = carregado;
      } else {
        db = cargaInicial();
        mesAtual = '2026-06';
        return Store.salvar(db);
      }
    }).then(function () {
      if (db.alunos.some(function (a) { return a.daCargaInicial; }) && db.aulas.length) {
        // abre já no mês do exemplo, para ela ver algo preenchido
        var temHoje = db.aulas.some(function (a) { return Core.mesDe(a.data) === mesAtual; });
        if (!temHoje) mesAtual = Core.mesDe(db.aulas[0].data);
      }
      valoresOcultos = !!(db.ajustes && db.ajustes.valoresOcultos);
      ligarEventos();
      atualizarBotaoOlho();
      desenharTudo();
      setTimeout(mostrarNovidades, 900);
      registrarServiceWorker();
    }).catch(function (e) {
      document.body.innerHTML = '<div style="padding:32px;font-family:sans-serif">' +
        '<h2>Não foi possível abrir os dados</h2><p>' + String(e && e.message || e) + '</p></div>';
    });
  }

  /* Atualização do aplicativo.
   *
   * Os dados ficam no banco do aparelho, que não é tocado pela atualização:
   * trocar de versão nunca apaga aluno, aula, folha nem anexo. Não existe
   * desinstalar e instalar de novo. */
  var registroSW = null;

  function registrarServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      registroSW = reg;
      if (reg.waiting) mostrarAvisoDeVersao();
      reg.addEventListener('updatefound', function () {
        var novo = reg.installing;
        if (!novo) return;
        novo.addEventListener('statechange', function () {
          if (novo.state === 'installed' && navigator.serviceWorker.controller) mostrarAvisoDeVersao();
        });
      });
      // procura versão nova de tempos em tempos, quando houver internet
      setInterval(function () { reg.update().catch(function () { }); }, 60 * 60 * 1000);
    }).catch(function () { /* segue sem modo offline */ });

    var recarregando = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (recarregando) return;
      recarregando = true;
      location.reload();
    });
  }

  function mostrarAvisoDeVersao() {
    avisar('Há uma versão nova do aplicativo.', 'Atualizar', aplicarAtualizacao);
    desenharAjustes();
  }

  function aplicarAtualizacao() {
    if (registroSW && registroSW.waiting) {
      registroSW.waiting.postMessage({ tipo: 'ativar-agora' });
    } else {
      location.reload();
    }
  }

  function procurarAtualizacao() {
    if (!registroSW) { avisar('Atualização automática não disponível aqui.'); return; }
    avisar('Procurando atualização...');
    registroSW.update().then(function () {
      setTimeout(function () {
        if (registroSW.waiting) mostrarAvisoDeVersao();
        else avisar('Você já está na versão mais recente.');
      }, 1400);
    }).catch(function () {
      avisar('Não foi possível verificar agora. Confira a internet.');
    });
  }

  function desenharTudo() {
    desenharAgenda();
    desenharAlunos();
    desenharFechamento();
    desenharAjustes();
  }

  // ================= navegação =================

  function ligarEventos() {
    $$('#abas .aba').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('#abas .aba').forEach(function (x) { x.classList.remove('ativa'); });
        b.classList.add('ativa');
        $$('.tela').forEach(function (t) { t.classList.remove('ativa'); });
        $('#tela-' + b.dataset.tela).classList.add('ativa');
        $('.conteudo').scrollTop = 0;
        /* Ajustes mostra coisa que muda enquanto ela usa: a data da última
         * cópia, o estado da versão e as buscas que não acharam nada. Sem
         * redesenhar ao abrir, ela via o estado de quando o aplicativo subiu. */
        if (b.dataset.tela === 'ajustes') desenharAjustes();
        /* Os números do IBGE se atualizam sozinhos quando ela abre uma tela que
         * os usa, e nunca na abertura do aplicativo: a hora em que ela abre o
         * aplicativo, na casa de uma família, é a pior hora para disputar a
         * rede. A busca é um extra e não segura tela nenhuma. */
        if (b.dataset.tela === 'fechamento' || b.dataset.tela === 'ajustes') {
          setTimeout(talvezAtualizarIndices, 900);
        }
      });
    });

    $$('[data-fechar]').forEach(function (b) {
      b.addEventListener('click', function () {
        var m = b.closest('.fundo-modal');
        if (m) {
          if (presaNoModoFamilia(m.id)) return;
          if (m.id === 'modal-nota') fecharEditorNota();
          else fecharModal(m.id);
        }
      });
    });

    $$('.fundo-modal').forEach(function (m) {
      m.addEventListener('click', function (e) {
        if (e.target !== m) return;
        if (presaNoModoFamilia(m.id)) return;
        if (m.id === 'modal-nota') fecharEditorNota();
        else fecharModal(m.id);
      });
    });

    $('#mes-anterior').addEventListener('click', function () { irParaMes(Core.mesAdjacente(mesAtual, -1)); });
    $('#mes-seguinte').addEventListener('click', function () { irParaMes(Core.mesAdjacente(mesAtual, 1)); });
    $('#ir-para-hoje').addEventListener('click', function () { irParaMes(Core.mesDe(Core.hojeIso())); });
    $('#nova-aula').addEventListener('click', function () { abrirAula(null, Core.hojeIso()); });
    $('#novo-aluno').addEventListener('click', function () { abrirAluno(null); });

    $('#salvar-aula').addEventListener('click', salvarAula);
    $('#excluir-aula').addEventListener('click', excluirAulaAtual);
    $('#salvar-aluno').addEventListener('click', salvarAluno);
    $('#excluir-aluno').addEventListener('click', excluirAlunoAtual);

    $('#mes-fechamento').addEventListener('change', function () {
      mesAtual = this.value;
      desenharAgenda();
      desenharFechamento();
    });
    $('#exportar-md-mes').addEventListener('click', exportarMesEmTexto);
    $('#exportar-pdf-mes').addEventListener('click', exportarResumoDoMesEmPdf);

    $('#baixar-copia').addEventListener('click', baixarCopia);
    $('#restaurar-copia').addEventListener('click', function () { $('#arquivo-copia').click(); });
    $('#arquivo-copia').addEventListener('change', restaurarCopia);
    $('#limpar-orfaos').addEventListener('click', liberarEspaco);
    $('#apagar-exemplo').addEventListener('click', apagarExemplo);
    $('#apagar-tudo').addEventListener('click', apagarTudo);
    $('#salvar-resumo').addEventListener('click', salvarResumo);
    $('#enviar-cartao').addEventListener('click', enviarCartaoDoMes);

    $('#alternar-valores').addEventListener('click', alternarValores);
    $('#versao-app').textContent = VERSAO;
    $('#procurar-atualizacao').addEventListener('click', procurarAtualizacao);

    window.addEventListener('resize', function () {
      if (editorAtual) editorAtual.ajustarTamanho();
    });
  }

  function irParaMes(mes) {
    mesAtual = mes;
    var criadas = Core.garantirSeriesAte(db, mes);
    var p = criadas ? salvar() : Promise.resolve();
    p.then(function () {
      desenharAgenda();
      desenharFechamento();
    });
  }

  // ================= agenda =================

  function alunoPorId(id) {
    return db.alunos.filter(function (a) { return a.id === id; })[0] || null;
  }

  /* Um número da faixa de cima, com linhas menores embaixo quando há o que
   * dizer.
   *
   * O número grande é o que JÁ ACONTECEU. O previsto fica embaixo, menor.
   * Antes disso, no dia primeiro do mês a tela mostrava o valor do mês inteiro
   * como se todas as aulas já tivessem sido dadas, porque a aula nasce marcada
   * como realizada mesmo quando está lá na frente no calendário. Ela lia aquilo
   * como dinheiro que já existe. Agora quem separa é a data, sozinha: ela não
   * confirma aula nenhuma.
   *
   * O rodapé não leva a classe valor de propósito: quem lê a tela por fora
   * procura o número principal por essa classe. */
  function numeroComRodape(rotulo, valor, rodapes) {
    var filhos = [
      el('div', { class: 'rotulo', texto: rotulo }),
      el('div', { class: 'valor', texto: valor })
    ];
    (rodapes || []).forEach(function (t) {
      if (!t) return;
      filhos.push(el('div', {
        style: 'font-size:12px;color:var(--muted);margin-top:3px;line-height:1.35',
        texto: t
      }));
    });
    return el('div', { class: 'numero' }, filhos);
  }

  function plural(n, um, muitos) { return n === 1 ? um : muitos; }

  function desenharAgenda() {
    $('#rotulo-mes').textContent = Core.mesExtenso(mesAtual);

    var hoje = Core.hojeIso();
    var doMes = db.aulas.filter(function (a) { return Core.mesDe(a.data) === mesAtual; });
    var minutos = 0, valor = 0;
    var minFeitos = 0, valorFeito = 0, minPrevistos = 0, valorPrevisto = 0;
    var encontrosFeitos = 0, encontrosPrevistos = 0;
    doMes.forEach(function (a) {
      /* A aula de hoje conta como dada: só o que vem depois de hoje é previsto. */
      var futura = a.data > hoje;
      if (futura) encontrosPrevistos++; else encontrosFeitos++;
      var st = Core.STATUS[a.status] || Core.STATUS.realizada;
      var cobravel = (typeof a.cobravel === 'boolean') ? a.cobravel : st.cobravelPadrao;
      if (!cobravel) return;
      var dur = a.duracaoMin || 0;
      var aluno = alunoPorId(a.alunoId);
      var pv = aluno ? Core.precoVigente(aluno, a.data) : null;
      var v = pv ? (dur / 60) * pv.valorHora : 0;
      minutos += dur;
      valor += v;
      if (futura) minPrevistos += dur;
      else { minFeitos += dur; valorFeito += v; }
    });
    /* O previsto sai por diferença para que os dois números da caixa somem
     * sempre o total do mês na tela, mesmo quando a hora não divide redondo. */
    valor = Math.round(valor * 100) / 100;
    valorFeito = Math.round(valorFeito * 100) / 100;
    valorPrevisto = Math.round((valor - valorFeito) * 100) / 100;

    var alunosNoMes = {};
    doMes.forEach(function (a) { alunosNoMes[a.alunoId] = true; });

    var numeros = $('#numeros-mes');
    numeros.innerHTML = '';
    numeros.appendChild(numeroComRodape('Encontros', String(encontrosFeitos), [
      encontrosPrevistos ? 'mais ' + encontrosPrevistos + ' ' +
        plural(encontrosPrevistos, 'marcado à frente', 'marcados à frente') : ''
    ]));
    numeros.appendChild(numeroComRodape('Horas cobradas', Core.fmtHoras(minFeitos) + ' h', [
      minPrevistos ? 'mais ' + Core.fmtHoras(minPrevistos) + ' h à frente' : ''
    ]));
    numeros.appendChild(numeroComRodape('A receber', dinheiro(valorFeito), [
      valorPrevisto ? 'previsto à frente: ' + dinheiro(valorPrevisto) : '',
      valorPrevisto ? 'mês inteiro: ' + dinheiro(valor) : ''
    ]));
    numeros.appendChild(numeroComRodape('Alunos', String(Object.keys(alunosNoMes).length), []));

    var lembrete = $('#lembrete-copia');
    lembrete.innerHTML = '';
    if (precisaLembrarDaCopia()) {
      var dias = diasDesdeACopia();
      lembrete.appendChild(el('div', { class: 'faixa-aviso' }, [
        el('strong', { texto: dias === null ? 'Você ainda não salvou uma cópia de segurança. '
          : 'Sua última cópia de segurança tem ' + dias + ' dias. ' }),
        document.createTextNode('Tudo fica só neste tablet. Salve uma cópia e guarde no Drive. '),
        el('button', {
          type: 'button', class: 'btn pequeno', style: 'margin-left:8px',
          texto: 'Salvar cópia agora',
          aoClick: function () { baixarCopia(); }
        })
      ]));
    }

    var grade = $('#grade-mes');
    grade.innerHTML = '';
    var caixa = el('div', { class: 'grade-mes' });

    Core.DIAS_CURTO.forEach(function (d) {
      caixa.appendChild(el('div', { class: 'cab-dia', texto: d }));
    });

    var primeiro = Core.primeiroDiaSemanaDoMes(mesAtual);
    var total = Core.diasDoMes(mesAtual);
    var mesAnterior = Core.mesAdjacente(mesAtual, -1);
    var totalAnterior = Core.diasDoMes(mesAnterior);
    var hoje = Core.hojeIso();

    for (var i = 0; i < primeiro; i++) {
      caixa.appendChild(el('div', { class: 'dia fora' }, [
        el('div', { class: 'num', texto: String(totalAnterior - primeiro + i + 1) })
      ]));
    }

    for (var d = 1; d <= total; d++) {
      var iso = mesAtual + '-' + Core.pad2(d);
      var doDia = db.aulas.filter(function (a) { return a.data === iso; })
        .sort(function (x, y) { return String(x.hora).localeCompare(String(y.hora)); });
      var feriado = Core.feriadoEm(iso);
      var classe = 'dia' + (iso === hoje ? ' hoje' : '') + (feriado && !feriado.facultativo ? ' feriado' : '');
      var celula = el('div', { class: classe, 'data-dia': iso }, [
        el('div', { class: 'num', texto: String(d) })
      ]);
      if (feriado) {
        celula.appendChild(el('div', {
          class: 'marca-feriado' + (feriado.facultativo ? ' facultativo' : ''),
          title: feriado.nome + ' (' + feriado.ambito + ')',
          texto: feriado.nome
        }));
      }
      doDia.forEach(function (a) {
        var aluno = alunoPorId(a.alunoId);
        var nome = aluno ? aluno.nome : 'Aluno removido';
        var cls = 'pilula' + (a.status === 'cancelada' ? ' cancelada' : '') +
          (a.temNota ? ' tem-nota' : '') + (a.tipo === 'mapeamento' ? ' mapeamento' : '');
        var pil = el('div', {
          class: cls,
          style: 'background:' + (aluno ? aluno.cor : '#9AA3AF'),
          // O encontro de mapeamento se distingue na agenda: nao e aula comum.
          texto: (a.hora ? a.hora + ' ' : '') + nome +
            (a.tipo === 'mapeamento' ? ' · mapeamento' : '')
        });
        pil.addEventListener('click', function (ev) {
          ev.stopPropagation();
          abrirAula(a.id, null);
        });
        celula.appendChild(pil);
      });
      celula.addEventListener('click', (function (dia) {
        return function () { abrirAula(null, dia); };
      })(iso));
      caixa.appendChild(celula);
    }

    var restantes = (7 - ((primeiro + total) % 7)) % 7;
    for (var j = 1; j <= restantes; j++) {
      caixa.appendChild(el('div', { class: 'dia fora' }, [el('div', { class: 'num', texto: String(j) })]));
    }

    grade.appendChild(caixa);
  }

  // ================= modal de aula =================

  var DURACOES = [30, 45, 60, 90, 120, 150, 180];

  function abrirAula(aulaId, dataSugerida) {
    if (!db.alunos.length) {
      avisar('Cadastre um aluno antes de marcar a primeira aula.');
      return;
    }
    aulaEmEdicao = aulaId ? db.aulas.filter(function (a) { return a.id === aulaId; })[0] : null;
    var novo = !aulaEmEdicao;
    var serie = aulaEmEdicao ? Core.serieDe(db, aulaEmEdicao) : null;

    $('#titulo-modal-aula').textContent = novo ? 'Nova aula' : 'Aula de ' + Core.ddmmaaaa(aulaEmEdicao.data);
    $('#excluir-aula').style.display = novo ? 'none' : '';

    var corpo = $('#corpo-modal-aula');
    corpo.innerHTML = '';

    /* Onde os dois pararam vem antes de tudo.
     *
     * Para lembrar do último encontro ela precisava fechar esta janela, achar a
     * aula anterior no calendário e abrir. Agora o assunto, as áreas, o que
     * rendeu e o que ela anotou só para ela abrem a janela, num bloco de altura
     * fixa e curta, que não empurra nada para fora da tela.
     *
     * Ele fica ACIMA do cartão da trilha de propósito: memória primeiro, ação
     * logo em seguida. O que a rodada da trilha exigia continua valendo, e é o
     * que os prints das duas orientações conferem: o cartão da trilha aparece
     * inteiro sem rolagem, e não depois de oito campos da aula. */
    if (!novo) {
      desenharUltimoEncontro(corpo, aulaEmEdicao);
      /* O próximo passo da trilha. Quem o preenche é o desenharAssuntos, que
       * sabe quando redesenhar. */
      corpo.appendChild(el('div', { id: 'cartao-trilha' }));
    }

    if (serie) {
      corpo.appendChild(el('div', { class: 'faixa-info' }, [
        el('strong', { texto: 'Aula que se repete. ' }),
        document.createTextNode(Core.descreveSerie(serie)),
        aulaEmEdicao.destacada ? el('div', { style: 'margin-top:6px' }, [
          el('span', { class: 'tag excecao', texto: 'alterada só neste dia' })
        ]) : null
      ]));
    }

    /* Quando a aula é, quanto dura, como terminou e se é cobrada.
     *
     * Numa aula que já existe isto tudo já está preenchido e quase nunca muda:
     * é o bloco que ela olha e passa. Fica num contêiner só porque, com a aula
     * aberta, ele é MOVIDO para depois dos dois campos de anotação. Ver o
     * comentário do move, mais abaixo. Numa aula nova ele continua no alto,
     * onde tem que estar: aula nova é exatamente escolher dia e horário. */
    var blocoQuando = el('div', { id: 'bloco-quando' });
    corpo.appendChild(blocoQuando);

    var selAluno = el('select', { id: 'campo-aluno' });
    db.alunos.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome); }).forEach(function (a) {
      var o = el('option', { value: a.id, texto: a.nome });
      if (aulaEmEdicao ? a.id === aulaEmEdicao.alunoId : false) o.selected = true;
      selAluno.appendChild(o);
    });
    blocoQuando.appendChild(el('label', { class: 'campo' }, [el('span', { texto: 'Aluno' }), selAluno]));
    if (!novo) selAluno.disabled = true;

    var dataVal = aulaEmEdicao ? aulaEmEdicao.data : (dataSugerida || Core.hojeIso());
    var horaVal = aulaEmEdicao ? (aulaEmEdicao.hora || '') : '15:30';

    blocoQuando.appendChild(el('div', { class: 'linha' }, [
      el('label', { class: 'campo' }, [
        el('span', { texto: 'Data' }),
        el('input', { type: 'date', id: 'campo-data', value: dataVal })
      ]),
      el('label', { class: 'campo' }, [
        el('span', { texto: 'Horário' }),
        el('input', { type: 'time', id: 'campo-hora', value: horaVal })
      ])
    ]));

    var duracaoVal = aulaEmEdicao ? aulaEmEdicao.duracaoMin : 60;
    var selDur = el('select', { id: 'campo-duracao' });
    var listaDur = DURACOES.slice();
    if (listaDur.indexOf(duracaoVal) < 0) listaDur.push(duracaoVal);
    listaDur.sort(function (a, b) { return a - b; }).forEach(function (m) {
      var o = el('option', { value: String(m), texto: Core.fmtDuracao(m) });
      if (m === duracaoVal) o.selected = true;
      selDur.appendChild(o);
    });

    var selStatus = el('select', { id: 'campo-status' });
    Object.keys(Core.STATUS).forEach(function (k) {
      var o = el('option', { value: k, texto: Core.STATUS[k].rotulo });
      if (aulaEmEdicao && aulaEmEdicao.status === k) o.selected = true;
      selStatus.appendChild(o);
    });

    blocoQuando.appendChild(el('div', { class: 'linha' }, [
      el('label', { class: 'campo' }, [el('span', { texto: 'Duração' }), selDur]),
      el('label', { class: 'campo' }, [el('span', { texto: 'Situação' }), selStatus])
    ]));

    var stAtual = aulaEmEdicao ? (Core.STATUS[aulaEmEdicao.status] || Core.STATUS.realizada) : Core.STATUS.realizada;
    var cobravelVal = aulaEmEdicao && typeof aulaEmEdicao.cobravel === 'boolean'
      ? aulaEmEdicao.cobravel : stAtual.cobravelPadrao;
    var chkCobrar = el('input', { type: 'checkbox', id: 'campo-cobrar', style: 'width:auto;min-height:auto' });
    chkCobrar.checked = cobravelVal;
    blocoQuando.appendChild(el('label', { class: 'campo', style: 'display:flex;align-items:center;gap:10px' }, [
      chkCobrar, el('span', { texto: 'Cobrar esta aula', style: 'margin:0' })
    ]));
    selStatus.addEventListener('change', function () {
      chkCobrar.checked = (Core.STATUS[this.value] || Core.STATUS.realizada).cobravelPadrao;
    });

    // lembrete de feriado, sem impedir a marcação
    var avisoFeriado = el('div', { id: 'aviso-feriado' });
    blocoQuando.appendChild(avisoFeriado);

    /* Choque de horário. Duas aulas ao mesmo tempo quase sempre são lançamento
       repetido, ou a aula desmarcada que ficou para trás. O aviso aparece, mas
       nada é bloqueado: irmãos na mesma sala existem. */
    var avisoChoque = el('div', { id: 'aviso-choque' });
    blocoQuando.appendChild(avisoChoque);
    function atualizarChoque() {
      avisoChoque.innerHTML = '';
      var provisoria = {
        id: aulaEmEdicao ? aulaEmEdicao.id : null,
        data: $('#campo-data').value,
        hora: $('#campo-hora').value,
        duracaoMin: parseInt($('#campo-duracao').value, 10) || 60,
        status: $('#campo-status').value
      };
      var choques = Core.conflitosDe(db, provisoria);
      if (!choques.length) return;
      var nomes = choques.map(function (c) {
        var al = alunoPorId(c.alunoId);
        return (al ? al.nome : 'aluno removido') + (c.hora ? ' às ' + c.hora : '');
      });
      avisoChoque.appendChild(el('div', { class: 'faixa-aviso' }, [
        el('strong', { texto: 'Já há aula neste horário: ' }),
        document.createTextNode(nomes.join(', ') + '. Confira se não é lançamento repetido. ' +
          'Se for mesmo assim, pode salvar.')
      ]));
    }
    function atualizarFeriado() {
      var data = $('#campo-data').value;
      var f = data ? Core.feriadoEm(data) : null;
      avisoFeriado.innerHTML = '';
      if (!f) return;
      avisoFeriado.appendChild(el('div', { class: 'faixa-aviso' }, [
        el('strong', { texto: f.facultativo ? 'Ponto facultativo: ' : 'Feriado: ' }),
        document.createTextNode(f.nome + '. Confirme com a família se a aula acontece.')
      ]));
    }

    // valor previsto
    var previsao = el('div', { class: 'ajuda', id: 'previsao-valor' });
    blocoQuando.appendChild(previsao);
    function atualizarPrevisao() {
      atualizarFeriado();
      atualizarChoque();
      var aluno = alunoPorId($('#campo-aluno').value);
      var data = $('#campo-data').value;
      var dur = parseInt($('#campo-duracao').value, 10) || 0;
      var pv = aluno ? Core.precoVigente(aluno, data) : null;
      if (!pv) {
        previsao.innerHTML = '<strong style="color:#B4453C">Sem valor por hora vigente nesta data.</strong> ' +
          'Cadastre o valor na ficha do aluno.';
      } else {
        previsao.textContent = 'Valor previsto: ' + dinheiro((dur / 60) * pv.valorHora) +
          ' (' + dinheiro(pv.valorHora) + ' por hora).';
      }
    }
    selAluno.addEventListener('change', atualizarPrevisao);
    selDur.addEventListener('change', atualizarPrevisao);
    selStatus.addEventListener('change', atualizarPrevisao);
    $('#campo-data').addEventListener('change', atualizarPrevisao);
    $('#campo-data').addEventListener('input', atualizarPrevisao);
    $('#campo-hora').addEventListener('change', atualizarPrevisao);
    $('#campo-hora').addEventListener('input', atualizarPrevisao);

    // recorrência, só ao criar
    if (novo) {
      var chkRepetir = el('input', { type: 'checkbox', id: 'campo-repetir', style: 'width:auto;min-height:auto' });
      corpo.appendChild(el('label', { class: 'campo', style: 'display:flex;align-items:center;gap:10px;margin-top:6px' }, [
        chkRepetir, el('span', { texto: 'Repetir toda semana', style: 'margin:0' })
      ]));

      var caixaRep = el('div', { id: 'caixa-repeticao', style: 'display:none' });
      var linhaDias = el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px' });
      Core.DIAS_CURTO.forEach(function (nome, indice) {
        var b = el('button', {
          type: 'button', class: 'btn pequeno', 'data-dia-semana': String(indice),
          texto: nome, style: 'min-width:52px'
        });
        b.addEventListener('click', function () {
          var ativo = b.classList.toggle('principal');
          b.dataset.marcado = ativo ? '1' : '';
        });
        linhaDias.appendChild(b);
      });
      caixaRep.appendChild(el('div', { class: 'campo' }, [
        el('span', { texto: 'Em quais dias da semana', style: 'display:block;font-size:13px;font-weight:700;color:#1F3A5F;margin-bottom:5px' }),
        linhaDias
      ]));
      var atePadrao = Core.mesAdjacente(Core.mesDe(dataVal), 6) + '-28';
      caixaRep.appendChild(el('label', { class: 'campo' }, [
        el('span', { texto: 'Repetir até' }),
        el('input', { type: 'date', id: 'campo-repetir-ate', value: atePadrao })
      ]));
      caixaRep.appendChild(el('div', { class: 'ajuda', texto: 'As aulas são criadas em todos esses dias, até a data informada. Depois dá para mudar ou apagar qualquer uma delas.' }));
      corpo.appendChild(caixaRep);

      chkRepetir.addEventListener('change', function () {
        caixaRep.style.display = this.checked ? '' : 'none';
        if (this.checked) {
          var diaDaData = Core.diaSemana($('#campo-data').value);
          var botao = linhaDias.querySelector('[data-dia-semana="' + diaDaData + '"]');
          if (botao && !botao.dataset.marcado) { botao.classList.add('principal'); botao.dataset.marcado = '1'; }
        }
      });
    }

    /* A aula nova ainda não existe, então não tem onde guardar folha, material
     * nem anexo. Em vez de deixar ela procurando por botões que não estão ali,
     * o aviso diz o que vem depois de salvar. */
    if (novo) {
      corpo.appendChild(el('div', {
        class: 'ajuda', id: 'ajuda-aula-nova',
        texto: 'Ao salvar, a aula abre de novo já com a folha, o material de aula, os anexos e ' +
          'as áreas trabalhadas.'
      }));
    }

    // folha de aula e anexos, só depois que a aula existe
    if (!novo) {
      var alunoDaAula = alunoPorId(aulaEmEdicao.alunoId);
      if (aulaEmEdicao.tipo === 'mapeamento' && alunoDaAula) {
        desenharEncontroDeMapeamento(corpo, alunoDaAula, aulaEmEdicao);
      } else if (alunoDaAula && Core.mapeado(alunoDaAula)) {
        desenharLembrete(corpo, alunoDaAula, aulaEmEdicao);
      }

      corpo.appendChild(el('h3', { class: 'subtitulo', texto: 'Conteúdo da aula' }));

      desenharAssuntos(corpo, aulaEmEdicao, alunoDaAula);

      /* A anotação virou duas.
       *
       * Existia uma só, e o que ela escrevesse ali podia acabar saindo no
       * arquivo que a família recebe: o fechamento com notas leva o notaTexto
       * inteiro. Então ela escrevia pensando em quem lê, e o que era só dela
       * não tinha onde morar.
       *
       * O campo de sempre continua sendo o de sempre, com o mesmo texto dentro
       * e o mesmo destino: é ele que vai para o fechamento. O que muda é o nome,
       * que agora diz para onde vai. O campo novo nasce vazio e não sai em lugar
       * nenhum: nem no Markdown, nem no PDF, nem no documento do mês. */
      var areaNota = el('textarea', {
        id: 'campo-nota-texto',
        placeholder: 'O que foi trabalhado nesta aula. Este texto entra no fechamento quando você pedir.'
      });
      areaNota.value = aulaEmEdicao.notaTexto || '';
      corpo.appendChild(el('label', { class: 'campo' }, [
        el('span', { texto: 'O que rendeu hoje' }), areaNota
      ]));
      corpo.appendChild(el('div', {
        class: 'ajuda', style: 'margin-top:-6px',
        texto: 'Este é o texto que pode sair no arquivo que a família recebe.'
      }));

      var areaPrivada = el('textarea', {
        id: 'campo-nota-privada', style: 'min-height:64px',
        placeholder: 'O que você não diria à família. Fica só aqui.'
      });
      areaPrivada.value = aulaEmEdicao.notaPrivada || '';
      corpo.appendChild(el('label', { class: 'campo' }, [
        el('span', { texto: 'Só minha' }), areaPrivada
      ]));
      corpo.appendChild(el('div', {
        class: 'ajuda', style: 'margin-top:-6px',
        texto: 'Não entra no fechamento, no PDF nem em nenhum documento que sai daqui. ' +
          'Aparece para você no alto da próxima aula deste aluno.'
      }));

      /* Aqui o bloco de data, horário, duração e situação desce.
       *
       * Ele estava acima do conteúdo, e com isso o que ela abre a aula para
       * escrever caía abaixo da dobra em paisagem: medindo em 1280 por 800, o
       * título "Conteúdo da aula" ficava em 552 e o campo "O que rendeu hoje"
       * em 752, num corpo de 600. Ela precisava rolar para achar o campo em que
       * escreve toda aula, e não precisava rolar nenhum pixel para achar a data,
       * que já está certa e ela não vai mexer.
       *
       * appendChild MOVE o bloco, que já está no documento desde o começo desta
       * função: os campos precisam existir antes, porque os avisos de feriado e
       * de choque de horário e a previsão de valor são ligados por $('#campo-...')
       * logo depois de criados. */
      corpo.appendChild(blocoQuando);

      var linhaFolha = el('div', { id: 'linha-folha', class: 'barra', style: 'margin-bottom:6px' });
      linhaFolha.appendChild(el('button', {
        type: 'button', class: 'btn destaque',
        texto: aulaEmEdicao.temNota ? 'Abrir folha de aula' : 'Escrever à mão na folha',
        aoClick: function () { abrirEditorNota(aulaEmEdicao.id); }
      }));
      linhaFolha.appendChild(el('button', {
        type: 'button', class: 'btn',
        texto: 'Material de aula',
        aoClick: function () { abrirTemas(aulaEmEdicao.id); }
      }));
      linhaFolha.appendChild(el('button', {
        type: 'button', class: 'btn',
        texto: 'Anexar PDF',
        aoClick: function () { anexarArquivo(aulaEmEdicao.id, 'documento'); }
      }));
      linhaFolha.appendChild(el('button', {
        type: 'button', class: 'btn',
        texto: 'Anexar foto',
        aoClick: function () { anexarArquivo(aulaEmEdicao.id, 'foto'); }
      }));
      corpo.appendChild(linhaFolha);
      corpo.appendChild(el('div', { id: 'ajuda-folha', class: 'ajuda' }, [
        el('strong', { texto: 'A folha em branco é sempre o começo: ' }),
        document.createTextNode('ela aceita escrita com a S Pen, imagem colada e texto digitado, ' +
          'e serve para você planejar a aula do jeito que quiser. '),
        el('strong', { texto: 'Material de aula ' }),
        document.createTextNode('é um atalho opcional, para quando quiser puxar explicação e ' +
          'exercícios prontos de um tema. '),
        el('strong', { texto: 'Para trazer uma aula do Samsung Notes: ' }),
        document.createTextNode('lá dentro toque em Compartilhar, escolha PDF, e depois use "Anexar PDF" aqui. ' +
          'O arquivo fica guardado junto da aula e você abre ou compartilha quando quiser. ' +
          'Ele não entra dentro do PDF do fechamento, que leva só as folhas escritas aqui.'),
        el('strong', { texto: ' O assunto da aula ' }),
        document.createTextNode('fica logo acima e vale sozinho: registrar o assunto não obriga ' +
          'a gerar material nenhum.')
      ]));

      var listaAnexos = el('div', { id: 'lista-anexos' });
      corpo.appendChild(listaAnexos);
      desenharAnexos(listaAnexos, aulaEmEdicao);

      desenharAreas(corpo, aulaEmEdicao);

      corpo.appendChild(el('div', { class: 'barra', style: 'margin:14px 0 4px' }, [
        el('button', {
          type: 'button', class: 'btn',
          texto: 'Repetir para trás',
          aoClick: function () { abrirRetroativo(aulaEmEdicao.id); }
        }),
        Core.podeDividir(aulaEmEdicao) ? el('button', {
          type: 'button', class: 'btn', id: 'dividir-aula',
          texto: 'Dividir em duas aulas de ' + rotuloMetades(aulaEmEdicao),
          aoClick: function () { dividirAulaEmDuas(aulaEmEdicao.id); }
        }) : null
      ].filter(Boolean)));
      corpo.appendChild(el('div', { class: 'ajuda' }, [
        el('strong', { texto: 'Repetir para trás: ' }),
        document.createTextNode('use quando as aulas já aconteciam antes de você cadastrar o aluno. ' +
          'O aplicativo cria as datas passadas com este mesmo horário e duração. '),
        Core.podeDividir(aulaEmEdicao) ? el('strong', { texto: 'Dividir em duas: ' }) : null,
        Core.podeDividir(aulaEmEdicao) ? document.createTextNode(
          'raramente é preciso. Um encontro que passou por vários assuntos continua sendo ' +
          'uma aula só, e pode receber quantos temas você quiser: assim o fechamento do mês ' +
          'mostra a lista de temas em vez de se partir em vários blocos curtos. ' +
          'Divida apenas quando foram mesmo dois encontros separados no dia.') : null
      ].filter(Boolean)));
    }

    atualizarPrevisao();
    abrirModal('modal-aula');
  }

  /* Áreas trabalhadas.
   *
   * Fica recolhido por padrão: no meio de uma aula ela não quer rolar por vinte
   * e quatro caixas para chegar ao anexo. Aberto, é só clicar. */
  function desenharAreas(corpo, aula) {
    aula.areas = aula.areas || [];

    var contador = el('span', { class: 'tag', id: 'conta-areas' });
    var caixa = el('div', { id: 'caixa-areas', style: 'display:none' });

    function atualizarContador() {
      var n = aula.areas.length;
      contador.textContent = n ? (n === 1 ? '1 marcada' : n + ' marcadas') : 'nenhuma';
      contador.className = 'tag' + (n ? ' cheia' : '');
    }

    var botao = el('button', {
      type: 'button', class: 'btn pequeno', id: 'abrir-areas', texto: 'Mostrar'
    });
    botao.addEventListener('click', function () {
      var aberto = caixa.style.display !== 'none';
      caixa.style.display = aberto ? 'none' : '';
      botao.textContent = aberto ? 'Mostrar' : 'Esconder';
    });

    corpo.appendChild(el('div', { class: 'barra', style: 'margin:10px 0 4px' }, [
      el('span', {
        texto: 'Áreas trabalhadas na aula',
        style: 'font-size:13px;font-weight:700;color:#1F3A5F'
      }),
      contador,
      el('span', { class: 'cresce' }),
      botao
    ]));

    Core.AREAS.forEach(function (grupo) {
      caixa.appendChild(el('div', { class: 'bloco-exercicios', texto: grupo.grupo }));
      var grade = el('div', { class: 'grade-areas' });
      grupo.itens.forEach(function (item) {
        var chk = el('input', { type: 'checkbox', style: 'width:auto;min-height:auto' });
        chk.checked = aula.areas.indexOf(item.id) >= 0;
        chk.addEventListener('change', function () {
          if (this.checked) {
            if (aula.areas.indexOf(item.id) < 0) aula.areas.push(item.id);
          } else {
            aula.areas = aula.areas.filter(function (x) { return x !== item.id; });
          }
          atualizarContador();
          salvar();
        });
        grade.appendChild(el('label', { class: 'item-area', 'data-area': item.id },
          [chk, el('span', { texto: item.rotulo })]));
      });
      caixa.appendChild(grade);
    });
    corpo.appendChild(caixa);
    atualizarContador();

    // Já marcada de outra vez: abre mostrando, para ela ver o que registrou.
    if (aula.areas.length) { caixa.style.display = ''; botao.textContent = 'Esconder'; }
  }

  /* O assunto da aula.
   *
   * Fica logo abaixo do título do conteúdo, antes de tudo, porque é o registro
   * do que foi trabalhado: é ele que entra no fechamento que a família lê.
   * Antes o assunto só existia quando ela gerava um PDF, e ficava escondido
   * dentro do botão "Material de aula". Agora é ao contrário: primeiro o
   * assunto, e o material é um atalho que sai de dentro dele quando ela quiser.
   *
   * Muta a aula e grava na hora, sem depender do botão Salvar, do mesmo jeito
   * que as áreas trabalhadas já fazem aqui embaixo. */
  var blocoAssuntoAtivo = null;

  function desenharAssuntos(corpo, aula, aluno) {
    var bloco = el('div', { id: 'bloco-assunto', style: 'margin-bottom:14px' });
    corpo.appendChild(bloco);

    function desenhar() {
      bloco.innerHTML = '';

      /* O próximo passo da trilha entra ANTES de tudo, porque é a primeira
       * pergunta da aula: o que vem hoje. Ele não mora mais dentro deste bloco,
       * e sim no TOPO da janela da aula, num #cartao-trilha que o abrirAula já
       * deixou pronto: aqui embaixo ele nascia depois de oito campos da aula e
       * ficava abaixo da dobra em paisagem (1280 por 800), faltando rolagem
       * para aparecer inteiro. O caminho de um toque que a trilha inteira
       * promete não pode depender de ela rolar para achá-lo.
       *
       * Continua sendo desenhado por esta função porque é ela que sabe quando
       * redesenhar: registrar ou tirar um assunto muda o cartão e o botão. */
      var cartao = $('#cartao-trilha');
      var passoAOferecer = cartao ? desenharCartaoDaTrilha(cartao, aula, aluno) : false;

      /* O id continua sendo lista-temas-aula porque é por ele que a geração de
       * material redesenha a lista depois de anexar o PDF. */
      var lista = el('div', { id: 'lista-temas-aula' });
      bloco.appendChild(lista);
      desenharTemasDaAula(lista, aula, aluno);

      /* Com o próximo passo em cima, este botão desce de tom: dois botões
       * grandes e do mesmo verde, um em cima do outro, brigam pelo olho e o
       * caminho de um toque some no meio. Sem trilha, ele continua sendo o
       * botão principal do bloco, como sempre foi. */
      var quantos = Core.temasDaAula(aula).length;
      bloco.appendChild(el('div', { class: 'barra', style: 'margin:0' }, [
        el('button', {
          type: 'button', id: 'escolher-assunto',
          class: quantos ? 'btn pequeno' : (passoAOferecer ? 'btn' : 'btn destaque'),
          style: quantos ? '' : 'flex:1',
          texto: quantos ? 'Mais um assunto' : (passoAOferecer
            ? 'Escolher outro assunto' : 'Escolher o assunto da aula'),
          aoClick: function () { abrirAssunto(aula.id); }
        })
      ]));
      if (!quantos) {
        bloco.appendChild(el('div', {
          class: 'ajuda', style: 'margin-top:4px',
          texto: 'O assunto entra no fechamento do mês. Se quiser material pronto, ' +
            'ele sai daqui mesmo.'
        }));
      }
    }

    blocoAssuntoAtivo = { aulaId: aula.id, desenhar: desenhar };
    desenhar();
  }

  /* Redesenha o bloco de assunto da aula que está aberta, quando é ela mesma.
   * Tirar um assunto ou registrar um novo muda também o rótulo do botão, e
   * redesenhar só a lista deixaria a tela mentindo. */
  function atualizarBlocoAssunto(aulaId) {
    if (!blocoAssuntoAtivo || blocoAssuntoAtivo.aulaId !== aulaId) return false;
    if (!$('#bloco-assunto')) return false;
    blocoAssuntoAtivo.desenhar();
    return true;
  }

  /* O próximo passo da trilha, no topo do bloco de assunto.
   *
   * Um toque registra o assunto E marca o passo, e é o MESMO toque que ela já
   * daria para escolher o assunto: não é gesto novo, é gesto poupado. Nada de
   * perguntar no fim da aula se o passo terminou, que é o tipo de pergunta que
   * não sobrevive duas semanas. */
  function desenharCartaoDaTrilha(caixa, aula, aluno) {
    caixa.innerHTML = '';
    if (!aluno) return false;

    var achado = null;
    var outras = [];
    Core.trilhasAtivas(aluno).forEach(function (t) {
      var p = Core.proximoPasso(t);
      if (!p) return;
      if (achado) { outras.push(t); return; }
      achado = { trilha: t, passo: p };
    });
    if (!achado) return false;

    var trilha = achado.trilha;
    var passo = achado.passo;
    var total = (trilha.passos || []).length;
    var numero = (trilha.passos || []).indexOf(passo) + 1;
    var jaNaAula = Core.temasDaAula(aula).filter(function (t) {
      return t.id === passo.temaId;
    }).length > 0;

    var st = aula.status || 'realizada';
    var contaAgora = st === 'realizada' || st === 'reposicao';

    var dentro = [
      el('div', { class: 'barra', style: 'margin:0 0 6px' }, [
        el('span', {
          class: 'cresce', style: 'font-size:13px;color:#1F5A4C',
          texto: 'Trilha até ' + trilha.titulo + ' · passo ' + numero + ' de ' + total
        })
      ])
    ];

    if (jaNaAula) {
      dentro.push(el('div', {
        style: 'font-size:14px;font-weight:700;color:#1F3A5F',
        texto: 'Próximo passo já registrado nesta aula: ' + passo.titulo
      }));
    } else {
      dentro.push(el('button', {
        type: 'button', class: 'btn destaque', id: 'usar-proximo-passo',
        style: 'width:100%;text-align:left;padding:14px 16px;font-size:15px;white-space:normal',
        texto: 'Próximo passo: ' + passo.titulo,
        aoClick: function () {
          registrarAssunto(aula, {
            id: passo.temaId, titulo: passo.titulo, fonte: 'banco', disciplina: 'matematica'
          });
        }
      }));
      dentro.push(el('div', {
        class: 'ajuda', style: 'margin:6px 0 0',
        texto: contaAgora
          ? 'Um toque registra o assunto da aula e marca o passo como dado, com a data desta aula.'
          : 'Um toque registra o assunto. O passo só é marcado em aula realizada ou reposição, e ' +
            'esta está como ' + (Core.STATUS[st] ? Core.STATUS[st].rotulo.toLowerCase() : st) + '.'
      }));
    }

    /* O cartão mostra o próximo passo de UMA trilha, e não dizia que havia
     * outra: ela escolhia entre duas sem saber que estava escolhendo. Dizer
     * qual é a outra basta, e é o que cabe aqui sem virar uma segunda tela. */
    if (outras.length) {
      dentro.push(el('div', {
        class: 'ajuda', id: 'outras-trilhas-ativas', style: 'margin:6px 0 0',
        texto: outras.length === 1
          ? 'Este aluno tem outra trilha em andamento, até ' + outras[0].titulo +
            '. Para dar um passo dela, escolha o assunto por baixo; a ficha do aluno mostra as duas.'
          : 'Este aluno tem outras ' + outras.length + ' trilhas em andamento (até ' +
            outras.map(function (t) { return t.titulo; }).join('; ') +
            '). Para dar um passo delas, escolha o assunto por baixo.'
      }));
    }

    caixa.appendChild(el('div', { class: 'lembrete', id: 'cartao-proximo-passo' }, dentro));
    /* Devolve se o cartão está mesmo OFERECENDO o passo: quando ele já foi
     * registrado nesta aula não há botão nenhum, e aí o bloco de assunto volta
     * a ser o botão principal. */
    return !jaNaAula;
  }

  /* Um assunto sem disciplina é de matemática: é o que todos os registros
   * anteriores são, porque antes só virava registro o que gerava material. */
  function disciplinaDoAssunto(t) { return t.disciplina || 'matematica'; }

  /* MAT06-04 é do 6º ano, MATEM1-14 é da 1ª série do médio. O ano já está
   * dentro do id, então não precisa de campo novo para ser lido. */
  function anoDoTemaMat(id) {
    var m = /^MAT(EM[123]|\d{2})/i.exec(String(id || ''));
    return m ? m[1].toLowerCase() : '';
  }

  function resumoMatDe(id) {
    if (!indiceTemas || !id) return null;
    return indiceTemas.filter(function (t) { return t.id === id; })[0] || null;
  }

  /* Os assuntos registrados nesta aula.
   *
   * Alguns vieram com material em PDF, e tirar daqui tira também o anexo; a
   * maioria é só o registro do que foi trabalhado, e é assim que ela pediu. */
  function desenharTemasDaAula(caixa, aula, aluno) {
    caixa.innerHTML = '';
    var lista = Core.temasDaAula(aula);
    if (!lista.length) return;

    if (!aluno) aluno = alunoPorId(aula.alunoId);

    caixa.appendChild(el('div', {
      class: 'bloco-exercicios',
      texto: lista.length === 1 ? 'Assunto da aula' : 'Assuntos desta aula'
    }));

    /* A etiqueta da matéria e o botão Material dependem de dois índices
     * pequenos. Eles só são buscados quando há assunto sem material para
     * mostrar: registro antigo, que sempre tem PDF, não pede nada. */
    var faltaIndice = false, faltaTopicos = false;
    lista.forEach(function (t) {
      if (t.anexoId) return;
      if (disciplinaDoAssunto(t) === 'matematica') {
        if (!indiceTemas && !indiceTemasFalhou) faltaIndice = true;
      } else if (!indiceTopicos && !indiceTopicosFalhou) {
        faltaTopicos = true;
      }
    });
    if (faltaIndice || faltaTopicos) {
      /* Sem sinal os dois podem não vir. A falha fica anotada para a lista não
       * ficar buscando de novo a cada redesenho: sem material a linha aparece
       * do mesmo jeito, só sem a etiqueta do ano ou da matéria. */
      var espera = faltaIndice
        ? carregarIndice().catch(function () { indiceTemasFalhou = true; })
        : Promise.resolve();
      espera.then(function () {
        if (!faltaTopicos) return null;
        return carregarIndiceTopicos().catch(function () { indiceTopicosFalhou = true; });
      }).then(function () {
        if (caixa.parentNode) desenharTemasDaAula(caixa, aula, aluno);
      });
    }

    lista.forEach(function (t) {
      var comMaterial = !!t.anexoId;
      var disciplina = disciplinaDoAssunto(t);
      var detalhe = '';
      if (comMaterial) {
        detalhe = (t.lingua === 'en' ? 'em inglês' : 'em português') +
          (t.exercicios ? ' · ' + t.exercicios + ' exercícios' : '') +
          (t.partes && t.partes.length ? ' · ' + t.partes.join(', ') : '');
      } else if (t.fonte === 'livre') {
        detalhe = 'assunto escrito por você';
      } else if (disciplina !== 'matematica') {
        var nomeGrupo = rotuloGrupoDeTopico(disciplina, t.grupo);
        detalhe = rotuloDisciplina(disciplina) + (nomeGrupo ? ', ' + nomeGrupo : '');
      } else {
        var ano = anoDoTemaMat(t.id);
        detalhe = ano ? nomeDoAno(ano) : '';
      }

      var podeMaterial = !comMaterial && disciplina === 'matematica' && !!resumoMatDe(t.id);

      caixa.appendChild(el('div', { class: 'item-lista item-assunto-aula' }, [
        el('div', { class: 'cresce' }, [
          el('div', { class: 'nome' }, [
            document.createTextNode(t.titulo || t.id),
            comMaterial
              ? el('span', { class: 'tag', texto: 'com material pronto', style: 'margin-left:8px' })
              : null
          ].filter(Boolean)),
          detalhe ? el('div', { class: 'detalhe', texto: detalhe }) : null
        ].filter(Boolean)),
        podeMaterial ? el('button', {
          type: 'button', class: 'btn pequeno', texto: 'Material',
          aoClick: function () {
            $('#titulo-modal-tema').textContent = 'Material de aula' +
              (aluno ? ', ' + aluno.nome : '');
            abrirModal('modal-tema');
            abrirMontagem(resumoMatDe(t.id), aula, aluno, {
              itemExistente: t,
              rotuloVoltar: '‹ Voltar para a aula',
              voltar: function () { fecharModal('modal-tema'); }
            });
          }
        }) : null,
        /* A folga sai dos 12 px da linha para 32: Tirar apaga, Material não, e
         * os dois ficavam a um dedo de distância um do outro numa tela que ela
         * usa em pé, na casa da família, muitas vezes com o aluno do lado. */
        el('button', {
          type: 'button', class: 'btn pequeno perigo', texto: 'Tirar',
          style: 'margin-left:20px',
          aoClick: function () {
            /* Tirar um assunto que tem PDF leva o arquivo junto, e arquivo
             * apagado não volta: aí ela é perguntada antes. Sem PDF não há o
             * que perder para sempre, então em vez de perguntar o item fica
             * guardado e a barra oferece Desfazer, do mesmo jeito que dividir
             * a aula em duas já faz. Perguntar sempre viraria hábito de dizer
             * sim sem ler, que é o contrário de proteger. */
            var comPdf = !!t.anexoId;
            if (comPdf && !confirmar('Tirar "' + (t.titulo || t.id) +
                '" apaga também o material em PDF que está anexado, e o arquivo não volta. ' +
                'Tirar mesmo assim?')) {
              return;
            }
            var guardado = t;
            var posicao = Core.temasDaAula(aula).indexOf(t);
            aula.temas = Core.temasDaAula(aula).filter(function (x) { return x !== t; });
            delete aula.tema;
            if (t.anexoId) {
              aula.anexos = (aula.anexos || []).filter(function (x) { return x.id !== t.anexoId; });
              Store.apagarAnexo(t.anexoId);
            }
            /* Tirar o assunto desfaz também a marcação do passo que aquele
             * assunto fechou. Sem isto o passo continuava contando como dado,
             * amarrado a uma aula que não registra mais aquele assunto: a
             * trilha andava com uma prova que ela mesma acabou de apagar. */
            var mexeu = revisarTrilhasDoAluno(aula.alunoId);
            salvar().then(function () {
              if (!atualizarBlocoAssunto(aula.id)) desenharTemasDaAula(caixa, aula, aluno);
              if ($('#lista-anexos')) desenharAnexos($('#lista-anexos'), aula);
              atualizarPainelTrilhas(aula.alunoId);
              desenharAgenda();
              if (comPdf) {
                avisar('Assunto e material tirados da aula.' + textoDeTrilha(mexeu));
                return;
              }
              avisar('Assunto tirado da aula.' + textoDeTrilha(mexeu), 'Desfazer', function () {
                var lista = Core.temasDaAula(aula);
                lista.splice(posicao < 0 ? lista.length : Math.min(posicao, lista.length),
                  0, guardado);
                aula.temas = lista;
                delete aula.tema;
                /* Devolver o assunto devolve o passo, com a data da aula. */
                var voltou = revisarTrilhasDoAluno(aula.alunoId);
                salvar().then(function () {
                  if (!atualizarBlocoAssunto(aula.id)) desenharTemasDaAula(caixa, aula, aluno);
                  atualizarPainelTrilhas(aula.alunoId);
                  desenharAgenda();
                  avisar('Assunto de volta na aula.' + textoDeTrilha(voltou));
                });
              });
            });
          }
        })
      ].filter(Boolean)));
    });
  }

  function rotuloMetades(aula) {
    var p = Core.metadesDe(aula.duracaoMin || 60);
    return p[0] === p[1] ? p[0] + ' minutos' : p[0] + ' e ' + p[1] + ' minutos';
  }

  function dividirAulaEmDuas(aulaId) {
    var marca = Core.dividirAula(db, aulaId);
    if (!marca) { avisar('Esta aula é curta demais para dividir.'); return; }
    salvar().then(function () {
      fecharModal('modal-aula');
      desenharTudo();
      avisar('Aula dividida em ' + marca.partes[0] + ' e ' + marca.partes[1] + ' minutos.',
        'Desfazer', function () {
          if (!Core.desfazerDivisao(db, marca)) {
            avisar('A segunda aula já tem conteúdo, então ela ficou como está.');
            return;
          }
          salvar().then(function () { desenharTudo(); avisar('Divisão desfeita.'); });
        });
    });
  }

  function desenharAnexos(caixa, aula) {
    caixa.innerHTML = '';
    (aula.anexos || []).forEach(function (an) {
      caixa.appendChild(el('div', { class: 'item-lista' }, [
        el('div', { class: 'cresce' }, [
          el('div', { class: 'nome', texto: an.nome }),
          el('div', { class: 'detalhe', texto: (an.tamanho ? Math.round(an.tamanho / 1024) + ' KB' : '') })
        ]),
        el('button', {
          type: 'button', class: 'btn pequeno', texto: 'Abrir',
          aoClick: function () {
            Store.lerAnexo(an.id).then(function (r) {
              if (r && r.blob) entregarArquivo(an.nome, r.blob, an.nome);
            });
          }
        }),
        el('button', {
          type: 'button', class: 'btn pequeno perigo', texto: 'Remover',
          aoClick: function () {
            aula.anexos = (aula.anexos || []).filter(function (x) { return x.id !== an.id; });
            Store.apagarAnexo(an.id);
            /* O assunto que carregava este PDF volta a ser só registro.
             *
             * Sem isto o item continuava com o anexoId de um arquivo que já não
             * existe: a linha da aula dizia "com material pronto" apontando para
             * o nada, e o botão Material não voltava, porque ele só aparece
             * quando não há material. Os campos que descrevem o PDF (a língua,
             * as partes e a contagem de exercícios) saem junto, senão a linha
             * continuaria contando um material que se foi. */
            Core.temasDaAula(aula).forEach(function (t) {
              if (t.anexoId !== an.id) return;
              delete t.anexoId;
              delete t.lingua;
              delete t.partes;
              delete t.exercicios;
            });
            salvar().then(function () {
              desenharAnexos(caixa, aula);
              if (!atualizarBlocoAssunto(aula.id) && $('#lista-temas-aula')) {
                desenharTemasDaAula($('#lista-temas-aula'), aula, alunoPorId(aula.alunoId));
              }
            });
          }
        })
      ]));
    });
  }

  function anexarArquivo(aulaId, tipo) {
    var entrada = $(tipo === 'foto' ? '#entrada-anexo-foto' : '#entrada-anexo');
    entrada.value = '';
    entrada.onchange = function () {
      var arquivo = entrada.files && entrada.files[0];
      if (!arquivo) return;
      var aula = db.aulas.filter(function (a) { return a.id === aulaId; })[0];
      if (!aula) return;
      var LIMITE = 25 * 1024 * 1024;
      if (arquivo.size > LIMITE) {
        avisar('Arquivo muito grande (' + Math.round(arquivo.size / 1048576) + ' MB). O limite é 25 MB.');
        return;
      }
      var id = Core.uid();
      Store.salvarAnexo(id, { nome: arquivo.name, tipo: arquivo.type, blob: arquivo }).then(function () {
        aula.anexos = aula.anexos || [];
        aula.anexos.push({ id: id, nome: arquivo.name, tamanho: arquivo.size });
        return salvar();
      }).then(function () {
        desenharAnexos($('#lista-anexos'), aula);
        avisar('Arquivo anexado.');
      });
    };
    entrada.click();
  }

  /* Põe as trilhas do aluno de acordo com as aulas que existem HOJE.
   *
   * Chamada depois de qualquer mexida em aula: mudança de situação, exclusão,
   * assunto tirado ou devolvido. São quatro coisas, nesta ordem, e a ordem
   * importa:
   *
   *   1. aula que deixou de acontecer solta os passos que ela tinha fechado.
   *      Sem isto a trilha contaria como andado o que não foi dado, que é o
   *      pior tipo de erro: o que fica calado.
   *   2. passo sem lastro também solta. São dois casos, e nenhum dos dois era
   *      tratado: a aula não existe mais no banco, porque excluir aula não
   *      revisava trilha nenhuma (vale nos dois ramos, com e sem repetição); e
   *      a aula existe mas não registra mais aquele assunto, porque tirar o
   *      assunto não desfazia a marcação do passo que aquele assunto fechou.
   *   3. o jaEra sai de todo passo que ficou sem data. Ele diz "isto é anterior
   *      à trilha", e sobrevivendo à desmarcação fazia o passo ser lido como
   *      anterior à trilha para sempre.
   *   4. e a volta, que faltava: varre as aulas realizadas e de reposição em
   *      ordem de data e remarca pelo assunto. A desmarcação era de mão única,
   *      então cancelar uma aula devolvia o passo para a fila e voltar a aula
   *      para realizada NÃO devolvia o passo, mesmo com o assunto ainda
   *      registrado ali. Aqui ele volta com a data e a aula daquele encontro.
   *
   * Duas coisas a varredura do 4 NÃO faz, de propósito:
   *
   *   - não toca em passo que ELA soltou à mão. "Trazer de volta" e desmarcar a
   *     caixa querem dizer "aquela aula não fechou isto de verdade", e a
   *     varredura remarcaria na primeira aula salva depois, apagando a decisão
   *     dela sem avisar. O passo solto à mão fica solto até ela marcar de novo.
   *   - não escreve em trilha encerrada. Registro fechado não ganha passo novo
   *     por efeito colateral de uma aula editada hoje.
   *
   * Devolve quantos passos ficaram mesmo para trás, já descontando os que a
   * varredura devolveu, e quantos voltaram a contar. */
  function revisarTrilhasDoAluno(alunoId) {
    var aluno = alunoPorId(alunoId);
    if (!aluno || !Core.trilhasDe(aluno).length) return { soltos: 0, remarcados: 0 };

    var todos = [];
    Core.trilhasDe(aluno).forEach(function (tr) {
      (tr.passos || []).forEach(function (p) { todos.push(p); });
    });
    var tinha = todos.map(function (p) { return !!p.feitoEm; });

    var minhasAulas = db.aulas.filter(function (a) { return a.alunoId === alunoId; });
    minhasAulas.forEach(function (a) { Core.revisarPassosDaAula(aluno, a); });

    // 2. o lastro de cada marca: a aula existe e ainda registra aquele assunto?
    var registra = {};
    db.aulas.forEach(function (a) {
      var mapa = {};
      Core.temasDaAula(a).forEach(function (t) { if (t && t.id) mapa[t.id] = true; });
      registra[a.id] = mapa;
    });
    todos.forEach(function (p) {
      if (p.aulaId && (!registra[p.aulaId] || (p.temaId && !registra[p.aulaId][p.temaId]))) {
        p.feitoEm = null;
        p.aulaId = null;
      }
      if (!p.feitoEm) delete p.jaEra;   // 3.
    });

    // 4. a volta, pelas aulas que contam, da mais antiga para a mais nova
    minhasAulas.slice()
      .sort(function (a, b) { return String(a.data).localeCompare(String(b.data)); })
      .forEach(function (a) {
        var st = a.status || 'realizada';
        if (st !== 'realizada' && st !== 'reposicao') return;
        Core.temasDaAula(a).forEach(function (t) {
          if (!t || !t.id) return;
          var achou = false;
          Core.trilhasAtivas(aluno).forEach(function (tr) {
            if (achou) return;
            (tr.passos || []).forEach(function (p) {
              if (achou || p.feitoEm || p.soltoAMao || p.temaId !== t.id) return;
              p.feitoEm = a.data;
              p.aulaId = a.id;
              delete p.jaEra;
              delete p.marcaAnterior;
              t.passoDe = tr.id;
              achou = true;
            });
          });
        });
      });

    var soltos = 0, remarcados = 0;
    todos.forEach(function (p, i) {
      if (tinha[i] && !p.feitoEm) soltos++;
      if (!tinha[i] && p.feitoEm) remarcados++;
    });
    return { soltos: soltos, remarcados: remarcados };
  }

  /* Desmarcar em silêncio seria o pior dos dois mundos: ela mudaria o status e
   * a trilha andaria para trás sem ninguém contar. O contrário também vale: se
   * o passo voltou a contar, ela precisa saber, senão a trilha anda sozinha e
   * ela descobre por acaso. */
  function textoDeTrilha(r) {
    if (!r) return '';
    var texto = '';
    if (r.soltos) {
      texto += ' A aula não conta mais, então ' + r.soltos +
        (r.soltos === 1 ? ' passo voltou' : ' passos voltaram') + ' para a fila da trilha.';
    }
    if (r.remarcados) {
      texto += ' ' + r.remarcados + (r.remarcados === 1
        ? ' passo voltou a contar como dado.' : ' passos voltaram a contar como dados.');
    }
    return texto;
  }

  function salvarAula() {
    var alunoId = $('#campo-aluno').value;
    var data = $('#campo-data').value;
    var hora = $('#campo-hora').value;
    var duracao = parseInt($('#campo-duracao').value, 10) || 60;
    var status = $('#campo-status').value;
    var cobrar = $('#campo-cobrar').checked;

    if (!data) { avisar('Informe a data da aula.'); return; }

    // criação
    if (!aulaEmEdicao) {
      var repetir = $('#campo-repetir') && $('#campo-repetir').checked;
      if (repetir) {
        var dias = $$('#caixa-repeticao [data-dia-semana]')
          .filter(function (b) { return b.dataset.marcado; })
          .map(function (b) { return parseInt(b.dataset.diaSemana, 10); });
        if (!dias.length) { avisar('Escolha ao menos um dia da semana.'); return; }
        var ate = $('#campo-repetir-ate').value || null;
        if (ate && ate < data) { avisar('A data final não pode ser antes do início.'); return; }
        comDesfazer('Aulas repetidas criadas.', function () {
          Core.criarSerie(db, {
            alunoId: alunoId, dias: dias, hora: hora, duracaoMin: duracao,
            inicio: data, fim: ate
          });
        }).then(function () {
          fecharModal('modal-aula');
          desenharTudo();
        });
        return;
      }
      var nova = {
        id: Core.uid(), alunoId: alunoId, serieId: null, destacada: false,
        data: data, hora: hora, duracaoMin: duracao, status: status, cobravel: cobrar,
        notaTexto: '', notaPrivada: '', temNota: false, anexos: []
      };
      db.aulas.push(nova);
      salvar().then(function () {
        fecharModal('modal-aula');
        desenharTudo();
        // Reabre para ela já poder escrever na folha ou puxar o material. Numa
        // repetição não faz sentido: seriam muitas aulas criadas de uma vez.
        abrirAula(nova.id);
        avisar('Aula criada.');
      });
      return;
    }

    // edição
    var mudancas = {
      data: data, hora: hora, duracaoMin: duracao, status: status, cobravel: cobrar,
      notaTexto: $('#campo-nota-texto') ? $('#campo-nota-texto').value : aulaEmEdicao.notaTexto,
      notaPrivada: $('#campo-nota-privada')
        ? $('#campo-nota-privada').value : aulaEmEdicao.notaPrivada
    };
    var mudouPadrao = (aulaEmEdicao.hora !== hora) || (aulaEmEdicao.duracaoMin !== duracao) ||
      (aulaEmEdicao.status !== status) || (aulaEmEdicao.cobravel !== cobrar);
    var serie = Core.serieDe(db, aulaEmEdicao);

    if (serie && mudouPadrao) {
      perguntarEscopo('Salvar a alteração em', function (escopo) {
        var rotulos = {
          esta: 'Aula alterada.',
          seguintes: 'Aulas alteradas desta data em diante.',
          todas: 'Todas as aulas da repetição foram alteradas.'
        };
        var alunoId = aulaEmEdicao.alunoId;
        var mexeu = null;
        var acao = function () {
          Core.aplicarEdicaoAula(db, aulaEmEdicao.id, mudancas, escopo);
          mexeu = revisarTrilhasDoAluno(alunoId);
        };
        if (escopo === 'esta') {
          acao();
          salvar().then(function () {
            fecharModal('modal-aula');
            desenharTudo();
            avisar(rotulos[escopo] + textoDeTrilha(mexeu));
          });
        } else {
          /* O rótulo é uma função porque só depois da ação se sabe quantos
           * passos se mexeram. Nos escopos "seguintes" e "todas", que são
           * justamente os que desmarcam vários de uma vez, a trilha andava para
           * trás em silêncio: o aviso saía sem contar nada. */
          comDesfazer(function () { return rotulos[escopo] + textoDeTrilha(mexeu); }, acao)
            .then(function () {
              fecharModal('modal-aula');
              desenharTudo();
            });
        }
      });
      return;
    }

    Core.aplicarEdicaoAula(db, aulaEmEdicao.id, mudancas, 'esta');
    var mexeuAqui = revisarTrilhasDoAluno(aulaEmEdicao.alunoId);
    salvar().then(function () {
      fecharModal('modal-aula');
      desenharTudo();
      avisar('Aula salva.' + textoDeTrilha(mexeuAqui));
    });
  }

  function excluirAulaAtual() {
    if (!aulaEmEdicao) return;
    var serie = Core.serieDe(db, aulaEmEdicao);
    /* Excluir a aula não revisava as trilhas: o passo continuava marcado
     * apontando para uma aula que não existe mais no banco, e a ficha dizia
     * "dado em 10/08" sem ter onde mostrar aquele dia. Vale nos dois ramos. */
    if (!serie) {
      if (!confirmar('Excluir esta aula?')) return;
      var alvo = aulaEmEdicao.id;
      var quem = aulaEmEdicao.alunoId;
      var mexeu = null;
      comDesfazer(function () { return 'Aula excluída.' + textoDeTrilha(mexeu); }, function () {
        Core.excluirAulas(db, alvo, 'esta');
        mexeu = revisarTrilhasDoAluno(quem);
      }).then(function () {
        fecharModal('modal-aula');
        desenharTudo();
      });
      return;
    }
    perguntarEscopo('Excluir', function (escopo) {
      var rotulos = {
        esta: 'Aula excluída.',
        seguintes: 'Aulas excluídas desta data em diante.',
        todas: 'Todas as aulas da repetição foram excluídas.'
      };
      var alvo = aulaEmEdicao.id;
      var quem = aulaEmEdicao.alunoId;
      var mexeu = null;
      comDesfazer(function () { return rotulos[escopo] + textoDeTrilha(mexeu); }, function () {
        Core.excluirAulas(db, alvo, escopo);
        mexeu = revisarTrilhasDoAluno(quem);
      }).then(function () {
        fecharModal('modal-aula');
        desenharTudo();
      });
    }, true);
  }

  /* Recuperar as aulas que já aconteceram antes do cadastro do aluno. */
  function abrirRetroativo(aulaId) {
    var aula = db.aulas.filter(function (a) { return a.id === aulaId; })[0];
    if (!aula) return;
    var aluno = alunoPorId(aula.alunoId);
    var serie = Core.serieDe(db, aula);

    var corpo = $('#corpo-modal-retroativo');
    corpo.innerHTML = '';
    corpo.appendChild(el('div', {
      class: 'ajuda', style: 'margin-top:0',
      texto: 'Partindo da aula de ' + Core.ddmmaaaa(aula.data) + ', às ' + (aula.hora || 'sem horário') +
        ', de ' + Core.fmtDuracao(aula.duracaoMin) + ', para ' + (aluno ? aluno.nome : '') + '.'
    }));

    var escolhidos = serie ? serie.dias.slice() : [Core.diaSemana(aula.data)];
    var linhaDias = el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px' });
    Core.DIAS_CURTO.forEach(function (nome, indice) {
      var marcado = escolhidos.indexOf(indice) >= 0;
      var b = el('button', {
        type: 'button', class: 'btn pequeno' + (marcado ? ' principal' : ''),
        texto: nome, style: 'min-width:52px'
      });
      b.dataset.dia = String(indice);
      b.dataset.marcado = marcado ? '1' : '';
      b.addEventListener('click', function () {
        var ativo = b.classList.toggle('principal');
        b.dataset.marcado = ativo ? '1' : '';
        atualizarPrevia();
      });
      linhaDias.appendChild(b);
    });
    corpo.appendChild(el('div', { class: 'campo' }, [
      el('span', { texto: 'Em quais dias da semana', style: 'display:block;font-size:13px;font-weight:700;color:#1F3A5F;margin-bottom:5px' }),
      linhaDias
    ]));

    var padraoAte = Core.mesAdjacente(Core.mesDe(aula.data), -1) + '-01';
    var campoAte = el('input', { type: 'date', id: 'campo-retroativo-ate', value: padraoAte, max: aula.data });
    corpo.appendChild(el('label', { class: 'campo' }, [
      el('span', { texto: 'Voltar até que data' }), campoAte
    ]));

    var previa = el('div', { class: 'faixa-info' });
    corpo.appendChild(previa);

    function diasEscolhidos() {
      return $$('#corpo-modal-retroativo [data-dia]')
        .filter(function (b) { return b.dataset.marcado; })
        .map(function (b) { return parseInt(b.dataset.dia, 10); });
    }

    function atualizarPrevia() {
      var datas = Core.preverRetroativo(db, aulaId, diasEscolhidos(), campoAte.value);
      if (!datas.length) {
        previa.textContent = 'Nenhuma aula nova seria criada com essas escolhas.';
        return;
      }
      previa.innerHTML = '';
      previa.appendChild(el('strong', {
        texto: datas.length + ' aula' + (datas.length === 1 ? '' : 's') + ' ' +
          (datas.length === 1 ? 'seria criada' : 'seriam criadas') + '. '
      }));
      previa.appendChild(document.createTextNode(
        'De ' + Core.ddmmaaaa(datas[0]) + ' a ' + Core.ddmmaaaa(datas[datas.length - 1]) + '. ' +
        'Dias que já têm aula são pulados.'));
    }
    campoAte.addEventListener('change', atualizarPrevia);
    campoAte.addEventListener('input', atualizarPrevia);
    atualizarPrevia();

    $('#salvar-retroativo').onclick = function () {
      var dias = diasEscolhidos();
      var ate = campoAte.value;
      if (!ate) { avisar('Informe até que data voltar.'); return; }
      if (!dias.length) { avisar('Escolha ao menos um dia da semana.'); return; }
      var quantas = Core.preverRetroativo(db, aulaId, dias, ate).length;
      if (!quantas) { avisar('Nenhuma aula nova a criar.'); return; }
      comDesfazer(quantas + ' aula' + (quantas === 1 ? '' : 's') + ' recuperada' + (quantas === 1 ? '' : 's') + '.', function () {
        Core.repetirParaTras(db, aulaId, dias, ate);
      }).then(function () {
        fecharModal('modal-retroativo');
        fecharModal('modal-aula');
        desenharTudo();
      });
    };

    abrirModal('modal-retroativo');
  }

  /* A escolha de escopo do Google Agenda: só esta, esta e as seguintes, ou todas. */
  function perguntarEscopo(verbo, aoEscolher, ehExclusao) {
    $('#titulo-modal-escopo').textContent = 'Esta aula se repete';
    var corpo = $('#corpo-modal-escopo');
    corpo.innerHTML = '';
    corpo.appendChild(el('p', {
      class: 'ajuda',
      texto: verbo + ' quais aulas? As aulas que você já alterou individualmente não são afetadas.'
    }));

    var opcoes = [
      ['esta', 'Somente esta aula', 'As outras aulas da repetição continuam como estão.'],
      ['seguintes', 'Esta e as seguintes', 'Vale desta data em diante. As anteriores não mudam.'],
      ['todas', 'Todas as aulas da repetição', 'Inclui as que já passaram. Dá para desfazer logo depois.']
    ];
    opcoes.forEach(function (o) {
      var b = el('button', {
        type: 'button',
        class: 'opcao-escopo' + (o[0] === 'todas' && ehExclusao ? ' atencao' : '')
      }, [
        el('strong', { texto: o[1] }),
        el('span', { texto: o[2] })
      ]);
      b.addEventListener('click', function () {
        fecharModal('modal-escopo');
        aoEscolher(o[0]);
      });
      corpo.appendChild(b);
    });
    abrirModal('modal-escopo');
  }

  // ================= alunos =================

  function desenharAlunos() {
    var caixa = $('#lista-alunos');
    caixa.innerHTML = '';
    var semValor = db.alunos.filter(function (a) { return !Core.precoVigente(a, Core.hojeIso()); });
    if (semValor.length) {
      caixa.appendChild(el('div', { class: 'faixa-aviso' }, [
        el('strong', { texto: semValor.length + ' aluno' + (semValor.length === 1 ? '' : 's') + ' sem valor por hora. ' }),
        document.createTextNode('Abra cada ficha e informe quanto custa a hora-aula. Enquanto isso, o fechamento desses alunos fica em zero.')
      ]));
    }
    if (!db.alunos.length) {
      caixa.appendChild(el('div', { class: 'vazio' }, [
        el('p', { texto: 'Nenhum aluno cadastrado ainda.' }),
        el('p', { class: 'ajuda', texto: 'Comece cadastrando um aluno e o valor da hora-aula.' })
      ]));
      return;
    }
    db.alunos.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome); }).forEach(function (a) {
      var pv = Core.precoVigente(a, Core.hojeIso());
      var series = (db.series || []).filter(function (s) { return s.alunoId === a.id; });
      var qtd = db.aulas.filter(function (x) { return x.alunoId === a.id; }).length;
      // A linha inteira abre a ficha: mirar no botao pequeno com o dedo, no
      // tablet, e mais trabalhoso do que tocar no nome do aluno.
      var linhaAluno = el('div', { class: 'item-lista clicavel', 'data-aluno': a.id }, [
        el('div', { class: 'bolinha', style: 'background:' + a.cor }),
        el('div', { class: 'cresce' }, [
          el('div', { class: 'nome' }, [
            document.createTextNode(a.nome),
            (!Core.precoVigente(a, Core.hojeIso())) ? el('span', { class: 'tag excecao', texto: 'falta o valor', style: 'margin-left:8px' }) : null
          ]),
          el('div', {
            class: 'detalhe',
            texto: (pv ? dinheiro(pv.valorHora) + ' por hora' : 'sem valor cadastrado') +
              ' · ' + qtd + ' aula' + (qtd === 1 ? '' : 's') +
              (series.length ? ' · ' + Core.descreveSerie(series[0]) : '')
          })
        ]),
        el('button', {
          type: 'button', class: 'btn pequeno', texto: 'Abrir',
          aoClick: function (ev) { ev.stopPropagation(); abrirAluno(a.id); }
        })
      ]);
      linhaAluno.addEventListener('click', function () { abrirAluno(a.id); });
      caixa.appendChild(linhaAluno);
    });
  }

  /* Janela de perfil do aluno, em três abas: quem é, quanto custa e o que já
   * aconteceu. O histórico existe para ela não ter que abrir aula por aula no
   * calendário quando quer lembrar como o aluno vem indo. */
  function abrirAluno(alunoId) {
    alunoEmEdicao = alunoId ? alunoPorId(alunoId) : null;
    var novo = !alunoEmEdicao;
    $('#titulo-modal-aluno').textContent = novo ? 'Novo aluno' : alunoEmEdicao.nome;
    $('#excluir-aluno').style.display = novo ? 'none' : '';

    var corpo = $('#corpo-modal-aluno');
    corpo.innerHTML = '';

    var painel = {
      dados: el('div'), valores: el('div'),
      mapeamento: el('div'), historico: el('div')
    };
    var abas = el('div', { class: 'abas-perfil' });
    var botaoDaAba = {};
    var lista = [['dados', 'Dados'], ['valores', 'Valores']];
    if (!novo) lista.push(['mapeamento', 'Mapeamento'], ['historico', 'Histórico']);

    lista.forEach(function (par, i) {
      var b = el('button', {
        type: 'button', class: 'aba-perfil' + (i === 0 ? ' ativa' : ''), texto: par[1]
      });
      botaoDaAba[par[0]] = b;
      b.addEventListener('click', function () {
        abas.querySelectorAll('.aba-perfil').forEach(function (x) { x.classList.remove('ativa'); });
        b.classList.add('ativa');
        Object.keys(painel).forEach(function (k) { painel[k].style.display = 'none'; });
        painel[par[0]].style.display = '';
        corpo.scrollTop = 0;
      });
      abas.appendChild(b);
      painel[par[0]].style.display = i === 0 ? '' : 'none';
    });
    corpo.appendChild(abas);
    Object.keys(painel).forEach(function (k) { corpo.appendChild(painel[k]); });

    // ---------------- aba: dados ----------------

    /* A etapa também aqui, no alto da primeira aba.
     *
     * Ela mora na aba Mapeamento, e a ficha abre na aba Dados: para ver em que
     * etapa o aluno está era preciso saber que existe uma terceira aba e tocar
     * nela. O valor do item inteiro é o quadro ficar parado à vista, e ele
     * estava atrás de um toque que ninguém dá sem já saber o que vai achar.
     *
     * Aqui é só leitura, em três linhas. Quem muda continua sendo o quadro da
     * aba Mapeamento, um lugar só, e o botão leva direto para lá. */
    resumoEtapas = novo ? null : desenharResumoDeEtapas(painel.dados, alunoEmEdicao, function () {
      if (botaoDaAba.mapeamento) botaoDaAba.mapeamento.click();
    });

    painel.dados.appendChild(el('label', { class: 'campo' }, [
      el('span', { texto: 'Nome do aluno' }),
      el('input', {
        type: 'text', id: 'campo-nome', value: novo ? '' : alunoEmEdicao.nome,
        placeholder: 'Nome da criança'
      })
    ]));

    painel.dados.appendChild(el('div', { class: 'linha' }, [
      el('label', { class: 'campo' }, [
        el('span', { texto: 'Responsável' }),
        el('input', {
          type: 'text', id: 'campo-responsavel',
          value: novo ? '' : (alunoEmEdicao.responsavel || ''),
          placeholder: 'Opcional. Aparece no fechamento.'
        })
      ]),
      el('label', { class: 'campo' }, [
        el('span', { texto: 'Aluno desde' }),
        el('input', {
          type: 'date', id: 'campo-desde',
          value: novo ? '' : (alunoEmEdicao.desde || '')
        })
      ])
    ]));

    var cores = el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' });
    var corEscolhida = novo ? CORES_ALUNO[db.alunos.length % CORES_ALUNO.length] : alunoEmEdicao.cor;
    CORES_ALUNO.forEach(function (c) {
      var b = el('button', {
        type: 'button', class: 'cor-opcao' + (c === corEscolhida ? ' ativa' : ''),
        style: 'background:' + c, 'data-cor': c
      });
      b.addEventListener('click', function () {
        corEscolhida = c;
        cores.querySelectorAll('.cor-opcao').forEach(function (x) { x.classList.remove('ativa'); });
        b.classList.add('ativa');
      });
      cores.appendChild(b);
    });
    painel.dados.appendChild(el('div', { class: 'campo' }, [
      el('span', { texto: 'Cor na agenda', style: 'display:block;font-size:13px;font-weight:700;color:#1F3A5F;margin-bottom:5px' }),
      cores
    ]));

    painel.dados.appendChild(el('label', { class: 'campo' }, [
      el('span', { texto: 'Observações gerais' }),
      (function () {
        var t = el('textarea', {
          id: 'campo-obs', style: 'min-height:64px',
          placeholder: 'Combinados, horários, contato, o que for prático de lembrar.'
        });
        t.value = novo ? '' : (alunoEmEdicao.obs || '');
        return t;
      })()
    ]));

    painel.dados.appendChild(el('label', { class: 'campo' }, [
      el('span', { texto: 'Observações pedagógicas' }),
      (function () {
        var t = el('textarea', {
          id: 'campo-obs-pedagogicas', style: 'min-height:88px',
          placeholder: 'Como este aluno aprende melhor, onde costuma travar, o que já deu certo.'
        });
        t.value = novo ? '' : (alunoEmEdicao.obsPedagogicas || '');
        return t;
      })()
    ]));
    painel.dados.appendChild(el('div', {
      class: 'ajuda',
      texto: 'Nada daqui aparece no fechamento que a família recebe. É a sua memória sobre o aluno.'
    }));

    /* Aluno novo costuma começar por um encontro de sondagem. Deixar isso a um
     * clique aqui evita que ela tenha que lembrar de marcar depois. */
    if (novo) {
      var marcarEncontro = el('input', { type: 'checkbox', id: 'campo-agendar-mapeamento' });
      var caixaEncontro = el('div', { id: 'caixa-mapeamento-novo', style: 'display:none' });

      painel.dados.appendChild(el('h3', { class: 'subtitulo', texto: 'Primeiro encontro' }));
      painel.dados.appendChild(el('label', {
        style: 'display:flex;align-items:center;gap:9px;cursor:pointer;margin-bottom:6px'
      }, [marcarEncontro, el('span', { texto: 'Agendar encontro de mapeamento' })]));
      painel.dados.appendChild(el('div', {
        class: 'ajuda', style: 'margin-top:0',
        texto: 'Um primeiro encontro de sondagem, para entender de onde o aluno parte antes de ' +
          'montar o plano. Abre com roteiro e com a ficha de mapeamento para preencher na hora. ' +
          'Conta como aula normal no fechamento.'
      }));

      caixaEncontro.appendChild(el('div', { class: 'linha' }, [
        el('label', { class: 'campo' }, [
          el('span', { texto: 'Data' }),
          el('input', { type: 'date', id: 'campo-mapa-data', value: Core.hojeIso() })
        ]),
        el('label', { class: 'campo' }, [
          el('span', { texto: 'Horário' }),
          el('input', { type: 'time', id: 'campo-mapa-hora', value: '15:30' })
        ]),
        el('label', { class: 'campo' }, [
          el('span', { texto: 'Duração' }),
          (function () {
            var sel = el('select', { id: 'campo-mapa-duracao' });
            [[60, '1h'], [90, '1h30'], [120, '2h']].forEach(function (par) {
              var o = el('option', { value: String(par[0]), texto: par[1] });
              if (par[0] === 90) o.selected = true;
              sel.appendChild(o);
            });
            return sel;
          })()
        ])
      ]));
      painel.dados.appendChild(caixaEncontro);
      marcarEncontro.addEventListener('change', function () {
        caixaEncontro.style.display = this.checked ? '' : 'none';
      });
    }

    // ---------------- aba: valores ----------------

    painel.valores.appendChild(el('div', {
      class: 'ajuda', style: 'margin-top:4px',
      texto: 'Cada valor vale de uma data até outra. Ao reajustar, encerre o valor antigo e crie o ' +
        'novo. O fechamento usa o valor vigente na data de cada aula.'
    }));

    if (!novo && !Core.precoVigente(alunoEmEdicao, Core.hojeIso())) {
      painel.valores.appendChild(el('div', {
        class: 'faixa-aviso',
        texto: 'Este aluno ainda não tem valor por hora. Sem ele o fechamento não consegue calcular quanto cobrar.'
      }));
    }

    var precos = novo ? [] : (alunoEmEdicao.precos || []).slice();
    var caixaPrecos = el('div', { id: 'caixa-precos' });
    painel.valores.appendChild(caixaPrecos);

    function desenharPrecos() {
      caixaPrecos.innerHTML = '';
      precos.slice().sort(function (a, b) { return String(a.inicio).localeCompare(String(b.inicio)); })
        .forEach(function (pr) {
          caixaPrecos.appendChild(el('div', { class: 'cartao compacto' }, [
            el('div', { class: 'linha' }, [
              el('label', { class: 'campo', style: 'margin-bottom:6px' }, [
                el('span', { texto: 'R$ por hora' }),
                el('input', {
                  type: 'number', step: '0.01', min: '0', value: String(pr.valorHora),
                  aoInput: function () { pr.valorHora = parseFloat(this.value) || 0; }
                })
              ]),
              el('label', { class: 'campo', style: 'margin-bottom:6px' }, [
                el('span', { texto: 'A partir de' }),
                el('input', {
                  type: 'date', value: pr.inicio || '',
                  aoInput: function () { pr.inicio = this.value; }
                })
              ]),
              el('label', { class: 'campo', style: 'margin-bottom:6px' }, [
                el('span', { texto: 'Até (vazio: sem fim)' }),
                el('input', {
                  type: 'date', value: pr.fim || '',
                  aoInput: function () { pr.fim = this.value || null; }
                })
              ])
            ]),
            el('button', {
              type: 'button', class: 'btn pequeno perigo', texto: 'Remover este valor',
              aoClick: function () {
                precos = precos.filter(function (x) { return x !== pr; });
                desenharPrecos();
              }
            })
          ]));
        });

      caixaPrecos.appendChild(el('button', {
        type: 'button', class: 'btn', texto: '+ Adicionar valor',
        aoClick: function () {
          var ultimo = precos.slice().sort(function (a, b) {
            return String(a.inicio).localeCompare(String(b.inicio));
          }).pop();
          precos.push({
            id: Core.uid(), inicio: Core.hojeIso(), fim: null,
            valorHora: ultimo ? ultimo.valorHora : 100
          });
          desenharPrecos();
        }
      }));
    }
    desenharPrecos();
    corpo._precos = function () { return precos; };
    corpo._cor = function () { return corEscolhida; };

    if (!novo) {
      var series = (db.series || []).filter(function (x) { return x.alunoId === alunoEmEdicao.id; });
      if (series.length) {
        painel.valores.appendChild(el('h3', { class: 'subtitulo', texto: 'Aulas que se repetem' }));
        series.forEach(function (se) {
          painel.valores.appendChild(el('div', { class: 'item-lista' }, [
            el('div', { class: 'cresce' }, [
              el('div', { class: 'nome', texto: Core.descreveSerie(se) }),
              el('div', {
                class: 'detalhe',
                texto: 'Começou em ' + Core.ddmmaaaa(se.inicio) + ', ' +
                  Core.fmtDuracao(se.duracaoMin) + ' por encontro'
              })
            ]),
            el('button', {
              type: 'button', class: 'btn pequeno', texto: 'Encerrar',
              aoClick: function () {
                var digitado = window.prompt(
                  'Encerrar a repetição a partir de qual data? Use o formato dia/mês/ano.',
                  Core.ddmmaaaa(Core.hojeIso()));
                if (!digitado) return;
                var quando = Core.deBR(digitado);
                if (!quando) { avisar('Data inválida. Use o formato dia/mês/ano, por exemplo 05/04/2026.'); return; }
                comDesfazer('Repetição encerrada.', function () {
                  db.aulas = db.aulas.filter(function (a) {
                    return !(a.serieId === se.id && a.data >= quando && !a.destacada);
                  });
                  var dt = Core.dataLocal(quando); dt.setDate(dt.getDate() - 1);
                  se.fim = Core.isoDe(dt);
                  if (se.fim < se.inicio) db.series = db.series.filter(function (x) { return x.id !== se.id; });
                }).then(function () {
                  fecharModal('modal-aluno');
                  desenharTudo();
                });
              }
            })
          ]));
        });
      }
    }

    // ---------------- aba: mapeamento ----------------

    if (!novo) desenharAbaMapeamento(painel.mapeamento, alunoEmEdicao);

    // ---------------- aba: histórico ----------------

    if (!novo) desenharHistorico(painel.historico, alunoEmEdicao);

    abrirModal('modal-aluno');
  }

  /* Aba Mapeamento na ficha do aluno.
   *
   * Existe para todo aluno, não só para os novos. Quem estuda com ela há dois
   * anos também nunca foi mapeado, e é justamente nesses que o mapa costuma
   * explicar coisas que ela já sentia sem conseguir nomear. */
  function desenharAbaMapeamento(caixa, aluno) {
    caixa.innerHTML = '';
    var m = Core.mapeamentoAtual(aluno);

    /* A etapa entra em cima, e vale mapeado ou não: ela é sobre o aluno ter
     * andado, e isso independe de existir ficha de mapeamento. */
    desenharEtapas(caixa, aluno);

    if (!m) {
      caixa.appendChild(el('div', { class: 'vazio' }, [
        el('p', { texto: aluno.nome + ' ainda não foi mapeado.' }),
        el('p', {
          class: 'ajuda',
          texto: 'Nunca é tarde: dá para mapear um aluno de anos, não só o que chegou hoje. ' +
            'São pontos fortes, pontos de atenção, lacunas de anos anteriores, rotina de estudo ' +
            'e como ele aprende melhor. O que você marcar aparece como lembrete toda vez que ' +
            'abrir uma aula dele.'
        }),
        el('button', {
          type: 'button', class: 'btn principal', id: 'mapear-aluno',
          texto: 'Mapear ' + aluno.nome,
          aoClick: function () {
            fecharModal('modal-aluno');
            abrirMapeamento(aluno.id, { novo: true });
          }
        })
      ]));
      /* O painel entra mesmo sem mapeamento: uma trilha do zero não depende de
       * lacuna nenhuma, e trilha encerrada nunca pode sumir da vista. */
      desenharPainelTrilhas(caixa, aluno);
      return;
    }

    var lista = Core.mapeamentosDe(aluno);
    caixa.appendChild(el('div', { class: 'barra', style: 'margin:6px 0 10px' }, [
      el('span', {
        class: 'cresce',
        texto: 'Mapeado em ' + Core.ddmmaaaa(m.data) +
          (lista.length > 1 ? ', com ' + (lista.length - 1) + ' revisão anterior' : ''),
        style: 'font-size:14px'
      }),
      el('button', {
        type: 'button', class: 'btn pequeno', id: 'editar-mapeamento', texto: 'Abrir',
        aoClick: function () { fecharModal('modal-aluno'); abrirMapeamento(aluno.id); }
      }),
      el('button', {
        type: 'button', class: 'btn pequeno', id: 'refazer-mapeamento', texto: 'Refazer',
        aoClick: function () { fecharModal('modal-aluno'); abrirMapeamento(aluno.id, { novo: true }); }
      })
    ]));

    if (Core.rotuloNivel(m.nivel)) {
      caixa.appendChild(el('div', { class: 'faixa-info', texto: Core.rotuloNivel(m.nivel) }));
    }

    var contexto = [];
    if (m.escola) contexto.push(m.escola);
    if (m.anoEscolar) {
      var nome = Core.anoEscolarLivre(m.anoEscolar)
        ? (m.anoEscolarOutro || '').trim()
        : Core.ANOS_ESCOLARES[m.anoEscolar];
      if (nome) contexto.push(nome);
    }
    if (m.motivo) contexto.push(m.motivo);
    if (contexto.length) {
      caixa.appendChild(el('div', { class: 'ajuda', style: 'margin-top:0', texto: contexto.join(' · ') }));
    }

    /* Para onde ele está indo, com o prazo em semanas quando há data de prova. */
    var objetivo = Core.objetivoDe(aluno);
    if (objetivo) {
      var prazo = Core.semanasAteAProva(objetivo.dataProva);
      caixa.appendChild(el('div', { class: 'faixa-info', id: 'objetivo-do-aluno' }, [
        el('strong', { texto: 'Objetivo: ' }),
        document.createTextNode(objetivo.rotulo +
          (prazo ? '. Prova em ' + Core.ddmmaaaa(prazo.data) + ', ' + prazo.texto : '') + '.')
      ]));
    }

    /* As trilhas vêm ANTES do resto do mapeamento. Elas eram a última coisa da
     * aba e, em paisagem, nasciam fora da tela: o botão Montar trilha ficava
     * 40 px abaixo da dobra e ela só o encontrava rolando. O mapeamento
     * marcado é consulta, e continua logo abaixo; a trilha é o que ela vem
     * fazer aqui. */
    desenharPainelTrilhas(caixa, aluno);

    /* Consulta: primeiro cada matéria que ela preencheu, depois o aluno, que
     * vale para todas. É a mesma divisão da tela de preencher. */
    function listar(titulo, rotulos) {
      if (!rotulos.length) return;
      caixa.appendChild(el('div', { class: 'bloco-exercicios', texto: titulo }));
      var grade = el('div', { class: 'grade-areas' });
      rotulos.forEach(function (r) {
        grade.appendChild(el('div', { class: 'item-area', style: 'cursor:default' },
          [el('span', { texto: r })]));
      });
      caixa.appendChild(grade);
    }

    Core.materiasDoMapeamento(m).forEach(function (materiaId) {
      var marc = Core.marcadosDaMateria(m, materiaId);
      var nomeMateria = Core.rotuloMateria(m, materiaId);
      Core.MAPA.forEach(function (g) {
        listar(nomeMateria + ': ' + g.titulo.toLowerCase(),
          Core.rotulosDoMapa(g.chave, marc[g.chave]));
      });
      var cobranca = Core.cobrancaDaMateria(m, materiaId);
      if (cobranca) {
        caixa.appendChild(el('div', {
          class: 'bloco-exercicios', texto: nomeMateria + ': o que o colégio cobra no bimestre'
        }));
        caixa.appendChild(el('div', {
          style: 'font-size:14px;line-height:1.55;white-space:pre-wrap', texto: cobranca
        }));
      }
    });

    var doAluno = Core.marcadosDoAluno(m);
    Core.MAPA.forEach(function (g) {
      listar('O aluno: ' + g.titulo.toLowerCase(), Core.rotulosDoMapa(g.chave, doAluno[g.chave]));
    });

    [['prioridades', 'Prioridades'], ['plano', 'Diagnóstico e plano'],
    ['expectativa', 'Expectativa da família']].forEach(function (par) {
      var texto = (m[par[0]] || '').trim();
      if (!texto) return;
      caixa.appendChild(el('h3', { class: 'subtitulo', texto: par[1] }));
      caixa.appendChild(el('div', { style: 'font-size:14px;line-height:1.55;white-space:pre-wrap', texto: texto }));
    });

    caixa.appendChild(el('div', { class: 'barra', style: 'margin-top:14px' }, [
      el('button', {
        type: 'button', class: 'btn', id: 'pdf-mapeamento', texto: 'Gerar ficha em PDF',
        aoClick: function () { gerarFichaDeMapeamento(aluno, m); }
      })
    ]));
    caixa.appendChild(el('div', {
      class: 'ajuda',
      texto: 'A ficha é sua. Se quiser mostrar à família, veja antes se tudo que está escrito ali ' +
        'é o que você diria para eles.'
    }));
  }

  function gerarFichaDeMapeamento(aluno, m) {
    var bytes = PDFGen.gerarFichaMapeamento({
      aluno: aluno, mapeamento: m,
      grupos: Core.MAPA,
      rotulos: Core.rotulosDoMapa,
      nivel: Core.rotuloNivel(m.nivel),
      anoEscolar: Core.anoEscolarLivre(m.anoEscolar)
        ? (m.anoEscolarOutro || '').trim()
        : (Core.ANOS_ESCOLARES[m.anoEscolar] || '')
    });
    var nome = 'Mapeamento_' + Core.nomeArquivo(aluno.nome) + '_' + m.data + '.pdf';
    var blob = new Blob([bytes], { type: 'application/pdf' });
    entregarArquivo(nome, blob, 'Mapeamento de ' + aluno.nome);
  }

  /* Últimas aulas do aluno, da mais recente para a mais antiga. */
  function desenharHistorico(caixa, aluno) {
    caixa.innerHTML = '';

    var aulas = db.aulas.filter(function (a) { return a.alunoId === aluno.id; })
      .sort(function (a, b) { return b.data.localeCompare(a.data); });

    if (!aulas.length) {
      caixa.appendChild(el('div', { class: 'vazio' }, [
        el('p', { texto: 'Nenhuma aula registrada para ' + aluno.nome + ' ainda.' })
      ]));
      return;
    }

    var hoje = Core.hojeIso();
    var passadas = aulas.filter(function (a) { return a.data <= hoje; });
    var futuras = aulas.filter(function (a) { return a.data > hoje; });

    var minutos = 0, cobradas = 0;
    passadas.forEach(function (a) {
      var st = Core.STATUS[a.status] || Core.STATUS.realizada;
      var cobravel = (typeof a.cobravel === 'boolean') ? a.cobravel : st.cobravelPadrao;
      if (!cobravel) return;
      minutos += a.duracaoMin || 0;
      cobradas++;
    });

    var desde = aluno.desde || (aulas.length ? aulas[aulas.length - 1].data : null);
    var resumo = el('div', { class: 'numeros', style: 'margin-bottom:12px' });
    [['Encontros', String(cobradas)],
    ['Horas somadas', Core.fmtHoras(minutos) + ' h'],
    ['Aluno desde', desde ? Core.ddmmaaaa(desde) : 'sem data'],
    ['Aulas marcadas', String(futuras.length)]].forEach(function (par) {
      resumo.appendChild(el('div', { class: 'numero' }, [
        el('div', { class: 'rotulo', texto: par[0] }),
        el('div', { class: 'valor', style: 'font-size:19px', texto: par[1] })
      ]));
    });
    caixa.appendChild(resumo);

    if (futuras.length) {
      caixa.appendChild(el('h3', { class: 'subtitulo', texto: 'Próximas aulas' }));
      linhasDeAula(caixa, futuras.slice().reverse().slice(0, 5));
    }

    caixa.appendChild(el('h3', { class: 'subtitulo', texto: 'Aulas já dadas' }));
    var mostrando = 8;
    var listaAulas = el('div');
    var maisBotao = el('div');
    caixa.appendChild(listaAulas);
    caixa.appendChild(maisBotao);

    function redesenhar() {
      listaAulas.innerHTML = '';
      maisBotao.innerHTML = '';
      linhasDeAula(listaAulas, passadas.slice(0, mostrando));
      if (passadas.length > mostrando) {
        maisBotao.appendChild(el('button', {
          type: 'button', class: 'btn', style: 'width:100%',
          texto: 'Ver mais (faltam ' + (passadas.length - mostrando) + ')',
          aoClick: function () { mostrando += 12; redesenhar(); }
        }));
      }
    }
    redesenhar();
  }

  function linhasDeAula(caixa, aulas) {
    aulas.forEach(function (a) {
      var st = Core.STATUS[a.status] || Core.STATUS.realizada;
      var cobravel = (typeof a.cobravel === 'boolean') ? a.cobravel : st.cobravelPadrao;
      var anotacao = (a.notaTexto || '').trim();

      var detalhes = [Core.diaSemanaCurto(a.data)];
      if (a.hora) detalhes.push(a.hora);
      detalhes.push(Core.fmtDuracao(a.duracaoMin));
      if (a.status !== 'realizada') detalhes.push(st.rotulo);
      if (!cobravel) detalhes.push('não cobrada');

      var linha = el('div', { class: 'item-lista linha-historico' }, [
        el('div', { class: 'cresce' }, [
          el('div', { class: 'nome' }, [
            document.createTextNode(Core.ddmmaaaa(a.data)),
            a.temNota ? el('span', { class: 'tag serie', texto: 'folha', style: 'margin-left:8px' }) : null,
            (a.anexos && a.anexos.length)
              ? el('span', { class: 'tag', texto: 'anexo', style: 'margin-left:6px' }) : null
          ]),
          el('div', { class: 'detalhe', texto: detalhes.join(' · ') }),
          anotacao ? el('div', { class: 'anotacao-historico', texto: anotacao }) : null
        ]),
        el('button', {
          type: 'button', class: 'btn pequeno', texto: 'Abrir',
          aoClick: function () {
            fecharModal('modal-aluno');
            setTimeout(function () { abrirAula(a.id, null); }, 120);
          }
        })
      ]);
      caixa.appendChild(linha);
    });
  }

  function salvarAluno() {
    var nome = $('#campo-nome').value.trim();
    if (!nome) { avisar('Informe o nome do aluno.'); return; }
    var corpo = $('#corpo-modal-aluno');
    var precos = corpo._precos();

    var encontroCriado = null;
    var provisorio = { precos: precos };
    var erros = Core.validarPrecos(provisorio);
    if (erros.length) { avisar(erros[0]); return; }

    if (alunoEmEdicao) {
      alunoEmEdicao.nome = nome;
      alunoEmEdicao.responsavel = $('#campo-responsavel').value.trim();
      alunoEmEdicao.cor = corpo._cor();
      alunoEmEdicao.precos = precos;
      alunoEmEdicao.obs = $('#campo-obs').value.trim();
      alunoEmEdicao.obsPedagogicas = $('#campo-obs-pedagogicas').value.trim();
      alunoEmEdicao.desde = $('#campo-desde').value || null;
    } else {
      var criado = {
        id: Core.uid(), nome: nome,
        responsavel: $('#campo-responsavel').value.trim(),
        cor: corpo._cor(), ativo: true, precos: precos,
        obs: $('#campo-obs').value.trim(),
        obsPedagogicas: $('#campo-obs-pedagogicas').value.trim(),
        desde: $('#campo-desde').value || null,
        mapeamentos: []
      };
      db.alunos.push(criado);

      var marcar = $('#campo-agendar-mapeamento');
      if (marcar && marcar.checked) {
        var dataEncontro = $('#campo-mapa-data').value;
        if (!dataEncontro) { avisar('Informe a data do encontro de mapeamento.'); return; }
        encontroCriado = {
          id: Core.uid(), alunoId: criado.id, serieId: null, destacada: false,
          tipo: 'mapeamento',
          data: dataEncontro,
          hora: $('#campo-mapa-hora').value || '',
          duracaoMin: parseInt($('#campo-mapa-duracao').value, 10) || 90,
          status: 'realizada', cobravel: true,
          notaTexto: '', temNota: false, anexos: [], areas: [], temas: []
        };
        db.aulas.push(encontroCriado);
        if (!criado.desde) criado.desde = dataEncontro;
      }
    }
    salvar().then(function () {
      fecharModal('modal-aluno');
      desenharTudo();
      if (encontroCriado) {
        irParaMes(Core.mesDe(encontroCriado.data));
        abrirAula(encontroCriado.id);
        avisar('Aluno salvo e encontro de mapeamento marcado para ' +
          Core.ddmmaaaa(encontroCriado.data) + '.');
        return;
      }
      avisar('Aluno salvo.');
    });
  }

  function excluirAlunoAtual() {
    if (!alunoEmEdicao) return;
    var qtd = db.aulas.filter(function (a) { return a.alunoId === alunoEmEdicao.id; }).length;
    if (!confirmar('Excluir ' + alunoEmEdicao.nome + ' e as ' + qtd + ' aulas registradas?')) return;
    var id = alunoEmEdicao.id;
    comDesfazer('Aluno excluído.', function () {
      db.alunos = db.alunos.filter(function (a) { return a.id !== id; });
      db.aulas = db.aulas.filter(function (a) { return a.alunoId !== id; });
      db.series = (db.series || []).filter(function (s) { return s.alunoId !== id; });
      db.resumos = db.resumos.filter(function (r) { return r.alunoId !== id; });
    }).then(function () {
      fecharModal('modal-aluno');
      desenharTudo();
    });
  }

  // ================= editor da folha de aula =================

  function abrirEditorNota(aulaId) {
    var aula = db.aulas.filter(function (a) { return a.id === aulaId; })[0];
    if (!aula) return;
    var aluno = alunoPorId(aula.alunoId);
    $('#titulo-modal-nota').textContent = 'Folha de aula, ' + (aluno ? aluno.nome : '') +
      ', ' + Core.ddmmaaaa(aula.data);

    Store.lerNota(aulaId).then(function (nota) {
      var usada = nota || Draw.notaVazia('pautado');
      var refs = [];
      usada.paginas.forEach(function (p) {
        (p.itens || []).forEach(function (it) { if (it.t === 'imagem' && it.ref) refs.push(it.ref); });
      });
      return Promise.all(refs.map(function (r) {
        return Store.lerMidia(r).then(function (m) { return { ref: r, midia: m }; });
      })).then(function (lista) {
        midiasCarregadas = {};
        lista.forEach(function (x) {
          if (!x.midia) return;
          var img = new Image();
          img.src = x.midia.dataUrl;
          midiasCarregadas[x.ref] = { dataUrl: x.midia.dataUrl, w: x.midia.w, h: x.midia.h, img: img };
        });
        montarEditor(aula, usada);
      });
    });
  }

  function montarEditor(aula, nota) {
    abrirModal('modal-nota');

    if (editorAtual) { editorAtual.destruir(); editorAtual = null; }

    var canvas = $('#tela-desenho');
    editorAtual = new Draw.Editor(canvas, {
      nota: nota,
      midias: midiasCarregadas,
      aoMudar: function () { agendarGravacaoNota(aula.id); },
      aoTrocarFerramenta: function () { desenharFerramentas(aula); },
      aoPedirTexto: function (p) { pedirTextoDaFolha(p, aula); }
    });

    // A folha precisa saber a que aula pertence antes de qualquer gravação.
    // Antes isso era definido dentro do desenho da barra de ferramentas, e um
    // tropeço ali deixava a folha sem dono e sem ser salva.
    editorAtual._aulaId = aula.id;

    // o canvas só tem tamanho depois que o painel aparece
    setTimeout(function () { if (editorAtual) editorAtual.ajustarTamanho(); }, 30);

    desenharFerramentas(aula);
    desenharRodapeNota(aula);
    ligarColagem();
  }

  /* Painel de texto da folha. Antes isso era a janela do navegador, que no
   * aplicativo instalado aparece como "romulorod1.github.io diz" e só aceita
   * uma linha. */
  function pedirTextoDaFolha(ponto, aula) {
    var area = $('#campo-texto-folha');
    area.value = '';
    $('#campo-texto-tamanho').value = '30';
    abrirModal('modal-texto');
    setTimeout(function () { area.focus(); }, 80);
    $('#salvar-texto-folha').onclick = function () {
      var txt = area.value.trim();
      fecharModal('modal-texto');
      if (!txt || !editorAtual) return;
      editorAtual.adicionarTexto(txt, ponto.x, ponto.y, parseInt($('#campo-texto-tamanho').value, 10) || 30);
      desenharFerramentas(aula);
    };
  }

  var gravacaoPendente = null;
  function agendarGravacaoNota(aulaId) {
    clearTimeout(gravacaoPendente);
    gravacaoPendente = setTimeout(function () { gravarNota(aulaId); }, 400);
  }

  /* Se o tablet for bloqueado ou o aplicativo for para segundo plano no meio da
   * escrita, grava na hora. Nenhum traço pode se perder por causa disso. */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && editorAtual && editorAtual._aulaId) {
      clearTimeout(gravacaoPendente);
      gravarNota(editorAtual._aulaId);
    }
  });
  window.addEventListener('pagehide', function () {
    if (editorAtual && editorAtual._aulaId) {
      clearTimeout(gravacaoPendente);
      gravarNota(editorAtual._aulaId);
    }
  });

  function gravarNota(aulaId) {
    if (!editorAtual) return Promise.resolve();
    var nota = editorAtual.nota;
    var temConteudo = nota.paginas.some(function (p) { return (p.itens || []).length; });
    var aula = db.aulas.filter(function (a) { return a.id === aulaId; })[0];
    return Store.salvarNota(aulaId, temConteudo ? nota : null).then(function () {
      if (aula && aula.temNota !== temConteudo) {
        aula.temNota = temConteudo;
        return salvar();
      }
    });
  }

  function fecharEditorNota() {
    clearTimeout(gravacaoPendente);
    var p = editorAtual ? gravarNota(editorAtual._aulaId) : Promise.resolve();
    p.then(function () {
      if (editorAtual) { editorAtual.destruir(); editorAtual = null; }
      fecharModal('modal-nota');
      desenharAgenda();
    });
  }

  /* Ícones da barra da folha. SVG inline, para acompanhar a cor do botão e não
   * depender de fonte de emoji, que muda de aparelho para aparelho. */
  function svg(caminho, extra) {
    return '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" ' +
      'fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + caminho + (extra || '') + '</svg>';
  }

  var ICONES = {
    // caneta apontando para baixo e à esquerda, com a ponta marcada
    caneta: svg('<path d="M16.8 3.6a2 2 0 0 1 2.8 2.8L8.4 17.6 4 20l2.4-4.4z"/>' +
      '<path d="M14.6 5.8l3.6 3.6"/>'),
    // marca-texto: ponta chanfrada e o rastro largo embaixo
    marcatexto: svg('<path d="M14.5 3.5l6 6-7.4 7.4H7.1v-6z"/>' +
      '<path d="M4 21h16" stroke-width="3"/>'),
    // borracha: o bloco inclinado apoiado na linha, que é como se desenha borracha
    borracha: svg('<path d="M8.6 19.5H20"/>' +
      '<path d="M14.2 4.6l5.2 5.2a1.6 1.6 0 0 1 0 2.3l-7.4 7.4H7.6l-3.1-3.1a1.6 1.6 0 0 1 0-2.3z"/>' +
      '<path d="M10.1 8.7l5.2 5.2"/>'),
    // texto: o T clássico, mas desenhado
    texto: svg('<path d="M5 6.5V5h14v1.5"/><path d="M12 5v14"/><path d="M9 19h6"/>'),
    // mover: as quatro setas
    selecao: svg('<path d="M12 3v18M3 12h18"/>' +
      '<path d="M12 3l-2.6 2.6M12 3l2.6 2.6M12 21l-2.6-2.6M12 21l2.6-2.6"/>' +
      '<path d="M3 12l2.6-2.6M3 12l2.6 2.6M21 12l-2.6-2.6M21 12l2.6 2.6"/>')
  };

  function desenharFerramentas(aula) {
    if (!editorAtual) return;
    editorAtual._aulaId = aula.id;
    var barra = $('#ferramentas-nota');
    barra.innerHTML = '';

    /* Os ícones são desenhados, e não símbolos de teclado. O ⌫ que estava aqui
     * é o sinal de apagar do teclado, e ninguém lê aquilo como borracha. */
    var ferramentas = [
      ['caneta', ICONES.caneta, 'Caneta'],
      ['marcatexto', ICONES.marcatexto, 'Marca-texto'],
      ['borracha', ICONES.borracha, 'Borracha'],
      ['texto', ICONES.texto, 'Texto digitado'],
      ['selecao', ICONES.selecao, 'Mover e redimensionar']
    ];
    ferramentas.forEach(function (f) {
      var b = el('button', {
        type: 'button', title: f[2], 'aria-label': f[2],
        class: 'ferr' + (editorAtual.ferramenta === f[0] ? ' ativa' : ''),
        html: f[1]
      });
      b.addEventListener('click', function () {
        editorAtual.ferramenta = f[0];
        editorAtual.selecionado = null;
        editorAtual.precisaRedesenhar = true;
        desenharFerramentas(aula);
      });
      barra.appendChild(b);
    });

    barra.appendChild(el('div', { class: 'separador' }));

    Draw.PALETA.forEach(function (c) {
      var b = el('button', {
        type: 'button', title: c.nome,
        class: 'cor-opcao' + (editorAtual.cor === c.cor ? ' ativa' : ''),
        style: 'background:' + c.cor
      });
      b.addEventListener('click', function () {
        editorAtual.cor = c.cor;
        desenharFerramentas(aula);
      });
      barra.appendChild(b);
    });

    barra.appendChild(el('div', { class: 'separador' }));

    Draw.ESPESSURAS.forEach(function (e) {
      var b = el('button', {
        type: 'button', title: e.nome,
        class: 'ferr' + (editorAtual.espessura === e.valor ? ' ativa' : '')
      });
      var ponto = el('span', {
        style: 'display:block;border-radius:50%;background:currentColor;width:' +
          Math.max(4, e.valor) + 'px;height:' + Math.max(4, e.valor) + 'px'
      });
      b.appendChild(ponto);
      b.addEventListener('click', function () {
        editorAtual.espessura = e.valor;
        desenharFerramentas(aula);
      });
      barra.appendChild(b);
    });

    barra.appendChild(el('div', { class: 'separador' }));

    barra.appendChild(el('button', {
      type: 'button', class: 'ferr', title: 'Desfazer', texto: '↶',
      aoClick: function () { editorAtual.desfazer(); }
    }));
    barra.appendChild(el('button', {
      type: 'button', class: 'ferr', title: 'Refazer', texto: '↷',
      aoClick: function () { editorAtual.refazer(); }
    }));

    if (editorAtual.selecionado) {
      barra.appendChild(el('button', {
        type: 'button', class: 'ferr', title: 'Remover o item selecionado', texto: '🗑',
        aoClick: function () { editorAtual.removerSelecionado(); desenharFerramentas(aula); }
      }));
    }

    barra.appendChild(el('span', { class: 'cresce' }));

    barra.appendChild(el('button', {
      type: 'button', class: 'btn pequeno', texto: 'Imagem',
      aoClick: function () { inserirImagem(); }
    }));
  }

  function desenharRodapeNota(aula) {
    var rodape = $('#rodape-nota');
    rodape.innerHTML = '';

    var selFundo = el('select', { style: 'max-width:150px;min-height:38px' });
    [['branco', 'Sem pauta'], ['pautado', 'Pautado'], ['pontilhado', 'Pontilhado']].forEach(function (f) {
      var o = el('option', { value: f[0], texto: f[1] });
      if (editorAtual.pagina().fundo === f[0]) o.selected = true;
      selFundo.appendChild(o);
    });
    selFundo.addEventListener('change', function () { editorAtual.trocarFundo(this.value); });
    rodape.appendChild(selFundo);

    rodape.appendChild(el('div', { class: 'separador' }));

    rodape.appendChild(el('button', {
      type: 'button', class: 'btn pequeno', texto: '‹',
      aoClick: function () { editorAtual.irParaPagina(editorAtual.indicePagina - 1); desenharRodapeNota(aula); }
    }));
    rodape.appendChild(el('span', {
      class: 'contador-pagina',
      texto: 'Folha ' + (editorAtual.indicePagina + 1) + ' de ' + editorAtual.nota.paginas.length
    }));
    rodape.appendChild(el('button', {
      type: 'button', class: 'btn pequeno', texto: '›',
      aoClick: function () { editorAtual.irParaPagina(editorAtual.indicePagina + 1); desenharRodapeNota(aula); }
    }));
    rodape.appendChild(el('button', {
      type: 'button', class: 'btn pequeno', texto: '+ Folha',
      aoClick: function () { editorAtual.novaPagina(); desenharRodapeNota(aula); }
    }));
    rodape.appendChild(el('button', {
      type: 'button', class: 'btn pequeno perigo', texto: 'Apagar folha',
      aoClick: function () {
        if (!confirmar('Apagar esta folha?')) return;
        editorAtual.removerPagina();
        desenharRodapeNota(aula);
      }
    }));

    rodape.appendChild(el('span', { class: 'cresce' }));

    rodape.appendChild(el('button', {
      type: 'button', class: 'btn pequeno', texto: 'Ajustar à tela',
      aoClick: function () { editorAtual.ajustarNaTela(); }
    }));
    rodape.appendChild(el('button', {
      type: 'button', class: 'btn principal pequeno', texto: 'Concluir',
      aoClick: fecharEditorNota
    }));
  }

  function inserirImagem() {
    var entrada = $('#entrada-imagem');
    entrada.value = '';
    entrada.onchange = function () {
      var arquivo = entrada.files && entrada.files[0];
      if (!arquivo) return;
      adicionarImagemAoEditor(arquivo);
    };
    entrada.click();
  }

  function adicionarImagemAoEditor(arquivo) {
    if (!editorAtual) return;
    prepararImagem(arquivo).then(function (r) {
      var ref = Core.uid();
      return Store.salvarMidia(ref, { dataUrl: r.dataUrl, w: r.w, h: r.h }).then(function () {
        editorAtual.registrarMidia(ref, r.dataUrl, r.w, r.h);
        midiasCarregadas[ref] = editorAtual.midias[ref];
        editorAtual.adicionarImagem(ref, r.w, r.h);
        desenharFerramentas({ id: editorAtual._aulaId });
        avisar('Imagem inserida. Arraste para posicionar e use o canto para redimensionar.');
      });
    }).catch(function (e) { avisar('Não foi possível inserir a imagem.'); });
  }

  /* Colar print copiado da internet, direto na folha. */
  function ligarColagem() {
    if (window._colagemLigada) return;
    window._colagemLigada = true;
    window.addEventListener('paste', function (e) {
      if (!editorAtual || !$('#modal-nota').classList.contains('aberto')) return;
      var itens = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < itens.length; i++) {
        if (itens[i].type && itens[i].type.indexOf('image') === 0) {
          var arquivo = itens[i].getAsFile();
          if (arquivo) { e.preventDefault(); adicionarImagemAoEditor(arquivo); return; }
        }
      }
    });
  }

  // ================= mapeamento do aluno =================
  //
  // Nunca é tarde para mapear: a janela é a mesma para o aluno que chegou hoje
  // e para o que estuda com ela há dois anos. O que muda é só de onde ela abriu.

  var ROTEIRO_MAPEAMENTO = [
    ['Conversa com o responsável, 10 minutos',
      'Por que procuraram apoio agora, o que esperam, como é a rotina em casa e ' +
      'como o colégio avalia.'],
    ['Conversa com o aluno, 10 minutos',
      'O que ele acha que sabe e o que acha que não sabe. Vale mais o que ele diz ' +
      'do que a nota do boletim.'],
    ['Sondagem escrita, 25 minutos',
      'Use "Material de aula" e monte uma lista curta com exercícios de anos anteriores. ' +
      'Não é prova: é para ver onde ele trava e como ele pensa.'],
    ['Preencher o mapeamento, 10 minutos',
      'Marque pontos fortes, pontos de atenção e lacunas, e escreva o plano inicial.'],
    ['Combinados, 5 minutos',
      'Frequência, dever de casa, remarcação, como e quando você vai dar retorno.']
  ];

  /* O mapeamento que está aberto para editar em cima do registro guardado.
   *
   * Guarda como o registro estava NO DISCO quando a janela abriu. Serve a duas
   * coisas: dbParaGravar() usa a foto para que nenhuma gravação feita enquanto
   * a janela está aberta leve o que ela ainda não confirmou, e fechar sem
   * salvar devolve a foto à memória. Vale só para a edição EM CIMA do registro
   * guardado; uma revisão nova já nasce num objeto separado. */
  var mapeamentoEmEdicao = null;

  function descartarMapeamentoEmEdicao() {
    var m = mapeamentoEmEdicao;
    mapeamentoEmEdicao = null;
    if (!m) return false;
    var aluno = alunoPorId(m.alunoId);
    var lista = aluno && aluno.mapeamentos;
    if (!lista) return false;
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].id === m.id) { lista[i] = m.disco; return true; }
    }
    return false;
  }

  function abrirMapeamento(alunoId, opcoes) {
    opcoes = opcoes || {};
    var aluno = alunoPorId(alunoId);
    if (!aluno) return;
    aluno.mapeamentos = aluno.mapeamentos || [];

    var atual = Core.mapeamentoAtual(aluno);
    var trabalho;
    if (opcoes.novo || !atual) {
      // Uma revisão nova começa do último preenchimento: quase nada muda de um
      // semestre para o outro, e redigitar tudo faria ela não refazer nunca.
      descartarMapeamentoEmEdicao();
      trabalho = atual ? JSON.parse(JSON.stringify(atual)) : Core.mapeamentoNovo();
      trabalho.id = Core.uid();
      trabalho.data = Core.hojeIso();
      trabalho.aulaId = opcoes.aulaId || null;
      trabalho._novo = true;
    } else {
      trabalho = atual;
      /* A foto é tirada UMA vez por sessão de edição. Voltar de "Ver" um
       * mapeamento antigo passa por aqui de novo, e refotografar ali gravaria
       * como se fosse disco o que ela digitou nesta mesma janela. */
      if (!mapeamentoEmEdicao || mapeamentoEmEdicao.id !== trabalho.id ||
          mapeamentoEmEdicao.alunoId !== aluno.id) {
        descartarMapeamentoEmEdicao();
        mapeamentoEmEdicao = {
          alunoId: aluno.id, id: trabalho.id,
          disco: JSON.parse(JSON.stringify(trabalho))
        };
      }
    }
    trabalho.marcados = trabalho.marcados || {};
    Core.MAPA.forEach(function (g) {
      trabalho.marcados[g.chave] = (trabalho.marcados[g.chave] || []).slice();
    });
    /* As matérias que não são matemática moram aqui, e o campo nasce ausente em
     * todo mapeamento que já existe: por isso ele é criado na entrada, e não
     * exigido de quem gravou antes. */
    trabalho.porMateria = trabalho.porMateria || {};

    $('#titulo-modal-mapeamento').textContent = 'Mapeamento de ' + aluno.nome;
    var corpo = $('#corpo-modal-mapeamento');
    var rodape = $('#rodape-modal-mapeamento');
    corpo.innerHTML = '';
    rodape.innerHTML = '';

    var anteriores = Core.mapeamentosDe(aluno).filter(function (m) { return m.id !== trabalho.id; });
    if (trabalho._novo && anteriores.length) {
      corpo.appendChild(el('div', { class: 'faixa-info' }, [
        el('strong', { texto: 'Revisão do mapeamento. ' }),
        document.createTextNode('Começa com o que estava marcado em ' +
          Core.ddmmaaaa(anteriores[anteriores.length - 1].data) +
          '. Ajuste o que mudou: o mapeamento anterior fica guardado do jeito que estava.')
      ]));
    }

    if (opcoes.aulaId) {
      corpo.appendChild(el('div', {
        class: 'ajuda', style: 'margin-top:0',
        texto: 'Este mapeamento fica ligado ao encontro de hoje.'
      }));
    }

    // ---- contexto ----
    corpo.appendChild(el('h3', { class: 'subtitulo', style: 'margin-top:6px', texto: 'Contexto' }));

    var campos = {};
    function campoTexto(chave, rotulo, dica, largo) {
      var e = el('input', { type: 'text', placeholder: dica || '' });
      e.value = trabalho[chave] || '';
      e.addEventListener('input', function () { trabalho[chave] = this.value; });
      campos[chave] = e;
      return el('label', { class: 'campo', 'data-campo': chave }, [el('span', { texto: rotulo }), e]);
    }

    /* O ano escolar deixou de ser uma lista fechada.
     *
     * A lista ia do 2º ano ao 3º do médio e acabava: não havia como registrar
     * aluno em cursinho, aluno que saiu da escola ou aluno em sistema de fora, e
     * ela era obrigada a escolher um ano que não era verdade ou a deixar em
     * branco. Agora os três casos entram na lista, e "Outro" abre um campo em
     * branco logo abaixo. O banco de temas continua entendendo só as séries: o
     * cursinho lê como 3º ano do médio, e os outros dois não viram série
     * nenhuma, o que faz a trilha propor o começo mais baixo. */
    var campoAnoLivre = el('input', {
      type: 'text', id: 'mapa-ano-outro',
      placeholder: 'Escreva qual, por exemplo: 1º período de engenharia'
    });
    campoAnoLivre.value = trabalho.anoEscolarOutro || aluno.anoEscolarOutro || '';
    campoAnoLivre.addEventListener('input', function () { trabalho.anoEscolarOutro = this.value; });
    var caixaAnoLivre = el('label', {
      class: 'campo', id: 'caixa-ano-outro', style: 'display:none'
    }, [el('span', { texto: 'Qual' }), campoAnoLivre]);

    corpo.appendChild(el('div', { class: 'linha' }, [
      campoTexto('escola', 'Colégio', 'Onde ele estuda'),
      (function () {
        var sel = el('select', { id: 'mapa-ano' });
        sel.appendChild(el('option', { value: '', texto: 'Não informado' }));
        Core.ANOS_ESCOLARES_ORDEM.forEach(function (id) {
          var o = el('option', { value: id, texto: Core.ANOS_ESCOLARES[id] });
          if (id === (trabalho.anoEscolar || aluno.anoEscolar)) o.selected = true;
          sel.appendChild(o);
        });
        sel.addEventListener('change', function () {
          trabalho.anoEscolar = this.value;
          caixaAnoLivre.style.display = Core.anoEscolarLivre(this.value) ? '' : 'none';
        });
        trabalho.anoEscolar = trabalho.anoEscolar || aluno.anoEscolar || '';
        return el('label', { class: 'campo' }, [el('span', { texto: 'Ano escolar' }), sel]);
      })()
    ]));
    caixaAnoLivre.style.display = Core.anoEscolarLivre(trabalho.anoEscolar) ? '' : 'none';
    corpo.appendChild(caixaAnoLivre);

    corpo.appendChild(el('div', { class: 'linha' }, [
      campoTexto('professor', 'Professor de matemática', 'Opcional'),
      campoTexto('calendarioProvas', 'Como o colégio avalia', 'Bimestral, trimestral, peso das provas')
    ]));

    corpo.appendChild(el('div', { class: 'linha' }, [
      campoTexto('indicacao', 'Como chegou até você', 'Indicação de quem'),
      campoTexto('motivo', 'Motivo da procura', 'Nota baixa, recuperação, aprofundamento')
    ]));

    corpo.appendChild(el('label', { class: 'campo' }, [
      el('span', { texto: 'Expectativa da família' }),
      (function () {
        var t = el('textarea', {
          style: 'min-height:56px',
          placeholder: 'O que eles esperam ver mudar, e em quanto tempo.'
        });
        t.value = trabalho.expectativa || '';
        t.addEventListener('input', function () { trabalho.expectativa = this.value; });
        return t;
      })()
    ]));

    // ---- para onde o aluno está indo ----
    desenharObjetivo(corpo, trabalho);

    // ---- listas de marcar, divididas entre a matéria e o aluno ----
    //
    // Metade do mapeamento é sobre a matéria e metade é sobre o aluno. Marcar
    // "estuda só na véspera" ou "fica ansioso perto da prova" é o mesmo aluno
    // em matemática e em história, e ela não deveria responder de novo a cada
    // matéria; já em que ponto ele está, o que erra e o que ficou para trás
    // muda de uma matéria para a outra.
    //
    // A ordem na tela é: primeiro a matéria escolhida, depois o aluno. É a
    // matéria que ela vem revisitar, uma por vez; o bloco do aluno fica
    // respondido de uma vez e quase não muda. É também a única ordem possível
    // sem separar em dois os grupos de Pontos fortes e Pontos de atenção, que
    // têm itens dos dois lados.

    function grade(itens, marcados, aoMudar) {
      var g = el('div', { class: 'grade-areas' });
      itens.forEach(function (item) {
        var chk = el('input', { type: 'checkbox', style: 'width:auto;min-height:auto' });
        chk.checked = marcados.indexOf(item.id) >= 0;
        chk.addEventListener('change', function () { aoMudar(item, this.checked); });
        var filhos = [chk, el('span', { class: 'cresce', texto: item.rotulo })];
        /* A lacuna monta a trilha: a sequência de assuntos que precisa vir
         * antes daquele em que o aluno travou, na ordem. Continua sendo UM
         * botão por lacuna, e o caminho antigo não some: dentro da trilha há
         * "Ver os temas soltos", que abre a mesma lista de sempre. */
        if (item.busca || (item.alvos && item.alvos.length)) {
          filhos.push(el('button', {
            type: 'button', class: 'btn pequeno', texto: 'trilha',
            title: 'Montar a trilha até ' + item.rotulo,
            aoClick: function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              abrirTrilhaDaLacuna(aluno, item);
            }
          }));
        }
        g.appendChild(el('label', {
          class: 'item-area', 'data-item': item.chaveDoGrupo + ':' + item.id
        }, filhos));
      });
      return g;
    }

    function cabecalhoDeGrupo(destino, titulo, ajuda, quantos, caixa) {
      var contador = el('span', { class: 'tag' });
      function atualizar(n) {
        contador.textContent = n ? n + ' marcados' : 'nenhum';
        contador.className = 'tag' + (n ? ' cheia' : '');
      }
      atualizar(quantos);
      var botao = el('button', { type: 'button', class: 'btn pequeno', texto: 'Esconder' });
      botao.addEventListener('click', function () {
        var aberto = caixa.style.display !== 'none';
        caixa.style.display = aberto ? 'none' : '';
        botao.textContent = aberto ? 'Mostrar' : 'Esconder';
      });
      destino.appendChild(el('div', { class: 'barra', style: 'margin:16px 0 2px' }, [
        el('h3', { class: 'subtitulo', style: 'margin:0;border:none', texto: titulo }),
        contador,
        el('span', { class: 'cresce' }),
        botao
      ]));
      destino.appendChild(el('div', { class: 'ajuda', style: 'margin-top:0', texto: ajuda }));
      return atualizar;
    }

    var materiaAberta = Core.MATERIA_PADRAO;
    var caixaMateria = el('div', { id: 'bloco-materia' });

    function desenharMateria() {
      caixaMateria.innerHTML = '';
      var mat = Core.materiaPorId(materiaAberta) || Core.materiaPorId(Core.MATERIA_PADRAO);

      if (mat.livre) {
        var nomeLivre = el('input', {
          type: 'text', id: 'mapa-materia-nome', placeholder: 'Escreva qual, por exemplo: Espanhol'
        });
        nomeLivre.value = (Core.garantirMateria(trabalho, mat.id).nome || '');
        nomeLivre.addEventListener('input', function () {
          Core.garantirMateria(trabalho, mat.id).nome = this.value;
        });
        caixaMateria.appendChild(el('label', { class: 'campo' }, [
          el('span', { texto: 'Qual matéria' }), nomeLivre
        ]));
      }

      /* Física e química vêm junto, sem trabalho nenhum. Quando um aluno trava
       * nelas, quase sempre o que falta é matemática: proporção, isolar a
       * variável, potência de dez, trigonometria. Esses assuntos já estão no
       * banco de temas e a busca já sabe achar, então em vez de uma lista de
       * lacunas de física, que ninguém preencheria, fica dito onde procurar. */
      if (mat.apoiaEmMatematica) {
        caixaMateria.appendChild(el('div', { class: 'faixa-info', id: 'apoio-matematica' }, [
          el('strong', { texto: 'Quando ele trava aqui, costuma faltar matemática. ' }),
          document.createTextNode('Proporção, isolar a variável, potência de dez e trigonometria ' +
            'já existem no banco de temas. Marque a lacuna em Matemática: a trilha e a busca ' +
            'levam aos mesmos assuntos.')
        ]));
      }

      Core.gruposDaMateria(mat.id).forEach(function (grupo) {
        var itens = Core.itensDaMateria(grupo.chave, mat.id).map(function (i) {
          var copia = {};
          Object.keys(i).forEach(function (k) { copia[k] = i[k]; });
          copia.chaveDoGrupo = grupo.chave;
          return copia;
        });
        var marcados = Core.marcadosDaMateria(trabalho, mat.id)[grupo.chave];
        var caixa = el('div', { 'data-grupo': grupo.chave });
        var atualizar = cabecalhoDeGrupo(caixaMateria, grupo.titulo, grupo.ajuda,
          marcados.length, caixa);
        caixa.appendChild(grade(itens, marcados, function (item, ligado) {
          Core.marcarNaMateria(trabalho, mat.id, grupo.chave, item.id, ligado);
          atualizar(Core.marcadosDaMateria(trabalho, mat.id)[grupo.chave].length);
        }));
        caixaMateria.appendChild(caixa);
      });

      /* O que o colégio vai cobrar no bimestre, tirado da lista que o aluno já
       * manda. Em história é o que entra no lugar da lista de lacunas, que ali
       * não existe; em matemática soma-se às lacunas, porque a lista do colégio
       * é útil de qualquer jeito. */
      var cob = el('textarea', {
        id: 'mapa-cobranca', style: 'min-height:72px',
        placeholder: 'Os assuntos que o colégio vai cobrar neste bimestre nesta matéria.'
      });
      cob.value = Core.cobrancaDaMateria(trabalho, mat.id);
      cob.addEventListener('input', function () {
        Core.definirCobranca(trabalho, mat.id, this.value);
      });
      caixaMateria.appendChild(el('label', { class: 'campo', style: 'margin-top:14px' }, [
        el('span', { texto: 'O que o colégio vai cobrar no bimestre' }), cob
      ]));
    }

    corpo.appendChild(el('h3', { class: 'subtitulo', texto: 'A matéria' }));
    corpo.appendChild(el('div', {
      class: 'ajuda', style: 'margin-top:0',
      texto: 'Esta parte se repete por matéria que você dá para este aluno. ' +
        'Trocar a matéria aqui em cima troca só o que está abaixo.'
    }));
    var selMateria = el('select', { id: 'mapa-materia' });
    var jaPreenchidas = Core.materiasDoMapeamento(trabalho);
    Core.MATERIAS.forEach(function (mat) {
      var jaTem = jaPreenchidas.indexOf(mat.id) >= 0;
      var o = el('option', {
        value: mat.id,
        texto: Core.rotuloMateria(trabalho, mat.id) + (jaTem && mat.id !== Core.MATERIA_PADRAO ? ' (preenchida)' : '')
      });
      if (mat.id === materiaAberta) o.selected = true;
      selMateria.appendChild(o);
    });
    selMateria.addEventListener('change', function () {
      materiaAberta = this.value;
      desenharMateria();
    });
    corpo.appendChild(el('label', { class: 'campo' }, [
      el('span', { texto: 'Matéria' }), selMateria
    ]));
    corpo.appendChild(caixaMateria);
    desenharMateria();

    corpo.appendChild(el('h3', { class: 'subtitulo', style: 'margin-top:22px', texto: 'O aluno' }));
    corpo.appendChild(el('div', {
      class: 'ajuda', style: 'margin-top:0',
      texto: 'Isto vale em qualquer matéria e fica respondido uma vez só. ' +
        'Não é preciso repetir quando você abrir outra matéria.'
    }));

    Core.gruposDoAluno().forEach(function (grupo) {
      var itens = Core.itensDoAluno(grupo.chave).map(function (i) {
        var copia = {};
        Object.keys(i).forEach(function (k) { copia[k] = i[k]; });
        copia.chaveDoGrupo = grupo.chave;
        return copia;
      });
      var marcados = trabalho.marcados[grupo.chave];
      /* Os grupos que são inteiros sobre o aluno mantêm o data-grupo, e por isso
       * rotina e aprende continuam aparecendo aqui, na ordem de sempre. Pontos
       * fortes e Pontos de atenção têm itens dos dois lados: a metade da matéria
       * ficou no bloco de cima, e esta metade não repete o data-grupo para não
       * haver dois elementos dizendo ser o mesmo grupo. */
      var caixa = el('div',
        grupo.sobre === 'aluno' ? { 'data-grupo': grupo.chave } : { 'data-grupo-aluno': grupo.chave });
      var titulo = grupo.sobre === 'aluno' ? grupo.titulo : grupo.titulo + ' do aluno';
      var atualizar = cabecalhoDeGrupo(corpo, titulo, grupo.ajuda,
        Core.marcadosDoAluno(trabalho)[grupo.chave].length, caixa);
      caixa.appendChild(grade(itens, marcados, function (item, ligado) {
        var i = marcados.indexOf(item.id);
        if (ligado && i < 0) marcados.push(item.id);
        if (!ligado && i >= 0) marcados.splice(i, 1);
        atualizar(Core.marcadosDoAluno(trabalho)[grupo.chave].length);
      }));
      corpo.appendChild(caixa);
    });

    // ---- leitura dela ----
    corpo.appendChild(el('h3', { class: 'subtitulo', texto: 'A sua leitura' }));

    var selNivel = el('select', { id: 'mapa-nivel' });
    selNivel.appendChild(el('option', { value: '', texto: 'Não avaliado' }));
    Core.NIVEIS.forEach(function (n) {
      var o = el('option', { value: n.id, texto: n.rotulo });
      if (n.id === String(trabalho.nivel || '')) o.selected = true;
      selNivel.appendChild(o);
    });
    selNivel.addEventListener('change', function () { trabalho.nivel = this.value; });
    corpo.appendChild(el('label', { class: 'campo' }, [
      el('span', { texto: 'Onde ele está hoje' }), selNivel
    ]));

    function campoLongo(chave, rotulo, dica, altura) {
      var t = el('textarea', { style: 'min-height:' + (altura || 72) + 'px', placeholder: dica });
      t.value = trabalho[chave] || '';
      t.addEventListener('input', function () { trabalho[chave] = this.value; });
      campos[chave] = t;
      return el('label', { class: 'campo', 'data-campo': chave }, [el('span', { texto: rotulo }), t]);
    }

    corpo.appendChild(campoLongo('prioridades', 'Prioridades para os próximos encontros',
      'Duas ou três, no máximo. É isto que vai aparecer ao abrir cada aula dele.', 72));
    corpo.appendChild(campoLongo('plano', 'Diagnóstico e plano inicial',
      'O que você entendeu do aluno e como pretende trabalhar nos próximos dois meses.', 96));

    if (anteriores.length) {
      corpo.appendChild(el('h3', { class: 'subtitulo', texto: 'Mapeamentos anteriores' }));
      anteriores.slice().reverse().forEach(function (m) {
        corpo.appendChild(el('div', { class: 'item-lista' }, [
          el('div', { class: 'cresce' }, [
            el('div', { class: 'nome', texto: Core.ddmmaaaa(m.data) }),
            el('div', {
              class: 'detalhe',
              texto: Core.rotuloNivel(m.nivel) ||
                ((m.marcados && m.marcados.lacunas ? m.marcados.lacunas.length : 0) + ' lacunas marcadas')
            })
          ]),
          el('button', {
            type: 'button', class: 'btn pequeno', texto: 'Ver',
            aoClick: function () { verMapeamentoAntigo(aluno, m); }
          })
        ]));
      });
    }

    rodape.appendChild(el('span', {
      class: 'esquerda ajuda', style: 'margin:0;align-self:center',
      texto: 'Mapeamento de ' + Core.ddmmaaaa(trabalho.data)
    }));
    rodape.appendChild(el('button', {
      type: 'button', class: 'btn', texto: 'Cancelar',
      aoClick: function () { fecharModal('modal-mapeamento'); }
    }));
    rodape.appendChild(el('button', {
      type: 'button', class: 'btn principal', id: 'salvar-mapeamento', texto: 'Salvar mapeamento',
      aoClick: function () {
        if (trabalho._novo) {
          delete trabalho._novo;
          aluno.mapeamentos.push(trabalho);
        }
        if (trabalho.anoEscolar) aluno.anoEscolar = trabalho.anoEscolar;
        if (Core.anoEscolarLivre(trabalho.anoEscolar)) {
          aluno.anoEscolarOutro = trabalho.anoEscolarOutro || '';
        }
        /* Este é o toque que autoriza a gravação: a foto do disco deixa de
         * valer AQUI, antes do salvar(), senão dbParaGravar() devolveria o
         * registro antigo e o botão não gravaria nada. */
        mapeamentoEmEdicao = null;
        salvar().then(function () {
          fecharModal('modal-mapeamento');
          if ($('#modal-aula').classList.contains('aberto') && aulaEmEdicao) {
            abrirAula(aulaEmEdicao.id);
          }
          desenharTudo();
          avisar('Mapeamento salvo.');
        });
      }
    }));

    abrirModal('modal-mapeamento');
    corpo.scrollTop = 0;
  }

  /* Para onde o aluno está indo.
   *
   * "Outro" fica em primeiro e traz campo em branco, porque nenhuma lista prevê
   * tudo. Com a data da prova preenchida, a janela da aula passa a mostrar
   * quantas semanas faltam, que é o número que muda a conversa.
   *
   * Nada aqui é obrigatório: sem objetivo registrado o bloco fica em branco e
   * a aula não mostra linha nenhuma. */
  function desenharObjetivo(corpo, trabalho) {
    trabalho.objetivo = trabalho.objetivo || { tipo: '', descricao: '', dataProva: '' };
    var obj = trabalho.objetivo;

    corpo.appendChild(el('h3', { class: 'subtitulo', texto: 'Para onde ele está indo' }));

    var campoLivre = el('input', {
      type: 'text', id: 'mapa-objetivo-outro',
      placeholder: 'Escreva qual, com as suas palavras'
    });
    campoLivre.value = obj.descricao || '';
    campoLivre.addEventListener('input', function () { obj.descricao = this.value; });
    var caixaLivre = el('label', { class: 'campo', id: 'caixa-objetivo-outro' },
      [el('span', { texto: 'Qual' }), campoLivre]);

    var sel = el('select', { id: 'mapa-objetivo' });
    sel.appendChild(el('option', { value: '', texto: 'Não registrado' }));
    Core.OBJETIVOS.forEach(function (o) {
      var op = el('option', { value: o.id, texto: o.rotulo });
      if (o.id === (obj.tipo || '')) op.selected = true;
      sel.appendChild(op);
    });
    function mostrarLivre() {
      var o = Core.objetivoPorId(obj.tipo);
      caixaLivre.style.display = (o && o.livre) ? '' : 'none';
    }
    sel.addEventListener('change', function () {
      obj.tipo = this.value;
      mostrarLivre();
    });

    var dataProva = el('input', { type: 'date', id: 'mapa-data-prova' });
    dataProva.value = obj.dataProva || '';
    dataProva.addEventListener('change', function () { obj.dataProva = this.value; });

    corpo.appendChild(el('div', { class: 'linha' }, [
      el('label', { class: 'campo' }, [el('span', { texto: 'Objetivo' }), sel]),
      el('label', { class: 'campo' }, [
        el('span', { texto: 'Data da prova, quando houver' }), dataProva
      ])
    ]));
    corpo.appendChild(caixaLivre);
    mostrarLivre();
    corpo.appendChild(el('div', {
      class: 'ajuda', style: 'margin-top:0',
      texto: 'Com a data preenchida, a janela de cada aula deste aluno passa a dizer ' +
        'quantas semanas faltam.'
    }));
  }

  /* Em que etapa o aluno está.
   *
   * Fica na ficha do aluno e não pede nada: nenhuma pergunta em toda aula.
   * Quando ela perceber que o aluno mudou, e isso leva semanas ou meses, toca
   * em "Mudou de etapa" naquela linha e escolhe uma das quatro. São dois
   * toques, e nada mais.
   *
   * O aplicativo nunca escolhe a etapa sozinho: seria inventar uma avaliação
   * que ela não fez. */
  /* As mesmas três linhas, só para ler, no alto da aba Dados.
   *
   * Devolve a função que redesenha, para o quadro da aba Mapeamento chamar
   * depois de registrar uma mudança: sem isso ela mudaria a etapa numa aba e
   * voltaria para a outra encontrando o valor velho. */
  function desenharResumoDeEtapas(caixa, aluno, irParaOQuadro) {
    var bloco = el('div', { class: 'resumo-etapas', id: 'resumo-etapas' });
    caixa.appendChild(bloco);

    function desenhar() {
      bloco.innerHTML = '';
      bloco.appendChild(el('div', { class: 'barra', style: 'margin-bottom:6px' }, [
        el('span', { class: 'rotulo-resumo-etapas', texto: 'Em que etapa ele está' }),
        el('span', { class: 'cresce' }),
        el('button', {
          type: 'button', class: 'btn pequeno', id: 'ir-para-etapas', texto: 'Marcar',
          aoClick: function () { if (irParaOQuadro) irParaOQuadro(); }
        })
      ]));
      Core.quadroDeEtapas(aluno).forEach(function (linha) {
        bloco.appendChild(el('div', { class: 'linha-resumo-etapa' }, [
          el('span', { class: 'frente-etapa', texto: linha.rotulo }),
          el('span', {
            class: 'valor-etapa' + (linha.atual ? '' : ' vazia'),
            texto: linha.atual
              ? linha.atual.rotulo + ', desde ' + Core.ddmmaaaa(linha.atual.desde)
              : 'ainda não marcada'
          })
        ]));
      });
    }

    desenhar();
    return desenhar;
  }

  function desenharEtapas(caixa, aluno) {
    var bloco = el('div', { class: 'quadro-etapas', id: 'quadro-etapas' });
    caixa.appendChild(bloco);

    function desenhar() {
      bloco.innerHTML = '';
      bloco.appendChild(el('div', { class: 'barra', style: 'margin-bottom:4px' }, [
        el('h3', { class: 'subtitulo', style: 'margin:0;border:none', texto: 'Em que etapa ele está' })
      ]));
      bloco.appendChild(el('div', {
        class: 'ajuda', style: 'margin-top:0',
        texto: 'Fica parado aqui mostrando o ponto. Toque em Mudou de etapa só quando ' +
          'perceber que ele andou, o que costuma levar semanas ou meses.'
      }));

      Core.quadroDeEtapas(aluno).forEach(function (linha) {
        var escolha = el('div', { class: 'escolha-etapa', style: 'display:none' });
        var corpoLinha = el('div', { class: 'cresce' }, [
          el('div', { class: 'nome', texto: linha.rotulo }),
          el('div', {
            class: 'detalhe',
            texto: linha.atual
              ? linha.atual.rotulo + ', desde ' + Core.ddmmaaaa(linha.atual.desde) +
                (linha.atual.anterior
                  ? '. Antes: ' + linha.atual.anterior.rotulo + ', desde ' +
                    Core.ddmmaaaa(linha.atual.anterior.desde) + '.'
                  : '')
              : 'Ainda não marcada. ' + linha.ajuda
          })
        ]);

        var botao = el('button', {
          type: 'button', class: 'btn pequeno',
          'data-etapa-frente': linha.frente,
          texto: linha.atual ? 'Mudou de etapa' : 'Marcar a etapa'
        });
        botao.addEventListener('click', function () {
          var aberto = escolha.style.display !== 'none';
          escolha.style.display = aberto ? 'none' : '';
        });

        Core.ETAPAS.forEach(function (etapa) {
          var atual = linha.atual && linha.atual.etapa === etapa.id;
          var b = el('button', {
            type: 'button',
            class: 'btn' + (atual ? ' principal' : ''),
            'data-etapa': linha.frente + ':' + etapa.id,
            title: etapa.ajuda,
            texto: etapa.rotulo
          });
          b.addEventListener('click', function () {
            if (atual) { escolha.style.display = 'none'; return; }
            var registro = null;
            comDesfazer('Etapa de ' + linha.rotulo.toLowerCase() + ' agora é ' +
              etapa.rotulo.toLowerCase() + '.', function () {
                registro = Core.registrarEtapa(aluno, linha.frente, etapa.id);
              }).then(function () {
                if (!registro) return;
                desenhar();
                if (resumoEtapas) resumoEtapas();
                desenharTudo();
              });
          });
          escolha.appendChild(b);
        });

        bloco.appendChild(el('div', { class: 'item-lista linha-etapa' }, [corpoLinha, botao]));
        bloco.appendChild(escolha);
      });
    }

    desenhar();
  }

  /* Um mapeamento antigo é só leitura: mexer nele reescreveria a história. */
  function verMapeamentoAntigo(aluno, m) {
    var corpo = $('#corpo-modal-mapeamento');
    var rodape = $('#rodape-modal-mapeamento');
    corpo.innerHTML = '';
    rodape.innerHTML = '';
    $('#titulo-modal-mapeamento').textContent =
      'Mapeamento de ' + aluno.nome + ' em ' + Core.ddmmaaaa(m.data);

    corpo.appendChild(el('div', {
      class: 'faixa-info',
      texto: 'Este é um mapeamento antigo, guardado como estava. Para mudar alguma coisa, ' +
        'refaça o mapeamento: o de hoje nasce a partir deste.'
    }));

    if (Core.rotuloNivel(m.nivel)) {
      corpo.appendChild(el('div', { class: 'bloco-exercicios', texto: 'Onde estava' }));
      corpo.appendChild(el('div', { style: 'font-size:14px', texto: Core.rotuloNivel(m.nivel) }));
    }

    function bloco(titulo, rotulos) {
      if (!rotulos.length) return;
      corpo.appendChild(el('div', { class: 'bloco-exercicios', texto: titulo }));
      corpo.appendChild(el('div', {
        style: 'font-size:14px;line-height:1.55', texto: rotulos.join(', ') + '.'
      }));
    }
    Core.materiasDoMapeamento(m).forEach(function (materiaId) {
      var marc = Core.marcadosDaMateria(m, materiaId);
      var nomeMateria = Core.rotuloMateria(m, materiaId);
      Core.MAPA.forEach(function (g) {
        bloco(nomeMateria + ': ' + g.titulo.toLowerCase(),
          Core.rotulosDoMapa(g.chave, marc[g.chave]));
      });
      var cobranca = Core.cobrancaDaMateria(m, materiaId);
      if (cobranca) {
        corpo.appendChild(el('div', {
          class: 'bloco-exercicios', texto: nomeMateria + ': o que o colégio cobrava no bimestre'
        }));
        corpo.appendChild(el('div', {
          style: 'font-size:14px;line-height:1.55;white-space:pre-wrap', texto: cobranca
        }));
      }
    });
    var doAlunoAntigo = Core.marcadosDoAluno(m);
    Core.MAPA.forEach(function (g) {
      bloco('O aluno: ' + g.titulo.toLowerCase(),
        Core.rotulosDoMapa(g.chave, doAlunoAntigo[g.chave]));
    });

    [['prioridades', 'Prioridades'], ['plano', 'Diagnóstico e plano'],
    ['expectativa', 'Expectativa da família'], ['motivo', 'Motivo da procura']].forEach(function (par) {
      var texto = (m[par[0]] || '').trim();
      if (!texto) return;
      corpo.appendChild(el('div', { class: 'bloco-exercicios', texto: par[1] }));
      corpo.appendChild(el('div', {
        style: 'font-size:14px;line-height:1.55;white-space:pre-wrap', texto: texto
      }));
    });

    rodape.appendChild(el('button', {
      type: 'button', class: 'btn', texto: '‹ Voltar',
      aoClick: function () { abrirMapeamento(aluno.id); }
    }));
    rodape.appendChild(el('button', {
      type: 'button', class: 'btn principal', texto: 'Fechar',
      aoClick: function () { fecharModal('modal-mapeamento'); }
    }));
    corpo.scrollTop = 0;
  }

  /* Abre o banco de temas já filtrado por uma lacuna, sem aula nenhuma por
   * trás: aqui ela está olhando material, não montando uma aula. */
  function abrirTemasPorBusca(busca, aluno) {
    abrirTemas(null, { busca: busca, aluno: aluno });
  }

  /* ===================== a trilha da lacuna =====================
   *
   * Marcar "Frações" no mapeamento levava a uma busca que devolve dezoito temas
   * em ordem de relevância, começando pelo 8º ano e pulando para o 4º: uma
   * lista sem ordem, em que ela decidia de cabeça por onde começar. A trilha
   * monta a sequência que precisa vir ANTES do assunto em que o aluno travou,
   * na ordem, e diz quantos encontros deve levar.
   *
   * O motor é todo do core.js e é função pura. Aqui é só o que ela vê e toca.
   * Três coisas mandam neste desenho, e as três vêm do tablet dela:
   *   - alvo de toque grande, porque ela usa isto em pé, na casa da família;
   *   - SETAS para reordenar, nunca arrasto, que é o gesto que falha dentro de
   *     uma janela que rola, tanto com o dedo quanto com a S Pen;
   *   - nenhum gesto novo por aula: a trilha anda pelo registro do assunto, que
   *     ela já faz hoje. */

  /* A proposta só existe entre montar e guardar; a lista dos cortados viaja
   * junto porque é ela que alimenta o "Puxar mais de trás". */
  var propostaDeTrilha = null;

  /* "1 hora" lê melhor do que "1h" numa frase corrida, e é ela que lê. */
  function duracaoPorExtenso(min) {
    if (min === 60) return '1 hora';
    if (min % 60 === 0) return (min / 60) + ' horas';
    if (min < 60) return min + ' minutos';
    return Core.fmtDuracao(min);
  }

  /* Nunca uma data de término: o calendário dela tem cancelamento, prova e
   * feriado, e data errada é pior do que data nenhuma. */
  function resumoDaTrilha(trilha, aluno) {
    /* Trilha encerrada não tem futuro para prometer: contar quantos encontros
     * "faltam" numa trilha que acabou é oferecer trabalho que não existe. */
    if (trilha.encerradaEm) return resumoDeTrilhaEncerrada(trilha);
    var passos = trilha.passos || [];
    if (!passos.length) return 'Nenhum passo. Acrescente ao menos um.';
    var feitos = Core.passosFeitos(trilha);
    var faltam = passos.filter(function (p) { return !p.feitoEm; });
    var dur = Core.duracaoHabitual(db, aluno ? aluno.id : trilha.alunoId);
    var texto = passos.length + (passos.length === 1 ? ' passo' : ' passos');
    if (feitos) texto += ', ' + feitos + ' já dado' + (feitos === 1 ? '' : 's');
    if (!faltam.length) return texto + '. Trilha inteira percorrida.';
    var enc = Core.encontrosPrevistos(faltam, dur);
    return texto + (feitos ? '. Faltam cerca de ' : ', cerca de ') + enc +
      (enc === 1 ? ' encontro' : ' encontros') + ' de ' + duracaoPorExtenso(dur) + '.';
  }

  /* O que uma trilha encerrada tem para dizer é o que foi feito, e até quando.
   * É registro histórico: é isto que uma conversa com a família vai olhar. */
  function resumoDeTrilhaEncerrada(trilha) {
    var passos = trilha.passos || [];
    var feitos = Core.passosFeitos(trilha);
    var texto = feitos + ' de ' + passos.length +
      (passos.length === 1 ? ' passo dado' : ' passos dados');
    texto += ', de ' + Core.ddmmaaaa(trilha.criadaEm) + ' a ' + Core.ddmmaaaa(trilha.encerradaEm);
    if (feitos === passos.length && passos.length) texto += '. Trilha inteira percorrida';
    return texto + (trilha.motivo ? '. Motivo: ' + trilha.motivo + '.' : '.');
  }

  /* Desmarcar e remarcar um passo à mão.
   *
   * Desmarcar apagava a data e a aula para sempre: remarcar carimbava HOJE e
   * perdia o vínculo com a aula em que o assunto foi dado, e um toque acidental
   * já bastava. A marca antiga fica guardada no próprio passo, num campo
   * opcional que registro nenhum é obrigado a ter, e remarcar devolve o que
   * estava lá. Só quando não há nada guardado é que a data de hoje entra.
   *
   * O jaEra também sai na desmarcação. Ele diz "este assunto é anterior a esta
   * trilha", e sobrevivendo a uma desmarcação fazia o passo ser lido como
   * anterior à trilha para sempre, mesmo depois de dado numa aula de verdade. */
  function desmarcarPasso(p) {
    if (!p) return;
    if (p.feitoEm || p.aulaId) {
      p.marcaAnterior = { feitoEm: p.feitoEm || null, aulaId: p.aulaId || null, jaEra: !!p.jaEra };
    }
    p.feitoEm = null;
    p.aulaId = null;
    delete p.jaEra;
    /* Quem soltou foi ELA, e não a revisão automática. A varredura que remarca
     * pelo assunto respeita esta marca: sem ela, soltar um passo cujo assunto
     * está registrado numa aula duraria só até a próxima aula salva. */
    p.soltoAMao = true;
  }

  function remarcarPasso(p, marca) {
    if (!p) return;
    var m = marca || p.marcaAnterior;
    delete p.marcaAnterior;
    delete p.soltoAMao;
    if (m && m.feitoEm) {
      p.feitoEm = m.feitoEm;
      p.aulaId = m.aulaId || null;
      if (m.jaEra) p.jaEra = true; else delete p.jaEra;
      return;
    }
    p.feitoEm = Core.hojeIso();
    p.aulaId = null;
    delete p.jaEra;
  }

  /* O caminho de hoje, guardado inteiro um nível abaixo da trilha. Para trilha
   * criada do zero não existe lacuna, e aí a busca é o próprio título do alvo. */
  function buscaSoltaDaTrilha(trilha) {
    var item = trilha.lacunaId ? Core.itemDaLacuna(trilha.lacunaId) : null;
    return (item && item.busca) || trilha.titulo || '';
  }

  function botaoTemasSoltos(trilha, aluno) {
    return el('button', {
      type: 'button', class: 'btn', id: 'trilha-temas-soltos', texto: 'Ver os temas soltos',
      title: 'Abre a lista de temas de sempre, sem ordem nenhuma',
      style: 'min-height:44px',
      aoClick: function () { abrirTemasPorBusca(buscaSoltaDaTrilha(trilha), aluno); }
    });
  }

  /* ---------- passo 1: onde ele precisa chegar ---------- */

  function abrirTrilhaDaLacuna(aluno, item) {
    propostaDeTrilha = null;
    $('#titulo-modal-trilha').textContent = 'Trilha para fechar: ' + item.rotulo;
    var corpo = $('#corpo-modal-trilha');
    var rodape = $('#rodape-modal-trilha');
    corpo.innerHTML = '';
    rodape.innerHTML = '';
    corpo.appendChild(el('div', {
      class: 'ajuda', style: 'margin-top:0', texto: 'Abrindo o banco de temas...'
    }));
    abrirModal('modal-trilha');

    carregarIndice().then(function (temas) {
      var r = Core.alvosDaLacuna(temas, item.id, Core.anoEscolarDe(aluno));
      /* Lacuna sem alvo curado cai no comportamento de sempre, em vez de abrir
       * uma tela vazia. Hoje as vinte e duas têm alvo, mas o dado pode mudar
       * sem que este arquivo mude junto. */
      if (!r.candidatos.length) {
        fecharModal('modal-trilha');
        abrirTemasPorBusca(item.busca, aluno);
        return;
      }
      desenharEscolhaDoAlvo(aluno, item, r, temas);
    }).catch(function () {
      corpo.innerHTML = '';
      corpo.appendChild(el('div', { class: 'faixa-aviso' }, [
        el('strong', { texto: 'Não consegui abrir o banco de temas agora. ' }),
        document.createTextNode('Se for a primeira vez, abra o aplicativo uma vez com internet. ' +
          'A folha em branco e o resto da aula continuam funcionando sem sinal.')
      ]));
      rodape.innerHTML = '';
      rodape.appendChild(el('button', {
        type: 'button', class: 'btn principal', texto: 'Fechar',
        aoClick: function () { fecharModal('modal-trilha'); }
      }));
    });
  }

  /* Quem decide o fim da trilha é ela, com um toque, e não a tabela sozinha.
   *
   * Medido: a lacuna "Funções" num aluno do 2º ano do médio pode cair numa
   * trilha de matrizes e determinantes se a escolha for automática. Um toque
   * por TRILHA, nunca por aula, então não é gesto novo no dia a dia. */
  function desenharEscolhaDoAlvo(aluno, item, r, temas) {
    var corpo = $('#corpo-modal-trilha');
    var rodape = $('#rodape-modal-trilha');
    corpo.innerHTML = '';
    rodape.innerHTML = '';
    $('#titulo-modal-trilha').textContent = 'Trilha para fechar: ' + item.rotulo;

    var ano = Core.anoEscolarDe(aluno);
    corpo.appendChild(el('div', { class: 'bloco-exercicios', id: 'trilha-onde-chegar', texto: 'Onde ele precisa chegar' }));
    corpo.appendChild(el('div', { class: 'ajuda', style: 'margin-top:0' }, [
      document.createTextNode(ano
        ? 'Toque no assunto que fecha a lacuna. A sugestão é o mais alto que não passa do ' +
          nomeDoAno(ano) + ', que é o ano de ' + aluno.nome + '. '
        : 'Toque no assunto que fecha a lacuna. ' + aluno.nome + ' está sem ano escolar ' +
          'registrado, então a sugestão é a mais baixa, que é o lado seguro de errar. '),
      el('strong', { texto: 'A trilha é montada até o que você escolher aqui.' })
    ]));

    r.candidatos.slice(0, 5).forEach(function (c) {
      var ehSugerido = c.id === r.sugerido;
      var linha = el('div', {
        class: 'item-lista clicavel item-alvo-trilha', 'data-alvo': c.id,
        style: ehSugerido ? 'border-color:#2E8B76;border-width:2px' : ''
      }, [
        el('div', { class: 'cresce' }, [
          el('div', { class: 'nome' }, [
            document.createTextNode(c.titulo),
            ehSugerido
              ? el('span', { class: 'tag cheia', texto: 'sugerido', style: 'margin-left:8px' })
              : null
          ].filter(Boolean)),
          el('div', { class: 'detalhe', texto: 'Matemática, ' + nomeDoAno(c.serie) })
        ]),
        el('button', {
          type: 'button', class: 'btn pequeno principal', texto: 'Montar',
          style: 'min-height:44px;box-sizing:border-box;padding:11px 18px;font-size:14px'
        })
      ]);
      /* O clique do botão sobe até aqui: a linha inteira é o alvo de toque, e
       * o botão existe para ela ver onde tocar. */
      linha.addEventListener('click', function () {
        montarPropostaDeTrilha(aluno, item, c, temas);
      });
      corpo.appendChild(linha);
    });

    corpo.appendChild(el('div', {
      class: 'ajuda',
      texto: 'Depois de montada, a trilha ainda é sua: dá para tirar passo, mudar a ordem e ' +
        'acrescentar o que faltar antes de guardar.'
    }));

    /* Mesmo id da versão que fica dentro da trilha montada: as duas telas nunca
     * existem ao mesmo tempo, e assim o caminho antigo tem um só endereço. */
    rodape.appendChild(el('button', {
      type: 'button', class: 'btn esquerda', id: 'trilha-temas-soltos',
      texto: 'Ver os temas soltos', style: 'min-height:44px',
      aoClick: function () { abrirTemasPorBusca(item.busca, aluno); }
    }));
    rodape.appendChild(el('button', {
      type: 'button', class: 'btn', texto: 'Cancelar', style: 'min-height:44px',
      aoClick: function () { fecharModal('modal-trilha'); }
    }));
    corpo.scrollTop = 0;
  }

  /* ---------- passo 2: a proposta, editável ---------- */

  function montarPropostaDeTrilha(aluno, item, alvo, temas) {
    var d = Core.trilhaDerivada(temas, alvo.id, { maximo: 6 });
    /* O passo que o aluno já viu nasce marcado, com a data daquela aula: é aqui
     * que o registro de assunto e a trilha se encostam. Ela traz de volta com
     * um toque, se aquela aula não tiver fechado o assunto de verdade. */
    Core.marcarOQueJaFoiDado(db, aluno.id, d.passos);
    var trilha = Core.criarTrilha({
      alunoId: aluno.id,
      lacunaId: item ? item.id : null,
      titulo: alvo.titulo,
      alvoId: alvo.id,
      passos: d.passos
    });
    propostaDeTrilha = { trilha: trilha, cortados: d.cortados, aluno: aluno, item: item };
    desenharTrilha(trilha, aluno, { proposta: true });
  }

  /* Uma função desenha os três casos: a proposta que ainda não foi guardada, a
   * trilha ativa que já mora no aluno e a trilha encerrada. O que muda é o
   * rodapé, a gravação e, na encerrada, o fato de não haver o que tocar.
   *
   * A encerrada é SÓ LEITURA. Ela abria igual a uma ativa, com título "Trilha
   * para fechar", resumo dizendo quantos encontros faltavam e os botões de
   * marcar, subir, descer, tirar e acrescentar, todos gravando no disco: um
   * toque em Tirar apagava um passo de um registro histórico, que é o que uma
   * conversa com a família vai olhar. */
  function desenharTrilha(trilha, aluno, opcoes) {
    opcoes = opcoes || {};
    var proposta = !!opcoes.proposta;
    var encerrada = !proposta && !!trilha.encerradaEm;
    var corpo = $('#corpo-modal-trilha');
    var rodape = $('#rodape-modal-trilha');
    var alturaAntes = corpo.scrollTop;
    corpo.innerHTML = '';
    rodape.innerHTML = '';

    var item = trilha.lacunaId ? Core.itemDaLacuna(trilha.lacunaId) : null;
    $('#titulo-modal-trilha').textContent = encerrada
      ? 'Trilha encerrada: ' + (item ? item.rotulo : trilha.titulo)
      : (item ? 'Trilha para fechar: ' + item.rotulo : 'Trilha até ' + trilha.titulo);

    /* Uma trilha antiga pode ter chegado aqui sem a lista de passos. Sem esta
     * linha a variável local viraria um array solto, as escritas não chegariam
     * ao disco e o aviso confirmaria assim mesmo: ela acrescentava um passo,
     * lia "Passo acrescentado" e nada tinha sido guardado. */
    if (!trilha.passos) trilha.passos = [];
    var passos = trilha.passos;

    /* Gravar só quando a trilha já existe no aluno. Na proposta nada vai para o
     * disco antes de ela tocar em Guardar. */
    function mudar(acao, aviso) {
      acao();
      if (proposta) { desenharTrilha(trilha, aluno, opcoes); return; }
      salvar().then(function () {
        desenharTrilha(trilha, aluno, opcoes);
        atualizarPainelTrilhas(aluno.id);
        if (aulaEmEdicao) atualizarBlocoAssunto(aulaEmEdicao.id);
        desenharAgenda();
        if (aviso) avisar(aviso);
      });
    }

    /* O mesmo, para o que APAGA. Tirar um passo e desmarcar um passo gravavam
     * direto, e o aviso saía sem o botão Desfazer, que é o padrão do resto do
     * aplicativo. Na proposta nada foi ao disco ainda, então o desfazer é em
     * memória; na trilha guardada é o comDesfazer de sempre, com ponto de
     * retorno no histórico. */
    function mudarComDesfazer(rotulo, acao, refazer) {
      if (proposta) {
        acao();
        desenharTrilha(trilha, aluno, opcoes);
        avisar(rotulo, 'Desfazer', function () {
          refazer();
          desenharTrilha(trilha, aluno, opcoes);
          avisar('Alteração desfeita.');
        });
        return;
      }
      comDesfazer(rotulo, acao).then(function () {
        desenharTrilha(trilha, aluno, opcoes);
        atualizarPainelTrilhas(aluno.id);
        if (aulaEmEdicao) atualizarBlocoAssunto(aulaEmEdicao.id);
        desenharAgenda();
      });
    }

    // ---- o que a trilha fecha ----
    corpo.appendChild(el('div', {
      class: 'faixa-info', id: 'resumo-trilha'
    }, [
      el('strong', { texto: (encerrada ? 'Era até ' : 'Até ') + trilha.titulo + '. ' }),
      document.createTextNode(resumoDaTrilha(trilha, aluno))
    ]));

    if (encerrada) {
      corpo.appendChild(el('div', { class: 'faixa-info', id: 'trilha-so-leitura' }, [
        el('strong', { texto: 'Esta trilha está encerrada, e aqui é só leitura. ' }),
        document.createTextNode('Ela fica guardada do jeito que estava: é a prova do trabalho ' +
          'feito. Para retomar o assunto, monte uma trilha nova.')
      ]));
    }

    /* Guardar a trilha não guarda o mapeamento, e a tela diz isso antes: sem
     * esta linha ela fecharia a trilha achando que já tinha confirmado tudo. */
    if (mapeamentoEmEdicao && aluno && mapeamentoEmEdicao.alunoId === aluno.id) {
      corpo.appendChild(el('div', { class: 'ajuda', id: 'trilha-mapeamento-aberto', style: 'margin-top:0' }, [
        el('strong', { texto: 'O mapeamento continua aberto atrás desta janela. ' }),
        document.createTextNode('O que você marcar lá só é gravado por "Salvar mapeamento": ' +
          'guardar a trilha aqui não salva o mapeamento junto.')
      ]));
    }

    /* Na encerrada as datas e o motivo já estão no resumo, e repeti-los aqui
     * embaixo faria a mesma frase aparecer duas vezes na mesma tela. */
    if (!proposta && !encerrada) {
      corpo.appendChild(el('div', {
        class: 'ajuda', style: 'margin-top:0',
        texto: 'Criada em ' + Core.ddmmaaaa(trilha.criadaEm)
      }));
    }

    // ---- a saída honesta: não há escada ----
    if (passos.length === 1 && !encerrada) {
      corpo.appendChild(el('div', { class: 'faixa-aviso', id: 'trilha-sem-escada' }, [
        el('strong', { texto: 'Este assunto não depende de nenhum outro no banco. ' }),
        document.createTextNode('Não há escada para montar até ele, e inventar uma seria pior ' +
          'do que não oferecer nenhuma. Dá para atacar direto: guardando assim mesmo, ele ' +
          'aparece como próximo passo ao abrir a aula. Se preferir escolher à mão, veja os ' +
          'temas soltos aqui embaixo.')
      ]));
    }

    // ---- o corte, que dispara na maioria das lacunas ----
    var cortados = (proposta && propostaDeTrilha) ? propostaDeTrilha.cortados : [];
    if (cortados && cortados.length) {
      corpo.appendChild(el('div', { class: 'faixa-aviso', id: 'trilha-cortada' }, [
        el('strong', { texto: 'Comecei do que está mais perto do objetivo. ' }),
        document.createTextNode('Se ele não tiver base nem para isso, puxe mais de trás: ' +
          'ainda há ' + cortados.length + (cortados.length === 1
            ? ' assunto anterior guardado.' : ' assuntos anteriores guardados.')),
        el('div', { class: 'barra', style: 'margin:8px 0 0' }, [
          el('button', {
            type: 'button', class: 'btn', id: 'puxar-mais-de-tras', texto: 'Puxar mais de trás',
            style: 'min-height:44px;padding:11px 16px',
            aoClick: function () {
              mudar(function () {
                var novo = propostaDeTrilha.cortados.pop();
                if (!novo) return;
                Core.marcarOQueJaFoiDado(db, aluno.id, [novo]);
                passos.unshift(novo);
              });
            }
          })
        ])
      ]));
    }

    // ---- os passos, numerados ----
    corpo.appendChild(el('div', { class: 'bloco-exercicios', texto: 'A ordem dos assuntos' }));
    /* A ordem não é arbitrária nem cronológica: sai do pré-requisito que cada
     * tema declara no banco. A tela nunca dizia isso, e sem saber de onde vem a
     * ordem ela não tinha como decidir quando mudá-la. */
    corpo.appendChild(el('div', {
      class: 'ajuda', id: 'trilha-de-onde-vem-a-ordem', style: 'margin-top:0',
      texto: encerrada
        ? 'A ordem veio dos pré-requisitos do banco: cada assunto entrou depois daquele que ele exige.'
        : 'A ordem vem dos pré-requisitos do banco: cada assunto vem depois daquele que ele exige. ' +
          'Se para este aluno fizer mais sentido de outro jeito, use as setas.'
    }));

    if (!passos.length) {
      corpo.appendChild(el('div', { class: 'vazio' }, [
        el('p', { texto: 'A trilha ficou sem nenhum passo.' }),
        el('p', {
          class: 'ajuda',
          texto: encerrada ? 'Ela foi encerrada assim.' : 'Acrescente um assunto aqui embaixo, ou cancele.'
        })
      ]));
    }

    var listaPassos = el('div', { id: 'passos-trilha' });
    corpo.appendChild(listaPassos);

    passos.forEach(function (p, i) {
      var feito = !!p.feitoEm;
      /* "1 hora" e não "60 minutos": o resumo lá em cima já fala assim, e duas
       * palavras diferentes para a mesma duração na mesma tela fazem parecer
       * que são coisas diferentes. */
      var detalhe = nomeDoAno(p.serie) + ' · cerca de ' + duracaoPorExtenso(p.duracaoMin || 60);
      if (feito) {
        detalhe = (p.jaEra ? 'já trabalhado em ' : (p.aulaId ? 'dado em ' : 'marcado por você em ')) +
          Core.ddmm(p.feitoEm) + ' · ' + detalhe;
      }

      /* Alvo de toque de 44 px, que é o que a mão dela pede em pé, na casa da
       * família. O que estava aqui tinha 37 px de altura. */
      var ALVO = 'min-height:44px;min-width:44px;box-sizing:border-box;';
      var botoes = [];
      if (encerrada) {
        /* Nenhum botão: trilha encerrada é registro, e registro não se mexe. */
      } else if (feito) {
        botoes.push(el('button', {
          type: 'button', class: 'btn pequeno trazer-passo', texto: 'Trazer de volta',
          title: 'Volta a contar como passo a dar',
          style: ALVO + 'padding:11px 14px;font-size:13px',
          aoClick: function () {
            var marca = { feitoEm: p.feitoEm, aulaId: p.aulaId, jaEra: p.jaEra };
            mudarComDesfazer('Passo de volta na fila.', function () {
              desmarcarPasso(p);
            }, function () { remarcarPasso(p, marca); });
          }
        }));
      } else {
        if (!proposta) {
          botoes.push(el('button', {
            type: 'button', class: 'btn pequeno marcar-passo', texto: 'Já dei este',
            style: ALVO + 'padding:11px 14px;font-size:13px',
            aoClick: function () {
              mudar(function () { remarcarPasso(p, null); }, 'Passo marcado.');
            }
          }));
        }
        /* Setas, nunca arrasto: arrasto dentro de uma janela que rola, com o
         * dedo e com a S Pen, é o gesto que falha.
         *
         * A folga entre elas era de 6 px, e elas fazem coisas opostas: errar a
         * seta desce o passo que ela queria subir, e ela só descobre relendo a
         * lista. Agora há 16 px entre uma e outra. */
        botoes.push(el('button', {
          type: 'button', class: 'btn pequeno subir-passo', texto: '↑', title: 'Subir este passo',
          style: ALVO + 'padding:11px 15px;font-size:16px;margin-right:16px' +
            (i === 0 ? ';visibility:hidden' : ''),
          aoClick: function () {
            if (i === 0) return;
            mudar(function () { Core.moverPasso(trilha, i, i - 1); });
          }
        }));
        botoes.push(el('button', {
          type: 'button', class: 'btn pequeno descer-passo', texto: '↓', title: 'Descer este passo',
          style: ALVO + 'padding:11px 15px;font-size:16px' +
            (i === passos.length - 1 ? ';visibility:hidden' : ''),
          aoClick: function () {
            if (i === passos.length - 1) return;
            mudar(function () { Core.moverPasso(trilha, i, i + 1); });
          }
        }));
      }
      if (!encerrada) {
        botoes.push(el('button', {
          type: 'button', class: 'btn pequeno perigo tirar-passo', texto: 'Tirar',
          /* A folga existe pelo mesmo motivo da lista de assuntos: Tirar apaga,
           * e ficava a 21 px da seta de descer numa tela usada em pé. */
          style: ALVO + 'margin-left:28px;padding:11px 14px;font-size:13px',
          aoClick: function () {
            var guardado = p, posicao = i;
            mudarComDesfazer('Passo tirado da trilha.', function () {
              Core.removerPasso(trilha, posicao);
            }, function () {
              trilha.passos.splice(Math.min(posicao, trilha.passos.length), 0, guardado);
            });
          }
        }));
      }

      listaPassos.appendChild(el('div', {
        class: 'passo-roteiro item-passo-trilha', 'data-passo': p.temaId,
        style: 'display:flex;align-items:center;gap:10px;flex-wrap:wrap' +
          (feito ? ';opacity:.65' : '')
      }, [
        el('div', { class: 'cresce', style: 'flex:1;min-width:200px' }, [
          el('div', {
            class: 'nome',
            style: feito ? 'text-decoration:line-through' : '',
            texto: (i + 1) + '. ' + p.titulo
          }),
          el('div', { class: 'detalhe', texto: detalhe })
        ]),
        el('div', { style: 'display:flex;align-items:center;gap:6px;flex-wrap:wrap' }, botoes)
      ]));
    });

    // ---- acrescentar, e o caminho antigo ----
    var barraDoFim = [];
    if (!encerrada) {
      barraDoFim.push(el('button', {
        type: 'button', class: 'btn', id: 'acrescentar-passo', texto: '+ Acrescentar passo',
        style: 'min-height:44px;padding:11px 16px',
        aoClick: function () {
          escolherTemaDeMatematica(aluno, 'Acrescentar passo à trilha', function (t) {
            var jaTem = passos.filter(function (x) { return x.temaId === t.id; }).length;
            if (jaTem) { avisar('Este assunto já é um passo desta trilha.'); return; }
            mudar(function () {
              var novo = {
                temaId: t.id, titulo: t.pt.titulo, serie: t.serie,
                duracaoMin: t.duracaoMin || 60, feitoEm: null, aulaId: null
              };
              Core.marcarOQueJaFoiDado(db, aluno.id, [novo]);
              passos.push(novo);
            }, 'Passo acrescentado.');
          }, true);
        }
      }));
    }
    barraDoFim.push(botaoTemasSoltos(trilha, aluno));
    corpo.appendChild(el('div', { class: 'barra', style: 'margin:12px 0 4px' }, barraDoFim));
    corpo.appendChild(el('div', {
      class: 'ajuda',
      texto: encerrada
        ? 'Ver os temas soltos abre a lista de sempre, para quando você quiser rever o material ' +
          'que esta trilha usou.'
        : 'Acrescentar passo abre o banco de matemática. Ver os temas soltos abre a mesma ' +
          'lista de sempre, sem ordem nenhuma, para quando você quiser só olhar o material.'
    }));

    // ---- rodapé ----
    if (proposta) {
      rodape.appendChild(el('button', {
        type: 'button', class: 'btn', texto: 'Cancelar',
        style: 'min-height:44px',
        aoClick: function () { propostaDeTrilha = null; fecharModal('modal-trilha'); }
      }));
      rodape.appendChild(el('button', {
        type: 'button', class: 'btn principal', id: 'guardar-trilha',
        texto: passos.length === 1 ? 'Guardar assim mesmo' : 'Guardar trilha',
        style: 'min-height:44px',
        aoClick: function (ev) {
          /* Trava do segundo toque, aqui e dentro do guardarProposta: no tablet
           * o toque duplica com facilidade, e dois toques empurravam a MESMA
           * trilha duas vezes, com o mesmo id. */
          if (ev && ev.currentTarget) ev.currentTarget.disabled = true;
          guardarProposta(trilha, aluno);
        }
      }));
    } else {
      if (!encerrada) {
        rodape.appendChild(el('button', {
          type: 'button', class: 'btn esquerda', id: 'encerrar-trilha', texto: 'Encerrar trilha',
          style: 'min-height:44px',
          aoClick: function () {
            abrirEncerramento(trilha, aluno, function () {
              desenharTrilha(trilha, aluno, opcoes);
            }, function () { desenharTrilha(trilha, aluno, opcoes); });
          }
        }));
      }
      rodape.appendChild(el('button', {
        type: 'button', class: 'btn principal', id: 'fechar-trilha', texto: 'Fechar',
        style: 'min-height:44px',
        aoClick: function () { fecharModal('modal-trilha'); }
      }));
    }

    corpo.scrollTop = alturaAntes;
  }

  /* A trilha está sendo empurrada para o aluno agora? Dois toques seguidos em
   * Guardar chegavam aqui duas vezes antes de a primeira gravação terminar, e
   * a mesma trilha ia para a lista duas vezes, com o mesmo id. */
  var guardandoTrilha = false;

  function guardarProposta(trilha, aluno) {
    if (guardandoTrilha) return;
    if (!(trilha.passos || []).length) {
      avisar('A trilha está sem passos. Acrescente um antes de guardar.');
      return;
    }
    aluno.trilhas = aluno.trilhas || [];
    /* Cinto e suspensório: se por algum caminho ela chegar aqui com a trilha
     * já guardada, não duplica. */
    if (aluno.trilhas.indexOf(trilha) >= 0) return;
    guardandoTrilha = true;
    aluno.trilhas.push(trilha);
    salvar().then(function () {
      guardandoTrilha = false;
      propostaDeTrilha = null;
      fecharModal('modal-trilha');
      atualizarPainelTrilhas(aluno.id);
      if (aulaEmEdicao) atualizarBlocoAssunto(aulaEmEdicao.id);
      desenharAgenda();
      avisar('Trilha guardada: ' + resumoDaTrilha(trilha, aluno));
    }).catch(function () {
      guardandoTrilha = false;
      /* A gravação falhou, então a memória volta a espelhar o disco: senão a
       * trilha ficaria só na tela e ela acharia que está guardada. */
      aluno.trilhas = (aluno.trilhas || []).filter(function (t) { return t !== trilha; });
      avisar('Não consegui guardar a trilha. Tente de novo.');
    });
  }

  /* Encerrar antes do fim é o normal, e não a exceção: o aluno destrava e a
   * trilha deixou de fazer sentido. Sem interrogatório, o motivo é opcional.
   *
   * Era um window.prompt. No tablet ele abre a caixa do sistema, que ganha foco
   * sozinha e faz o teclado subir por cima da tela, contra a regra de nenhum
   * campo com foco automático; e um OK sem digitar nada já encerrava a trilha,
   * porque texto vazio não é a mesma coisa que cancelar. Aqui é tela do próprio
   * aplicativo: nada tem foco ao abrir, e encerrar exige um toque no botão que
   * diz Encerrar. */
  function abrirEncerramento(trilha, aluno, depois, voltar) {
    var corpo = $('#corpo-modal-trilha');
    var rodape = $('#rodape-modal-trilha');
    corpo.innerHTML = '';
    rodape.innerHTML = '';
    $('#titulo-modal-trilha').textContent = 'Encerrar a trilha até ' + trilha.titulo;

    var feitos = Core.passosFeitos(trilha);
    var total = (trilha.passos || []).length;

    corpo.appendChild(el('div', { class: 'faixa-info' }, [
      el('strong', { texto: 'Encerrar não apaga nada. ' }),
      document.createTextNode('A trilha sai da lista das ativas e continua guardada com as ' +
        'datas, como prova do trabalho: ' + feitos + ' de ' + total +
        (total === 1 ? ' passo dado' : ' passos dados') + ' desde ' +
        Core.ddmmaaaa(trilha.criadaEm) + '.')
    ]));

    var campo = el('textarea', {
      id: 'motivo-encerramento', style: 'min-height:72px',
      placeholder: 'Ele destravou, mudou a prioridade, a família pediu outra coisa...'
    });
    corpo.appendChild(el('label', { class: 'campo' }, [
      el('span', { texto: 'Por que está encerrando (opcional)' }), campo
    ]));
    corpo.appendChild(el('div', {
      class: 'ajuda', style: 'margin-top:0',
      texto: 'Pode deixar em branco. O motivo aparece junto da trilha encerrada na ficha do aluno.'
    }));

    rodape.appendChild(el('button', {
      type: 'button', class: 'btn', id: 'cancelar-encerramento', texto: '‹ Voltar',
      style: 'min-height:44px',
      aoClick: function () {
        if (voltar) voltar(); else fecharModal('modal-trilha');
      }
    }));
    rodape.appendChild(el('button', {
      /* Sem a classe perigo junto da principal: as duas mandam na cor e a
       * segunda vence, deixando texto vermelho sobre fundo azul-escuro. E
       * encerrar não apaga nada mesmo, então vermelho contaria outra história. */
      type: 'button', class: 'btn principal', id: 'confirmar-encerramento',
      texto: 'Encerrar trilha', style: 'min-height:44px',
      aoClick: function (ev) {
        if (ev && ev.currentTarget) ev.currentTarget.disabled = true;
        var motivo = String(campo.value || '').trim();
        /* Encerrar é destrutivo do ponto de vista dela: some da lista das
         * ativas e o próximo passo deixa de aparecer na aula. Vai com Desfazer,
         * como o resto do aplicativo. */
        comDesfazer('Trilha encerrada. Ela continua guardada, com as datas.', function () {
          Core.encerrarTrilha(trilha, Core.hojeIso(), motivo);
        }).then(function () {
          atualizarPainelTrilhas(aluno.id);
          if (aulaEmEdicao) atualizarBlocoAssunto(aulaEmEdicao.id);
          desenharAgenda();
          if (depois) depois();
        });
      }
    }));
    /* Nada de campo.focus() aqui: é justamente o teclado subindo sozinho que
     * tirava metade da tela dela no tablet. */
    corpo.scrollTop = 0;
  }

  /* O seletor de temas de matemática servindo à trilha: mesma lista de sempre,
   * o que muda é o que acontece ao escolher. Ele abre POR CIMA da trilha, e ao
   * fechar a trilha continua atrás, do jeito que ela deixou. */
  function escolherTemaDeMatematica(aluno, titulo, aoEscolher, temTrilhaAtras) {
    $('#titulo-modal-tema').textContent = titulo;
    var corpo = $('#corpo-modal-tema');
    var rodape = $('#rodape-modal-tema');
    corpo.innerHTML = '';
    rodape.innerHTML = '';
    corpo.appendChild(el('div', {
      class: 'ajuda', style: 'margin-top:0', texto: 'Carregando os temas...'
    }));
    abrirModal('modal-tema');
    carregarIndice().then(function (temas) {
      desenharEscolhaTema(temas, null, aluno, '', {
        rotuloEscolher: 'Usar',
        /* O botão de voltar só existe quando há mesmo uma trilha atrás. Vindo da
         * ficha do aluno, a trilha ainda não foi montada, e "Voltar para a
         * trilha" prometeria uma tela que não existe. */
        rotuloVoltar: temTrilhaAtras ? '‹ Voltar para a trilha' : null,
        voltar: temTrilhaAtras ? function () { fecharModal('modal-tema'); } : null,
        aoEscolher: function (t) {
          fecharModal('modal-tema');
          aoEscolher(t);
        }
      });
    }).catch(function () {
      corpo.innerHTML = '';
      corpo.appendChild(el('div', { class: 'faixa-aviso' }, [
        el('strong', { texto: 'Não consegui abrir o banco de temas agora. ' }),
        document.createTextNode('Abra o aplicativo uma vez com internet para ele ficar guardado.')
      ]));
    });
  }

  function abrirTrilhaGuardada(aluno, trilha) {
    propostaDeTrilha = null;
    abrirModal('modal-trilha');
    desenharTrilha(trilha, aluno, { proposta: false });
    $('#corpo-modal-trilha').scrollTop = 0;
  }

  /* ---------- montar a partir da ficha, com alvo grande ----------
   *
   * O botão da lacuna dentro do mapeamento tem 12 px de altura. Aqui, na ficha,
   * a mesma coisa começa por um botão largo que lista as lacunas marcadas. */
  function abrirEscolhaDaLacuna(aluno) {
    propostaDeTrilha = null;
    $('#titulo-modal-trilha').textContent = 'Montar trilha para ' + aluno.nome;
    var corpo = $('#corpo-modal-trilha');
    var rodape = $('#rodape-modal-trilha');
    corpo.innerHTML = '';
    rodape.innerHTML = '';

    var m = Core.mapeamentoAtual(aluno);
    var marcadas = (m && m.marcados && m.marcados.lacunas) || [];
    var itens = marcadas.map(Core.itemDaLacuna).filter(Boolean);

    if (itens.length) {
      corpo.appendChild(el('div', { class: 'bloco-exercicios', texto: 'Lacunas marcadas no mapeamento' }));
      corpo.appendChild(el('div', {
        class: 'ajuda', style: 'margin-top:0',
        texto: 'Toque na lacuna que você quer fechar. Na tela seguinte você confirma onde ele ' +
          'precisa chegar, e só depois a trilha é montada.'
      }));
      itens.forEach(function (item) {
        var linha = el('div', {
          class: 'item-lista clicavel item-lacuna-trilha', 'data-lacuna': item.id
        }, [
          el('div', { class: 'cresce' }, [
            el('div', { class: 'nome', texto: item.rotulo })
          ]),
          el('button', {
            type: 'button', class: 'btn pequeno principal', texto: 'Montar',
            style: 'min-height:44px;box-sizing:border-box;padding:11px 18px;font-size:14px'
          })
        ]);
        linha.addEventListener('click', function () { abrirTrilhaDaLacuna(aluno, item); });
        corpo.appendChild(linha);
      });
    } else {
      corpo.appendChild(el('div', { class: 'vazio' }, [
        el('p', { texto: 'Nenhuma lacuna de ano anterior está marcada no mapeamento de ' + aluno.nome + '.' }),
        el('p', {
          class: 'ajuda',
          texto: 'A trilha nasce de uma lacuna marcada. Abra o mapeamento e marque o que ficou ' +
            'para trás, ou monte uma trilha do zero escolhendo o assunto direto no banco.'
        })
      ]));
    }

    corpo.appendChild(el('div', { class: 'barra', style: 'margin-top:12px' }, [
      el('button', {
        type: 'button', class: 'btn', id: 'trilha-do-zero-na-escolha', texto: 'Trilha do zero',
        style: 'min-height:44px;padding:11px 16px',
        aoClick: function () { novaTrilhaDoZero(aluno); }
      })
    ]));

    rodape.appendChild(el('button', {
      type: 'button', class: 'btn principal', texto: 'Fechar', style: 'min-height:44px',
      aoClick: function () { fecharModal('modal-trilha'); }
    }));
    abrirModal('modal-trilha');
    corpo.scrollTop = 0;
  }

  /* Do zero: sem lacuna por trás, ela mesma escolhe onde a trilha termina. */
  function novaTrilhaDoZero(aluno) {
    var daTrilha = $('#modal-trilha').classList.contains('aberto');
    escolherTemaDeMatematica(aluno, 'Onde a trilha precisa chegar', function (t) {
      carregarIndice().then(function (temas) {
        abrirModal('modal-trilha');
        montarPropostaDeTrilha(aluno, null,
          { id: t.id, titulo: t.pt.titulo, serie: t.serie }, temas);
      });
    }, daTrilha);
  }

  /* ---------- onde ela governa: painel na ficha do aluno ---------- */

  var painelTrilhasAtivo = null;

  function atualizarPainelTrilhas(alunoId) {
    if (!painelTrilhasAtivo || painelTrilhasAtivo.alunoId !== alunoId) return false;
    if (!document.getElementById('painel-trilhas')) return false;
    painelTrilhasAtivo.desenhar();
    return true;
  }

  function desenharPainelTrilhas(caixa, aluno) {
    var painel = el('div', { id: 'painel-trilhas' });
    caixa.appendChild(painel);

    function desenhar() {
      painel.innerHTML = '';
      var todas = Core.trilhasDe(aluno);
      var ativas = Core.trilhasAtivas(aluno);
      var encerradas = todas.filter(function (t) { return t.encerradaEm; });

      painel.appendChild(el('h3', { class: 'subtitulo', texto: 'Trilhas' }));
      painel.appendChild(el('div', {
        class: 'ajuda', style: 'margin-top:0',
        texto: 'A trilha é a sequência de assuntos que precisa vir antes daquele em que ele ' +
          'travou, na ordem. Ela anda sozinha: quando você registra o assunto da aula, o passo ' +
          'daquele assunto fica marcado com a data da aula.'
      }));

      painel.appendChild(el('div', { class: 'barra', style: 'margin:10px 0' }, [
        el('button', {
          type: 'button', class: 'btn principal', id: 'montar-trilha',
          texto: 'Montar trilha', style: 'flex:1;min-height:44px;padding:12px 16px',
          aoClick: function () { abrirEscolhaDaLacuna(aluno); }
        }),
        el('button', {
          type: 'button', class: 'btn', id: 'nova-trilha-do-zero', texto: 'Trilha do zero',
          style: 'min-height:44px;padding:12px 16px',
          aoClick: function () { novaTrilhaDoZero(aluno); }
        })
      ]));

      if (!todas.length) {
        painel.appendChild(el('div', {
          class: 'ajuda', style: 'margin-top:0',
          texto: 'Nenhuma trilha ainda. Montar trilha parte das lacunas marcadas no ' +
            'mapeamento; Trilha do zero parte de um assunto escolhido por você.'
        }));
        return;
      }

      ativas.forEach(function (trilha) { painel.appendChild(cartaoDeTrilha(trilha, aluno, desenhar)); });

      if (encerradas.length) {
        painel.appendChild(el('div', { class: 'bloco-exercicios', texto: 'Trilhas encerradas' }));
        painel.appendChild(el('div', {
          class: 'ajuda', style: 'margin-top:0',
          texto: 'Trilha encerrada não some: é a prova do trabalho, e é o que uma conversa com ' +
            'a família vai querer ver.'
        }));
        encerradas.forEach(function (trilha) {
          painel.appendChild(el('div', { class: 'item-lista item-trilha-encerrada' }, [
            el('div', { class: 'cresce' }, [
              el('div', { class: 'nome', texto: trilha.titulo }),
              el('div', {
                class: 'detalhe',
                texto: Core.passosFeitos(trilha) + ' de ' + (trilha.passos || []).length +
                  ' passos dados · de ' + Core.ddmmaaaa(trilha.criadaEm) + ' a ' +
                  Core.ddmmaaaa(trilha.encerradaEm) + (trilha.motivo ? ' · ' + trilha.motivo : '')
              })
            ]),
            el('button', {
              type: 'button', class: 'btn pequeno abrir-trilha', texto: 'Abrir',
              style: 'min-height:44px;min-width:44px;box-sizing:border-box;padding:11px 16px;font-size:13px',
              /* Sem fechar a ficha: ver a trilha e voltar tem que custar um
               * toque, como já custa em Montar trilha, que empilha. */
              aoClick: function () { abrirTrilhaGuardada(aluno, trilha); }
            })
          ]));
        });
      }
    }

    painelTrilhasAtivo = { alunoId: aluno.id, desenhar: desenhar };
    desenhar();
  }

  /* Uma trilha ativa por inteiro: os passos em ordem, a data de cada um que já
   * foi dado, e a caixa de marcar para consertar à mão o que o automático
   * errou. Desmarcar apaga a data e a aula, e por isso passa pelo Desfazer.
   *
   * O alvo de toque aqui era o rótulo INTEIRO, 470 por 38 px, e ele alternava o
   * feito: rolar a lista com o dedo e encostar num rótulo apagava a data e a
   * aula de um passo, sem pergunta e sem volta. Agora o alvo é só a caixa de
   * marcar, que passou de 13 para 44 px. */
  function cartaoDeTrilha(trilha, aluno, redesenhar) {
    var caixa = el('div', {
      class: 'cartao item-trilha-ativa', 'data-trilha': trilha.id,
      style: 'margin-bottom:12px'
    });
    var ALVO = 'min-height:44px;min-width:44px;box-sizing:border-box;';

    caixa.appendChild(el('div', { class: 'barra', style: 'margin-bottom:6px;gap:10px' }, [
      el('div', { class: 'cresce' }, [
        el('div', { class: 'nome', style: 'font-weight:700;color:#1F3A5F', texto: trilha.titulo }),
        el('div', { class: 'detalhe', style: 'font-size:13px', texto: resumoDaTrilha(trilha, aluno) })
      ]),
      el('button', {
        type: 'button', class: 'btn pequeno abrir-trilha', texto: 'Abrir',
        style: ALVO + 'padding:11px 16px;font-size:13px',
        /* Abrir empilha em cima da ficha, do mesmo jeito que Montar trilha:
         * fechar a ficha aqui fazia o caminho de volta custar seis toques. */
        aoClick: function () { abrirTrilhaGuardada(aluno, trilha); }
      }),
      el('button', {
        type: 'button', class: 'btn pequeno encerrar-trilha', texto: 'Encerrar',
        /* Encerrar ficava a 10 px de Abrir, e uma some da lista e a outra não. */
        style: ALVO + 'margin-left:22px;padding:11px 16px;font-size:13px',
        aoClick: function () { encerrarPeloPainel(trilha, aluno, redesenhar); }
      })
    ]));

    (trilha.passos || []).forEach(function (p, i) {
      var feito = !!p.feitoEm;
      /* A caixa tinha 13 por 13 px e o alvo real era o rótulo inteiro. Agora a
       * caixa É o alvo, e por isso ela mesma tem 44 por 44: nada de zona
       * invisível maior do que o desenho, que é o tipo de alvo que ela erra
       * justamente por não ver onde acaba. */
      var chk = el('input', {
        type: 'checkbox', class: 'marca-passo',
        style: 'width:44px;height:44px;min-height:44px;flex:none;margin:0;cursor:pointer'
      });
      chk.checked = feito;
      chk.addEventListener('change', function () {
        /* Desmarcar apaga a data e a aula, então vai com Desfazer, que é o
         * padrão do resto do aplicativo. Marcar não destrói nada e continua
         * gravando direto: pedir desfazer para tudo ensina a ignorar o aviso.
         *
         * Marcar recupera a marca anterior, se houver: desmarcar sem querer e
         * marcar de novo devolvia a data de HOJE e perdia a aula em que o
         * assunto foi dado. */
        if (this.checked) {
          remarcarPasso(p, null);
          salvar().then(function () {
            redesenhar();
            if (aulaEmEdicao) atualizarBlocoAssunto(aulaEmEdicao.id);
            desenharAgenda();
          });
          return;
        }
        comDesfazer('Passo de volta na fila.', function () {
          desmarcarPasso(p);
        }).then(function () {
          redesenhar();
          if (aulaEmEdicao) atualizarBlocoAssunto(aulaEmEdicao.id);
          desenharAgenda();
        });
      });

      var quando = '';
      if (feito) {
        quando = (p.jaEra ? 'já trabalhado em ' : (p.aulaId ? 'dado em ' : 'marcado por você em ')) +
          Core.ddmm(p.feitoEm);
      }

      /* Um <div>, e não um <label>: o rótulo do <label> repassava o toque para
       * a caixa, e era a linha inteira que virava alvo. A caixa ganhou 10 px de
       * folga em volta para chegar aos 44, sem crescer o desenho. */
      caixa.appendChild(el('div', {
        class: 'item-area passo-da-trilha', 'data-passo': p.temaId,
        style: 'margin-bottom:5px;cursor:default;padding:4px 10px' + (feito ? ';opacity:.65' : '')
      }, [
        chk,
        el('span', { class: 'cresce' }, [
          el('span', {
            style: feito ? 'text-decoration:line-through' : '',
            texto: (i + 1) + '. ' + p.titulo
          }),
          quando ? el('span', { class: 'detalhe', style: 'display:block;font-size:12px', texto: quando }) : null
        ].filter(Boolean))
      ]));
    });

    return caixa;
  }

  /* Encerrar a partir do painel da ficha usa a MESMA tela de encerramento da
   * trilha aberta, empilhada em cima da ficha. Voltar devolve a ficha do jeito
   * que estava, sem redesenhar nada. */
  function encerrarPeloPainel(trilha, aluno, redesenhar) {
    abrirModal('modal-trilha');
    abrirEncerramento(trilha, aluno, function () {
      fecharModal('modal-trilha');
      if (redesenhar) redesenhar();
    }, function () {
      fecharModal('modal-trilha');
    });
    $('#corpo-modal-trilha').scrollTop = 0;
  }

  /* Caixa de lembrete que aparece ao abrir uma aula de aluno já mapeado. */
  /* Onde os dois pararam, no alto da aula de hoje.
   *
   * Mostra o encontro anterior daquele aluno: assunto, áreas, o que rendeu e o
   * que ela anotou só para ela. Nada aqui pede resposta, e nada aqui pode ser
   * editado: é memória, e a memória é a aula que já foi. O botão Abrir leva
   * para a aula de verdade, que é onde se corrige.
   *
   * Não aparece quando não há encontro anterior com conteúdo nenhum: a primeira
   * aula de um aluno novo não pode abrir com uma caixa vazia. */
  function desenharUltimoEncontro(corpo, aula) {
    if (!aula || !aula.alunoId) return;
    var u = Core.ultimoEncontro(db, aula.alunoId, aula);
    if (!u) return;

    var linhas = [];
    function linha(rotulo, texto) {
      if (!texto) return;
      linhas.push(el('div', { class: 'linha-ultimo' }, [
        el('strong', { texto: rotulo + ': ' }),
        document.createTextNode(texto)
      ]));
    }
    linha('Assunto', u.assuntos.join('; '));
    var areas = u.areas.slice(0, 4).join(', ') +
      (u.areas.length > 4 ? ' e mais ' + (u.areas.length - 4) : '');
    linha('Áreas', u.areas.length ? areas : '');
    linha('O que rendeu', u.oQueRendeu);

    var sinais = [];
    if (u.temFolha) sinais.push('folha escrita');
    if (u.qtdAnexos) sinais.push(u.qtdAnexos === 1 ? '1 anexo' : u.qtdAnexos + ' anexos');
    if (sinais.length) {
      linhas.push(el('div', { class: 'linha-ultimo ajuda', style: 'margin:2px 0 0',
        texto: 'Esse encontro tem ' + sinais.join(' e ') + '.' }));
    }

    /* A anotação particular do encontro anterior sai por último e fechada.
     *
     * Ela abria escrita, no alto da janela da aula, e o tablet fica na mesa
     * durante a aula inteira, com a mãe passando ao lado. É o único texto do
     * aplicativo escrito para não ser lido por ninguém além dela, e era o
     * primeiro que aparecia. Agora precisa de um toque, num botão de dedo, e
     * fica no fim do bloco: quem abre a aula vê o assunto e o que rendeu, que é
     * o que serve para começar, e a anotação só aparece quando ela quiser. */
    if (u.soMinha) {
      var texto = el('div', {
        class: 'linha-ultimo so-minha-anterior', id: 'so-minha-anterior', style: 'display:none'
      }, [
        el('strong', { texto: 'Só minha: ' }),
        document.createTextNode(u.soMinha)
      ]);
      var botao = el('button', {
        type: 'button', class: 'btn pequeno mostrar-so-minha', id: 'mostrar-so-minha',
        texto: 'Ver a sua anotação'
      });
      botao.addEventListener('click', function () {
        var escondida = texto.style.display === 'none';
        texto.style.display = escondida ? '' : 'none';
        botao.textContent = escondida ? 'Esconder a sua anotação' : 'Ver a sua anotação';
        /* O bloco tem teto de altura e rola por dentro: sem isto, deitado, o
         * texto aparecia abaixo da borda e o botão parecia não ter feito nada. */
        var caixa = texto.parentNode;
        if (escondida && caixa && caixa.scrollHeight > caixa.clientHeight) {
          caixa.scrollTop = caixa.scrollHeight;
        }
      });
      linhas.push(el('div', { style: 'margin-top:6px' }, [botao]));
      linhas.push(texto);
    }

    corpo.appendChild(el('div', { class: 'ultimo-encontro', id: 'ultimo-encontro' }, [
      el('div', { class: 'barra', style: 'margin-bottom:6px' }, [
        el('span', {
          class: 'rotulo-ultimo',
          texto: 'No último encontro, ' + Core.ddmmaaaa(u.data) + ', ' + u.diaSemana
        }),
        el('span', { class: 'cresce' }),
        el('button', {
          type: 'button', class: 'btn pequeno', id: 'abrir-ultimo-encontro', texto: 'Abrir',
          aoClick: function () { irParaOutraAula(u.aulaId); }
        })
      ])
    ].concat(linhas)));
  }

  /* Sair desta aula para outra sem jogar fora o que ela acabou de escrever.
   *
   * O botão Abrir fechava a janela e chamava a aula anterior direto: o que
   * estivesse nos dois campos de anotação sumia, sem gravar e sem perguntar.
   * O caminho é justamente o de quem estava escrevendo: ela digita o que
   * rendeu, rola até o alto para conferir onde os dois pararam, toca em Abrir.
   *
   * As duas anotações são gravadas antes de navegar, e é seguro fazer isso
   * calado: nota nunca escorre pela repetição e nunca muda dinheiro nenhum. O
   * que mexe no fechamento (data, horário, duração, situação e cobrança) NÃO é
   * gravado por tabela, porque numa aula que se repete isso abriria a pergunta
   * de escopo no meio da navegação. Se ela mexeu ali, a janela pergunta antes
   * de sair, e o padrão é ficar. */
  function irParaOutraAula(aulaId) {
    var seguir = function () {
      fecharModal('modal-aula');
      setTimeout(function () { abrirAula(aulaId, null); }, 120);
    };
    if (!aulaEmEdicao) { seguir(); return; }

    var valor = function (sel) { var e = $(sel); return e ? e.value : null; };
    var marcado = function (sel) { var e = $(sel); return e ? e.checked : null; };
    var stAtual = Core.STATUS[aulaEmEdicao.status] || Core.STATUS.realizada;
    var cobravelAtual = typeof aulaEmEdicao.cobravel === 'boolean'
      ? aulaEmEdicao.cobravel : stAtual.cobravelPadrao;
    var mexeuNoResto =
      (valor('#campo-data') !== null && valor('#campo-data') !== aulaEmEdicao.data) ||
      (valor('#campo-hora') !== null && valor('#campo-hora') !== (aulaEmEdicao.hora || '')) ||
      (valor('#campo-duracao') !== null &&
        parseInt(valor('#campo-duracao'), 10) !== aulaEmEdicao.duracaoMin) ||
      (valor('#campo-status') !== null &&
        valor('#campo-status') !== (aulaEmEdicao.status || 'realizada')) ||
      (marcado('#campo-cobrar') !== null && marcado('#campo-cobrar') !== cobravelAtual);

    if (mexeuNoResto && !confirmar(
      'Você mudou a data, o horário, a duração, a situação ou a cobrança desta aula ' +
      'e ainda não salvou. Abrir o outro encontro agora perde essa mudança. Abrir mesmo assim?'
    )) return;

    var campoNota = $('#campo-nota-texto');
    var campoPriv = $('#campo-nota-privada');
    var mudouNota = campoNota && campoNota.value !== (aulaEmEdicao.notaTexto || '');
    var mudouPriv = campoPriv && campoPriv.value !== (aulaEmEdicao.notaPrivada || '');
    if (!mudouNota && !mudouPriv) { seguir(); return; }

    if (campoNota) aulaEmEdicao.notaTexto = campoNota.value;
    if (campoPriv) aulaEmEdicao.notaPrivada = campoPriv.value;
    salvar().then(function () {
      fecharModal('modal-aula');
      desenharTudo();
      avisar('Sua anotação foi salva antes de abrir o outro encontro.');
      setTimeout(function () { abrirAula(aulaId, null); }, 120);
    });
  }

  /* O que ela marcou no mapeamento, de TODAS as matérias, numa lista só.
   *
   * O lembrete lia m.marcados, que é onde matemática sempre morou e continua
   * morando. As outras matérias nasceram em m.porMateria, e o que ela marcasse
   * em história, inglês ou redação não aparecia em canto nenhum na hora da
   * aula: ela mapeava o aluno com cuidado e abria a aula dele com uma caixa de
   * lembrete vazia, como se o mapeamento não existisse.
   *
   * As duas fontes viram uma aqui. O bloco do aluno vale em qualquer matéria e
   * entra uma vez só; o bloco de cada matéria entra por marcadosDaMateria, para
   * cada matéria que ela usou. Nada conta duas vezes: em matemática as duas
   * fontes saem da mesma lista, e o mesmo id não entra de novo. */
  function marcasDoMapeamento(aluno) {
    var m = Core.mapeamentoAtual(aluno);
    if (!m) return null;
    var out = {};
    function junta(fonte) {
      Object.keys(fonte || {}).forEach(function (chave) {
        out[chave] = out[chave] || [];
        (fonte[chave] || []).forEach(function (id) {
          if (out[chave].indexOf(id) < 0) out[chave].push(id);
        });
      });
    }
    junta(Core.marcadosDoAluno(m));
    Core.materiasDoMapeamento(m).forEach(function (id) {
      junta(Core.marcadosDaMateria(m, id));
    });
    return out;
  }

  /* O mesmo lembrete em texto, para o botão Copiar. Sai da MESMA união que a
   * caixa mostra: senão a tela diria uma coisa e o texto colado diria outra. */
  function textoDoLembreteCompleto(aluno) {
    var m = Core.mapeamentoAtual(aluno);
    var todas = marcasDoMapeamento(aluno);
    if (!m || !todas) return Core.textoDoLembrete(aluno);
    var L = [];
    var pri = (m.prioridades || '').trim();
    if (pri) L.push('Prioridades: ' + pri.replace(/\s*\n\s*/g, '; '));
    var lac = Core.rotulosDoMapa('lacunas', todas.lacunas).slice(0, 6);
    var ate = Core.rotulosDoMapa('atencao', todas.atencao).slice(0, 6);
    var apr = Core.rotulosDoMapa('aprende', todas.aprende).slice(0, 2);
    if (lac.length) L.push('Lacunas: ' + lac.join(', ') + '.');
    if (ate.length) L.push('Atenção: ' + ate.join(', ') + '.');
    if (apr.length) L.push('Aprende melhor: ' + apr.join(' e ') + '.');
    return L.join(' ');
  }

  function desenharLembrete(corpo, aluno, aula) {
    var l = Core.lembreteDoMapeamento(aluno);
    if (!l) return;

    /* O Core continua devolvendo o lembrete de matemática, que é o que ele
     * sempre devolveu e o que o PDF e a trilha leem. O que é da tela da aula, e
     * só dela, é enxergar as outras matérias junto. */
    var todas = marcasDoMapeamento(aluno);
    if (todas) {
      l.lacunas = Core.rotulosDoMapa('lacunas', todas.lacunas).slice(0, 4);
      l.totalLacunas = (todas.lacunas || []).length;
      l.atencao = Core.rotulosDoMapa('atencao', todas.atencao).slice(0, 4);
      l.totalAtencao = (todas.atencao || []).length;
      l.aprende = Core.rotulosDoMapa('aprende', todas.aprende).slice(0, 2);
    }

    var conteudo = [];

    /* Para onde o aluno está indo, e quanto tempo falta.
     *
     * Com a data da prova registrada no mapeamento, a aula passa a dizer
     * quantas semanas faltam. É o número que muda a conversa de "vamos ver
     * frações" para "faltam seis semanas". */
    var obj = Core.objetivoDe(aluno);
    if (obj) {
      var prazo = Core.semanasAteAProva(obj.dataProva);
      var texto = obj.rotulo;
      if (prazo) {
        texto += (texto ? '. ' : '') + 'Prova em ' + Core.ddmmaaaa(prazo.data) +
          ', ' + prazo.texto;
      }
      conteudo.push(el('div', { id: 'objetivo-da-aula', style: 'margin-bottom:5px' }, [
        el('strong', { texto: 'Objetivo: ' }),
        document.createTextNode(texto + '.')
      ]));
    }

    if (l.prioridades) {
      conteudo.push(el('div', { style: 'margin-bottom:5px' }, [
        el('strong', { texto: 'Prioridades: ' }),
        document.createTextNode(l.prioridades.replace(/\s*\n\s*/g, '; '))
      ]));
    }
    function linha(rotulo, itens, total) {
      if (!itens.length) return;
      var extra = total > itens.length ? ' e mais ' + (total - itens.length) : '';
      conteudo.push(el('div', { style: 'margin-bottom:4px' }, [
        el('strong', { texto: rotulo + ': ' }),
        document.createTextNode(itens.join(', ') + extra + '.')
      ]));
    }
    linha('Lacunas', l.lacunas, l.totalLacunas);
    linha('Atenção', l.atencao, l.totalAtencao);
    linha('Aprende melhor', l.aprende, l.aprende.length);

    var caixa = el('div', { class: 'lembrete', id: 'lembrete-mapeamento' }, [
      el('div', { class: 'barra', style: 'margin-bottom:6px' }, [
        el('span', {
          texto: 'Do mapeamento de ' + Core.ddmmaaaa(l.data),
          style: 'font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#2E7D6B'
        }),
        el('span', { class: 'cresce' }),
        el('button', {
          type: 'button', class: 'btn pequeno', id: 'abrir-mapeamento-da-aula', texto: 'Abrir',
          aoClick: function () { abrirMapeamento(aluno.id); }
        })
      ])
    ].concat(conteudo));

    if (aula) {
      caixa.appendChild(el('button', {
        type: 'button', class: 'btn pequeno', id: 'usar-lembrete',
        style: 'margin-top:8px',
        texto: 'Copiar para a anotação',
        aoClick: function () {
          var area = $('#campo-nota-texto');
          if (!area) return;
          var texto = textoDoLembreteCompleto(aluno);
          area.value = (area.value.trim() ? area.value.trim() + '\n\n' : '') + texto;
          area.dispatchEvent(new Event('input', { bubbles: true }));
          avisar('Lembrete copiado para a anotação. Ajuste como quiser.');
        }
      }));
    }
    corpo.appendChild(caixa);
  }

  /* Roteiro do encontro de mapeamento, dentro da própria aula. */
  function desenharEncontroDeMapeamento(corpo, aluno, aula) {
    corpo.appendChild(el('div', { class: 'faixa-info' }, [
      el('strong', { texto: 'Encontro de mapeamento. ' }),
      document.createTextNode('Este primeiro encontro é de sondagem: entender de onde o aluno ' +
        'parte antes de montar qualquer plano. Ele conta como aula normal no fechamento.')
    ]));

    var jaTem = Core.mapeado(aluno);
    corpo.appendChild(el('div', { class: 'barra', style: 'margin-bottom:6px' }, [
      el('button', {
        type: 'button', class: 'btn destaque', id: 'abrir-mapeamento',
        texto: jaTem ? 'Abrir o mapeamento' : 'Preencher o mapeamento',
        aoClick: function () { abrirMapeamento(aluno.id, { aulaId: aula.id }); }
      })
    ]));

    var roteiro = el('div', { id: 'roteiro-mapeamento' });
    ROTEIRO_MAPEAMENTO.forEach(function (par) {
      roteiro.appendChild(el('div', { class: 'passo-roteiro' }, [
        el('div', { class: 'nome', texto: par[0] }),
        el('div', { class: 'detalhe', texto: par[1] })
      ]));
    });
    corpo.appendChild(el('h3', { class: 'subtitulo', texto: 'Roteiro sugerido' }));
    corpo.appendChild(roteiro);
    corpo.appendChild(el('div', {
      class: 'ajuda',
      texto: 'É sugestão, não regra. Cada família chega de um jeito.'
    }));
  }

  // ================= banco de temas =================
  //
  // O tema é sempre opcional. A folha em branco continua sendo o caminho
  // principal, e existe para ela planejar a aula do jeito que quiser. Isto aqui
  // é um atalho para quando ela quiser material pronto, e nada mais.

  var SERIES_NOMES = [
    ['02', '2º ano'], ['03', '3º ano'], ['04', '4º ano'], ['05', '5º ano'],
    ['06', '6º ano'], ['07', '7º ano'], ['08', '8º ano'], ['09', '9º ano'],
    ['em1', '1º médio'], ['em2', '2º médio'], ['em3', '3º médio']
  ];
  var UNIDADES_NOMES = {
    numeros: 'Números', algebra: 'Álgebra', geometria: 'Geometria',
    grandezas: 'Grandezas', estatistica: 'Estatística'
  };

  /* Busca que não achou nada.
   *
   * Antes de escrever uma lista de sinônimos adivinhando o que ela digitaria,
   * vale descobrir o que ela digita de verdade e não encontra. Fica só no
   * aparelho, não vai para lugar nenhum, e guarda no máximo duzentas entradas.
   *
   * Grava depois que ela para de digitar, e não a cada tecla: senão o registro
   * enche de prefixo de palavra e não serve para nada. */
  var LIMITE_BUSCAS_VAZIAS = 200;
  var relogioBuscaVazia = null;

  function anotarBuscaSemResultado(termo, onde) {
    var t = String(termo || '').trim();
    if (t.length < 3) return;
    clearTimeout(relogioBuscaVazia);
    relogioBuscaVazia = setTimeout(function () {
      try {
        var bruto = localStorage.getItem('buscas-vazias');
        var lista = bruto ? JSON.parse(bruto) : [];
        if (!Array.isArray(lista)) lista = [];
        lista.push({ termo: t, onde: onde || '', quando: Core.hojeIso() });
        if (lista.length > LIMITE_BUSCAS_VAZIAS) {
          lista = lista.slice(lista.length - LIMITE_BUSCAS_VAZIAS);
        }
        localStorage.setItem('buscas-vazias', JSON.stringify(lista));
      } catch (e) {
        /* modo anônimo, ou armazenamento cheio. Registro é conveniência,
           e nunca pode atrapalhar a busca em si. */
      }
    }, 1200);
  }

  /* Lida em Ajustes, para virar pauta de conversa com ela. */
  function buscasSemResultado() {
    try {
      var bruto = localStorage.getItem('buscas-vazias');
      var lista = bruto ? JSON.parse(bruto) : [];
      if (!Array.isArray(lista)) return [];
      var conta = {};
      lista.forEach(function (r) {
        var k = Core.chaveDeBusca(r.termo);
        if (!conta[k]) conta[k] = { termo: r.termo, vezes: 0, ultima: r.quando };
        conta[k].vezes++;
        if (r.quando > conta[k].ultima) conta[k].ultima = r.quando;
      });
      return Object.keys(conta).map(function (k) { return conta[k]; })
        .sort(function (a, b) { return b.vezes - a.vezes || b.ultima.localeCompare(a.ultima); });
    } catch (e) {
      return [];
    }
  }

  function nomeDoAno(serie) {
    for (var i = 0; i < SERIES_NOMES.length; i++) {
      if (SERIES_NOMES[i][0] === serie) return SERIES_NOMES[i][1];
    }
    return serie;
  }

  var indiceTemas = null;
  var seriesCarregadas = {};
  var ultimoAnoEscolar = null;
  var indiceTemasFalhou = false;

  /* O índice de busca vem separado, e a falta dele não impede nada: sem ele a
   * busca volta a comparar título e resumo, que é o comportamento antigo. */
  var indiceDeBusca = null;

  function carregarIndice() {
    if (indiceTemas) return Promise.resolve(indiceTemas);
    return fetch('banco/indice.json').then(function (r) {
      if (!r.ok) throw new Error('indice indisponivel');
      return r.json();
    }).then(function (d) {
      indiceTemas = d.temas || [];
      carregarIndiceDeBusca();
      return indiceTemas;
    });
  }

  function carregarIndiceDeBusca() {
    if (indiceDeBusca) return Promise.resolve(indiceDeBusca);
    return fetch('banco/busca.json').then(function (r) {
      if (!r.ok) throw new Error('sem indice de busca');
      return r.json();
    }).then(function (d) {
      indiceDeBusca = d.temas || [];
      return indiceDeBusca;
    }).catch(function () {
      indiceDeBusca = null;
      return null;
    });
  }

  function carregarSerie(serie) {
    if (seriesCarregadas[serie]) return Promise.resolve(seriesCarregadas[serie]);
    return fetch('banco/serie-' + serie + '.json').then(function (r) {
      if (!r.ok) throw new Error('serie indisponivel');
      return r.json();
    }).then(function (d) {
      seriesCarregadas[serie] = d.temas || [];
      return seriesCarregadas[serie];
    });
  }

  /* ---------- os assuntos das outras matérias ----------
   *
   * banco/topicos/ tem um índice que descreve as doze disciplinas e um arquivo
   * por disciplina. Cada disciplina tem grupos (por ano escolar em português,
   * ciências, história, geografia, física, química, biologia e literatura; por
   * nível em inglês; transversais em redação, filosofia e sociologia e método
   * de estudo), cada grupo tem blocos com título, e cada bloco tem os tópicos.
   *
   * Os tópicos são cadeias de texto puras, sem id nenhum: o título é o que ela
   * lê e é o que fica guardado na aula. Por isso o item de assunto guarda
   * titulo, disciplina e grupo, e não um identificador que não existe. */
  var indiceTopicos = null;
  var topicosPorDisciplina = null;
  var topicosPlanos = null;
  var indiceTopicosFalhou = false;
  /* Guarda a última lista montada, completa ou não, para a tela saber a
   * diferença entre 'ainda não pedi' e 'pedi e não veio'. */
  var topicosParciais = null;

  function carregarIndiceTopicos() {
    if (indiceTopicos) return Promise.resolve(indiceTopicos);
    return fetch('banco/topicos/indice.json').then(function (r) {
      if (!r.ok) throw new Error('indice de topicos indisponivel');
      return r.json();
    }).then(function (d) {
      indiceTopicos = d.disciplinas || [];
      return indiceTopicos;
    });
  }

  /* Os treze arquivos de uma vez. Somam 99 KB, menos que o índice de busca que
   * já vem no pacote, e a lista precisa deles inteiros para a busca atravessar
   * as matérias sem ela ter que escolher uma antes. */
  function carregarTopicos() {
    if (topicosPlanos) return Promise.resolve(topicosPlanos);
    return carregarIndiceTopicos().then(function (disciplinas) {
      return Promise.all(disciplinas.map(function (d) {
        return fetch('banco/topicos/' + d.chave + '.json').then(function (r) {
          return r.ok ? r.json() : null;
        }).catch(function () { return null; });
      }));
    }).then(function (arquivos) {
      topicosPorDisciplina = {};
      var planos = [];
      arquivos.forEach(function (arquivo, i) {
        var d = indiceTopicos[i];
        if (!arquivo || !d) return;
        topicosPorDisciplina[d.chave] = arquivo;
        (arquivo.grupos || []).forEach(function (g) {
          (g.blocos || []).forEach(function (b) {
            (b.topicos || []).forEach(function (titulo) {
              planos.push({
                disciplina: d.chave, disciplinaNome: d.nome,
                grupo: g.chave, grupoRotulo: g.rotulo,
                bloco: b.titulo, titulo: titulo,
                chave: Core.chaveDeBusca(titulo + ' ' + b.titulo + ' ' + d.nome)
              });
            });
          });
        });
      });
      /* Só memoriza quando veio tudo.
       *
       * O índice tem 4 KB e os doze arquivos de disciplina somam 95 KB, então
       * quem costuma falhar são eles. Guardando lista incompleta, a sessão
       * inteira ficava sem as outras matérias mesmo depois de o sinal voltar,
       * porque a primeira linha desta função devolve o que está guardado.
       * Lista parcial é devolvida para a tela, mas não vira memória. */
      var faltaram = arquivos.filter(function (a) { return !a; }).length;
      topicosParciais = planos;
      if (!faltaram) topicosPlanos = planos;
      return planos;
    });
  }

  function rotuloDisciplina(chave) {
    if (chave === 'matematica') return 'Matemática';
    var d = (indiceTopicos || []).filter(function (x) { return x.chave === chave; })[0];
    return d ? d.nome : '';
  }

  function rotuloGrupoDeTopico(chaveDisciplina, chaveGrupo) {
    if (!chaveGrupo) return '';
    var d = (indiceTopicos || []).filter(function (x) { return x.chave === chaveDisciplina; })[0];
    if (!d) return '';
    var g = (d.grupos || []).filter(function (x) { return x.chave === chaveGrupo; })[0];
    return g ? g.rotulo : '';
  }

  /* O ano escolar não é perguntado em lugar nenhum: ele fica guardado sozinho na
   * primeira vez que ela escolhe um tema para aquele aluno, e da segunda em
   * diante a lista já abre no lugar certo. Um campo a menos para preencher.
   *
   * O valor guardado deixou de ser sempre uma série. O mapeamento passou a
   * aceitar cursinho, fora da escola e outro, e grava a escolha aqui: um aluno
   * que já tinha 9º ano aprendido virava "cursinho" e o seletor de tema, que só
   * conhece as séries, não achava a opção e caía na primeira da lista, o 2º
   * ano. Core.serieParaTemas é quem sabe traduzir: cursinho lê como 3º do
   * médio, e fora da escola e outro não viram série nenhuma, e aí o seletor cai
   * no último ano que ela usou, como já caía para aluno sem ano registrado. */
  function anoEscolarDe(aluno) {
    return Core.serieParaTemas((aluno && aluno.anoEscolar) || '') || null;
  }
  /* Aprender por uso não pode apagar o que ela respondeu no mapeamento. Um
   * aluno de cursinho abre a lista no 3º do médio, que é onde o cursinho lê; se
   * ela navegar dali para outro ano, o que fica guardado continua sendo
   * cursinho, e não o ano que ela foi olhar. O mesmo vale para fora da escola e
   * para outro. Ano de série continua sendo aprendido como sempre foi. */
  function lembrarAnoEscolar(aluno, ano) {
    if (!aluno || aluno.anoEscolar === ano) return;
    var guardado = aluno.anoEscolar || '';
    if (guardado && Core.serieParaTemas(guardado) !== guardado) return;
    aluno.anoEscolar = ano;
    salvar();
  }

  /* ================= o assunto da aula =================
   *
   * Reusa a janela do material, e não abre tela nova: tela nova é mais uma
   * coisa para ela decorar, e o caminho já é o mesmo que ela conhece.
   *
   * Três faixas, de cima para baixo. Escrever com as próprias palavras vem
   * primeiro, porque é o que o material dela fixou e é o que resolve o dia em
   * que o banco não tem o assunto. Depois as sugestões, que valem um toque só.
   * Por último a navegação por matéria, para quando ela quiser procurar.
   *
   * O campo não recebe foco automático de propósito: em tablet isso abre o
   * teclado por cima da lista toda vez que a janela abre. */
  function abrirAssunto(aulaId) {
    var aula = db.aulas.filter(function (a) { return a.id === aulaId; })[0];
    if (!aula) return;
    var aluno = alunoPorId(aula.alunoId);

    $('#titulo-modal-tema').textContent = 'Assunto da aula' + (aluno ? ', ' + aluno.nome : '');
    var corpo = $('#corpo-modal-tema');
    var rodape = $('#rodape-modal-tema');
    corpo.innerHTML = '';
    rodape.innerHTML = '';
    corpo.appendChild(el('div', {
      class: 'ajuda', style: 'margin-top:0', texto: 'Carregando os assuntos...'
    }));
    abrirModal('modal-tema');

    /* Os dois bancos em paralelo, e nenhum deles é obrigatório: faltando um, a
     * tela abre com o que veio, e escrever o assunto à mão sempre funciona. */
    Promise.all([
      carregarIndice().catch(function () { indiceTemasFalhou = true; return null; }),
      carregarTopicos().catch(function () { indiceTopicosFalhou = true; return null; })
    ]).then(function () {
      desenharEscolhaAssunto(aula, aluno);
    });
  }

  /* Grava o assunto na aula e fecha. É um item de aula.temas sem anexoId, que é
   * o que faz o fechamento, o PDF e a lista da aula continuarem funcionando sem
   * precisarem saber que alguma coisa mudou. */
  var MAX_TITULO_ASSUNTO = 70;

  function registrarAssunto(aula, item) {
    /* O corte mora aqui e não só no campo, porque o texto livre chega por dois
     * caminhos: o campo Escrever e a linha 'Usar o que você digitou assim
     * mesmo', que copia o termo da busca e não passa pelo maxlength. */
    if (item && item.titulo && item.titulo.length > MAX_TITULO_ASSUNTO) {
      item.titulo = item.titulo.slice(0, MAX_TITULO_ASSUNTO).replace(/\s+\S*$/, '');
    }
    var repetido = Core.temasDaAula(aula).filter(function (t) {
      return Core.chaveDeBusca(t.titulo || '') === Core.chaveDeBusca(item.titulo || '');
    })[0];
    if (repetido) {
      fecharModal('modal-tema');
      avisar('Este assunto já está registrado nesta aula.');
      return;
    }
    aula.temas = Core.temasDaAula(aula);
    aula.temas.push(item);
    delete aula.tema;

    /* A trilha anda de graça: o mesmo toque que registra o assunto marca o
     * passo daquele assunto, com a data DA AULA e não a de hoje, porque ela
     * lança aula atrasada e usa Repetir para trás. Só marca o passo que ainda
     * não foi dado, e nunca os anteriores: pular etapa é decisão dela. */
    var alunoDaAula = alunoPorId(aula.alunoId);
    var andou = alunoDaAula ? Core.marcarPassoPorAssunto(alunoDaAula, aula, item) : null;
    /* Este passo foi dado NESTA aula, então não é anterior à trilha. Um jaEra
     * que tivesse sobrado de uma desmarcação faria a ficha dizer "já trabalhado
     * em", como se a aula de hoje não contasse. E a marca de solto à mão sai
     * junto: ela acabou de dizer o contrário, registrando o assunto. */
    if (andou) {
      delete andou.passo.jaEra;
      delete andou.passo.marcaAnterior;
      delete andou.passo.soltoAMao;
    }

    salvar().then(function () {
      fecharModal('modal-tema');
      if ($('#modal-aula').classList.contains('aberto') && aulaEmEdicao &&
          aulaEmEdicao.id === aula.id) {
        if (!atualizarBlocoAssunto(aula.id) && $('#lista-temas-aula')) {
          desenharTemasDaAula($('#lista-temas-aula'), aula, alunoPorId(aula.alunoId));
        }
        if ($('#lista-anexos')) desenharAnexos($('#lista-anexos'), aula);
      }
      if (andou) atualizarPainelTrilhas(aula.alunoId);
      desenharAgenda();
      if (andou) {
        var feitos = Core.passosFeitos(andou.trilha);
        var total = (andou.trilha.passos || []).length;
        avisar('Assunto registrado, e a trilha andou: ' + feitos + ' de ' + total + ' passos.');
        return;
      }
      avisar('Assunto registrado: ' + item.titulo + '.');
    }).catch(function () {
      /* O passo também volta atrás: trilha que anda sem a aula ter sido gravada
       * contaria como dado o que não ficou registrado em lugar nenhum. */
      if (andou) {
        andou.passo.feitoEm = null;
        andou.passo.aulaId = null;
        delete item.passoDe;
      }
      /* A gravação falhou, então a memória tem que voltar a espelhar o disco.
       *
       * Sem desfazer, o assunto ficava só na memória e a guarda de duplicata
       * logo acima passava a recusar a segunda tentativa, dizendo que ele já
       * estava registrado quando não estava em lugar nenhum. Acontece de
       * verdade com o armazenamento cheio, e o aplicativo aceita anexo de até
       * 25 MB. */
      aula.temas = Core.temasDaAula(aula).filter(function (x) { return x !== item; });
      atualizarBlocoAssunto(aula.id);
      avisar('Não foi possível registrar o assunto. Tente de novo.');
    });
  }

  /* O que oferecer sem ela digitar nada: primeiro os cinco últimos assuntos
   * dados a este aluno, que é o que mais se repete de uma semana para a outra,
   * e depois os temas de matemática do ano escolar dele.
   *
   * O total é curto de propósito. Cada ano tem catorze temas de matemática, e
   * a lista inteira empurrava "Por matéria" para fora da tela: quem quiser o
   * ano completo toca em Matemática ali embaixo. */
  var MAX_SUGESTOES = 8;

  function sugestoesDeAssunto(aula, aluno) {
    var fora = {};
    Core.temasDaAula(aula).forEach(function (t) {
      fora[Core.chaveDeBusca(t.titulo || '')] = true;
    });

    var saida = [];
    function juntar(item, detalhe) {
      var chave = Core.chaveDeBusca(item.titulo || '');
      if (!chave || fora[chave]) return;
      fora[chave] = true;
      saida.push({ item: item, detalhe: detalhe });
    }

    /* O próximo passo da trilha vem na frente de tudo, porque é a resposta mais
     * provável para "o que a gente vê hoje". O cartão lá em cima é o caminho de
     * um toque; aqui é o mesmo assunto, para quando ela já entrou no seletor. */
    Core.trilhasAtivas(aluno || {}).forEach(function (tr) {
      var p = Core.proximoPasso(tr);
      if (!p) return;
      juntar(
        { id: p.temaId, titulo: p.titulo, fonte: 'banco', disciplina: 'matematica' },
        'próximo passo da trilha até ' + tr.titulo
      );
    });
    var daTrilha = saida.length;

    db.aulas.filter(function (a) {
      return a.alunoId === aula.alunoId && a.id !== aula.id;
    }).sort(function (a, b) { return b.data.localeCompare(a.data); })
      .forEach(function (a) {
        if (saida.length >= daTrilha + 5) return;
        Core.temasDaAula(a).forEach(function (t) {
          if (saida.length >= daTrilha + 5) return;
          juntar({
            id: t.id, titulo: t.titulo, fonte: t.fonte, disciplina: t.disciplina, grupo: t.grupo
          }, 'já dado em ' + Core.ddmm(a.data));
        });
      });

    var ano = anoEscolarDe(aluno) || ultimoAnoEscolar || '06';
    (indiceTemas || []).filter(function (t) { return t.serie === ano; })
      .forEach(function (t) {
        if (saida.length >= daTrilha + MAX_SUGESTOES) return;
        juntar(
          { id: t.id, titulo: t.pt.titulo, fonte: 'banco', disciplina: 'matematica' },
          'Matemática, ' + nomeDoAno(t.serie)
        );
      });

    return saida;
  }

  /* Casa o que ela digitou com um tópico, palavra por palavra: procurar
   * "verbo ser" tem que achar o tópico que escreve as duas separadas. */
  function casaTopico(chaveDoTopico, palavras) {
    for (var i = 0; i < palavras.length; i++) {
      if (chaveDoTopico.indexOf(palavras[i]) < 0) return false;
    }
    return true;
  }

  function desenharEscolhaAssunto(aula, aluno) {
    var corpo = $('#corpo-modal-tema');
    var rodape = $('#rodape-modal-tema');
    corpo.innerHTML = '';
    rodape.innerHTML = '';

    var busca = '';
    var nivel = { tipo: 'raiz' };

    var campoBusca = el('input', {
      type: 'text', id: 'busca-assunto',
      placeholder: 'Procurar assunto em qualquer matéria',
      style: 'flex:1;min-width:160px'
    });
    campoBusca.addEventListener('input', function () {
      busca = this.value;
      nivel = { tipo: 'raiz' };
      desenhar();
    });
    corpo.appendChild(el('div', { class: 'barra' }, [campoBusca]));

    var lista = el('div', { id: 'lista-assuntos' });
    corpo.appendChild(lista);

    rodape.appendChild(el('button', {
      type: 'button', class: 'btn', texto: 'Cancelar',
      aoClick: function () { fecharModal('modal-tema'); }
    }));

    function irPara(novo) {
      nivel = novo;
      busca = '';
      campoBusca.value = '';
      desenhar();
    }

    /* Linha inteira clicável: em tablet, alvo grande vale mais que botão. */
    function linha(titulo, detalhe, aoTocar, comSeta) {
      var dentro = [el('div', { class: 'nome', texto: titulo })];
      if (detalhe) dentro.push(el('div', { class: 'detalhe', texto: detalhe }));
      var item = el('div', { class: 'item-lista clicavel item-assunto' }, [
        el('div', { class: 'cresce' }, dentro),
        comSeta ? el('span', { class: 'tag', texto: 'abrir' }) : null
      ].filter(Boolean));
      item.addEventListener('click', aoTocar);
      return item;
    }

    function voltarPara(rotulo, titulo, aoTocar) {
      return el('div', { class: 'barra', style: 'margin-bottom:8px' }, [
        el('button', { type: 'button', class: 'btn pequeno', texto: '‹ Voltar', aoClick: aoTocar }),
        el('h3', { class: 'titulo', style: 'font-size:17px', texto: titulo })
      ]);
    }

    function desenhar() {
      lista.innerHTML = '';
      var termo = busca.trim();
      if (termo) { desenharBusca(termo); return; }
      if (nivel.tipo === 'disciplina') { desenharDisciplina(nivel.d); return; }
      if (nivel.tipo === 'grupo') { desenharGrupo(nivel.d, nivel.g); return; }
      desenharRaiz();
    }

    function desenharRaiz() {
      // 1. Escrever com as próprias palavras, sempre primeiro.
      lista.appendChild(el('div', { class: 'bloco-exercicios', texto: 'Escrever o assunto' }));
      /* Setenta caracteres é o limite, e ele existe porque até agora todo
       * título vinha do banco: o mais longo da matemática tem 57 e o mais longo
       * das outras matérias tem 63. Texto maior que isso não cabe na linha da
       * aula nem na tabela do fechamento que a família lê, e sai cortado no
       * meio de uma palavra. Cortar na entrada é melhor do que cortar na
       * impressão, porque ela vê o que vai sair. */
      var campoOutro = el('input', {
        type: 'text', id: 'assunto-outro', maxlength: '70',
        placeholder: 'Com as suas palavras', style: 'flex:1;min-width:160px'
      });
      var usar = el('button', {
        type: 'button', class: 'btn principal', id: 'usar-assunto-outro', texto: 'Usar',
        aoClick: function () {
          var texto = campoOutro.value.trim();
          if (!texto) { avisar('Escreva o assunto antes de tocar em Usar.'); return; }
          registrarAssunto(aula, { titulo: texto, fonte: 'livre' });
        }
      });
      campoOutro.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); usar.click(); }
      });
      lista.appendChild(el('div', { class: 'barra', style: 'margin-bottom:12px' }, [campoOutro, usar]));

      // 2. Sugestões, sem digitar nada.
      var sugestoes = sugestoesDeAssunto(aula, aluno);
      if (sugestoes.length) {
        lista.appendChild(el('div', { class: 'bloco-exercicios', texto: 'Sugestões para este aluno' }));
        sugestoes.forEach(function (s) {
          lista.appendChild(linha(s.item.titulo, s.detalhe, function () {
            registrarAssunto(aula, s.item);
          }));
        });
      }

      // 3. Por matéria, com a matemática na frente.
      lista.appendChild(el('div', { class: 'bloco-exercicios', texto: 'Por matéria' }));
      lista.appendChild(linha('Matemática',
        indiceTemas ? indiceTemas.length + ' temas, com material pronto' : 'temas com material pronto',
        function () { abrirMatematicaComoAssunto(aula, aluno); }, true));
      (indiceTopicos || []).forEach(function (d) {
        lista.appendChild(linha(d.nome, d.topicos + ' assuntos', function () {
          irPara({ tipo: 'disciplina', d: d });
        }, true));
      });
      /* A faixa vale para os dois jeitos de faltar: o índice não abriu, ou ele
       * abriu e os arquivos das disciplinas não vieram. O segundo é o mais
       * provável, porque o índice tem 4 KB e os doze somam 95 KB, e era
       * justamente o que passava calado: ela via as doze matérias com a
       * contagem, entrava numa e encontrava o vazio sem explicação. */
      var semTopicos = !indiceTopicos ||
        (topicosParciais !== null && !topicosParciais.length);
      if (semTopicos) {
        lista.appendChild(el('div', { class: 'faixa-aviso' }, [
          el('strong', { texto: 'As outras matérias não abriram agora. ' }),
          document.createTextNode('Abra o aplicativo uma vez com internet para elas ficarem ' +
            'guardadas no tablet. Escrever o assunto acima continua funcionando sem sinal.')
        ]));
      }
    }

    function desenharDisciplina(d) {
      lista.appendChild(voltarPara('‹ Voltar', d.nome, function () { irPara({ tipo: 'raiz' }); }));
      var arquivo = topicosPorDisciplina ? topicosPorDisciplina[d.chave] : null;
      var grupos = (arquivo && arquivo.grupos) || [];
      if (!grupos.length) {
        lista.appendChild(el('div', { class: 'vazio' }, [
          el('p', { texto: 'Os assuntos desta matéria não estão guardados no tablet.' })
        ]));
        return;
      }
      grupos.forEach(function (g) {
        var quantos = 0;
        (g.blocos || []).forEach(function (b) { quantos += (b.topicos || []).length; });
        lista.appendChild(linha(g.rotulo, quantos + ' assuntos', function () {
          irPara({ tipo: 'grupo', d: d, g: g });
        }, true));
      });
    }

    /* Os blocos viram título e os tópicos ficam logo abaixo, na mesma tela.
     * Um nível a menos para tocar, e ela vê o grupo inteiro de uma vez. */
    function desenharGrupo(d, g) {
      lista.appendChild(voltarPara('‹ Voltar', d.nome + ', ' + g.rotulo, function () {
        irPara({ tipo: 'disciplina', d: d });
      }));
      (g.blocos || []).forEach(function (b) {
        lista.appendChild(el('div', { class: 'bloco-exercicios', texto: b.titulo }));
        (b.topicos || []).forEach(function (titulo) {
          lista.appendChild(linha(titulo, '', function () {
            registrarAssunto(aula, {
              titulo: titulo, fonte: 'topico', disciplina: d.chave, grupo: g.chave
            });
          }));
        });
      });
    }

    function desenharBusca(termo) {
      var achados = [];
      var exatos = 0;

      if (indiceTemas) {
        var porId = {};
        indiceTemas.forEach(function (t) { porId[t.id] = t; });
        var itens, completa = true;
        if (indiceDeBusca && typeof Busca !== 'undefined') {
          var r = Busca.procurar(indiceDeBusca, termo) || { itens: [] };
          itens = r.itens || [];
          /* A busca de matemática responde por aproximação quando não acha tudo
           * o que ela escreveu. Aproximação é resposta útil, mas não é achado:
           * conta como zero para decidir onde fica a linha do texto livre. */
          completa = r.completa !== false;
        } else {
          itens = indiceTemas.filter(function (t) {
            return Core.casaBusca(t.pt.titulo + ' ' + t.pt.resumo, termo);
          }).map(function (t) { return { id: t.id }; });
        }
        itens.forEach(function (x) {
          var t = porId[x.id];
          if (!t) return;
          if (completa) exatos++;
          achados.push({
            titulo: t.pt.titulo, detalhe: 'Matemática, ' + nomeDoAno(t.serie),
            item: { id: t.id, titulo: t.pt.titulo, fonte: 'banco', disciplina: 'matematica' }
          });
        });
      }

      var palavras = Core.chaveDeBusca(termo).split(/\s+/).filter(Boolean);
      (topicosPlanos || []).forEach(function (p) {
        if (!casaTopico(p.chave, palavras)) return;
        exatos++;
        achados.push({
          titulo: p.titulo,
          detalhe: p.disciplinaNome + ', ' + p.grupoRotulo + ' · ' + p.bloco,
          item: {
            titulo: p.titulo, fonte: 'topico', disciplina: p.disciplina, grupo: p.grupo
          }
        });
      });

      var livre = linha('Usar "' + termo + '" assim mesmo',
        'grava exatamente o que você escreveu', function () {
          registrarAssunto(aula, { titulo: termo, fonte: 'livre' });
        });

      /* Ela procura assunto que o banco não tem, e é por isso que a anotação
       * existe. Aqui a saída fica na primeira linha, e não num beco. */
      if (!exatos) {
        anotarBuscaSemResultado(termo, 'assunto da aula');
        lista.appendChild(livre);
        lista.appendChild(el('div', {
          class: 'ajuda',
          texto: achados.length
            ? 'Nenhum assunto do banco casou com tudo o que você escreveu. ' +
              'A linha de cima grava exatamente o que está escrito; abaixo, o mais próximo.'
            : 'Nenhum assunto do banco casou com o que você escreveu.'
        }));
      }

      var LIMITE = 120;
      if (!achados.length) return;

      if (exatos) {
        lista.appendChild(el('div', { class: 'ajuda', style: 'margin-top:0' }, [
          document.createTextNode(achados.length +
            (achados.length === 1 ? ' assunto encontrado' : ' assuntos encontrados') +
            (achados.length > LIMITE ? ', mostrando os ' + LIMITE + ' primeiros.' : '.'))
        ]));
      }
      achados.slice(0, LIMITE).forEach(function (a) {
        lista.appendChild(linha(a.titulo, a.detalhe, function () {
          registrarAssunto(aula, a.item);
        }));
      });
      if (exatos) lista.appendChild(livre);
    }

    desenhar();
  }

  /* A matemática do assunto reusa a lista do material, com o mesmo filtro por
   * ano e a mesma busca. O que muda é só o que acontece ao escolher: aqui vira
   * registro da aula, e não montagem de PDF. */
  function abrirMatematicaComoAssunto(aula, aluno) {
    if (!indiceTemas) { avisar('O banco de matemática não abriu agora.'); return; }
    desenharEscolhaTema(indiceTemas, aula, aluno, '', {
      rotuloEscolher: 'Usar',
      rotuloVoltar: '‹ Voltar',
      voltar: function () { desenharEscolhaAssunto(aula, aluno); },
      aoEscolher: function (t) {
        registrarAssunto(aula, {
          id: t.id, titulo: t.pt.titulo, fonte: 'banco', disciplina: 'matematica'
        });
      }
    });
  }

  /* Passo 1: escolher o tema. */
  function abrirTemas(aulaId, opcoes) {
    opcoes = opcoes || {};
    var aula = aulaId ? db.aulas.filter(function (a) { return a.id === aulaId; })[0] : null;
    if (aulaId && !aula) return;
    // Sem aula por tras, ela esta so consultando material: o botao final entrega
    // o arquivo em vez de anexar em lugar nenhum.
    var aluno = aula ? alunoPorId(aula.alunoId) : (opcoes.aluno || null);
    $('#titulo-modal-tema').textContent = (aula ? 'Material de aula' : 'Consultar temas') +
      (aluno ? ', ' + aluno.nome : '');

    var corpo = $('#corpo-modal-tema');
    var rodape = $('#rodape-modal-tema');
    corpo.innerHTML = '';
    rodape.innerHTML = '';
    corpo.appendChild(el('div', { class: 'ajuda', style: 'margin-top:0', texto: 'Carregando os temas...' }));
    abrirModal('modal-tema');

    carregarIndice().then(function (temas) {
      desenharEscolhaTema(temas, aula, aluno, opcoes.busca || '');
    }).catch(function () {
      corpo.innerHTML = '';
      corpo.appendChild(el('div', { class: 'faixa-aviso' }, [
        el('strong', { texto: 'Não consegui abrir o banco de temas. ' }),
        document.createTextNode('Se for a primeira vez, abra o aplicativo uma vez com internet. ' +
          'De qualquer jeito, a folha em branco continua funcionando normalmente.')
      ]));
    });
  }

  /* opcoes existe para esta mesma lista servir a dois caminhos sem virar duas
   * funções: pelo botão "Material de aula" ela leva à montagem do PDF, que é o
   * padrão e não muda em nada; pelo assunto da aula ela só registra o tema.
   * O que vier aqui viaja junto até o botão "‹ Outro tema" da montagem, senão
   * voltar de lá cairia no caminho errado. */
  function desenharEscolhaTema(temas, aula, aluno, buscaInicial, opcoes) {
    opcoes = opcoes || {};
    var corpo = $('#corpo-modal-tema');
    var rodape = $('#rodape-modal-tema');
    corpo.innerHTML = '';
    rodape.innerHTML = '';

    if (opcoes.voltar) {
      corpo.appendChild(el('div', { class: 'barra', style: 'margin-bottom:8px' }, [
        el('button', {
          type: 'button', class: 'btn pequeno',
          texto: opcoes.rotuloVoltar || '‹ Voltar', aoClick: opcoes.voltar
        })
      ]));
    }

    var serieAtual = anoEscolarDe(aluno) || ultimoAnoEscolar || '06';
    var busca = buscaInicial || '';

    var selSerie = el('select', { style: 'max-width:150px' });
    SERIES_NOMES.forEach(function (par) {
      var o = el('option', { value: par[0], texto: par[1] });
      if (par[0] === serieAtual) o.selected = true;
      selSerie.appendChild(o);
    });

    var campoBusca = el('input', {
      type: 'text', placeholder: 'Procurar por assunto', style: 'flex:1;min-width:160px'
    });
    campoBusca.value = busca;

    /* Vindo de uma lacuna do mapeamento, a busca costuma achar temas espalhados
       por varios anos. Comecar pelo ano do aluno e nao achar nada seria um beco
       sem saida, entao abrimos no primeiro ano que tem resposta. */
    if (busca) {
      var casa = function (t) {
        return Core.casaBusca(t.pt.titulo + ' ' + t.pt.resumo + ' ' + t.en.titulo, busca);
      };
      if (!temas.filter(function (t) { return t.serie === serieAtual && casa(t); }).length) {
        var achou = temas.filter(casa)[0];
        if (achou) {
          serieAtual = achou.serie;
          for (var iOpc = 0; iOpc < selSerie.options.length; iOpc++) {
            selSerie.options[iOpc].selected = selSerie.options[iOpc].value === serieAtual;
          }
        }
      }
    }

    corpo.appendChild(el('div', { class: 'barra' }, [selSerie, campoBusca]));
    var lista = el('div', { id: 'lista-temas' });
    corpo.appendChild(lista);

    /* Sem busca, a lista é a do ano escolhido, como sempre foi. Com busca, ela
     * atravessa os anos, porque o assunto que ela procura muitas vezes está no
     * ano anterior, e é justamente disso que a aula de reforço trata. */
    function procurarTemas(termo) {
      if (!termo) {
        return {
          achados: temas.filter(function (t) { return t.serie === serieAtual; })
            .map(function (t) { return { tema: t, onde: 'titulo', completa: true }; }),
          atravessaAnos: false
        };
      }
      if (indiceDeBusca && typeof Busca !== 'undefined') {
        var porId = {};
        temas.forEach(function (t) { porId[t.id] = t; });
        var r = Busca.procurar(indiceDeBusca, termo) || { itens: [] };
        var achados = r.itens
          .map(function (x) {
            return { tema: porId[x.id], onde: x.onde, completa: x.completa };
          })
          .filter(function (x) { return x.tema; });
        return {
          achados: achados, atravessaAnos: true, total: r.total,
          completa: r.completa, corrigida: r.corrigida, foraDoAno: r.foraDoAno
        };
      }
      /* Sem o índice de busca, volta a procurar só no título e no resumo. */
      return {
        achados: temas.filter(function (t) {
          return Core.casaBusca(t.pt.titulo + ' ' + t.pt.resumo + ' ' + t.en.titulo, termo);
        }).map(function (t) { return { tema: t, onde: 'titulo', completa: true }; }),
        atravessaAnos: true
      };
    }

    function redesenhar() {
      lista.innerHTML = '';
      var termo = busca.trim();
      var achado = procurarTemas(termo);
      var filtrados = achado.achados;

      /* O que ela procurou e o banco não tem fica anotado, tanto quando a
       * lista vem vazia quanto quando vem só por aproximação: nos dois casos
       * ela procurou um assunto que não existe aqui. */
      if (termo && (!filtrados.length || achado.completa === false)) {
        anotarBuscaSemResultado(termo, 'temas de matemática');
      }
      if (!filtrados.length) {
        lista.appendChild(el('div', { class: 'vazio' }, [
          el('p', { texto: termo ? 'Nenhum tema encontrado para essa busca.' : 'Nenhum tema nesta série.' })
        ]));
        return;
      }

      if (termo && achado.atravessaAnos) {
        var deOutroAno = filtrados.filter(function (x) { return x.tema.serie !== serieAtual; }).length;
        var recado = filtrados.length + (filtrados.length === 1 ? ' tema' : ' temas') +
          (deOutroAno ? ', sendo ' + deOutroAno + ' de outros anos' : ', neste ano') + '.';
        var extra = '';
        if (achado.corrigida) extra = ' Corrigi o que parecia erro de digitação.';
        else if (achado.completa === false) extra = ' Não achei tudo o que você escreveu, então mostro o mais próximo.';
        lista.appendChild(el('div', { class: 'ajuda', style: 'margin-top:0' }, [
          document.createTextNode(recado),
          extra ? el('strong', { texto: extra }) : null
        ].filter(Boolean)));
      }

      filtrados.forEach(function (x) {
        var t = x.tema;
        var rotulo = typeof Busca !== 'undefined' && Busca.ROTULO ? Busca.ROTULO[x.onde] : '';
        lista.appendChild(el('div', { class: 'item-lista item-tema' }, [
          el('div', { class: 'cresce' }, [
            el('div', { class: 'nome' }, [
              document.createTextNode(t.pt.titulo),
              el('span', { class: 'tag', texto: UNIDADES_NOMES[t.unidade] || t.unidade, style: 'margin-left:8px' }),
              termo && t.serie !== serieAtual
                ? el('span', { class: 'tag serie', texto: nomeDoAno(t.serie), style: 'margin-left:6px' })
                : null,
              rotulo ? el('span', { class: 'tag', texto: rotulo, style: 'margin-left:6px' }) : null
            ].filter(Boolean)),
            el('div', { class: 'detalhe', texto: t.pt.resumo }),
            el('div', {
              class: 'detalhe',
              texto: t.qtd + ' exercícios · cerca de ' + t.duracaoMin + ' minutos · dificuldade ' +
                t.dificuldade + ' de 5'
            })
          ]),
          el('button', {
            type: 'button', class: 'btn pequeno principal',
            texto: opcoes.rotuloEscolher || 'Escolher',
            aoClick: function () {
              if (opcoes.aoEscolher) opcoes.aoEscolher(t);
              else abrirMontagem(t, aula, aluno, opcoes);
            }
          })
        ]));
      });
    }

    selSerie.addEventListener('change', function () {
      serieAtual = this.value;
      ultimoAnoEscolar = serieAtual;
      lembrarAnoEscolar(aluno, serieAtual);
      redesenhar();
    });
    campoBusca.addEventListener('input', function () { busca = this.value; redesenhar(); });
    redesenhar();

    rodape.appendChild(el('button', {
      type: 'button', class: 'btn', texto: 'Cancelar',
      aoClick: function () { fecharModal('modal-tema'); }
    }));
  }

  /* Passo 2: montar o material, escolhendo o que entra e quais exercícios. */
  function abrirMontagem(resumoTema, aula, aluno, opcoes) {
    var corpo = $('#corpo-modal-tema');
    var rodape = $('#rodape-modal-tema');
    corpo.innerHTML = '';
    rodape.innerHTML = '';
    corpo.appendChild(el('div', { class: 'ajuda', texto: 'Carregando o tema...' }));

    carregarSerie(resumoTema.serie).then(function (temas) {
      var tema = temas.filter(function (t) { return t.id === resumoTema.id; })[0];
      if (!tema) throw new Error('tema nao encontrado');
      desenharMontagem(tema, aula, aluno, opcoes);
    }).catch(function () {
      corpo.innerHTML = '';
      corpo.appendChild(el('div', { class: 'faixa-aviso' }, [
        document.createTextNode('Não consegui abrir este tema. Abra o aplicativo uma vez com ' +
          'internet para ele ficar guardado no tablet.')
      ]));
    });
  }

  function desenharMontagem(tema, aula, aluno, opcoes) {
    opcoes = opcoes || {};
    var corpo = $('#corpo-modal-tema');
    var rodape = $('#rodape-modal-tema');
    corpo.innerHTML = '';
    rodape.innerHTML = '';

    var lingua = 'pt';
    var incluir = { material: true, lista: true, gabarito: false };
    var marcados = {};
    tema.pt.exercicios.forEach(function (e) { marcados[e.n] = true; });

    corpo.appendChild(el('div', { class: 'barra', style: 'margin-bottom:8px' }, [
      el('button', {
        type: 'button', class: 'btn pequeno',
        texto: opcoes.rotuloVoltar || '‹ Outro tema',
        aoClick: function () {
          if (opcoes.voltar) opcoes.voltar();
          else desenharEscolhaTema(indiceTemas, aula, aluno, '', opcoes);
        }
      }),
      el('h3', { class: 'titulo', style: 'font-size:17px', texto: tema.pt.titulo })
    ]));

    // idioma
    var linhaIdioma = el('div', { class: 'barra', style: 'margin-bottom:10px' });
    [['pt', 'Português'], ['en', 'English']].forEach(function (par) {
      var b = el('button', {
        type: 'button', class: 'btn pequeno' + (par[0] === lingua ? ' principal' : ''),
        texto: par[1], 'data-lingua': par[0]
      });
      b.addEventListener('click', function () {
        lingua = par[0];
        linhaIdioma.querySelectorAll('[data-lingua]').forEach(function (x) { x.classList.remove('principal'); });
        b.classList.add('principal');
        desenharExercicios();
      });
      linhaIdioma.appendChild(b);
    });
    corpo.appendChild(el('div', { class: 'campo' }, [
      el('span', { texto: 'Idioma do material', style: 'display:block;font-size:13px;font-weight:700;color:#1F3A5F;margin-bottom:5px' }),
      linhaIdioma
    ]));

    // o que entra
    var caixaPartes = el('div', { style: 'display:flex;gap:14px;flex-wrap:wrap;margin-bottom:6px' });
    [['material', 'Material explicativo'], ['lista', 'Lista de exercícios'], ['gabarito', 'Gabarito']]
      .forEach(function (par) {
        var chk = el('input', { type: 'checkbox', style: 'width:auto;min-height:auto' });
        chk.checked = incluir[par[0]];
        chk.addEventListener('change', function () {
          incluir[par[0]] = this.checked;
          caixaExercicios.style.display = incluir.lista || incluir.gabarito ? '' : 'none';
          atualizarRodape();
        });
        caixaPartes.appendChild(el('label', {
          style: 'display:flex;align-items:center;gap:7px;font-size:15px;cursor:pointer'
        }, [chk, el('span', { texto: par[1] })]));
      });
    corpo.appendChild(el('div', { class: 'campo' }, [
      el('span', { texto: 'O que incluir', style: 'display:block;font-size:13px;font-weight:700;color:#1F3A5F;margin-bottom:5px' }),
      caixaPartes
    ]));
    corpo.appendChild(el('div', {
      class: 'ajuda',
      texto: 'O gabarito sai numa folha separada, para a lista poder ser entregue sem ele.'
    }));

    // exercícios
    var caixaExercicios = el('div');
    corpo.appendChild(caixaExercicios);

    function contarMarcados() {
      return Object.keys(marcados).filter(function (k) { return marcados[k]; }).length;
    }

    function desenharExercicios() {
      caixaExercicios.innerHTML = '';
      var dados = tema[lingua];
      caixaExercicios.appendChild(el('div', { class: 'barra', style: 'margin:14px 0 8px' }, [
        el('h3', { class: 'subtitulo', style: 'margin:0;border:none', texto: 'Quais exercícios' }),
        el('span', { class: 'cresce' }),
        el('button', {
          type: 'button', class: 'btn pequeno', texto: 'Marcar todos',
          aoClick: function () {
            dados.exercicios.forEach(function (e) { marcados[e.n] = true; });
            desenharExercicios();
          }
        }),
        el('button', {
          type: 'button', class: 'btn pequeno', texto: 'Desmarcar todos',
          aoClick: function () {
            dados.exercicios.forEach(function (e) { marcados[e.n] = false; });
            desenharExercicios();
          }
        })
      ]));

      var blocoAtual = null;
      dados.exercicios.forEach(function (ex) {
        if (ex.bloco && ex.bloco !== blocoAtual) {
          blocoAtual = ex.bloco;
          caixaExercicios.appendChild(el('div', { class: 'bloco-exercicios', texto: blocoAtual }));
        }
        var chk = el('input', { type: 'checkbox', style: 'width:auto;min-height:auto;margin-top:3px' });
        chk.checked = !!marcados[ex.n];
        chk.addEventListener('change', function () {
          marcados[ex.n] = this.checked;
          atualizarRodape();
        });
        caixaExercicios.appendChild(el('label', { class: 'item-exercicio' }, [
          chk,
          el('div', { class: 'cresce' }, [
            el('div', { class: 'texto-exercicio' }, comNotacao(ex.enunciado))
          ])
        ]));
      });
      atualizarRodape();
    }

    function atualizarRodape() {
      rodape.innerHTML = '';
      var quantos = contarMarcados();
      var precisaExercicio = incluir.lista || incluir.gabarito;
      var nada = !incluir.material && !precisaExercicio;
      var semExercicio = precisaExercicio && quantos === 0;

      rodape.appendChild(el('span', {
        class: 'esquerda ajuda', style: 'margin:0;align-self:center',
        texto: precisaExercicio
          ? quantos + ' de ' + tema.pt.exercicios.length + ' exercícios marcados'
          : 'só o material explicativo'
      }));
      rodape.appendChild(el('button', {
        type: 'button', class: 'btn', texto: 'Cancelar',
        aoClick: function () { fecharModal('modal-tema'); }
      }));
      var botao = el('button', {
        type: 'button', class: 'btn principal',
        texto: aula ? 'Gerar e anexar à aula' : 'Gerar material',
        aoClick: function () {
          gerarMaterialDoTema(tema, lingua, incluir, marcados, aula, aluno, opcoes.itemExistente);
        }
      });
      if (nada || semExercicio) botao.disabled = true;
      rodape.appendChild(botao);
    }

    desenharExercicios();
  }

  /* Passo 3: gerar o PDF e anexar à aula.
   *
   * itemExistente vem quando o material foi pedido a partir de um assunto que
   * já está registrado na aula. Aí o PDF entra naquele item, e não num segundo:
   * sem isso, tocar em "Material" numa linha de assunto criaria uma linha
   * repetida do mesmo assunto no fechamento do mês. */
  function gerarMaterialDoTema(tema, lingua, incluir, marcados, aula, aluno, itemExistente) {
    var escolhidos = tema[lingua].exercicios
      .map(function (e) { return e.n; })
      .filter(function (n) { return marcados[n]; });

    var partes = [];
    if (incluir.material) partes.push('material');
    if (incluir.lista) partes.push('lista');
    if (incluir.gabarito) partes.push('gabarito');

    var bytes = PDFGen.gerarMaterialTema({
      tema: tema, lingua: lingua,
      incluirMaterial: incluir.material,
      incluirLista: incluir.lista,
      incluirGabarito: incluir.gabarito,
      escolhidos: escolhidos,
      aluno: aluno ? aluno.nome : '',
      data: aula ? Core.ddmmaaaa(aula.data) : Core.ddmmaaaa(Core.hojeIso()),
      espacoParaResposta: incluir.lista && !incluir.gabarito ? 24 : 0
    });

    var nome = Core.nomeArquivo(tema[lingua].titulo) + '_' + tema.id + '.pdf';
    var blob = new Blob([bytes], { type: 'application/pdf' });
    var id = Core.uid();

    // Consultando material, sem aula: entrega o arquivo e pronto.
    if (!aula) {
      fecharModal('modal-tema');
      entregarArquivo(nome, blob, tema[lingua].titulo);
      return;
    }

    Store.salvarAnexo(id, { nome: nome, tipo: 'application/pdf', blob: blob }).then(function () {
      aula.anexos = aula.anexos || [];
      aula.anexos.push({ id: id, nome: nome, tamanho: blob.size });
      // Uma aula pode tratar mais de um assunto: os temas se somam.
      aula.temas = Core.temasDaAula(aula);
      var jaEsta = itemExistente ? aula.temas.indexOf(itemExistente) : -1;
      if (jaEsta >= 0) {
        itemExistente.id = tema.id;
        itemExistente.titulo = itemExistente.titulo || tema[lingua].titulo;
        itemExistente.lingua = lingua;
        itemExistente.partes = partes;
        itemExistente.exercicios = escolhidos.length;
        itemExistente.anexoId = id;
      } else {
        aula.temas.push({
          id: tema.id, titulo: tema[lingua].titulo, lingua: lingua,
          partes: partes, exercicios: escolhidos.length, anexoId: id
        });
      }
      delete aula.tema;
      return salvar();
    }).then(function () {
      fecharModal('modal-tema');
      if ($('#modal-aula').classList.contains('aberto') && aulaEmEdicao &&
          aulaEmEdicao.id === aula.id) {
        if (!atualizarBlocoAssunto(aula.id) && $('#lista-temas-aula')) {
          desenharTemasDaAula($('#lista-temas-aula'), aula, aluno);
        }
        if ($('#lista-anexos')) desenharAnexos($('#lista-anexos'), aula);
      }
      desenharAgenda();
      avisar('Material anexado à aula.', 'Abrir', function () {
        entregarArquivo(nome, blob, tema[lingua].titulo);
      });
    }).catch(function () {
      avisar('Não foi possível gerar o material.');
    });
  }

  // ================= fechamento =================

  function mesesComDados() {
    var conjunto = {};
    db.aulas.forEach(function (a) { conjunto[Core.mesDe(a.data)] = true; });
    conjunto[mesAtual] = true;
    conjunto[Core.mesDe(Core.hojeIso())] = true;
    return Object.keys(conjunto).sort().reverse();
  }

  function desenharFechamento() {
    var sel = $('#mes-fechamento');
    var meses = mesesComDados();
    sel.innerHTML = '';
    meses.forEach(function (m) {
      var o = el('option', { value: m, texto: Core.mesExtenso(m) });
      if (m === mesAtual) o.selected = true;
      sel.appendChild(o);
    });

    var fechs = Core.calcularMesInteiro(db, mesAtual);
    var t = Core.totaisDoMes(fechs);

    var numeros = $('#numeros-fechamento');
    numeros.innerHTML = '';
    numeros.appendChild(numeroComRodape('Alunos no mês', String(t.alunos), []));
    numeros.appendChild(numeroComRodape('Encontros', String(t.encontrosFeitos), [
      t.encontrosPrevistos ? 'mais ' + t.encontrosPrevistos + ' ' +
        plural(t.encontrosPrevistos, 'marcado à frente', 'marcados à frente') : ''
    ]));
    numeros.appendChild(numeroComRodape('Horas cobradas', Core.fmtHoras(t.minFeitos) + ' h', [
      t.minPrevistos ? 'mais ' + Core.fmtHoras(t.minPrevistos) + ' h à frente' : ''
    ]));
    numeros.appendChild(numeroComRodape('Total a receber', dinheiro(t.valorFeito), [
      t.valorPrevisto ? 'previsto à frente: ' + dinheiro(t.valorPrevisto) : '',
      t.valorPrevisto ? 'mês inteiro: ' + dinheiro(t.valor) : ''
    ]));

    desenharGentilezas(numeros, t);

    var lista = $('#lista-fechamento');
    lista.innerHTML = '';
    if (!fechs.length) {
      lista.appendChild(el('div', { class: 'vazio' }, [
        el('p', { texto: 'Nenhuma aula registrada em ' + Core.mesExtenso(mesAtual) + '.' })
      ]));
      desenharPanoramaDeValores();
      return;
    }

    fechs.forEach(function (f) {
      var cartao = el('div', { class: 'cartao' });

      cartao.appendChild(el('div', { class: 'barra', style: 'margin-bottom:10px' }, [
        el('h3', { class: 'titulo', style: 'font-size:18px', texto: f.alunoNome }),
        el('span', { class: 'cresce' }),
        el('strong', { style: 'color:#1F3A5F;font-size:18px', texto: dinheiro(f.valorFeito) })
      ]));

      cartao.appendChild(el('div', {
        class: 'ajuda', style: 'margin-top:0',
        /* Num mês já vencido nada está à frente, e a frase fica igual à de
         * sempre. O "até aqui" só aparece quando existe algo depois de hoje. */
        texto: f.qtdEncontrosFeitos + ' encontro' + (f.qtdEncontrosFeitos === 1 ? '' : 's') +
          (f.qtdEncontrosPrevistos ? ' até aqui' : '') +
          ' · ' + f.horasFeitas + ' h cobradas' +
          (f.qtdEncontrosPrevistos
            ? ' · mais ' + f.qtdEncontrosPrevistos + ' ' +
              plural(f.qtdEncontrosPrevistos, 'marcado à frente', 'marcados à frente') +
              ', ' + dinheiro(f.valorPrevisto)
            : '') +
          (f.faixas.length > 1 ? ' · houve reajuste no mês' : '')
      }));

      /* As duas contas do "o que você deu e não cobrou", por aluno. Sem cor de
       * aviso e sem sugestão, só o número, e só na tela dela. */
      if (f.minutosDadosSemCobrar || f.minutosDesmarcados) {
        cartao.appendChild(el('div', {
          class: 'ajuda', style: 'margin-top:-6px',
          texto: [
            f.minutosDadosSemCobrar
              ? 'Dadas sem cobrar: ' + Core.fmtHoras(f.minutosDadosSemCobrar) + ' h' : '',
            f.minutosDesmarcados
              ? 'Reservadas e desmarcadas: ' + Core.fmtHoras(f.minutosDesmarcados) + ' h' : ''
          ].filter(Boolean).join(' · ')
        }));
      }

      if (f.semPreco.length) {
        cartao.appendChild(el('div', {
          class: 'faixa-aviso',
          texto: 'Sem valor por hora vigente em ' + f.semPreco.map(Core.ddmm).join(', ') +
            '. Cadastre o valor na ficha do aluno para o total ficar correto.'
        }));
      }

      var tabela = el('table', { class: 'dados' });
      var cab = el('tr');
      ['Data', 'Dia', 'Duração', 'Situação', 'Valor'].forEach(function (t) {
        cab.appendChild(el('th', { texto: t }));
      });
      tabela.appendChild(el('thead', {}, [cab]));
      var corpo = el('tbody');
      f.linhas.forEach(function (l) {
        corpo.appendChild(el('tr', {}, [
          el('td', { texto: Core.ddmm(l.data) }),
          el('td', { texto: l.dia }),
          el('td', { texto: Core.fmtDuracao(l.duracaoMin) }),
          el('td', {
            texto: l.statusRotulo + (l.cobravel ? '' : ' (não cobrada)') +
              (l.futura ? ' · ainda vai acontecer' : '')
          }),
          el('td', { texto: dinheiro(l.cobravel ? l.valor : 0) })
        ]));
      });
      var linhaTotal = el('tr', { class: 'total' }, [
        el('td', { texto: 'Total' }),
        el('td', { texto: '' }),
        el('td', { texto: f.totalHoras + ' h' }),
        el('td', { texto: '' }),
        el('td', { texto: dinheiro(f.totalValor) })
      ]);
      corpo.appendChild(linhaTotal);
      tabela.appendChild(corpo);
      cartao.appendChild(el('div', { class: 'rolagem' }, [tabela]));

      /* A tabela lista o mês inteiro, e o total dela é o do mês inteiro. Quem
       * lê o número grande lá em cima vê só o que já aconteceu, então aqui fica
       * dito, uma vez, de onde vem a diferença. */
      if (f.valorPrevisto) {
        cartao.appendChild(el('div', {
          class: 'ajuda', style: 'margin-top:6px',
          texto: 'Desse total, ' + dinheiro(f.valorFeito) + ' já aconteceu e ' +
            dinheiro(f.valorPrevisto) + ' está marcado para os próximos dias.'
        }));
      }

      var temResumo = !!(f.resumoTexto || '').trim();

      /* A caixa fica ACIMA dos botões de exportar, e não dentro da fileira: ela
       * muda o que vai sair, então precisa ser lida antes de tocar em PDF. */
      var chkListas = el('input', {
        type: 'checkbox', style: 'width:auto;min-height:auto'
      });
      chkListas.checked = exibirTemasEAreas();
      chkListas.addEventListener('change', function () {
        db.ajustes = db.ajustes || {};
        db.ajustes.exibirTemasEAreas = chkListas.checked;
        salvar().then(function () { desenharFechamento(); });
      });
      cartao.appendChild(el('label', {
        class: 'campo', style: 'display:flex;align-items:center;gap:10px;margin:12px 0 0'
      }, [
        chkListas,
        el('span', {
          texto: 'Exibir os temas e as áreas trabalhadas no documento', style: 'margin:0'
        })
      ]));
      cartao.appendChild(el('div', {
        class: 'ajuda', style: 'margin:2px 0 0',
        texto: exibirTemasEAreas()
          ? 'A família vai ver a lista de assuntos e a de áreas, com as datas de cada um.'
          : 'Por enquanto o documento leva a tabela de aulas, o total e o seu feedback. '
            + 'Marque quando quiser que a lista de assuntos e a de áreas entrem também.'
      }));

      cartao.appendChild(el('div', { class: 'barra', style: 'margin:12px 0 0' }, [
        el('button', {
          type: 'button', class: 'btn' + (temResumo ? '' : ' destaque'),
          texto: temResumo ? 'Editar o feedback' : 'Escrever o feedback',
          aoClick: function () { abrirResumo(f.aluno.id, mesAtual); }
        }),
        el('button', {
          type: 'button', class: 'btn', texto: 'O mês numa tela',
          aoClick: function () { abrirMesNumaTela(f.aluno.id, mesAtual); }
        }),
        el('span', { class: 'cresce' }),
        el('button', {
          type: 'button', class: 'btn', texto: 'Texto',
          aoClick: function () { exportarAlunoEmTexto(f); }
        }),
        el('button', {
          type: 'button', class: 'btn principal', texto: 'PDF do fechamento',
          aoClick: function () { exportarAlunoEmPdf(f, false); }
        }),
        el('button', {
          type: 'button', class: 'btn', texto: 'Cartão do mês',
          aoClick: function () { abrirCartaoDoMes(f.aluno.id, mesAtual); }
        }),
        el('button', {
          type: 'button', class: 'btn', texto: 'PDF com as folhas',
          aoClick: function () { exportarAlunoEmPdf(f, true); }
        })
      ]));

      if (!temResumo) {
        cartao.appendChild(el('div', {
          class: 'ajuda', style: 'margin:8px 0 0',
          texto: 'O feedback ainda não foi escrito. Ele entra no PDF logo abaixo da tabela.'
        }));
      }

      lista.appendChild(cartao);
    });

    desenharPanoramaDeValores();
  }

  /* O que ela deu e não cobrou no mês.
   *
   * Duas linhas discretas, sem cor de aviso e sem sugestão, só o número. A aula
   * extra na véspera da prova, a reposição sem cobrar e o horário esticado são
   * gentilezas, e o total nunca tinha sido somado. Isto NÃO entra no fechamento
   * que a família recebe, e não é para entrar: mostrar essa conta a quem paga
   * transforma gentileza em dívida. Por isso mora aqui, na tela, e não em
   * markdownFechamento nem no PDF. */
  function desenharGentilezas(depoisDe, t) {
    var caixa = $('#gentilezas-do-mes');
    if (!caixa) {
      caixa = el('div', { id: 'gentilezas-do-mes' });
      if (depoisDe && depoisDe.parentNode) {
        depoisDe.parentNode.insertBefore(caixa, depoisDe.nextSibling);
      } else return;
    }
    caixa.innerHTML = '';
    if (!t.minutosDadosSemCobrar && !t.minutosDesmarcados) return;
    caixa.appendChild(el('div', {
      class: 'ajuda', style: 'margin:-8px 0 4px',
      texto: 'Horas dadas sem cobrar no mês: ' + Core.fmtHoras(t.minutosDadosSemCobrar) + ' h'
    }));
    caixa.appendChild(el('div', {
      class: 'ajuda', style: 'margin:0 0 4px',
      texto: 'Horas reservadas e desmarcadas: ' + Core.fmtHoras(t.minutosDesmarcados) + ' h'
    }));
    caixa.appendChild(el('div', {
      class: 'ajuda', style: 'margin:0 0 14px;font-size:12px',
      texto: 'Só para você. Não entra no documento que a família recebe.'
    }));
  }

  // ================= cada aluno, desde quando e por quanto =================

  /* Uma linha por aluno, só para ela: desde quando estuda, quanto paga, há
   * quantos meses está nesse valor e quanto pesa no mês. Ao lado, uma sugestão
   * de reajuste. Sem alerta e sem cobrança: só o que já está guardado. */

  function textoDaIdadeDoIndice(ind) {
    var quando = 'referentes a ' + Core.mesExtenso(ind.referencia).toLowerCase();
    if (ind.baixado) {
      return 'Números do IBGE ' + quando +
        (ind.baixadoEm ? ', baixados em ' + Core.ddmmaaaa(ind.baixadoEm) : '') + '.';
    }
    return 'Números do IBGE ' + quando + ', os que vieram escritos no aplicativo. ' +
      'Quando houver internet, ele busca os mais novos sozinho.';
  }

  function linhaDoPanorama(l) {
    var partes = [];
    if (l.desde) {
      partes.push('estuda com você desde ' + Core.ddmmaaaa(l.desde) +
        (typeof l.mesesEstudando === 'number'
          ? ' (' + (l.mesesEstudando < 1 ? 'menos de um mês'
            : l.mesesEstudando + ' ' + plural(l.mesesEstudando, 'mês', 'meses')) + ')'
          : ''));
    }
    if (l.valorHora !== null && typeof l.mesesNoValor === 'number') {
      partes.push('neste valor há ' + (l.mesesNoValor < 1 ? 'menos de um mês'
        : l.mesesNoValor + ' ' + plural(l.mesesNoValor, 'mês', 'meses')));
    }
    if (l.valorNoMes > 0) {
      partes.push(dinheiro(l.valorNoMes) + ' no mês, ' +
        Math.round(l.fatiaDoMes * 100) + '% do total');
    }

    var caixa = el('div', { class: 'item-lista', style: 'display:block' });
    caixa.appendChild(el('div', { class: 'barra', style: 'margin-bottom:2px' }, [
      el('div', { class: 'nome', texto: l.nome }),
      el('span', { class: 'cresce' }),
      el('strong', {
        style: 'color:#1F3A5F',
        texto: l.valorHora === null ? 'sem valor por hora' : dinheiro(l.valorHora) + ' por hora'
      })
    ]));
    if (partes.length) {
      caixa.appendChild(el('div', { class: 'detalhe', texto: partes.join(' · ') }));
    }
    if (!l.sugestao) {
      caixa.appendChild(el('div', {
        class: 'detalhe', style: 'margin-top:4px',
        texto: 'Sem valor por hora cadastrado, então não há o que sugerir.'
      }));
      return caixa;
    }
    caixa.appendChild(el('div', {
      class: 'detalhe', style: 'margin-top:6px;color:#1F3A5F',
      texto: 'Sugestão: ' + dinheiro(l.sugestao.valorNovo) + ' por hora, ' +
        Core.pctBR(l.sugestao.percentual) + ' a mais' +
        (l.sugestao.noAno > 0 ? '. No ano, ' + dinheiro(l.sugestao.noAno) + ' a mais' : '') + '.'
    }));
    caixa.appendChild(el('div', { class: 'detalhe', style: 'margin-top:2px', texto: l.sugestao.motivo }));
    return caixa;
  }

  function desenharPanoramaDeValores() {
    var tela = $('#tela-fechamento');
    if (!tela) return;
    var caixa = $('#painel-valores');
    if (!caixa) {
      caixa = el('div', { id: 'painel-valores' });
      tela.appendChild(caixa);
    }
    caixa.innerHTML = '';

    var pan = Core.panoramaDeValores(db, mesAtual);
    if (!pan.linhas.length) return;

    caixa.appendChild(el('h3', { class: 'subtitulo', texto: 'Cada aluno, desde quando e por quanto' }));
    var cartao = el('div', { class: 'cartao' });
    cartao.appendChild(el('div', {
      class: 'ajuda', style: 'margin-top:0',
      texto: 'Só para você. Nada daqui entra no documento que a família recebe. ' +
        textoDaIdadeDoIndice(pan.indices) +
        (pan.margem > 0 ? ' A sugestão já soma os ' + Core.pctBR(pan.margem) +
          ' acima que você escolheu em Ajustes.' : '')
    }));
    pan.linhas.forEach(function (l) { cartao.appendChild(linhaDoPanorama(l)); });
    caixa.appendChild(cartao);

    if (tela.classList.contains('ativa')) setTimeout(talvezAtualizarIndices, 1200);
  }

  function abrirResumo(alunoId, mes) {
    var aluno = alunoPorId(alunoId);
    var registro = db.resumos.filter(function (r) { return r.alunoId === alunoId && r.mes === mes; })[0];
    $('#titulo-modal-resumo').textContent = 'Feedback de ' + aluno.nome + ', ' + Core.mesExtenso(mes);
    var corpo = $('#corpo-modal-resumo');
    corpo.innerHTML = '';
    corpo.appendChild(el('div', {
      class: 'ajuda', style: 'margin-top:0',
      texto: 'Este texto vai para o fechamento que a família recebe. Escreva como você já escreve.'
    }));
    var area = el('textarea', {
      id: 'campo-resumo', style: 'min-height:280px',
      placeholder: 'Como foi o mês, o que evoluiu, o que merece atenção e o que vem a seguir.'
    });
    area.value = registro ? registro.texto : '';
    corpo.appendChild(area);
    corpo._alunoId = alunoId;
    corpo._mes = mes;
    abrirModal('modal-resumo');
    setTimeout(function () { area.focus(); }, 60);
  }

  function salvarResumo() {
    var corpo = $('#corpo-modal-resumo');
    var texto = $('#campo-resumo').value;
    var registro = db.resumos.filter(function (r) {
      return r.alunoId === corpo._alunoId && r.mes === corpo._mes;
    })[0];
    if (registro) registro.texto = texto;
    else db.resumos.push({ alunoId: corpo._alunoId, mes: corpo._mes, texto: texto });
    salvar().then(function () {
      fecharModal('modal-resumo');
      desenharFechamento();
      /* A tela do mês pode estar aberta por baixo, e é de lá que ela costuma
       * escrever o feedback: sem isto o texto novo só apareceria ao reabrir. */
      atualizarMesNumaTela();
      avisar('Resumo salvo.');
    });
  }

  // ================= o cartão do mês =================

  /* O mesmo fechamento que ela já escreve, saindo também como uma imagem
   * quadrada que aparece DENTRO da conversa em vez de virar um retângulo cinza
   * para baixar. O desenho inteiro mora no cartao.js; aqui só existem as três
   * coisas que o documento promete: ela escolhe a frase, ela vê antes de mandar
   * e é essa mesma imagem que sai.
   *
   * A prévia e o arquivo são o MESMO canvas, de propósito. Redesenhar por fora
   * na hora de enviar abriria a porta para a família receber uma imagem que ela
   * nunca viu, e o documento diz "vê antes de mandar, sempre".
   *
   * Não há campo novo e não há gravação: o cartão é leitura do que o
   * Core.calcularFechamento já devolve. Fechar sem enviar não deixa rastro. */
  var cartaoAberto = null;

  function abrirCartaoDoMes(alunoId, mes) {
    var f = Core.calcularFechamento(db, alunoId, mes);
    if (!f) { avisar('Não há o que mostrar neste mês.'); return; }
    /* O desenho do cartão vive num arquivo próprio. Enquanto ele não estiver na
     * lista do sw.js, uma abertura sem sinal pode não tê-lo: melhor dizer isso
     * do que quebrar a tela de fechamento inteira em cima de um toque. */
    if (typeof Cartao === 'undefined' || !Cartao) {
      avisar('O cartão do mês não abriu agora. Tente de novo com internet.');
      return;
    }
    var frases = Cartao.frasesDoResumo(f.resumoTexto);
    cartaoAberto = { alunoId: alunoId, mes: mes, nome: f.alunoNome, frase: frases[0] || '' };
    $('#titulo-modal-cartao').textContent = 'Cartão do mês, ' + f.alunoNome;
    abrirModal('modal-cartao');
    desenharEscolhaDoCartao(f, frases);
  }

  function desenharEscolhaDoCartao(f, frases) {
    var corpo = $('#corpo-modal-cartao');
    corpo.innerHTML = '';

    var tela = el('canvas', { class: 'previa-cartao', id: 'previa-cartao' });
    var botoes = [];

    function repintar() {
      /* rotuloDisciplina depende do índice das outras matérias, que pode não ter
       * vindo ainda. O cartao.js tem a própria lista de reserva, então o nome da
       * matéria sai certo dos dois jeitos. */
      Cartao.desenhar(tela, f, {
        frase: cartaoAberto.frase,
        rotuloDisciplina: rotuloDisciplina
      });
      botoes.forEach(function (b) {
        b.classList.toggle('escolhida', b._frase === cartaoAberto.frase);
      });
    }

    function opcao(texto, valor, extra) {
      var b = el('button', {
        type: 'button', class: 'opcao-frase' + (extra || ''), texto: texto,
        aoClick: function () { cartaoAberto.frase = valor; repintar(); }
      });
      b._frase = valor;
      botoes.push(b);
      return b;
    }

    /* A imagem vem PRIMEIRO e fica presa no alto enquanto ela rola as frases.
     * O documento promete "vê antes de mandar, sempre", e com oito frases numa
     * tela de tablet a prévia caía abaixo da dobra: ela escolheria uma frase e
     * mandaria sem ter visto o cartão. Presa, cada toque numa frase muda uma
     * imagem que está debaixo do olho dela. */
    corpo.appendChild(el('div', { class: 'previa-presa' }, [
      tela,
      el('div', {
        class: 'ajuda', style: 'margin:8px 0 0;text-align:center',
        texto: 'É exatamente esta imagem que a família recebe.'
      })
    ]));

    if (frases.length) {
      corpo.appendChild(el('div', {
        class: 'ajuda', style: 'margin:14px 0 8px',
        texto: 'A frase sai do feedback que você já escreveu. Toque numa e ela vai para o cartão.'
      }));
      frases.forEach(function (fr) { corpo.appendChild(opcao(fr, fr)); });
      corpo.appendChild(opcao('Sem frase nenhuma', '', ' sem-frase'));
    } else {
      corpo.appendChild(el('div', {
        class: 'ajuda', style: 'margin:14px 0 8px',
        texto: 'O feedback deste mês ainda não foi escrito, então o cartão sai sem frase. ' +
          'Escreva o feedback e volte aqui para escolher uma.'
      }));
    }

    corpo.appendChild(el('div', {
      class: 'ajuda', style: 'margin:10px 0 0',
      texto: 'O cartão não leva valor nenhum. A conta continua no PDF do fechamento, ' +
        'e a lista completa de assuntos também.'
    }));

    repintar();
  }

  function enviarCartaoDoMes() {
    var tela = $('#previa-cartao');
    if (!tela || !cartaoAberto) return;
    var alvo = cartaoAberto;
    tela.toBlob(function (bl) {
      if (!bl) { avisar('Não consegui gerar o cartão.'); return; }
      entregarArquivo('Cartao_' + Core.nomeArquivo(alvo.nome) + '_' + alvo.mes + '.png',
        bl, 'Cartão do mês');
      fecharModal('modal-cartao');
    }, 'image/png');
  }

  // ================= o mês numa tela, nos dois modos =================

  /* O mês inteiro de um aluno numa tela só, em dois modos: um com tudo, para ela
   * escrever o fechamento sem abrir aula por aula, e outro sem valores, sem a
   * anotação particular dela e sem nenhum outro aluno, para abrir com o tablet
   * na mão na frente da família.
   *
   * O modo da família não esconde o que é dela atrás de uma máscara: ele NÃO
   * CRIA o nó. Máscara é o que o botão do olho faz, e máscara ainda escreve
   * "R$" na tela; aqui o valor não chega a existir no documento. E o resto do
   * aplicativo sai do ar por CSS (body.modo-familia no styles.css), porque a
   * agenda e o fechamento atrás desta janela têm todos os outros alunos e todo
   * o dinheiro do mês, e uma rolagem ou uma janela mal fechada bastaria.
   *
   * Nenhum arquivo é gerado daqui, nos dois modos. Não há PDF, não há imagem e
   * não há compartilhamento: o que sai para a família continua saindo pelos
   * botões da tela de fechamento, onde ela escolhe o que manda. Assim não
   * existe caminho por onde esta tela vaze num arquivo.
   *
   * Nada aqui grava: é leitura do que o Core.calcularFechamento devolve, mais o
   * notaPrivada lido direto da aula, que de propósito não viaja no fechamento. */
  var mesNaTela = null;
  var modoFamilia = false;
  var perguntandoFamilia = false;
  var MS_SEGURAR = 1200;

  /* No modo da família a tela não fecha por engano: nem no ×, nem tocando fora,
   * nem no Cancelar. Sair de lá é segurar o botão do rodapé. */
  function presaNoModoFamilia(id) { return id === 'modal-mes' && modoFamilia; }

  function abrirMesNumaTela(alunoId, mes) {
    mesNaTela = { alunoId: alunoId, mes: mes };
    modoFamilia = false;
    perguntandoFamilia = false;
    abrirModal('modal-mes');
    desenharMesNumaTela();
  }

  function encerrarMesNumaTela() {
    mesNaTela = null;
    modoFamilia = false;
    perguntandoFamilia = false;
    document.body.classList.remove('modo-familia');
  }

  function atualizarMesNumaTela() {
    if (mesNaTela && $('#modal-mes').classList.contains('aberto')) desenharMesNumaTela();
  }

  function entrarNoModoFamilia() {
    perguntandoFamilia = false;
    modoFamilia = true;
    /* Nenhuma outra janela pode ficar aberta atrás desta. O CSS já as esconde,
     * mas fechar de verdade é o que garante que ela não volte de lá com uma
     * janela pendurada que ninguém sabia estar aberta. */
    $$('.fundo-modal.aberto').forEach(function (m) {
      if (m.id !== 'modal-mes') fecharModal(m.id);
    });
    desenharMesNumaTela();
    $('#corpo-modal-mes').scrollTop = 0;
  }

  function sairDoModoFamilia() {
    modoFamilia = false;
    perguntandoFamilia = false;
    desenharMesNumaTela();
  }

  /* As duas caixas do alto saem da MESMA lista de blocos que vem logo abaixo.
   *
   * Contavam de conjuntos diferentes. "Encontros" somava tudo que não fosse
   * cancelada, então a aula dada de graça e a falta entravam; "Horas" usava o
   * total cobrado, onde nenhuma das duas entra. Um mês com uma aula de duas
   * horas dada sem cobrar e uma falta de uma hora mostrava dez encontros e oito
   * horas sobre os mesmos onze blocos, e nenhum dos dois números explicava o
   * outro para quem lia.
   *
   * Agora as duas contam a mesma linha: o encontro que houve. A falta e a aula
   * cancelada com aviso continuam na lista, com o rótulo delas, e ficam fora da
   * conta, porque ninguém deu aula naquele dia. A aula dada sem cobrar entra
   * nas duas, porque ela aconteceu, e a família não descobre por aqui que ela
   * não foi cobrada: no modo da família não há uma palavra sobre cobrança.
   *
   * E só entra no número grande o que já aconteceu. Isto aqui é a mesma
   * separação que o Core faz com hoje, lida da linha (l.futura): a aula marcada
   * para daqui a três semanas vai para o rodapé, "mais N marcados à frente", e
   * nunca para o número que a família lê em letra grande.
   *
   * Não uso o par qtdEncontrosFeitos e minFeitos direto porque eles são o par
   * do dinheiro: qtdEncontrosFeitos conta a falta, e minFeitos só soma minuto
   * cobrado. Os dois juntos recriariam aqui a mesma divergência de conjunto. */
  function houveEncontro(l) {
    return l.status !== 'cancelada' && l.status !== 'falta';
  }

  function contaDeEncontros(linhas) {
    var c = { feitos: 0, minFeitos: 0, previstos: 0, minPrevistos: 0 };
    (linhas || []).forEach(function (l) {
      if (!houveEncontro(l)) return;
      if (l.futura) { c.previstos += 1; c.minPrevistos += l.duracaoMin || 0; }
      else { c.feitos += 1; c.minFeitos += l.duracaoMin || 0; }
    });
    return c;
  }

  function blocoDaAula(l) {
    var bloco = el('div', { class: 'bloco-mes' + (l.futura ? ' futura' : '') });
    var cabeca = el('div', { class: 'cabeca-dia' });
    cabeca.appendChild(el('span', {
      class: 'data-dia', texto: Core.ddmm(l.data) + ' · ' + l.dia
    }));

    var detalhe = [Core.fmtDuracao(l.duracaoMin)];
    if (modoFamilia) {
      /* "Realizada" em toda linha é ruído; o que foge do comum é o que informa.
       * O rótulo é o mesmo do PDF que a família recebe, para a tela e o
       * documento nunca contarem histórias diferentes. */
      if (l.status !== 'realizada') detalhe.push(l.statusRotulo);
      /* A aula que ainda não chegou saía desenhada igual à que já aconteceu:
       * mesma borda, mesma letra, nenhuma marca. Quem está lendo do outro lado
       * da mesa não tem como saber que aquele dia é o mês que vem. */
      if (l.futura) detalhe.push('ainda vai acontecer');
    } else {
      if (l.hora) detalhe.push(l.hora);
      detalhe.push(l.statusRotulo + (l.cobravel ? '' : ' (não cobrada)'));
      if (l.futura) detalhe.push('ainda vai acontecer');
    }
    cabeca.appendChild(el('span', { class: 'detalhe-dia', texto: detalhe.join(' · ') }));

    if (!modoFamilia) {
      cabeca.appendChild(el('span', {
        class: 'valor-dia', texto: dinheiro(l.cobravel ? l.valor : 0)
      }));
    }
    bloco.appendChild(cabeca);

    var titulos = (l.temas || []).map(function (t) {
      return String((t && t.titulo) || '').trim();
    }).filter(Boolean);
    if (titulos.length) {
      var tags = el('div', { class: 'tags-assunto' });
      titulos.forEach(function (t) { tags.appendChild(el('span', { class: 'assunto-mes', texto: t })); });
      bloco.appendChild(tags);
    }

    var rendeu = (l.notaTexto || '').trim();
    if (rendeu) bloco.appendChild(el('div', { class: 'texto-rendeu', texto: rendeu }));

    /* O bloco cinza com a barra. Só no modo dela, e lido direto da aula: o
     * notaPrivada não viaja no fechamento justamente para não vazar por
     * descuido em quem consome o fechamento. */
    if (!modoFamilia) {
      var au = (db.aulas || []).filter(function (a) { return a.id === l.id; })[0];
      var so = au ? (au.notaPrivada || '').trim() : '';
      if (so) {
        bloco.appendChild(el('div', { class: 'so-minha' }, [
          el('span', { class: 'rotulo-so-minha', texto: 'Só minha' }),
          document.createTextNode(so)
        ]));
      }
    }

    return bloco;
  }

  function desenharMesNumaTela() {
    if (!mesNaTela) return;
    var f = Core.calcularFechamento(db, mesNaTela.alunoId, mesNaTela.mes);
    if (!f) { fecharModal('modal-mes'); return; }

    document.body.classList.toggle('modo-familia', modoFamilia);

    /* O título da janela também é tela. No modo da família ele leva o primeiro
     * nome deste aluno e o mês, e mais nada. */
    $('#titulo-modal-mes').textContent = f.alunoNome + ', ' + f.mesExtenso;
    var selo = $('#selo-modal-mes');
    selo.textContent = modoFamilia ? 'Mostrando para a família' : '';
    selo.className = modoFamilia ? 'selo-familia' : '';

    var corpo = $('#corpo-modal-mes');
    corpo.innerHTML = '';

    var c = contaDeEncontros(f.linhas);
    var numeros = el('div', { class: 'numeros' });
    numeros.appendChild(numeroComRodape('Encontros', String(c.feitos), [
      c.previstos ? 'mais ' + c.previstos + ' ' +
        plural(c.previstos, 'marcado à frente', 'marcados à frente') : ''
    ]));
    numeros.appendChild(numeroComRodape('Horas', Core.fmtHoras(c.minFeitos) + ' h', [
      c.minPrevistos ? 'mais ' + Core.fmtHoras(c.minPrevistos) + ' h à frente' : ''
    ]));
    if (!modoFamilia) {
      /* O rótulo muda junto com o número. Num mês já vencido nada está à frente
       * e ele é o total do mês, como sempre foi; enquanto o mês corre, o número
       * é só o que já aconteceu, e dizer "total do mês" ali seria a mesma
       * mentira de antes, agora do lado do dinheiro. */
      numeros.appendChild(numeroComRodape(
        c.previstos ? 'Total até aqui' : 'Total do mês', dinheiro(f.valorFeito), [
          f.faixas.length > 1 ? 'houve reajuste no mês' : '',
          f.valorPrevisto ? 'previsto à frente: ' + dinheiro(f.valorPrevisto) : '',
          f.valorPrevisto ? 'mês inteiro: ' + dinheiro(f.totalValor) : ''
        ]));
    }
    corpo.appendChild(numeros);

    if (!modoFamilia && (f.minutosDadosSemCobrar || f.minutosDesmarcados)) {
      corpo.appendChild(el('div', {
        class: 'ajuda', style: 'margin-top:-6px',
        texto: [
          f.minutosDadosSemCobrar
            ? 'Dadas sem cobrar: ' + Core.fmtHoras(f.minutosDadosSemCobrar) + ' h' : '',
          f.minutosDesmarcados
            ? 'Reservadas e desmarcadas: ' + Core.fmtHoras(f.minutosDesmarcados) + ' h' : ''
        ].filter(Boolean).join(' · ') + '. Só para você.'
      }));
    }

    if (!f.linhas.length) {
      corpo.appendChild(el('div', { class: 'vazio' }, [
        el('p', { texto: 'Nenhum encontro registrado neste mês.' })
      ]));
    } else {
      f.linhas.forEach(function (l) { corpo.appendChild(blocoDaAula(l)); });
    }

    if (f.areasDoMes.length) {
      corpo.appendChild(el('h3', { class: 'subtitulo', texto: 'Além do conteúdo' }));
      var areas = el('div', { class: 'tags-assunto' });
      f.areasDoMes.forEach(function (a) {
        areas.appendChild(el('span', { class: 'assunto-mes area', texto: a.rotulo }));
      });
      corpo.appendChild(areas);
    }

    var texto = (f.resumoTexto || '').trim();
    if (texto || !modoFamilia) {
      corpo.appendChild(el('h3', { class: 'subtitulo', texto: 'Feedback do mês' }));
      corpo.appendChild(texto
        ? el('div', { class: 'texto-rendeu', style: 'margin-top:0', texto: texto })
        : el('div', {
          class: 'ajuda', style: 'margin-top:0',
          texto: 'Ainda não escrito. É esta tela que serve para escrever, sem abrir aula por aula.'
        }));
    }

    desenharRodapeDoMes(f);
  }

  function desenharRodapeDoMes(f) {
    var rodape = $('#rodape-modal-mes');
    rodape.innerHTML = '';

    if (modoFamilia) {
      rodape.appendChild(botaoDeSegurarParaSair());
      return;
    }

    if (perguntandoFamilia) {
      rodape.appendChild(el('div', { class: 'confirma-familia' }, [
        el('strong', { texto: 'Vou virar o tablet para a família' }),
        el('span', {
          texto: 'Somem os valores, a sua anotação particular e todos os outros alunos. ' +
            'Fica só ' + f.alunoNome + ' em ' + f.mesExtenso + '. ' +
            'Para voltar, você segura o botão de sair.'
        })
      ]));
      rodape.appendChild(el('button', {
        type: 'button', class: 'btn esquerda', texto: 'Agora não',
        aoClick: function () { perguntandoFamilia = false; desenharMesNumaTela(); }
      }));
      rodape.appendChild(el('button', {
        type: 'button', class: 'btn destaque', id: 'confirmar-familia', texto: 'Sim, mostrar',
        aoClick: entrarNoModoFamilia
      }));
      return;
    }

    rodape.appendChild(el('button', {
      type: 'button', class: 'btn esquerda', texto: 'Fechar',
      aoClick: function () { fecharModal('modal-mes'); }
    }));
    rodape.appendChild(el('button', {
      type: 'button', class: 'btn',
      texto: (f.resumoTexto || '').trim() ? 'Editar o feedback' : 'Escrever o feedback',
      aoClick: function () { abrirResumo(f.aluno.id, f.mes); }
    }));
    rodape.appendChild(el('button', {
      type: 'button', class: 'btn principal', id: 'mostrar-para-familia',
      texto: 'Mostrar para a família',
      aoClick: function () { perguntandoFamilia = true; desenharMesNumaTela(); }
    }));
  }

  /* Segurar, e não tocar.
   *
   * Um toque perdido no meio de uma conversa não pode devolver a tela com os
   * valores e os outros alunos na frente de quem paga. Segurar por um instante
   * é gesto de adulto decidido, e a barra que enche diz o que está acontecendo
   * enquanto acontece. Quem só toca não sai, e lê por que não saiu.
   *
   * Isto não é gesto novo por aula: esta tela é do fim do mês, e nada no dia a
   * dia dela depende de saber segurar botão. */
  function botaoDeSegurarParaSair() {
    var caixa = document.createDocumentFragment();
    var dica = el('div', { class: 'dica-segurar', id: 'dica-segurar', texto: '' });
    var botao = el('button', {
      type: 'button', class: 'btn segurar', id: 'sair-modo-familia'
    }, [
      el('span', { class: 'enchendo' }),
      el('span', { class: 'rotulo-segurar', texto: 'Segure para sair' })
    ]);

    var conta = null;
    function comeca(ev) {
      if (ev && ev.cancelable) ev.preventDefault();
      if (conta) return;
      dica.textContent = '';
      botao.classList.add('segurando');
      conta = setTimeout(function () {
        conta = null;
        botao.classList.remove('segurando');
        sairDoModoFamilia();
      }, MS_SEGURAR);
    }
    function solta() {
      if (!conta) return;
      clearTimeout(conta);
      conta = null;
      botao.classList.remove('segurando');
      dica.textContent = 'Segure o botão por um instante para sair.';
    }

    botao.addEventListener('pointerdown', comeca);
    botao.addEventListener('pointerup', solta);
    botao.addEventListener('pointerleave', solta);
    botao.addEventListener('pointercancel', solta);

    caixa.appendChild(botao);
    caixa.appendChild(dica);
    return caixa;
  }

  // ================= exportação =================

  function nomeBase(f) {
    return 'Fechamento_' + Core.nomeArquivo(f.alunoNome) + '_' + f.mes;
  }

  /* Exibir ou não as listas de temas e de áreas no documento que a família lê.
   *
   * Nasce desmarcada, por decisão dela: hoje o que ela usa é a agenda, o valor a
   * receber e o texto do fechamento. Registrar assunto e marcar áreas são coisas
   * que está começando a explorar, e explorar não pode mudar sozinho o que sai
   * para a família. Quando o registro estiver do jeito que ela quer, marca uma
   * vez e fica marcado.
   *
   * Mora em db.ajustes, junto das outras preferências, e não por aluno: é uma
   * decisão sobre o formato do documento, não sobre uma família específica. */
  function exibirTemasEAreas() {
    return !!(db.ajustes && db.ajustes.exibirTemasEAreas);
  }

  function opcoesDoDocumento(extra) {
    var o = extra || {};
    o.exibirTemasEAreas = exibirTemasEAreas();
    return o;
  }

  function exportarAlunoEmTexto(f) {
    var md = Core.markdownFechamento(f, opcoesDoDocumento({ incluirNotas: true }));
    entregarArquivo(nomeBase(f) + '.md', new Blob([md], { type: 'text/markdown;charset=utf-8' }),
      'Fechamento de ' + f.alunoNome);
  }

  function exportarMesEmTexto() {
    var fechs = Core.calcularMesInteiro(db, mesAtual);
    if (!fechs.length) { avisar('Não há aulas neste mês.'); return; }
    var md = Core.markdownMesInteiro(fechs, mesAtual);
    entregarArquivo('Fechamento_do_mes_' + mesAtual + '.md',
      new Blob([md], { type: 'text/markdown;charset=utf-8' }), 'Fechamento do mês');
  }

  function exportarResumoDoMesEmPdf() {
    var fechs = Core.calcularMesInteiro(db, mesAtual);
    if (!fechs.length) { avisar('Não há aulas neste mês.'); return; }
    var bytes = PDFGen.gerarResumoMes(fechs, Core.mesExtenso(mesAtual));
    entregarArquivo('Fechamento_do_mes_' + mesAtual + '.pdf',
      new Blob([bytes], { type: 'application/pdf' }), 'Fechamento do mês');
  }

  function exportarAlunoEmPdf(f, comFolhas) {
    var aulasComNota = f.linhas.filter(function (l) { return l.temNota; });
    var passo = Promise.resolve({ notas: [], imagens: {} });

    if (comFolhas && aulasComNota.length) {
      passo = Promise.all(aulasComNota.map(function (l) {
        return Store.lerNota(l.id).then(function (n) {
          return n ? { data: l.data, paginas: n.paginas } : null;
        });
      })).then(function (notas) {
        var limpas = notas.filter(Boolean);
        var refs = {};
        limpas.forEach(function (n) {
          n.paginas.forEach(function (p) {
            (p.itens || []).forEach(function (it) { if (it.t === 'imagem' && it.ref) refs[it.ref] = true; });
          });
        });
        return Promise.all(Object.keys(refs).map(function (r) {
          return Store.lerMidia(r).then(function (m) { return { ref: r, midia: m }; });
        })).then(function (lista) {
          var imagens = {};
          lista.forEach(function (x) {
            if (!x.midia) return;
            imagens[x.ref] = { bytes: bytesDeDataUrl(x.midia.dataUrl), w: x.midia.w, h: x.midia.h };
          });
          return { notas: limpas, imagens: imagens };
        });
      });
    }

    passo.then(function (extra) {
      var bytes = PDFGen.gerarFechamento(f, opcoesDoDocumento({
        incluirNotas: comFolhas,
        notas: extra.notas,
        imagens: extra.imagens,
        sempreResumo: true
      }));
      entregarArquivo(nomeBase(f) + (comFolhas ? '_com_folhas' : '') + '.pdf',
        new Blob([bytes], { type: 'application/pdf' }),
        'Fechamento de ' + f.alunoNome);
    }).catch(function (e) {
      avisar('Não foi possível gerar o PDF.');
    });
  }

  // ================= ajustes =================

  function desenharAjustes() {
    var lista = $('#lista-historico');
    Store.listarHistorico().then(function (registros) {
      lista.innerHTML = '';
      if (!registros.length) {
        lista.appendChild(el('div', { class: 'ajuda', texto: 'Nenhuma alteração em massa registrada ainda.' }));
        return;
      }
      registros.slice(0, 12).forEach(function (r) {
        var quando = new Date(r.quando);
        lista.appendChild(el('div', { class: 'item-lista' }, [
          el('div', { class: 'cresce' }, [
            el('div', { class: 'nome', texto: r.rotulo }),
            el('div', {
              class: 'detalhe',
              texto: Core.pad2(quando.getDate()) + '/' + Core.pad2(quando.getMonth() + 1) + '/' +
                quando.getFullYear() + ' às ' + Core.pad2(quando.getHours()) + ':' + Core.pad2(quando.getMinutes())
            })
          ]),
          el('button', {
            type: 'button', class: 'btn pequeno', texto: 'Voltar a este ponto',
            aoClick: function () {
              if (!confirmar('Voltar ao estado anterior a "' + r.rotulo + '"?')) return;
              Store.desfazer(r.id).then(function (estado) {
                if (!estado) return;
                db = estado;
                desenharTudo();
                avisar('Estado restaurado.');
              });
            }
          })
        ]));
      });
    });

    var estadoCopia = $('#estado-copia');
    if (estadoCopia) {
      var d = diasDesdeACopia();
      estadoCopia.innerHTML = '';
      if (d === null) {
        estadoCopia.appendChild(el('div', { class: 'faixa-aviso', texto: 'Nenhuma cópia foi salva ainda por este aplicativo.' }));
      } else {
        estadoCopia.appendChild(el('div', {
          class: d >= 14 ? 'faixa-aviso' : 'faixa-info',
          texto: d === 0 ? 'Última cópia salva hoje.'
            : 'Última cópia salva há ' + d + ' dia' + (d === 1 ? '' : 's') + ', em ' +
              Core.ddmmaaaa(db.ajustes.ultimaCopia) + '.'
        }));
      }
    }

    /* O que ela procurou e não achou. Fica em Ajustes porque é conversa nossa,
     * não recurso dela: serve para decidir que assunto falta no banco e que
     * palavra a busca precisa entender. */
    var caixaBuscas = $('#buscas-vazias');
    if (caixaBuscas) {
      var vazias = buscasSemResultado();
      caixaBuscas.innerHTML = '';
      if (!vazias.length) {
        caixaBuscas.appendChild(el('div', {
          class: 'ajuda', style: 'margin-top:0',
          texto: 'Nenhuma busca sem resultado registrada ainda.'
        }));
      } else {
        caixaBuscas.appendChild(el('div', {
          class: 'ajuda', style: 'margin-top:0',
          texto: 'O que você procurou e não encontrou. Fica só neste tablet. ' +
            'Serve para a gente descobrir que assunto falta no banco.'
        }));
        vazias.slice(0, 12).forEach(function (b) {
          caixaBuscas.appendChild(el('div', { class: 'item-lista' }, [
            el('div', { class: 'cresce' }, [
              el('div', { class: 'nome', texto: b.termo }),
              el('div', {
                class: 'detalhe',
                texto: (b.vezes === 1 ? 'uma vez' : b.vezes + ' vezes') +
                  ' · a última em ' + Core.ddmmaaaa(b.ultima)
              })
            ])
          ]));
        });
        caixaBuscas.appendChild(el('button', {
          type: 'button', class: 'btn pequeno', texto: 'Limpar esta lista',
          aoClick: function () {
            try { localStorage.removeItem('buscas-vazias'); } catch (e) { /* nada a fazer */ }
            desenharAjustes();
          }
        }));
      }
    }

    var estado = $('#estado-versao');
    if (estado) {
      if (registroSW && registroSW.waiting) {
        estado.innerHTML = '';
        estado.appendChild(el('div', { class: 'faixa-info' }, [
          el('strong', { texto: 'Há uma versão nova pronta. ' }),
          document.createTextNode('Toque em Atualizar agora. Seus dados continuam como estão.')
        ]));
        estado.appendChild(el('button', {
          type: 'button', class: 'btn destaque', texto: 'Atualizar agora',
          aoClick: aplicarAtualizacao
        }));
      } else {
        estado.textContent = '';
      }
    }

    desenharAjustesDeReajuste();

    Store.estimarEspaco().then(function (e) {
      if (!e) { $('#info-espaco').textContent = ''; return; }
      var usado = (e.usage || 0) / (1024 * 1024);
      $('#info-espaco').textContent = 'Espaço usado pelo aplicativo: ' +
        (usado < 1 ? (Math.round(usado * 1000) / 1000).toString().replace('.', ',') : (Math.round(usado * 10) / 10).toString().replace('.', ',')) + ' MB.';
    });
  }

  // ================= os números do IBGE =================

  /* A sugestão de reajuste usa dois números do IBGE: quanto as escolas subiram
   * em doze meses e a inflação geral no mesmo período. Os dois vêm do mesmo
   * pedido e se atualizam juntos.
   *
   * Ela dá aula na casa das famílias e muitas vezes está sem sinal. Por isso a
   * busca NUNCA segura a tela e nunca reclama sozinha quando falha: o par que
   * veio escrito no aplicativo continua valendo, com a data dele à vista, para
   * ela nunca olhar um número sem saber de quando é. Em Ajustes ficam essa data
   * e um botão para procurar na hora, se ela quiser. */

  var buscandoIbge = false;

  function buscarIndicesDoIbge() {
    if (buscandoIbge) return Promise.reject(new Error('já está procurando'));
    if (typeof fetch !== 'function') return Promise.reject(new Error('sem fetch aqui'));
    buscandoIbge = true;

    var parar = null;
    var opcoes = { cache: 'no-store' };
    if (typeof AbortController === 'function') {
      var ctrl = new AbortController();
      opcoes.signal = ctrl.signal;
      parar = setTimeout(function () { try { ctrl.abort(); } catch (e) { /* já foi */ } }, 15000);
    }
    var solta = function () { if (parar) clearTimeout(parar); buscandoIbge = false; };

    return fetch(Core.IBGE_URL, opcoes).then(function (r) {
      if (!r.ok) throw new Error('resposta ' + r.status);
      return r.json();
    }).then(function (dados) {
      var lido = Core.lerIndicesDoIbge(dados);
      if (!lido) throw new Error('a resposta não trouxe os dois números');
      db.ajustes = db.ajustes || {};
      db.ajustes.ibge = {
        escolas12m: lido.escolas12m,
        inflacao12m: lido.inflacao12m,
        referencia: lido.referencia,
        baixadoEm: Core.hojeIso()
      };
      return salvar().then(function () { solta(); return lido; });
    }).catch(function (e) { solta(); throw e; });
  }

  /* Sozinho, sem ela pedir, quando abre a tela que usa o número e há internet.
   *
   * Uma vez por sessão e no máximo uma por semana: o IPCA sai uma vez por mês, o
   * plano de dados do tablet não é para gastar à toa e a hora em que ela abre o
   * aplicativo, na casa de uma família, é a pior hora para disputar a rede.
   * Falhou, fica quieto: continua valendo o número que já estava, com a data
   * dele à vista. */
  var jaTenteiIbge = false;

  function talvezAtualizarIndices() {
    if (jaTenteiIbge) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    var g = db.ajustes && db.ajustes.ibge;
    if (g && g.baixadoEm) {
      var dias = (Core.dataLocal(Core.hojeIso()) - Core.dataLocal(g.baixadoEm)) / 86400000;
      if (dias >= 0 && dias < 7) return;
    }
    jaTenteiIbge = true;
    buscarIndicesDoIbge().then(function () {
      desenharFechamento();
      desenharAjustes();
    }).catch(function () { /* sem sinal hoje: continua valendo o que já estava */ });
  }

  function desenharAjustesDeReajuste() {
    var tela = $('#tela-ajustes');
    if (!tela) return;
    var caixa = $('#ajustes-reajuste');
    if (!caixa) {
      caixa = el('div', { id: 'ajustes-reajuste' });
      /* Antes de Recomeçar, que é onde ficam os botões de apagar. */
      var apagar = $('#apagar-exemplo');
      var cartaoRecomecar = (apagar && apagar.closest) ? apagar.closest('.cartao') : null;
      var tituloRecomecar = cartaoRecomecar ? cartaoRecomecar.previousElementSibling : null;
      if (tituloRecomecar && tituloRecomecar.parentNode === tela) tela.insertBefore(caixa, tituloRecomecar);
      else tela.appendChild(caixa);
    }
    caixa.innerHTML = '';

    var ind = Core.indicesDeReajuste(db);
    var margem = Core.margemDeReajuste(db);

    caixa.appendChild(el('h3', { class: 'subtitulo', texto: 'Sugestão de reajuste' }));
    var cartao = el('div', { class: 'cartao' });

    cartao.appendChild(el('p', {
      class: 'ajuda', style: 'margin-top:0',
      texto: 'A sugestão que aparece no fechamento usa dois números do IBGE: quanto as escolas ' +
        'subiram em doze meses e a inflação geral no mesmo período. Os dois vêm do mesmo lugar e ' +
        'se atualizam juntos, sozinhos, sempre que o tablet estiver com internet.'
    }));

    cartao.appendChild(el('div', {
      class: 'faixa-info',
      texto: 'Escolas: ' + Core.pctBR(ind.escolas12m) + ' em doze meses. Inflação geral: ' +
        Core.pctBR(ind.inflacao12m) + '. ' + textoDaIdadeDoIndice(ind)
    }));

    cartao.appendChild(el('div', { class: 'barra' }, [
      el('button', {
        type: 'button', class: 'btn', id: 'procurar-ibge',
        texto: 'Procurar os números agora',
        aoClick: function () {
          var b = $('#procurar-ibge');
          if (b) { b.disabled = true; b.textContent = 'Procurando...'; }
          buscarIndicesDoIbge().then(function (lido) {
            avisar('Números atualizados: escolas ' + Core.pctBR(lido.escolas12m) +
              ' e inflação ' + Core.pctBR(lido.inflacao12m) + '.');
            desenharAjustes();
            desenharFechamento();
          }).catch(function () {
            if (b) { b.disabled = false; b.textContent = 'Procurar os números agora'; }
            avisar('Não consegui buscar agora. Continua valendo o número de ' +
              Core.mesExtenso(ind.referencia).toLowerCase() + '.');
          });
        }
      })
    ]));

    cartao.appendChild(el('p', {
      class: 'ajuda', style: 'margin:16px 0 8px',
      texto: 'Quanto você quer subir acima da inflação. Entra na sugestão, somado à alta das escolas.'
    }));

    var mostra = el('strong', {
      style: 'font-size:20px;min-width:78px;text-align:center;color:#1F3A5F',
      texto: Core.pctBR(margem)
    });
    var mudar = function (passo) {
      db.ajustes = db.ajustes || {};
      var novo = Core.margemDeReajuste(db) + passo;
      if (novo < 0) novo = 0;
      if (novo > 20) novo = 20;
      db.ajustes.reajusteAcimaDaInflacao = novo;
      salvar().then(function () {
        mostra.textContent = Core.pctBR(Core.margemDeReajuste(db));
        desenharFechamento();
      });
    };
    cartao.appendChild(el('div', { class: 'barra', style: 'margin-bottom:0' }, [
      el('button', {
        type: 'button', class: 'btn', style: 'min-width:64px', texto: '-1%',
        'aria-label': 'Diminuir um ponto', aoClick: function () { mudar(-1); }
      }),
      mostra,
      el('button', {
        type: 'button', class: 'btn', style: 'min-width:64px', texto: '+1%',
        'aria-label': 'Aumentar um ponto', aoClick: function () { mudar(1); }
      })
    ]));

    caixa.appendChild(cartao);
  }

  /* Por que a cópia ia parar sempre nos downloads, e nunca no Drive.
   *
   * O Android só deixa abrir a folha de compartilhamento logo depois de um toque.
   * Montar a cópia demora segundos, porque cada folha escrita e cada anexo viram
   * texto, e quando terminava a permissão do toque já tinha vencido: o
   * compartilhamento era recusado em silêncio e o arquivo caía no download.
   *
   * A correção é separar em dois tempos. Primeiro o aplicativo monta a cópia e
   * avisa que ficou pronta. O toque em "Enviar" é um toque novo, e aí a folha de
   * compartilhamento abre, com Drive, e-mail e o que mais ela tiver. */
  var copiaPronta = null;

  function baixarCopia() {
    var botao = $('#baixar-copia');
    var rotuloCopia = botao ? botao.textContent : '';
    if (botao) { botao.disabled = true; botao.textContent = 'Montando a cópia...'; }

    Store.exportarTudo(db).then(function (pacote) {
      var hoje = Core.hojeIso();
      copiaPronta = {
        nome: 'Copia_Apoio_Educacional_' + hoje + '.json',
        blob: new Blob([JSON.stringify(pacote)], { type: 'application/json' })
      };
      db.ajustes = db.ajustes || {};
      db.ajustes.ultimaCopia = hoje;
      return salvar();
    }).then(function () {
      if (botao) { botao.disabled = false; botao.textContent = rotuloCopia; }
      desenharAjustes();
      desenharAgenda();
      avisar('Cópia pronta, ' + Math.round(copiaPronta.blob.size / 1024) + ' KB. Envie para o Drive.',
        'Enviar', enviarCopiaPronta);
    }).catch(function () {
      if (botao) { botao.disabled = false; botao.textContent = rotuloCopia; }
      avisar('Não consegui montar a cópia. Tente de novo em um minuto.');
    });
  }

  /* Chamada a partir do toque dela, com a permissão do Android ainda valendo. */
  function enviarCopiaPronta() {
    if (!copiaPronta) return;
    entregarArquivo(copiaPronta.nome, copiaPronta.blob, 'Cópia de segurança');
  }

  /* Há quantos dias a última cópia foi salva. Devolve null se nunca houve. */
  function diasDesdeACopia() {
    var quando = db.ajustes && db.ajustes.ultimaCopia;
    if (!quando) return null;
    var ms = Core.dataLocal(Core.hojeIso()) - Core.dataLocal(quando);
    return Math.max(0, Math.round(ms / 86400000));
  }

  function precisaLembrarDaCopia() {
    if (!db.aulas.length) return false;
    var dias = diasDesdeACopia();
    return dias === null || dias >= 14;
  }

  function restaurarCopia(ev) {
    var arquivo = ev.target.files && ev.target.files[0];
    if (!arquivo) return;
    if (!confirmar('Restaurar esta cópia? Os dados atuais deste tablet serão substituídos.')) {
      ev.target.value = '';
      return;
    }
    var leitor = new FileReader();
    leitor.onload = function () {
      var pacote;
      try { pacote = JSON.parse(leitor.result); }
      catch (e) { avisar('O arquivo não é uma cópia válida.'); return; }
      Store.importarTudo(pacote).then(function (dados) {
        db = dados;
        desenharTudo();
        avisar('Cópia restaurada.');
      }).catch(function (e) { avisar(e.message || 'Não foi possível restaurar.'); });
    };
    leitor.readAsText(arquivo);
    ev.target.value = '';
  }

  function liberarEspaco() {
    Store.limparOrfaos(db).then(function (r) {
      avisar('Liberado: ' + r.notas + ' folha(s), ' + r.midias + ' imagem(ns), ' + r.anexos + ' anexo(s).');
      desenharAjustes();
    });
  }

  function apagarExemplo() {
    var exemplos = db.alunos.filter(function (a) { return a.daCargaInicial; });
    if (!exemplos.length) { avisar('A carga inicial já foi removida.'); return; }
    if (!confirmar('Apagar os ' + exemplos.length + ' alunos da carga inicial e as aulas deles?')) return;
    comDesfazer('Carga inicial removida.', function () {
      var ids = {};
      exemplos.forEach(function (a) { ids[a.id] = true; });
      db.alunos = db.alunos.filter(function (a) { return !ids[a.id]; });
      db.aulas = db.aulas.filter(function (a) { return !ids[a.alunoId]; });
      db.series = (db.series || []).filter(function (s) { return !ids[s.alunoId]; });
      db.resumos = db.resumos.filter(function (r) { return !ids[r.alunoId]; });
      db.ajustes.cargaInicial = false;
    }).then(function () { desenharTudo(); });
  }

  function apagarTudo() {
    if (!confirmar('Apagar TODOS os dados deste tablet? Faça uma cópia de segurança antes.')) return;
    if (!confirmar('Confirma mesmo? Esta ação apaga alunos, aulas, folhas e anexos.')) return;
    Store.apagarTudo().then(function () {
      db = Store.bancoVazio();
      return Store.salvar(db);
    }).then(function () {
      desenharTudo();
      avisar('Todos os dados foram apagados.');
    });
  }

  // ================= partida =================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
