/* app.js
 * Interface do controle de aulas do Apoio Educacional.
 */
(function () {
  'use strict';

  var VERSAO = '1.1.0';

  var db = null;
  var mesAtual = Core.mesDe(Core.hojeIso());
  var editorAtual = null;
  var aulaEmEdicao = null;
  var alunoEmEdicao = null;
  var midiasCarregadas = {};
  var tempoAviso = null;

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
      ligarEventos();
      desenharTudo();
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
    ['A receber', Core.fmtMoeda(valor)],
    ['Alunos', String(Object.keys(alunosNoMes).length)]].forEach(function (par) {
      numeros.appendChild(el('div', { class: 'numero' }, [
        el('div', { class: 'rotulo', texto: par[0] }),
        el('div', { class: 'valor', texto: par[1] })
      ]));
    });

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
        var cls = 'pilula' + (a.status === 'cancelada' ? ' cancelada' : '') + (a.temNota ? ' tem-nota' : '');
        var pil = el('div', {
          class: cls,
          style: 'background:' + (aluno ? aluno.cor : '#9AA3AF'),
          texto: (a.hora ? a.hora + ' ' : '') + nome
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
      var aluno = alunoPorId($('#campo-aluno').value);
      var data = $('#campo-data').value;
      var dur = parseInt($('#campo-duracao').value, 10) || 0;
      var pv = aluno ? Core.precoVigente(aluno, data) : null;
      if (!pv) {
        previsao.innerHTML = '<strong style="color:#B4453C">Sem valor por hora vigente nesta data.</strong> ' +
          'Cadastre o valor na ficha do aluno.';
      } else {
        previsao.textContent = 'Valor previsto: ' + Core.fmtMoeda((dur / 60) * pv.valorHora) +
          ' (' + Core.fmtMoeda(pv.valorHora) + ' por hora).';
      }
    }
    selAluno.addEventListener('change', atualizarPrevisao);
    selDur.addEventListener('change', atualizarPrevisao);
    $('#campo-data').addEventListener('change', atualizarPrevisao);
    $('#campo-data').addEventListener('input', atualizarPrevisao);

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

    // folha de aula e anexos, só depois que a aula existe
    if (!novo) {
      corpo.appendChild(el('h3', { class: 'subtitulo', texto: 'Conteúdo da aula' }));

      var areaNota = el('textarea', {
        id: 'campo-nota-texto',
        placeholder: 'O que foi trabalhado nesta aula. Este texto entra no fechamento quando você pedir.'
      });
      areaNota.value = aulaEmEdicao.notaTexto || '';
      corpo.appendChild(el('label', { class: 'campo' }, [
        el('span', { texto: 'Anotação digitada' }), areaNota
      ]));

      corpo.appendChild(el('div', { class: 'barra', style: 'margin-bottom:4px' }, [
        el('button', {
          type: 'button', class: 'btn',
          texto: 'Repetir para trás',
          aoClick: function () { abrirRetroativo(aulaEmEdicao.id); }
        })
      ]));
      corpo.appendChild(el('div', {
        class: 'ajuda',
        texto: 'Use quando as aulas já aconteciam antes de você cadastrar o aluno. ' +
          'O aplicativo cria as datas passadas com este mesmo horário e duração.'
      }));

      var linhaFolha = el('div', { class: 'barra', style: 'margin-bottom:6px' });
      linhaFolha.appendChild(el('button', {
        type: 'button', class: 'btn destaque',
        texto: aulaEmEdicao.temNota ? 'Abrir folha de aula' : 'Escrever à mão na folha',
        aoClick: function () { abrirEditorNota(aulaEmEdicao.id); }
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
      corpo.appendChild(el('div', { class: 'ajuda' }, [
        document.createTextNode('A folha aceita escrita com a S Pen, imagem colada e texto digitado. '),
        el('strong', { texto: 'Para trazer uma aula do Samsung Notes: ' }),
        document.createTextNode('lá dentro toque em Compartilhar, escolha PDF, e depois use "Anexar PDF" aqui. ' +
          'O arquivo fica guardado junto da aula e você abre ou compartilha quando quiser. ' +
          'Ele não entra dentro do PDF do fechamento, que leva só as folhas escritas aqui.')
      ]));

      var listaAnexos = el('div', { id: 'lista-anexos' });
      corpo.appendChild(listaAnexos);
      desenharAnexos(listaAnexos, aulaEmEdicao);
    }

    atualizarPrevisao();
    abrirModal('modal-aula');
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
      caixa.appendChild(el('div', { class: 'item-lista' }, [
        el('div', { class: 'bolinha', style: 'background:' + a.cor }),
        el('div', { class: 'cresce' }, [
          el('div', { class: 'nome' }, [
            document.createTextNode(a.nome),
            (!Core.precoVigente(a, Core.hojeIso())) ? el('span', { class: 'tag excecao', texto: 'falta o valor', style: 'margin-left:8px' }) : null
          ]),
          el('div', {
            class: 'detalhe',
            texto: (pv ? Core.fmtMoeda(pv.valorHora) + ' por hora' : 'sem valor cadastrado') +
              ' · ' + qtd + ' aula' + (qtd === 1 ? '' : 's') +
              (series.length ? ' · ' + Core.descreveSerie(series[0]) : '')
          })
        ]),
        el('button', {
          type: 'button', class: 'btn pequeno', texto: 'Abrir',
          aoClick: function () { abrirAluno(a.id); }
        })
      ]));
    });
  }

  function abrirAluno(alunoId) {
    alunoEmEdicao = alunoId ? alunoPorId(alunoId) : null;
    var novo = !alunoEmEdicao;
    $('#titulo-modal-aluno').textContent = novo ? 'Novo aluno' : alunoEmEdicao.nome;
    $('#excluir-aluno').style.display = novo ? 'none' : '';

    var corpo = $('#corpo-modal-aluno');
    corpo.innerHTML = '';

    corpo.appendChild(el('label', { class: 'campo' }, [
      el('span', { texto: 'Nome do aluno' }),
      el('input', { type: 'text', id: 'campo-nome', value: novo ? '' : alunoEmEdicao.nome, placeholder: 'Nome da criança' })
    ]));
    corpo.appendChild(el('label', { class: 'campo' }, [
      el('span', { texto: 'Responsável' }),
      el('input', {
        type: 'text', id: 'campo-responsavel',
        value: novo ? '' : (alunoEmEdicao.responsavel || ''),
        placeholder: 'Opcional. Aparece no fechamento.'
      })
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
    corpo.appendChild(el('div', { class: 'campo' }, [
      el('span', { texto: 'Cor na agenda', style: 'display:block;font-size:13px;font-weight:700;color:#1F3A5F;margin-bottom:5px' }),
      cores
    ]));

    corpo.appendChild(el('label', { class: 'campo' }, [
      el('span', { texto: 'Observações' }),
      (function () {
        var t = el('textarea', {
          id: 'campo-obs', style: 'min-height:70px',
          placeholder: 'Anotações suas sobre o aluno. Não aparece no fechamento da família.'
        });
        t.value = novo ? '' : (alunoEmEdicao.obs || '');
        return t;
      })()
    ]));

    // vigências de preço
    corpo.appendChild(el('h3', { class: 'subtitulo', texto: 'Valor da hora-aula' }));
    if (!novo && !Core.precoVigente(alunoEmEdicao, Core.hojeIso())) {
      corpo.appendChild(el('div', {
        class: 'faixa-aviso',
        texto: 'Este aluno ainda não tem valor por hora. Sem ele o fechamento não consegue calcular quanto cobrar.'
      }));
    }
    corpo.appendChild(el('div', {
      class: 'ajuda',
      texto: 'Cada valor vale de uma data até outra. Ao reajustar, encerre o valor antigo e crie o novo. O fechamento usa o valor vigente na data de cada aula.'
    }));

    var precos = novo ? [] : (alunoEmEdicao.precos || []).slice();
    var caixaPrecos = el('div', { id: 'caixa-precos' });
    corpo.appendChild(caixaPrecos);

    function desenharPrecos() {
      caixaPrecos.innerHTML = '';
      precos.slice().sort(function (a, b) { return String(a.inicio).localeCompare(String(b.inicio)); })
        .forEach(function (p) {
          var linha = el('div', { class: 'cartao compacto' }, [
            el('div', { class: 'linha' }, [
              el('label', { class: 'campo', style: 'margin-bottom:6px' }, [
                el('span', { texto: 'R$ por hora' }),
                el('input', {
                  type: 'number', step: '0.01', min: '0', value: String(p.valorHora),
                  aoInput: function () { p.valorHora = parseFloat(this.value) || 0; }
                })
              ]),
              el('label', { class: 'campo', style: 'margin-bottom:6px' }, [
                el('span', { texto: 'A partir de' }),
                el('input', {
                  type: 'date', value: p.inicio || '',
                  aoInput: function () { p.inicio = this.value; }
                })
              ]),
              el('label', { class: 'campo', style: 'margin-bottom:6px' }, [
                el('span', { texto: 'Até (vazio: sem fim)' }),
                el('input', {
                  type: 'date', value: p.fim || '',
                  aoInput: function () { p.fim = this.value || null; }
                })
              ])
            ]),
            el('button', {
              type: 'button', class: 'btn pequeno perigo', texto: 'Remover este valor',
              aoClick: function () {
                precos = precos.filter(function (x) { return x !== p; });
                desenharPrecos();
              }
            })
          ]);
          caixaPrecos.appendChild(linha);
        });

      caixaPrecos.appendChild(el('button', {
        type: 'button', class: 'btn', texto: '+ Adicionar valor',
        aoClick: function () {
          var ultimo = precos.slice().sort(function (a, b) { return String(a.inicio).localeCompare(String(b.inicio)); }).pop();
          precos.push({
            id: Core.uid(),
            inicio: Core.hojeIso(),
            fim: null,
            valorHora: ultimo ? ultimo.valorHora : 100
          });
          desenharPrecos();
        }
      }));
    }
    desenharPrecos();
    corpo._precos = function () { return precos; };
    corpo._cor = function () { return corEscolhida; };

    // recorrências existentes
    if (!novo) {
      var series = (db.series || []).filter(function (s) { return s.alunoId === alunoEmEdicao.id; });
      if (series.length) {
        corpo.appendChild(el('h3', { class: 'subtitulo', texto: 'Aulas que se repetem' }));
        series.forEach(function (s) {
          corpo.appendChild(el('div', { class: 'item-lista' }, [
            el('div', { class: 'cresce' }, [
              el('div', { class: 'nome', texto: Core.descreveSerie(s) }),
              el('div', { class: 'detalhe', texto: 'Começou em ' + Core.ddmmaaaa(s.inicio) + ', ' + Core.fmtDuracao(s.duracaoMin) + ' por encontro' })
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
                    return !(a.serieId === s.id && a.data >= quando && !a.destacada);
                  });
                  var dt = Core.dataLocal(quando); dt.setDate(dt.getDate() - 1);
                  s.fim = Core.isoDe(dt);
                  if (s.fim < s.inicio) db.series = db.series.filter(function (x) { return x.id !== s.id; });
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

    abrirModal('modal-aluno');
  }

  function salvarAluno() {
    var nome = $('#campo-nome').value.trim();
    if (!nome) { avisar('Informe o nome do aluno.'); return; }
    var corpo = $('#corpo-modal-aluno');
    var precos = corpo._precos();

    var provisorio = { precos: precos };
    var erros = Core.validarPrecos(provisorio);
    if (erros.length) { avisar(erros[0]); return; }

    if (alunoEmEdicao) {
      alunoEmEdicao.nome = nome;
      alunoEmEdicao.responsavel = $('#campo-responsavel').value.trim();
      alunoEmEdicao.cor = corpo._cor();
      alunoEmEdicao.precos = precos;
      alunoEmEdicao.obs = $('#campo-obs').value.trim();
    } else {
      db.alunos.push({
        id: Core.uid(), nome: nome,
        responsavel: $('#campo-responsavel').value.trim(),
        cor: corpo._cor(), ativo: true, precos: precos,
        obs: $('#campo-obs').value.trim()
      });
    }
    salvar().then(function () {
      fecharModal('modal-aluno');
      desenharTudo();
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

  function desenharFerramentas(aula) {
    if (!editorAtual) return;
    editorAtual._aulaId = aula.id;
    var barra = $('#ferramentas-nota');
    barra.innerHTML = '';

    var ferramentas = [
      ['caneta', '✎', 'Caneta'],
      ['marcatexto', '▬', 'Marca-texto'],
      ['borracha', '⌫', 'Borracha'],
      ['texto', 'T', 'Texto digitado'],
      ['selecao', '✥', 'Mover e redimensionar']
    ];
    ferramentas.forEach(function (f) {
      var b = el('button', {
        type: 'button', title: f[2],
        class: 'ferr' + (editorAtual.ferramenta === f[0] ? ' ativa' : ''),
        texto: f[1]
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
    ['Total a receber', Core.fmtMoeda(totalValor)]].forEach(function (par) {
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
        el('strong', { style: 'color:#1F3A5F;font-size:18px', texto: Core.fmtMoeda(f.totalValor) })
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
          el('td', { texto: Core.fmtMoeda(l.cobravel ? l.valor : 0) })
        ]));
      });
      var linhaTotal = el('tr', { class: 'total' }, [
        el('td', { texto: 'Total' }),
        el('td', { texto: '' }),
        el('td', { texto: f.totalHoras + ' h' }),
        el('td', { texto: '' }),
        el('td', { texto: Core.fmtMoeda(f.totalValor) })
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

  function baixarCopia() {
    Store.exportarTudo(db).then(function (pacote) {
      var texto = JSON.stringify(pacote);
      var hoje = Core.hojeIso();
      entregarArquivo('Copia_Apoio_Educacional_' + hoje + '.json',
        new Blob([texto], { type: 'application/json' }), 'Cópia de segurança');
    });
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
