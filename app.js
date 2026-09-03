/* app.js
 * Interface do controle de aulas do Apoio Educacional.
 */
(function () {
  'use strict';

  var VERSAO = '1.10.0';

  var db = null;
  var mesAtual = Core.mesDe(Core.hojeIso());
  var editorAtual = null;
  var aulaEmEdicao = null;
  var alunoEmEdicao = null;
  var midiasCarregadas = {};
  var tempoAviso = null;

  /* O que mudou em cada versão, para ela não descobrir por acaso.
   * Escrito para quem usa, não para quem programa: cada item diz o que ela
   * ganha, e onde encontrar. */
  var NOVIDADES = [
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
    var novas = vista
      ? NOVIDADES.filter(function (n) { return compararVersao(n.versao, vista) > 0; })
      : NOVIDADES.slice(0, 2);

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

  function abrirModal(id) { $('#' + id).classList.add('aberto'); }
  function fecharModal(id) { $('#' + id).classList.remove('aberto'); }

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
    $$('.fundo-modal').forEach(function (m) { m.classList.remove('aberto'); });
    aulaEmEdicao = null;
    alunoEmEdicao = null;
  }

  // ================= gravação e desfazer =================

  function salvar() { return Store.salvar(db); }

  /* Grava um ponto de retorno antes de mexer em várias aulas de uma vez,
   * e depois oferece o desfazer na barra flutuante. */
  function comDesfazer(rotulo, acao) {
    var antes = JSON.parse(JSON.stringify(db));
    var resultado = acao();
    return Store.registrarHistorico(rotulo, antes).then(function () {
      return salvar();
    }).then(function () {
      avisar(rotulo, 'Desfazer', function () {
        db = antes;
        // Um painel aberto ainda aponta para o registro antigo, que sai do ar
        // ao voltar o estado. Fecha tudo e limpa as referências.
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
      });
    });

    $$('[data-fechar]').forEach(function (b) {
      b.addEventListener('click', function () {
        var m = b.closest('.fundo-modal');
        if (m) {
          if (m.id === 'modal-nota') fecharEditorNota();
          else m.classList.remove('aberto');
        }
      });
    });

    $$('.fundo-modal').forEach(function (m) {
      m.addEventListener('click', function (e) {
        if (e.target !== m) return;
        if (m.id === 'modal-nota') fecharEditorNota();
        else m.classList.remove('aberto');
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

  function desenharAgenda() {
    $('#rotulo-mes').textContent = Core.mesExtenso(mesAtual);

    var doMes = db.aulas.filter(function (a) { return Core.mesDe(a.data) === mesAtual; });
    var minutos = 0, valor = 0;
    doMes.forEach(function (a) {
      var st = Core.STATUS[a.status] || Core.STATUS.realizada;
      var cobravel = (typeof a.cobravel === 'boolean') ? a.cobravel : st.cobravelPadrao;
      if (!cobravel) return;
      minutos += a.duracaoMin || 0;
      var aluno = alunoPorId(a.alunoId);
      var pv = aluno ? Core.precoVigente(aluno, a.data) : null;
      if (pv) valor += (a.duracaoMin / 60) * pv.valorHora;
    });
    var alunosNoMes = {};
    doMes.forEach(function (a) { alunosNoMes[a.alunoId] = true; });

    var numeros = $('#numeros-mes');
    numeros.innerHTML = '';
    [['Encontros', String(doMes.length)],
    ['Horas cobradas', Core.fmtHoras(minutos) + ' h'],
    ['A receber', dinheiro(valor)],
    ['Alunos', String(Object.keys(alunosNoMes).length)]].forEach(function (par) {
      numeros.appendChild(el('div', { class: 'numero' }, [
        el('div', { class: 'rotulo', texto: par[0] }),
        el('div', { class: 'valor', texto: par[1] })
      ]));
    });

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

    if (serie) {
      corpo.appendChild(el('div', { class: 'faixa-info' }, [
        el('strong', { texto: 'Aula que se repete. ' }),
        document.createTextNode(Core.descreveSerie(serie)),
        aulaEmEdicao.destacada ? el('div', { style: 'margin-top:6px' }, [
          el('span', { class: 'tag excecao', texto: 'alterada só neste dia' })
        ]) : null
      ]));
    }

    var selAluno = el('select', { id: 'campo-aluno' });
    db.alunos.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome); }).forEach(function (a) {
      var o = el('option', { value: a.id, texto: a.nome });
      if (aulaEmEdicao ? a.id === aulaEmEdicao.alunoId : false) o.selected = true;
      selAluno.appendChild(o);
    });
    corpo.appendChild(el('label', { class: 'campo' }, [el('span', { texto: 'Aluno' }), selAluno]));
    if (!novo) selAluno.disabled = true;

    var dataVal = aulaEmEdicao ? aulaEmEdicao.data : (dataSugerida || Core.hojeIso());
    var horaVal = aulaEmEdicao ? (aulaEmEdicao.hora || '') : '15:30';

    corpo.appendChild(el('div', { class: 'linha' }, [
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

    corpo.appendChild(el('div', { class: 'linha' }, [
      el('label', { class: 'campo' }, [el('span', { texto: 'Duração' }), selDur]),
      el('label', { class: 'campo' }, [el('span', { texto: 'Situação' }), selStatus])
    ]));

    var stAtual = aulaEmEdicao ? (Core.STATUS[aulaEmEdicao.status] || Core.STATUS.realizada) : Core.STATUS.realizada;
    var cobravelVal = aulaEmEdicao && typeof aulaEmEdicao.cobravel === 'boolean'
      ? aulaEmEdicao.cobravel : stAtual.cobravelPadrao;
    var chkCobrar = el('input', { type: 'checkbox', id: 'campo-cobrar', style: 'width:auto;min-height:auto' });
    chkCobrar.checked = cobravelVal;
    corpo.appendChild(el('label', { class: 'campo', style: 'display:flex;align-items:center;gap:10px' }, [
      chkCobrar, el('span', { texto: 'Cobrar esta aula', style: 'margin:0' })
    ]));
    selStatus.addEventListener('change', function () {
      chkCobrar.checked = (Core.STATUS[this.value] || Core.STATUS.realizada).cobravelPadrao;
    });

    // lembrete de feriado, sem impedir a marcação
    var avisoFeriado = el('div', { id: 'aviso-feriado' });
    corpo.appendChild(avisoFeriado);

    /* Choque de horário. Duas aulas ao mesmo tempo quase sempre são lançamento
       repetido, ou a aula desmarcada que ficou para trás. O aviso aparece, mas
       nada é bloqueado: irmãos na mesma sala existem. */
    var avisoChoque = el('div', { id: 'aviso-choque' });
    corpo.appendChild(avisoChoque);
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
    corpo.appendChild(previsao);
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

      var areaNota = el('textarea', {
        id: 'campo-nota-texto',
        placeholder: 'O que foi trabalhado nesta aula. Este texto entra no fechamento quando você pedir.'
      });
      areaNota.value = aulaEmEdicao.notaTexto || '';
      corpo.appendChild(el('label', { class: 'campo' }, [
        el('span', { texto: 'Anotação digitada' }), areaNota
      ]));

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
          'Ele não entra dentro do PDF do fechamento, que leva só as folhas escritas aqui.')
      ]));

      var listaTemas = el('div', { id: 'lista-temas-aula' });
      corpo.appendChild(listaTemas);
      desenharTemasDaAula(listaTemas, aulaEmEdicao);

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

  /* Os temas já gerados para esta aula. Cada um veio com o seu PDF, e remover
   * daqui remove também o anexo correspondente. */
  function desenharTemasDaAula(caixa, aula) {
    caixa.innerHTML = '';
    var lista = Core.temasDaAula(aula);
    if (!lista.length) return;
    caixa.appendChild(el('div', {
      class: 'bloco-exercicios',
      texto: lista.length === 1 ? 'Tema desta aula' : 'Temas desta aula'
    }));
    lista.forEach(function (t) {
      caixa.appendChild(el('div', { class: 'item-lista' }, [
        el('div', { class: 'cresce' }, [
          el('div', { class: 'nome', texto: t.titulo || t.id }),
          el('div', {
            class: 'detalhe',
            texto: (t.lingua === 'en' ? 'em inglês' : 'em português') +
              (t.exercicios ? ' · ' + t.exercicios + ' exercícios' : '') +
              (t.partes && t.partes.length ? ' · ' + t.partes.join(', ') : '')
          })
        ]),
        el('button', {
          type: 'button', class: 'btn pequeno perigo', texto: 'Tirar',
          aoClick: function () {
            aula.temas = Core.temasDaAula(aula).filter(function (x) { return x !== t; });
            delete aula.tema;
            if (t.anexoId) {
              aula.anexos = (aula.anexos || []).filter(function (x) { return x.id !== t.anexoId; });
              Store.apagarAnexo(t.anexoId);
            }
            salvar().then(function () {
              desenharTemasDaAula(caixa, aula);
              if ($('#lista-anexos')) desenharAnexos($('#lista-anexos'), aula);
            });
          }
        })
      ]));
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
            salvar().then(function () { desenharAnexos(caixa, aula); });
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
        notaTexto: '', temNota: false, anexos: []
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
      notaTexto: $('#campo-nota-texto') ? $('#campo-nota-texto').value : aulaEmEdicao.notaTexto
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
        var acao = function () { Core.aplicarEdicaoAula(db, aulaEmEdicao.id, mudancas, escopo); };
        if (escopo === 'esta') {
          acao();
          salvar().then(function () {
            fecharModal('modal-aula');
            desenharTudo();
            avisar(rotulos[escopo]);
          });
        } else {
          comDesfazer(rotulos[escopo], acao).then(function () {
            fecharModal('modal-aula');
            desenharTudo();
          });
        }
      });
      return;
    }

    Core.aplicarEdicaoAula(db, aulaEmEdicao.id, mudancas, 'esta');
    salvar().then(function () {
      fecharModal('modal-aula');
      desenharTudo();
      avisar('Aula salva.');
    });
  }

  function excluirAulaAtual() {
    if (!aulaEmEdicao) return;
    var serie = Core.serieDe(db, aulaEmEdicao);
    if (!serie) {
      if (!confirmar('Excluir esta aula?')) return;
      var alvo = aulaEmEdicao.id;
      comDesfazer('Aula excluída.', function () {
        Core.excluirAulas(db, alvo, 'esta');
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
      comDesfazer(rotulos[escopo], function () {
        Core.excluirAulas(db, alvo, escopo);
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
    var lista = [['dados', 'Dados'], ['valores', 'Valores']];
    if (!novo) lista.push(['mapeamento', 'Mapeamento'], ['historico', 'Histórico']);

    lista.forEach(function (par, i) {
      var b = el('button', {
        type: 'button', class: 'aba-perfil' + (i === 0 ? ' ativa' : ''), texto: par[1]
      });
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
      var nome = SERIES_NOMES.filter(function (p) { return p[0] === m.anoEscolar; })[0];
      if (nome) contexto.push(nome[1]);
    }
    if (m.motivo) contexto.push(m.motivo);
    if (contexto.length) {
      caixa.appendChild(el('div', { class: 'ajuda', style: 'margin-top:0', texto: contexto.join(' · ') }));
    }

    Core.MAPA.forEach(function (g) {
      var rot = Core.rotulosDoMapa(g.chave, m.marcados && m.marcados[g.chave]);
      if (!rot.length) return;
      caixa.appendChild(el('div', { class: 'bloco-exercicios', texto: g.titulo }));
      var grade = el('div', { class: 'grade-areas' });
      rot.forEach(function (r) {
        grade.appendChild(el('div', { class: 'item-area', style: 'cursor:default' },
          [el('span', { texto: r })]));
      });
      caixa.appendChild(grade);
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
      anoEscolar: (SERIES_NOMES.filter(function (p) { return p[0] === m.anoEscolar; })[0] || ['', ''])[1]
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
      trabalho = atual ? JSON.parse(JSON.stringify(atual)) : Core.mapeamentoNovo();
      trabalho.id = Core.uid();
      trabalho.data = Core.hojeIso();
      trabalho.aulaId = opcoes.aulaId || null;
      trabalho._novo = true;
    } else {
      trabalho = atual;
    }
    trabalho.marcados = trabalho.marcados || {};
    Core.MAPA.forEach(function (g) {
      trabalho.marcados[g.chave] = (trabalho.marcados[g.chave] || []).slice();
    });

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

    corpo.appendChild(el('div', { class: 'linha' }, [
      campoTexto('escola', 'Colégio', 'Onde ele estuda'),
      (function () {
        var sel = el('select', { id: 'mapa-ano' });
        sel.appendChild(el('option', { value: '', texto: 'Não informado' }));
        SERIES_NOMES.forEach(function (par) {
          var o = el('option', { value: par[0], texto: par[1] });
          if (par[0] === (trabalho.anoEscolar || aluno.anoEscolar)) o.selected = true;
          sel.appendChild(o);
        });
        sel.addEventListener('change', function () { trabalho.anoEscolar = this.value; });
        trabalho.anoEscolar = trabalho.anoEscolar || aluno.anoEscolar || '';
        return el('label', { class: 'campo' }, [el('span', { texto: 'Ano escolar' }), sel]);
      })()
    ]));

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

    // ---- listas de marcar ----
    Core.MAPA.forEach(function (grupo) {
      var marcados = trabalho.marcados[grupo.chave];
      var contador = el('span', { class: 'tag' });
      function atualizar() {
        contador.textContent = marcados.length ? marcados.length + ' marcados' : 'nenhum';
        contador.className = 'tag' + (marcados.length ? ' cheia' : '');
      }

      var caixa = el('div', { 'data-grupo': grupo.chave });
      var botao = el('button', { type: 'button', class: 'btn pequeno', texto: 'Esconder' });
      botao.addEventListener('click', function () {
        var aberto = caixa.style.display !== 'none';
        caixa.style.display = aberto ? 'none' : '';
        botao.textContent = aberto ? 'Mostrar' : 'Esconder';
      });

      corpo.appendChild(el('div', { class: 'barra', style: 'margin:16px 0 2px' }, [
        el('h3', { class: 'subtitulo', style: 'margin:0;border:none', texto: grupo.titulo }),
        contador,
        el('span', { class: 'cresce' }),
        botao
      ]));
      corpo.appendChild(el('div', { class: 'ajuda', style: 'margin-top:0', texto: grupo.ajuda }));

      var grade = el('div', { class: 'grade-areas' });
      grupo.itens.forEach(function (item) {
        var chk = el('input', { type: 'checkbox', style: 'width:auto;min-height:auto' });
        chk.checked = marcados.indexOf(item.id) >= 0;
        chk.addEventListener('change', function () {
          if (this.checked) {
            if (marcados.indexOf(item.id) < 0) marcados.push(item.id);
          } else {
            var i = marcados.indexOf(item.id);
            if (i >= 0) marcados.splice(i, 1);
          }
          atualizar();
        });
        var filhos = [chk, el('span', { class: 'cresce', texto: item.rotulo })];
        // A lacuna leva direto aos temas que a tapam.
        if (item.busca) {
          filhos.push(el('button', {
            type: 'button', class: 'btn pequeno', texto: 'temas', title: 'Ver temas sobre ' + item.rotulo,
            aoClick: function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              abrirTemasPorBusca(item.busca, aluno);
            }
          }));
        }
        grade.appendChild(el('label', {
          class: 'item-area', 'data-item': grupo.chave + ':' + item.id
        }, filhos));
      });
      caixa.appendChild(grade);
      corpo.appendChild(caixa);
      atualizar();
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

    Core.MAPA.forEach(function (g) {
      var rot = Core.rotulosDoMapa(g.chave, m.marcados && m.marcados[g.chave]);
      if (!rot.length) return;
      corpo.appendChild(el('div', { class: 'bloco-exercicios', texto: g.titulo }));
      corpo.appendChild(el('div', { style: 'font-size:14px;line-height:1.55', texto: rot.join(', ') + '.' }));
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

  /* Caixa de lembrete que aparece ao abrir uma aula de aluno já mapeado. */
  function desenharLembrete(corpo, aluno, aula) {
    var l = Core.lembreteDoMapeamento(aluno);
    if (!l) return;

    var conteudo = [];
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
          var texto = Core.textoDoLembrete(aluno);
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

  /* O ano escolar não é perguntado em lugar nenhum: ele fica guardado sozinho na
   * primeira vez que ela escolhe um tema para aquele aluno, e da segunda em
   * diante a lista já abre no lugar certo. Um campo a menos para preencher. */
  function anoEscolarDe(aluno) {
    return (aluno && aluno.anoEscolar) || null;
  }
  function lembrarAnoEscolar(aluno, ano) {
    if (!aluno || aluno.anoEscolar === ano) return;
    aluno.anoEscolar = ano;
    salvar();
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

  function desenharEscolhaTema(temas, aula, aluno, buscaInicial) {
    var corpo = $('#corpo-modal-tema');
    var rodape = $('#rodape-modal-tema');
    corpo.innerHTML = '';
    rodape.innerHTML = '';

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
            type: 'button', class: 'btn pequeno principal', texto: 'Escolher',
            aoClick: function () { abrirMontagem(t, aula, aluno); }
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
  function abrirMontagem(resumoTema, aula, aluno) {
    var corpo = $('#corpo-modal-tema');
    var rodape = $('#rodape-modal-tema');
    corpo.innerHTML = '';
    rodape.innerHTML = '';
    corpo.appendChild(el('div', { class: 'ajuda', texto: 'Carregando o tema...' }));

    carregarSerie(resumoTema.serie).then(function (temas) {
      var tema = temas.filter(function (t) { return t.id === resumoTema.id; })[0];
      if (!tema) throw new Error('tema nao encontrado');
      desenharMontagem(tema, aula, aluno);
    }).catch(function () {
      corpo.innerHTML = '';
      corpo.appendChild(el('div', { class: 'faixa-aviso' }, [
        document.createTextNode('Não consegui abrir este tema. Abra o aplicativo uma vez com ' +
          'internet para ele ficar guardado no tablet.')
      ]));
    });
  }

  function desenharMontagem(tema, aula, aluno) {
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
        type: 'button', class: 'btn pequeno', texto: '‹ Outro tema',
        aoClick: function () { desenharEscolhaTema(indiceTemas, aula, aluno); }
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
          gerarMaterialDoTema(tema, lingua, incluir, marcados, aula, aluno);
        }
      });
      if (nada || semExercicio) botao.disabled = true;
      rodape.appendChild(botao);
    }

    desenharExercicios();
  }

  /* Passo 3: gerar o PDF e anexar à aula. */
  function gerarMaterialDoTema(tema, lingua, incluir, marcados, aula, aluno) {
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
      aula.temas.push({
        id: tema.id, titulo: tema[lingua].titulo, lingua: lingua,
        partes: partes, exercicios: escolhidos.length, anexoId: id
      });
      delete aula.tema;
      return salvar();
    }).then(function () {
      fecharModal('modal-tema');
      if ($('#modal-aula').classList.contains('aberto') && aulaEmEdicao &&
          aulaEmEdicao.id === aula.id) {
        if ($('#lista-temas-aula')) desenharTemasDaAula($('#lista-temas-aula'), aula);
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
    var totalMin = 0, totalValor = 0, totalEncontros = 0;
    fechs.forEach(function (f) {
      totalMin += f.totalMin; totalValor += f.totalValor; totalEncontros += f.qtdEncontros;
    });

    var numeros = $('#numeros-fechamento');
    numeros.innerHTML = '';
    [['Alunos no mês', String(fechs.length)],
    ['Encontros', String(totalEncontros)],
    ['Horas cobradas', Core.fmtHoras(totalMin) + ' h'],
    ['Total a receber', dinheiro(totalValor)]].forEach(function (par) {
      numeros.appendChild(el('div', { class: 'numero' }, [
        el('div', { class: 'rotulo', texto: par[0] }),
        el('div', { class: 'valor', texto: par[1] })
      ]));
    });

    var lista = $('#lista-fechamento');
    lista.innerHTML = '';
    if (!fechs.length) {
      lista.appendChild(el('div', { class: 'vazio' }, [
        el('p', { texto: 'Nenhuma aula registrada em ' + Core.mesExtenso(mesAtual) + '.' })
      ]));
      return;
    }

    fechs.forEach(function (f) {
      var cartao = el('div', { class: 'cartao' });

      cartao.appendChild(el('div', { class: 'barra', style: 'margin-bottom:10px' }, [
        el('h3', { class: 'titulo', style: 'font-size:18px', texto: f.alunoNome }),
        el('span', { class: 'cresce' }),
        el('strong', { style: 'color:#1F3A5F;font-size:18px', texto: dinheiro(f.totalValor) })
      ]));

      cartao.appendChild(el('div', {
        class: 'ajuda', style: 'margin-top:0',
        texto: f.qtdEncontros + ' encontro' + (f.qtdEncontros === 1 ? '' : 's') +
          ' · ' + f.totalHoras + ' h cobradas' +
          (f.faixas.length > 1 ? ' · houve reajuste no mês' : '') +
          (f.minutosNaoCobrados ? ' · ' + Core.fmtHoras(f.minutosNaoCobrados) + ' h não cobradas' : '')
      }));

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
          el('td', { texto: l.statusRotulo + (l.cobravel ? '' : ' (não cobrada)') }),
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

      var temResumo = !!(f.resumoTexto || '').trim();
      cartao.appendChild(el('div', { class: 'barra', style: 'margin:12px 0 0' }, [
        el('button', {
          type: 'button', class: 'btn' + (temResumo ? '' : ' destaque'),
          texto: temResumo ? 'Editar resumo do mês' : 'Escrever o resumo do mês',
          aoClick: function () { abrirResumo(f.aluno.id, mesAtual); }
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
          type: 'button', class: 'btn', texto: 'PDF com as folhas',
          aoClick: function () { exportarAlunoEmPdf(f, true); }
        })
      ]));

      if (!temResumo) {
        cartao.appendChild(el('div', {
          class: 'ajuda', style: 'margin:8px 0 0',
          texto: 'O resumo do mês ainda não foi escrito. Ele entra no PDF logo abaixo da tabela.'
        }));
      }

      lista.appendChild(cartao);
    });
  }

  function abrirResumo(alunoId, mes) {
    var aluno = alunoPorId(alunoId);
    var registro = db.resumos.filter(function (r) { return r.alunoId === alunoId && r.mes === mes; })[0];
    $('#titulo-modal-resumo').textContent = 'Resumo de ' + aluno.nome + ', ' + Core.mesExtenso(mes);
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
      avisar('Resumo salvo.');
    });
  }

  // ================= exportação =================

  function nomeBase(f) {
    return 'Fechamento_' + Core.nomeArquivo(f.alunoNome) + '_' + f.mes;
  }

  function exportarAlunoEmTexto(f) {
    var md = Core.markdownFechamento(f, { incluirNotas: true });
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
      var bytes = PDFGen.gerarFechamento(f, {
        incluirNotas: comFolhas,
        notas: extra.notas,
        imagens: extra.imagens,
        sempreResumo: true
      });
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

    Store.estimarEspaco().then(function (e) {
      if (!e) { $('#info-espaco').textContent = ''; return; }
      var usado = (e.usage || 0) / (1024 * 1024);
      $('#info-espaco').textContent = 'Espaço usado pelo aplicativo: ' +
        (usado < 1 ? (Math.round(usado * 1000) / 1000).toString().replace('.', ',') : (Math.round(usado * 10) / 10).toString().replace('.', ',')) + ' MB.';
    });
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
