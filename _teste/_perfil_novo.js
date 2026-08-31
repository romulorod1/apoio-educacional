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

    var painel = { dados: el('div'), valores: el('div'), historico: el('div') };
    var abas = el('div', { class: 'abas-perfil' });
    var lista = [['dados', 'Dados'], ['valores', 'Valores']];
    if (!novo) lista.push(['historico', 'Histórico']);

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

    // ---------------- aba: histórico ----------------

    if (!novo) desenharHistorico(painel.historico, alunoEmEdicao);

    abrirModal('modal-aluno');
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

