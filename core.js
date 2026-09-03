/* core.js
 * Modelo de dados, calculo de fechamento e geracao de Markdown.
 * Sem dependencia de DOM: roda no navegador e no Node (para testes).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Core = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  var DIAS_CURTO = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var DIAS_LONGO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  var STATUS = {
    realizada: { rotulo: 'Realizada', cobravelPadrao: true },
    reposicao: { rotulo: 'Reposição', cobravelPadrao: true },
    falta: { rotulo: 'Falta sem aviso', cobravelPadrao: true },
    cancelada: { rotulo: 'Cancelada com aviso', cobravelPadrao: false }
  };

  // ---------- datas (sempre locais, nunca UTC, para nao deslocar o dia) ----------

  function partesData(iso) {
    var p = String(iso).split('-');
    return { a: +p[0], m: +p[1], d: +p[2] };
  }

  function dataLocal(iso) {
    var p = partesData(iso);
    return new Date(p.a, p.m - 1, p.d);
  }

  function isoDe(dt) {
    return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate());
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function diaSemana(iso) { return dataLocal(iso).getDay(); }
  function diaSemanaCurto(iso) { return DIAS_CURTO[diaSemana(iso)]; }
  function diaSemanaLongo(iso) { return DIAS_LONGO[diaSemana(iso)]; }

  function ddmm(iso) { var p = partesData(iso); return pad2(p.d) + '/' + pad2(p.m); }
  function ddmmaaaa(iso) { var p = partesData(iso); return pad2(p.d) + '/' + pad2(p.m) + '/' + p.a; }

  /* Converte uma data escrita como dd/mm/aaaa para o formato interno.
   * Devolve null quando o texto não é uma data válida. */
  function deBR(texto) {
    var m = String(texto || '').trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (!m) return null;
    var d = +m[1], mes = +m[2], a = +m[3];
    if (mes < 1 || mes > 12 || d < 1) return null;
    var dt = new Date(a, mes - 1, d);
    if (dt.getFullYear() !== a || dt.getMonth() !== mes - 1 || dt.getDate() !== d) return null;
    return isoDe(dt);
  }

  function mesExtenso(mesIso) {
    var p = String(mesIso).split('-');
    return MESES[(+p[1]) - 1] + ' de ' + p[0];
  }

  function mesDe(iso) { return String(iso).slice(0, 7); }

  function diasDoMes(mesIso) {
    var p = String(mesIso).split('-');
    return new Date(+p[0], +p[1], 0).getDate();
  }

  function primeiroDiaSemanaDoMes(mesIso) {
    var p = String(mesIso).split('-');
    return new Date(+p[0], +p[1] - 1, 1).getDay();
  }

  function mesAdjacente(mesIso, delta) {
    var p = String(mesIso).split('-');
    var dt = new Date(+p[0], +p[1] - 1 + delta, 1);
    return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1);
  }

  function hojeIso() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  // ---------- formatacao pt-BR ----------

  function fmtMoeda(v) {
    var neg = v < 0;
    var n = Math.abs(Math.round(v * 100)) / 100;
    var inteiro = Math.floor(n);
    var cent = Math.round((n - inteiro) * 100);
    if (cent === 100) { inteiro += 1; cent = 0; }
    var s = String(inteiro);
    var out = '';
    while (s.length > 3) { out = '.' + s.slice(-3) + out; s = s.slice(0, -3); }
    out = s + out;
    return (neg ? '-' : '') + 'R$ ' + out + ',' + pad2(cent);
  }

  function fmtHoras(min) {
    var h = Math.floor(min / 60);
    var m = min % 60;
    return h + ':' + pad2(m);
  }

  function fmtHorasDecimal(min) {
    var v = min / 60;
    var s = (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
    return s.replace(/,00$/, '').replace(/(,\d)0$/, '$1');
  }

  function fmtDuracao(min) {
    if (min < 60) return min + 'min';
    if (min % 60 === 0) return (min / 60) + 'h';
    return Math.floor(min / 60) + 'h' + pad2(min % 60);
  }

  // ---------- precos vigentes ----------

  /* aluno.precos = [{ id, inicio: 'AAAA-MM-DD', fim: 'AAAA-MM-DD'|null, valorHora: Number }]
   * Vigencia com fim null vale por prazo indeterminado.
   * Havendo sobreposicao, vence a de inicio mais recente. */
  function precoVigente(aluno, dataIso) {
    var lista = (aluno && aluno.precos) || [];
    var melhor = null;
    for (var i = 0; i < lista.length; i++) {
      var p = lista[i];
      if (!p || typeof p.valorHora !== 'number') continue;
      if (p.inicio && dataIso < p.inicio) continue;
      if (p.fim && dataIso > p.fim) continue;
      if (!melhor || String(p.inicio || '') > String(melhor.inicio || '')) melhor = p;
    }
    return melhor;
  }

  function validarPrecos(aluno) {
    var erros = [];
    var lista = ((aluno && aluno.precos) || []).slice().sort(function (a, b) {
      return String(a.inicio || '').localeCompare(String(b.inicio || ''));
    });
    for (var i = 0; i < lista.length; i++) {
      var p = lista[i];
      if (!p.inicio) erros.push('Há uma vigência sem data de início.');
      if (typeof p.valorHora !== 'number' || !(p.valorHora > 0)) erros.push('Há uma vigência sem valor por hora válido.');
      if (p.fim && p.inicio && p.fim < p.inicio) erros.push('Vigência iniciada em ' + ddmmaaaa(p.inicio) + ' termina antes de começar.');
      if (i > 0) {
        var ant = lista[i - 1];
        if (!ant.fim) erros.push('A vigência de ' + ddmmaaaa(ant.inicio) + ' não tem fim e se sobrepõe à de ' + ddmmaaaa(p.inicio) + '.');
        else if (ant.fim >= p.inicio) erros.push('As vigências de ' + ddmmaaaa(ant.inicio) + ' e ' + ddmmaaaa(p.inicio) + ' se sobrepõem.');
      }
    }
    return erros;
  }

  // ---------- grade padrao ----------

  /* aluno.grade = { dias: [1,3,5], hora: '15:30', duracaoMin: 60 } */
  function gradeTexto(aluno) {
    var g = aluno && aluno.grade;
    if (!g || !g.dias || !g.dias.length) return '';
    var nomes = g.dias.slice().sort().map(function (d) { return DIAS_LONGO[d]; });
    var lista;
    if (nomes.length === 1) lista = nomes[0];
    else lista = nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1];
    return lista + (g.hora ? ', ' + g.hora : '');
  }

  function aulasDaGradeNoMes(aluno, mesIso) {
    var g = aluno && aluno.grade;
    if (!g || !g.dias || !g.dias.length) return [];
    var total = diasDoMes(mesIso);
    var out = [];
    for (var d = 1; d <= total; d++) {
      var iso = mesIso + '-' + pad2(d);
      if (g.dias.indexOf(diaSemana(iso)) >= 0) {
        out.push({ data: iso, hora: g.hora || '', duracaoMin: g.duracaoMin || 60 });
      }
    }
    return out;
  }

  // ---------- feriados ----------

  /* Feriados nacionais, do estado do Rio de Janeiro e do município de Niterói.
   * Servem apenas de lembrete no calendário: nada é bloqueado, porque
   * aula em feriado acontece e às vezes é justamente a reposição. */

  /* Domingo de Páscoa pelo algoritmo de Meeus e Butcher. */
  function domingoDePascoa(ano) {
    var a = ano % 19;
    var b = Math.floor(ano / 100);
    var c = ano % 100;
    var d = Math.floor(b / 4);
    var e = b % 4;
    var f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4);
    var k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var mes = Math.floor((h + l - 7 * m + 114) / 31);
    var dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
  }

  function somaDias(dt, dias) {
    var novo = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    novo.setDate(novo.getDate() + dias);
    return novo;
  }

  var cacheFeriados = {};

  /* Devolve { 'AAAA-MM-DD': { nome, ambito, facultativo } } para o ano. */
  function feriadosDoAno(ano) {
    if (cacheFeriados[ano]) return cacheFeriados[ano];
    var mapa = {};
    function marca(iso, nome, ambito, facultativo) {
      mapa[iso] = { nome: nome, ambito: ambito, facultativo: !!facultativo };
    }
    function fixo(mes, dia, nome, ambito, facultativo) {
      marca(ano + '-' + pad2(mes) + '-' + pad2(dia), nome, ambito, facultativo);
    }

    // nacionais de data fixa
    fixo(1, 1, 'Confraternização Universal', 'nacional');
    fixo(4, 21, 'Tiradentes', 'nacional');
    fixo(5, 1, 'Dia do Trabalho', 'nacional');
    fixo(9, 7, 'Independência do Brasil', 'nacional');
    fixo(10, 12, 'Nossa Senhora Aparecida', 'nacional');
    fixo(11, 2, 'Finados', 'nacional');
    fixo(11, 15, 'Proclamação da República', 'nacional');
    fixo(11, 20, 'Consciência Negra', 'nacional');
    fixo(12, 25, 'Natal', 'nacional');

    // nacionais de data móvel, ancorados na Páscoa
    var pascoa = domingoDePascoa(ano);
    marca(isoDe(somaDias(pascoa, -48)), 'Carnaval', 'nacional');
    marca(isoDe(somaDias(pascoa, -47)), 'Carnaval', 'nacional');
    marca(isoDe(somaDias(pascoa, -46)), 'Quarta-feira de Cinzas', 'nacional', true);
    marca(isoDe(somaDias(pascoa, -2)), 'Sexta-feira Santa', 'nacional');
    marca(isoDe(pascoa), 'Páscoa', 'nacional');
    marca(isoDe(somaDias(pascoa, 60)), 'Corpus Christi', 'nacional', true);

    // estado do Rio de Janeiro
    fixo(4, 23, 'São Jorge', 'estadual');

    // município de Niterói
    fixo(11, 22, 'Aniversário de Niterói', 'municipal');
    fixo(12, 8, 'Nossa Senhora da Conceição, padroeira de Niterói', 'municipal');

    cacheFeriados[ano] = mapa;
    return mapa;
  }

  function feriadoEm(iso) {
    var ano = parseInt(String(iso).slice(0, 4), 10);
    if (!ano) return null;
    return feriadosDoAno(ano)[iso] || null;
  }

  function feriadosDoMes(mesIso) {
    var ano = parseInt(String(mesIso).slice(0, 4), 10);
    var todos = feriadosDoAno(ano);
    var saida = {};
    Object.keys(todos).forEach(function (iso) {
      if (mesDe(iso) === mesIso) saida[iso] = todos[iso];
    });
    return saida;
  }

  // ---------- séries recorrentes ----------

  /* serie = { id, alunoId, dias: [1,3,5], hora: '15:30', duracaoMin: 60,
   *           inicio: 'AAAA-MM-DD', fim: 'AAAA-MM-DD'|null, materializadoAte: 'AAAA-MM' }
   *
   * As ocorrências são materializadas como aulas de verdade, com serieId.
   * Uma aula editada individualmente recebe destacada = true e passa a ser
   * uma exceção: edições em massa da série não a sobrescrevem mais.
   * É a mesma semântica do Google Agenda. */

  var HORIZONTE_MESES = 6;

  function datasDaSerieNoMes(serie, mesIso) {
    var out = [];
    if (!serie || !serie.dias || !serie.dias.length) return out;
    var total = diasDoMes(mesIso);
    for (var d = 1; d <= total; d++) {
      var iso = mesIso + '-' + pad2(d);
      if (serie.inicio && iso < serie.inicio) continue;
      if (serie.fim && iso > serie.fim) continue;
      if (serie.dias.indexOf(diaSemana(iso)) >= 0) out.push(iso);
    }
    return out;
  }

  function achaAula(db, alunoId, dataIso) {
    return (db.aulas || []).filter(function (a) {
      return a.alunoId === alunoId && a.data === dataIso;
    })[0] || null;
  }

  /* Cria as ocorrências que faltam da série no mês.
   * Nunca duplica, e nunca ressuscita uma aula que a Nathália apagou:
   * as datas apagadas ficam registradas em serie.exclusoes. */
  function materializarSerieNoMes(db, serie, mesIso) {
    var criadas = 0;
    var apagadas = serie.exclusoes || [];
    datasDaSerieNoMes(serie, mesIso).forEach(function (iso) {
      if (apagadas.indexOf(iso) >= 0) return;
      if (achaAula(db, serie.alunoId, iso)) return;
      db.aulas.push({
        id: uid(),
        alunoId: serie.alunoId,
        serieId: serie.id,
        destacada: false,
        data: iso,
        hora: serie.hora || '',
        duracaoMin: serie.duracaoMin || 60,
        status: 'realizada',
        cobravel: true,
        notaTexto: '',
        nota: null,
        anexos: []
      });
      criadas++;
    });
    return criadas;
  }

  /* Garante que todas as séries ativas estejam materializadas até o mês pedido.
   * Chamado sempre que ela navega no calendário, para a agenda nunca aparecer vazia. */
  function garantirSeriesAte(db, mesIso) {
    var criadas = 0;
    (db.series || []).forEach(function (s) {
      // vai até o mês pedido, mas nunca além do fim da própria série
      var limite = mesIso;
      if (s.fim && mesDe(s.fim) < limite) limite = mesDe(s.fim);
      var m = mesDe(s.inicio || mesIso);
      if (s.materializadoAte && s.materializadoAte >= m) m = s.materializadoAte;
      var guarda = 0;
      while (m <= limite && guarda++ < 240) {
        criadas += materializarSerieNoMes(db, s, m);
        m = mesAdjacente(m, 1);
      }
      if (!s.materializadoAte || s.materializadoAte < limite) s.materializadoAte = limite;
    });
    return criadas;
  }

  function criarSerie(db, dados) {
    var serie = {
      id: uid(),
      alunoId: dados.alunoId,
      dias: (dados.dias || []).slice().sort(),
      hora: dados.hora || '',
      duracaoMin: dados.duracaoMin || 60,
      inicio: dados.inicio,
      fim: dados.fim || null,
      exclusoes: [],
      materializadoAte: null
    };
    db.series = db.series || [];
    db.series.push(serie);
    var ate = serie.fim ? mesDe(serie.fim) : mesAdjacente(mesDe(serie.inicio), HORIZONTE_MESES);
    var m = mesDe(serie.inicio), guarda = 0;
    while (m <= ate && guarda++ < 240) {
      materializarSerieNoMes(db, serie, m);
      m = mesAdjacente(m, 1);
    }
    serie.materializadoAte = ate;
    return serie;
  }

  function aulasDaSerie(db, serieId) {
    return (db.aulas || []).filter(function (a) { return a.serieId === serieId; });
  }

  /* Alvos de uma edição em massa, respeitando o escopo escolhido.
   * escopo: 'esta' | 'seguintes' | 'todas' */
  function alvosDoEscopo(db, aula, escopo) {
    if (escopo === 'esta' || !aula.serieId) return [aula];
    var irmas = aulasDaSerie(db, aula.serieId).filter(function (a) {
      return a.id === aula.id || !a.destacada;
    });
    if (escopo === 'seguintes') {
      return irmas.filter(function (a) { return a.data >= aula.data; });
    }
    return irmas;
  }

  /* Aplica mudanças de horário, duração, situação ou cobrança.
   * Devolve quantas aulas foram alteradas. */
  function aplicarEdicaoAula(db, aulaId, mudancas, escopo) {
    var aula = (db.aulas || []).filter(function (a) { return a.id === aulaId; })[0];
    if (!aula) return 0;
    var alvos = alvosDoEscopo(db, aula, escopo);
    var campos = ['hora', 'duracaoMin', 'status', 'cobravel'];
    alvos.forEach(function (a) {
      campos.forEach(function (c) {
        if (mudancas[c] !== undefined) a[c] = mudancas[c];
      });
      if (escopo === 'esta' && a.serieId) a.destacada = true;
    });
    // Notas e anexos são sempre individuais: nunca se propagam pela série.
    if (mudancas.notaTexto !== undefined) aula.notaTexto = mudancas.notaTexto;
    if (mudancas.nota !== undefined) aula.nota = mudancas.nota;
    if (mudancas.anexos !== undefined) aula.anexos = mudancas.anexos;
    if (mudancas.data !== undefined && mudancas.data !== aula.data) {
      var dataAntiga = aula.data;
      aula.data = mudancas.data;
      if (aula.serieId) {
        aula.destacada = true;
        // A data de onde ela saiu fica registrada como apagada. Sem isso a
        // série recriaria uma aula ali na próxima vez que o mês fosse aberto,
        // e a aula pareceria ter se duplicado.
        var s2 = (db.series || []).filter(function (x) { return x.id === aula.serieId; })[0];
        if (s2) {
          s2.exclusoes = s2.exclusoes || [];
          if (s2.exclusoes.indexOf(dataAntiga) < 0) s2.exclusoes.push(dataAntiga);
        }
      }
    }
    return alvos.length;
  }

  function excluirAulas(db, aulaId, escopo) {
    var aula = (db.aulas || []).filter(function (a) { return a.id === aulaId; })[0];
    if (!aula) return 0;
    var alvos = alvosDoEscopo(db, aula, escopo);
    var ids = {};
    alvos.forEach(function (a) { ids[a.id] = true; });

    // Registra as datas apagadas na série, para elas não voltarem sozinhas
    // quando o calendário for aberto de novo.
    if (aula.serieId) {
      var s0 = (db.series || []).filter(function (x) { return x.id === aula.serieId; })[0];
      if (s0) {
        s0.exclusoes = s0.exclusoes || [];
        alvos.forEach(function (a) {
          if (a.serieId === s0.id && s0.exclusoes.indexOf(a.data) < 0) s0.exclusoes.push(a.data);
        });
      }
    }

    db.aulas = (db.aulas || []).filter(function (a) { return !ids[a.id]; });
    if (escopo === 'todas' && aula.serieId) {
      db.series = (db.series || []).filter(function (s) { return s.id !== aula.serieId; });
    } else if (escopo === 'seguintes' && aula.serieId) {
      var s = (db.series || []).filter(function (x) { return x.id === aula.serieId; })[0];
      if (s) {
        var dt = dataLocal(aula.data); dt.setDate(dt.getDate() - 1);
        s.fim = isoDe(dt);
        if (s.fim < s.inicio) db.series = db.series.filter(function (x) { return x.id !== s.id; });
      }
    }
    return alvos.length;
  }

  /* Muda o padrão da recorrência (dias da semana, horário, duração, fim).
   * Recria as ocorrências futuras não destacadas a partir de aPartirDe. */
  /* Uma aula com folha escrita, anotação ou anexo carrega trabalho que não pode
   * ser jogado fora por causa de uma mudança de padrão. */
  function temConteudo(aula) {
    return !!(aula && ((aula.notaTexto && aula.notaTexto.trim()) || aula.temNota ||
      (aula.anexos && aula.anexos.length)));
  }

  function editarSerie(db, serieId, novoPadrao, aPartirDe) {
    var s = (db.series || []).filter(function (x) { return x.id === serieId; })[0];
    if (!s) return 0;
    var corte = aPartirDe || s.inicio;
    if (novoPadrao.inicio && novoPadrao.inicio < corte) corte = novoPadrao.inicio;

    // Descobre quais datas o padrão novo produz, para poder aproveitar as aulas
    // que continuam valendo em vez de apagar e recriar. Manter o mesmo registro
    // é o que preserva a folha de aula, que fica ligada ao identificador dele.
    var padraoNovo = {
      dias: novoPadrao.dias !== undefined ? novoPadrao.dias.slice().sort() : s.dias,
      inicio: novoPadrao.inicio || (corte > s.inicio ? corte : s.inicio),
      fim: novoPadrao.fim !== undefined ? novoPadrao.fim : s.fim
    };
    var limite = padraoNovo.fim ? mesDe(padraoNovo.fim) : mesAdjacente(mesDe(corte), HORIZONTE_MESES);
    var datasNovas = {};
    var m0 = mesDe(padraoNovo.inicio), guarda0 = 0;
    while (m0 <= limite && guarda0++ < 240) {
      datasDaSerieNoMes(padraoNovo, m0).forEach(function (d) { if (d >= corte) datasNovas[d] = true; });
      m0 = mesAdjacente(m0, 1);
    }

    var preservadas = 0;
    db.aulas = (db.aulas || []).filter(function (a) {
      if (a.serieId !== serieId || a.data < corte || a.destacada) return true;
      if (datasNovas[a.data]) return true;          // a data continua no padrão
      if (temConteudo(a)) { a.destacada = true; preservadas++; return true; }
      return false;                                  // vazia e fora do padrão: sai
    });
    db._preservadasNaEdicao = preservadas;

    s.exclusoes = (s.exclusoes || []).filter(function (d) { return d < corte; });

    // Antecipar o início faz a recorrência passar a valer para trás, criando
    // as datas que ainda não existiam naquele intervalo.
    if (novoPadrao.inicio !== undefined && novoPadrao.inicio) {
      s.inicio = novoPadrao.inicio;
      if (s.inicio < corte) corte = s.inicio;
    }
    if (novoPadrao.dias !== undefined) s.dias = novoPadrao.dias.slice().sort();
    if (novoPadrao.hora !== undefined) s.hora = novoPadrao.hora;
    if (novoPadrao.duracaoMin !== undefined) s.duracaoMin = novoPadrao.duracaoMin;
    if (novoPadrao.fim !== undefined) s.fim = novoPadrao.fim;

    var serieCorte = {
      id: s.id, alunoId: s.alunoId, dias: s.dias, hora: s.hora,
      duracaoMin: s.duracaoMin, inicio: corte > s.inicio ? corte : s.inicio, fim: s.fim,
      exclusoes: s.exclusoes
    };
    // As aulas que sobreviveram ao corte passam a seguir o horário e a duração
    // novos, sem trocar de registro: assim a folha de aula continua com a aula.
    (db.aulas || []).forEach(function (a) {
      if (a.serieId !== serieId || a.data < corte || a.destacada) return;
      if (novoPadrao.hora !== undefined) a.hora = s.hora;
      if (novoPadrao.duracaoMin !== undefined) a.duracaoMin = s.duracaoMin;
    });

    s.materializadoAte = null;
    var ate = s.fim ? mesDe(s.fim) : mesAdjacente(mesDe(corte), HORIZONTE_MESES);
    var m = mesDe(serieCorte.inicio), guarda = 0, criadas = 0;
    while (m <= ate && guarda++ < 240) {
      criadas += materializarSerieNoMes(db, serieCorte, m);
      m = mesAdjacente(m, 1);
    }
    s.materializadoAte = ate;
    return criadas;
  }

  /* Repete uma aula para trás, recuperando o que já aconteceu antes de o aluno
   * ser cadastrado. Cria as datas dos dias da semana escolhidos, do dia anterior
   * ao da aula até a data limite, com o mesmo horário e a mesma duração.
   *
   * Nunca mexe em aula que já existe: se o dia já tem aula, aquele dia é pulado.
   * Se a aula faz parte de uma recorrência, o início dela é puxado para trás,
   * para o padrão continuar coerente. */
  function repetirParaTras(db, aulaId, dias, ateData, opcoes) {
    opcoes = opcoes || {};
    var aula = (db.aulas || []).filter(function (a) { return a.id === aulaId; })[0];
    if (!aula || !ateData || ateData >= aula.data) return { criadas: 0, datas: [] };
    var listaDias = (dias && dias.length) ? dias.slice().sort() : [diaSemana(aula.data)];

    var datas = [];
    var dt = dataLocal(aula.data);
    dt.setDate(dt.getDate() - 1);
    var limite = dataLocal(ateData);
    var guarda = 0;
    while (dt >= limite && guarda++ < 4000) {
      var iso = isoDe(dt);
      if (listaDias.indexOf(dt.getDay()) >= 0 && !achaAula(db, aula.alunoId, iso)) datas.push(iso);
      dt.setDate(dt.getDate() - 1);
    }
    datas.sort();

    var serie = serieDe(db, aula);
    datas.forEach(function (iso) {
      db.aulas.push({
        id: uid(),
        alunoId: aula.alunoId,
        serieId: serie ? serie.id : null,
        destacada: serie ? (listaDias.indexOf(diaSemana(iso)) < 0) : false,
        data: iso,
        hora: aula.hora || '',
        duracaoMin: aula.duracaoMin || 60,
        status: opcoes.status || 'realizada',
        cobravel: opcoes.cobravel !== undefined ? opcoes.cobravel : true,
        notaTexto: '',
        temNota: false,
        anexos: []
      });
    });

    if (serie) {
      // a recorrência passa a valer desde a data mais antiga recuperada
      if (datas.length && datas[0] < serie.inicio) serie.inicio = datas[0];
      serie.exclusoes = (serie.exclusoes || []).filter(function (d) { return datas.indexOf(d) < 0; });
      listaDias.forEach(function (d) { if (serie.dias.indexOf(d) < 0) serie.dias.push(d); });
      serie.dias.sort();
    }
    return { criadas: datas.length, datas: datas };
  }

  /* Quantas aulas seriam criadas, para mostrar antes de confirmar. */
  function preverRetroativo(db, aulaId, dias, ateData) {
    var aula = (db.aulas || []).filter(function (a) { return a.id === aulaId; })[0];
    if (!aula || !ateData || ateData >= aula.data) return [];
    var listaDias = (dias && dias.length) ? dias.slice() : [diaSemana(aula.data)];
    var datas = [];
    var dt = dataLocal(aula.data);
    dt.setDate(dt.getDate() - 1);
    var limite = dataLocal(ateData);
    var guarda = 0;
    while (dt >= limite && guarda++ < 4000) {
      var iso = isoDe(dt);
      if (listaDias.indexOf(dt.getDay()) >= 0 && !achaAula(db, aula.alunoId, iso)) datas.push(iso);
      dt.setDate(dt.getDate() - 1);
    }
    return datas.sort();
  }

  function serieDe(db, aula) {
    if (!aula || !aula.serieId) return null;
    return (db.series || []).filter(function (s) { return s.id === aula.serieId; })[0] || null;
  }

  function descreveSerie(serie) {
    if (!serie) return '';
    var nomes = (serie.dias || []).slice().sort().map(function (d) { return DIAS_LONGO[d]; });
    var lista = nomes.length <= 1 ? (nomes[0] || '') :
      nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1];
    var txt = 'Toda ' + lista + (serie.hora ? ', às ' + serie.hora : '');
    if (serie.fim) txt += ', até ' + ddmmaaaa(serie.fim);
    return txt;
  }

  // ---------- fechamento ----------

  function ordenarAulas(a, b) {
    if (a.data !== b.data) return a.data < b.data ? -1 : 1;
    return String(a.hora || '').localeCompare(String(b.hora || ''));
  }

  /* Retorna o fechamento de um aluno num mes.
   * db = { alunos: [], aulas: [], resumos: [] } */
  /* Áreas trabalhadas na aula.
   *
   * O trabalho dela não é só conteúdo: boa parte do valor está em ensinar a
   * criança a estudar, a se organizar e a lidar com prova. Isso costuma ficar
   * invisível no fechamento, que só mostra hora e valor. Aqui a lista é de
   * clicar, para o registro sair completo sem virar trabalho de digitação.
   *
   * A ordem dentro de cada grupo é a de uso provável, não alfabética.
   */
  var AREAS = [
    {
      grupo: 'Método e organização',
      itens: [
        { id: 'autonomia', rotulo: 'Autonomia nos estudos' },
        { id: 'horarios', rotulo: 'Organização dos horários' },
        { id: 'cronograma', rotulo: 'Montagem do cronograma' },
        { id: 'priorizacao', rotulo: 'Priorização do que estudar' },
        { id: 'disciplina', rotulo: 'Disciplina e constância' },
        { id: 'metodo', rotulo: 'Método de estudo (resumo, mapa, ficha)' },
        { id: 'material', rotulo: 'Organização do material e do caderno' },
        { id: 'tempo', rotulo: 'Uso do tempo e foco' }
      ]
    },
    {
      grupo: 'Preparação para avaliações',
      itens: [
        { id: 'revisao', rotulo: 'Revisão para prova' },
        { id: 'estrategia-prova', rotulo: 'Estratégia de prova' },
        { id: 'analise-erros', rotulo: 'Correção de prova e análise de erros' },
        { id: 'enunciado', rotulo: 'Leitura e interpretação de enunciado' },
        { id: 'lista-tarefa', rotulo: 'Lista de exercícios e dever de casa' }
      ]
    },
    {
      grupo: 'Postura e emocional',
      itens: [
        { id: 'frustracao', rotulo: 'Lidar com frustrações' },
        { id: 'ansiedade', rotulo: 'Ansiedade ou medo de prova' },
        { id: 'confianca', rotulo: 'Confiança e autoestima' },
        { id: 'persistencia', rotulo: 'Persistir na questão difícil' },
        { id: 'pedir-ajuda', rotulo: 'Pedir ajuda e tirar dúvida' },
        { id: 'concentracao', rotulo: 'Concentração' }
      ]
    },
    {
      grupo: 'Conteúdo e raciocínio',
      itens: [
        { id: 'base', rotulo: 'Retomada de base de anos anteriores' },
        { id: 'raciocinio', rotulo: 'Raciocínio lógico' },
        { id: 'argumentacao', rotulo: 'Argumentação e justificativa escrita' },
        { id: 'calculo-mental', rotulo: 'Cálculo mental' },
        { id: 'linguagem', rotulo: 'Linguagem matemática e notação' }
      ]
    }
  ];

  var ROTULO_AREA = {};
  AREAS.forEach(function (g) {
    g.itens.forEach(function (i) { ROTULO_AREA[i.id] = i.rotulo; });
  });

  function rotuloArea(id) { return ROTULO_AREA[id] || ''; }

  /* Uma aula pode ter mais de um tema: hora e meia dá tempo de fechar um assunto
   * e começar outro. O campo antigo, de um tema só, continua sendo lido para não
   * perder registro de quem já usou. */
  function temasDaAula(au) {
    if (au.temas && au.temas.length) return au.temas.slice();
    if (au.tema) return [au.tema];
    return [];
  }

  /* Mapeamento do aluno.
   *
   * O primeiro encontro com um aluno novo raramente é aula: é sondagem. E o
   * que se descobre ali costuma ficar só na cabeça dela. Aqui vira registro,
   * de clicar, com espaço para o que só se escreve.
   *
   * Nunca é tarde: aluno de dois anos de casa pode ser mapeado hoje, e o
   * mapeamento pode ser refeito quantas vezes ela quiser. Cada revisão fica
   * guardada com a data, então dá para ver o que mudou de um semestre ao outro.
   *
   * Nas lacunas, cada item carrega um termo de busca do banco de temas: marcar
   * "Frações" e cair na lista de temas de fração é o caminho curto entre
   * descobrir o buraco e ter material para tapá-lo.
   */
  var MAPA = [
    {
      chave: 'fortes',
      titulo: 'Pontos fortes',
      ajuda: 'O que já funciona e serve de apoio para o resto.',
      itens: [
        { id: 'calculo-mental', rotulo: 'Cálculo mental' },
        { id: 'tabuada-ok', rotulo: 'Tabuada automatizada' },
        { id: 'enunciado-ok', rotulo: 'Entende bem o enunciado' },
        { id: 'raciocinio-ok', rotulo: 'Raciocínio lógico' },
        { id: 'caderno-ok', rotulo: 'Caderno organizado' },
        { id: 'tarefa-ok', rotulo: 'Faz as tarefas em dia' },
        { id: 'pergunta', rotulo: 'Pergunta quando não entende' },
        { id: 'persiste', rotulo: 'Persiste na questão difícil' },
        { id: 'sozinho', rotulo: 'Trabalha bem sozinho' },
        { id: 'autocorrige', rotulo: 'Percebe e corrige o próprio erro' },
        { id: 'gosta', rotulo: 'Gosta de matemática' },
        { id: 'pega-rapido', rotulo: 'Pega conceito novo com rapidez' }
      ]
    },
    {
      chave: 'atencao',
      titulo: 'Pontos de atenção',
      ajuda: 'Onde ele costuma perder ponto. É o que vira plano de trabalho.',
      itens: [
        { id: 'sinal', rotulo: 'Erros de sinal' },
        { id: 'tabuada-fraca', rotulo: 'Tabuada insegura' },
        { id: 'fracao-fraca', rotulo: 'Se perde nas operações com frações' },
        { id: 'decimal-fraca', rotulo: 'Erra na passagem entre decimal, fração e porcentagem' },
        { id: 'enunciado-fraco', rotulo: 'Lê o enunciado sem entender o que se pede' },
        { id: 'nao-comeca', rotulo: 'Não sabe por onde começar' },
        { id: 'branco', rotulo: 'Deixa questão em branco' },
        { id: 'chuta', rotulo: 'Chuta sem tentar' },
        { id: 'nao-confere', rotulo: 'Não confere o resultado' },
        { id: 'nao-revisa', rotulo: 'Não revisa a prova depois de corrigida' },
        { id: 'vespera', rotulo: 'Estuda só na véspera' },
        { id: 'caderno-fraco', rotulo: 'Caderno incompleto' },
        { id: 'dispersa', rotulo: 'Dispersa com facilidade' },
        { id: 'depende', rotulo: 'Depende de ajuda para começar' },
        { id: 'fora-do-modelo', rotulo: 'Trava quando a questão foge do modelo' },
        { id: 'ansiedade-prova', rotulo: 'Fica ansioso perto da prova' }
      ]
    },
    {
      chave: 'lacunas',
      titulo: 'Lacunas de anos anteriores',
      ajuda: 'O que ficou para trás e atrapalha o conteúdo de agora. ' +
        'Cada lacuna marcada abre os temas correspondentes no banco.',
      itens: [
        { id: 'naturais', rotulo: 'Operações com números naturais', busca: 'operações' },
        { id: 'tabuada', rotulo: 'Tabuada e multiplicação', busca: 'multiplicação' },
        { id: 'divisao', rotulo: 'Divisão', busca: 'divisão' },
        { id: 'fracoes', rotulo: 'Frações', busca: 'fração' },
        { id: 'decimais', rotulo: 'Números decimais', busca: 'decimais' },
        { id: 'porcentagem', rotulo: 'Porcentagem', busca: 'porcentagem' },
        { id: 'inteiros', rotulo: 'Números negativos', busca: 'inteiros' },
        { id: 'potencias', rotulo: 'Potenciação e raiz', busca: 'potência' },
        { id: 'medidas', rotulo: 'Unidades de medida', busca: 'medida' },
        { id: 'algebrica', rotulo: 'Expressões algébricas', busca: 'algébric' },
        { id: 'eq1', rotulo: 'Equação do primeiro grau', busca: 'primeiro grau' },
        { id: 'sistemas', rotulo: 'Sistemas de equações', busca: 'sistema' },
        { id: 'fatoracao', rotulo: 'Produtos notáveis e fatoração', busca: 'fatoração' },
        { id: 'eq2', rotulo: 'Equação do segundo grau', busca: 'segundo grau' },
        { id: 'proporcao', rotulo: 'Razão, proporção e regra de três', busca: 'proporção' },
        { id: 'area', rotulo: 'Perímetro, área e volume', busca: 'área' },
        { id: 'pitagoras', rotulo: 'Teorema de Pitágoras', busca: 'Pitágoras' },
        { id: 'semelhanca', rotulo: 'Semelhança e escala', busca: 'semelhança' },
        { id: 'trigonometria', rotulo: 'Trigonometria no triângulo retângulo', busca: 'trigonometria' },
        { id: 'funcoes', rotulo: 'Funções', busca: 'função' },
        { id: 'graficos', rotulo: 'Leitura de gráficos e estatística', busca: 'gráfico' },
        { id: 'probabilidade', rotulo: 'Probabilidade', busca: 'probabilidade' }
      ]
    },
    {
      chave: 'rotina',
      titulo: 'Rotina de estudo',
      ajuda: 'Como o estudo acontece fora da aula. Marque o que for verdade hoje.',
      itens: [
        { id: 'horario-fixo', rotulo: 'Tem horário fixo de estudo' },
        { id: 'lugar-calmo', rotulo: 'Estuda em lugar sem distração' },
        { id: 'usa-agenda', rotulo: 'Usa agenda ou cronograma' },
        { id: 'celular-longe', rotulo: 'Deixa o celular longe na hora de estudar' },
        { id: 'dever-sozinho', rotulo: 'Faz o dever sem precisar ser lembrado' },
        { id: 'revisa-antes', rotulo: 'Revisa a matéria antes da véspera' },
        { id: 'anota-duvida', rotulo: 'Anota as dúvidas para perguntar' },
        { id: 'material-completo', rotulo: 'Tem o material completo' },
        { id: 'agenda-cheia', rotulo: 'Agenda muito cheia de outras atividades' },
        { id: 'cansado', rotulo: 'Costuma chegar cansado na aula' }
      ]
    },
    {
      chave: 'aprende',
      titulo: 'Como aprende melhor',
      ajuda: 'O caminho que costuma funcionar com este aluno.',
      itens: [
        { id: 'visual', rotulo: 'Vendo o desenho ou o gráfico' },
        { id: 'fazendo', rotulo: 'Fazendo muitos exercícios' },
        { id: 'ouvindo', rotulo: 'Ouvindo a explicação passo a passo' },
        { id: 'explicando', rotulo: 'Explicando para outra pessoa' },
        { id: 'exemplo-regra', rotulo: 'Do exemplo para a regra' },
        { id: 'regra-exemplo', rotulo: 'Da regra para o exemplo' },
        { id: 'aplicado', rotulo: 'Com aplicação prática do dia a dia' },
        { id: 'devagar', rotulo: 'Com ritmo mais devagar e mais repetição' }
      ]
    }
  ];

  var NIVEIS = [
    { id: '1', rotulo: 'Precisa retomar a base de anos anteriores' },
    { id: '2', rotulo: 'Abaixo do que o ano pede' },
    { id: '3', rotulo: 'Acompanha o ano com apoio' },
    { id: '4', rotulo: 'Seguro no conteúdo do ano' },
    { id: '5', rotulo: 'Pronto para aprofundar' }
  ];

  var ITEM_MAPA = {};
  MAPA.forEach(function (g) {
    g.itens.forEach(function (i) { ITEM_MAPA[g.chave + ':' + i.id] = i; });
  });

  function itemDoMapa(chave, id) { return ITEM_MAPA[chave + ':' + id] || null; }

  function rotulosDoMapa(chave, ids) {
    return (ids || []).map(function (id) {
      var it = itemDoMapa(chave, id);
      return it ? it.rotulo : '';
    }).filter(Boolean);
  }

  function rotuloNivel(id) {
    var n = NIVEIS.filter(function (x) { return x.id === String(id); })[0];
    return n ? n.rotulo : '';
  }

  function mapeamentoNovo() {
    return {
      id: uid(), data: hojeIso(), aulaId: null,
      escola: '', anoEscolar: '', professor: '', calendarioProvas: '',
      indicacao: '', motivo: '', expectativa: '',
      nivel: '', prioridades: '', plano: '',
      marcados: { fortes: [], atencao: [], lacunas: [], rotina: [], aprende: [] }
    };
  }

  function mapeamentosDe(aluno) {
    return ((aluno && aluno.mapeamentos) || []).slice()
      .sort(function (a, b) { return String(a.data).localeCompare(String(b.data)); });
  }

  /* O mapeamento que vale hoje é o mais recente. */
  function mapeamentoAtual(aluno) {
    var lista = mapeamentosDe(aluno);
    return lista.length ? lista[lista.length - 1] : null;
  }

  function mapeado(aluno) { return !!mapeamentoAtual(aluno); }

  var ANOS_ESCOLARES = {
    '02': '2º ano', '03': '3º ano', '04': '4º ano', '05': '5º ano', '06': '6º ano',
    '07': '7º ano', '08': '8º ano', '09': '9º ano',
    em1: '1º ano do médio', em2: '2º ano do médio', em3: '3º ano do médio'
  };

  /* Ano escolar e colégio, para o fechamento situar quem lê. Só aparece quando
   * a informação existe: nada de linha em branco no documento da família. */
  function contextoEscolarDe(aluno) {
    var m = mapeamentoAtual(aluno);
    var ano = (m && m.anoEscolar) || (aluno && aluno.anoEscolar) || '';
    var partes = [];
    if (ANOS_ESCOLARES[ano]) partes.push(ANOS_ESCOLARES[ano]);
    if (m && m.escola) partes.push(m.escola);
    return partes.join(', ');
  }

  /* O lembrete que aparece ao abrir uma aula: curto de propósito, porque ela
   * está com o aluno na frente e não vai ler meia página. */
  function lembreteDoMapeamento(aluno, limite) {
    var m = mapeamentoAtual(aluno);
    if (!m) return null;
    var max = limite || 4;
    return {
      data: m.data,
      nivel: rotuloNivel(m.nivel),
      atencao: rotulosDoMapa('atencao', m.marcados && m.marcados.atencao).slice(0, max),
      lacunas: rotulosDoMapa('lacunas', m.marcados && m.marcados.lacunas).slice(0, max),
      aprende: rotulosDoMapa('aprende', m.marcados && m.marcados.aprende).slice(0, 2),
      prioridades: (m.prioridades || '').trim(),
      totalAtencao: ((m.marcados && m.marcados.atencao) || []).length,
      totalLacunas: ((m.marcados && m.marcados.lacunas) || []).length
    };
  }

  /* O mesmo lembrete em texto, para ela colar na anotação da aula se quiser. */
  function textoDoLembrete(aluno) {
    var l = lembreteDoMapeamento(aluno, 6);
    if (!l) return '';
    var L = [];
    if (l.prioridades) L.push('Prioridades: ' + l.prioridades.replace(/\s*\n\s*/g, '; '));
    if (l.lacunas.length) L.push('Lacunas: ' + l.lacunas.join(', ') + '.');
    if (l.atencao.length) L.push('Atenção: ' + l.atencao.join(', ') + '.');
    if (l.aprende.length) L.push('Aprende melhor: ' + l.aprende.join(' e ') + '.');
    return L.join(' ');
  }

  /* Choque de horário.
   *
   * Duas aulas no mesmo dia e no mesmo horário quase sempre são engano: ou a
   * aula foi lançada duas vezes, ou a que foi cancelada não foi apagada. O
   * aplicativo avisa, mas não impede: dois alunos irmãos na mesma sala existe,
   * e quem sabe se é engano é ela.
   *
   * A aula cancelada não entra: ela não ocupa horário nenhum.
   */
  function minutosDaHora(hora) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(hora || ''));
    return m ? (+m[1]) * 60 + (+m[2]) : null;
  }

  function conflitosDe(db, aula) {
    if (!aula || !aula.data) return [];
    var inicio = minutosDaHora(aula.hora);
    if (inicio === null) return [];
    var fim = inicio + (aula.duracaoMin || 60);
    if ((aula.status || 'realizada') === 'cancelada') return [];

    return (db.aulas || []).filter(function (o) {
      if (o.id === aula.id || o.data !== aula.data) return false;
      if ((o.status || 'realizada') === 'cancelada') return false;
      var oi = minutosDaHora(o.hora);
      if (oi === null) return false;
      return oi < fim && (oi + (o.duracaoMin || 60)) > inicio;
    });
  }

  /* Divide uma aula em duas metades no mesmo dia.
   *
   * Serve para quando o encontro tratou de dois assuntos diferentes e ela quer
   * registrar cada um no seu lugar. A soma das duas é sempre igual à duração
   * original, para o valor cobrado no mês não mudar por causa da divisão.
   *
   * O que já estava escrito fica na primeira metade. A segunda nasce vazia:
   * mover nota e anexo por conta própria seria adivinhar a qual assunto cada
   * coisa pertence.
   */
  function somarMinutosNaHora(hora, minutos) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(hora || ''));
    if (!m) return '';
    var total = (+m[1]) * 60 + (+m[2]) + minutos;
    if (total >= 24 * 60) total = 24 * 60 - 1;
    return pad2(Math.floor(total / 60)) + ':' + pad2(total % 60);
  }

  function metadesDe(duracaoMin) {
    var total = duracaoMin || 60;
    var primeira = Math.round(total / 2);
    return [primeira, total - primeira];
  }

  function podeDividir(aula) {
    return !!aula && (aula.duracaoMin || 60) >= 20;
  }

  function dividirAula(db, aulaId) {
    var aula = (db.aulas || []).filter(function (a) { return a.id === aulaId; })[0];
    if (!podeDividir(aula)) return null;
    var partes = metadesDe(aula.duracaoMin || 60);
    var anterior = { duracaoMin: aula.duracaoMin, destacada: !!aula.destacada };

    aula.duracaoMin = partes[0];
    // A divisão vale só para este encontro, nunca para a repetição inteira.
    if (aula.serieId) aula.destacada = true;

    var nova = {
      id: uid(),
      alunoId: aula.alunoId,
      serieId: null,
      destacada: false,
      data: aula.data,
      hora: somarMinutosNaHora(aula.hora, partes[0]),
      duracaoMin: partes[1],
      status: aula.status || 'realizada',
      cobravel: aula.cobravel !== undefined ? aula.cobravel : true,
      notaTexto: '',
      temNota: false,
      anexos: [],
      areas: [],
      temas: []
    };
    db.aulas.push(nova);
    return { aulaId: aula.id, novaId: nova.id, anterior: anterior, partes: partes };
  }

  function desfazerDivisao(db, marca) {
    if (!marca) return false;
    var aula = (db.aulas || []).filter(function (a) { return a.id === marca.aulaId; })[0];
    var nova = (db.aulas || []).filter(function (a) { return a.id === marca.novaId; })[0];
    // Se ela já escreveu algo na segunda metade, desfazer apagaria trabalho.
    if (nova && temConteudo(nova)) return false;
    if (aula) {
      aula.duracaoMin = marca.anterior.duracaoMin;
      aula.destacada = marca.anterior.destacada;
    }
    db.aulas = (db.aulas || []).filter(function (a) { return a.id !== marca.novaId; });
    return true;
  }

  function calcularFechamento(db, alunoId, mesIso) {
    var aluno = (db.alunos || []).filter(function (a) { return a.id === alunoId; })[0];
    if (!aluno) return null;

    var aulas = (db.aulas || []).filter(function (x) {
      return x.alunoId === alunoId && mesDe(x.data) === mesIso;
    }).sort(ordenarAulas);

    var linhas = [];
    var totalMin = 0, totalValor = 0, minNaoCobrados = 0;
    var faixas = {};
    var semPreco = [];

    for (var i = 0; i < aulas.length; i++) {
      var au = aulas[i];
      var st = STATUS[au.status] || STATUS.realizada;
      var cobravel = (typeof au.cobravel === 'boolean') ? au.cobravel : st.cobravelPadrao;
      var pv = precoVigente(aluno, au.data);
      var vh = pv ? pv.valorHora : null;
      var dur = au.duracaoMin || 0;
      var valor = (cobravel && vh !== null) ? (dur / 60) * vh : 0;

      if (cobravel && vh === null && dur > 0) semPreco.push(au.data);

      if (cobravel) {
        totalMin += dur;
        totalValor += valor;
        if (vh !== null) {
          var k = String(vh);
          if (!faixas[k]) faixas[k] = { valorHora: vh, minutos: 0, valor: 0 };
          faixas[k].minutos += dur;
          faixas[k].valor += valor;
        }
      } else {
        minNaoCobrados += dur;
      }

      linhas.push({
        id: au.id,
        data: au.data,
        dia: diaSemanaCurto(au.data),
        hora: au.hora || '',
        duracaoMin: dur,
        status: au.status || 'realizada',
        statusRotulo: st.rotulo,
        cobravel: cobravel,
        valorHora: vh,
        valor: valor,
        temNota: !!(au.notaTexto || (au.nota && au.nota.paginas && au.nota.paginas.length) || (au.anexos && au.anexos.length)),
        notaTexto: au.notaTexto || '',
        temas: temasDaAula(au),
        areas: (au.areas || []).slice()
      });
    }

    var resumo = (db.resumos || []).filter(function (r) {
      return r.alunoId === alunoId && r.mes === mesIso;
    })[0] || null;

    /* O que ela trabalhou no mês, além das horas. É isto que transforma o
     * fechamento em algo que a família lê com atenção, e não só uma conta. */
    var temasDoMes = [];
    var vistos = {};
    var contagemAreas = {};
    linhas.forEach(function (l) {
      l.temas.forEach(function (t) {
        if (vistos[t.titulo]) {
          if (vistos[t.titulo].datas.indexOf(l.data) < 0) vistos[t.titulo].datas.push(l.data);
          return;
        }
        vistos[t.titulo] = { titulo: t.titulo, datas: [l.data] };
        temasDoMes.push(vistos[t.titulo]);
      });
      l.areas.forEach(function (id) {
        contagemAreas[id] = (contagemAreas[id] || 0) + 1;
      });
    });
    var areasDoMes = Object.keys(contagemAreas).map(function (id) {
      return { id: id, rotulo: rotuloArea(id), vezes: contagemAreas[id] };
    }).filter(function (a) { return a.rotulo; })
      .sort(function (a, b) { return b.vezes - a.vezes || a.rotulo.localeCompare(b.rotulo); });

    var listaFaixas = Object.keys(faixas).map(function (k) { return faixas[k]; })
      .sort(function (a, b) { return a.valorHora - b.valorHora; });

    return {
      aluno: aluno,
      alunoNome: aluno.nome,
      responsavel: aluno.responsavel || '',
      mes: mesIso,
      mesExtenso: mesExtenso(mesIso),
      grade: gradeTexto(aluno),
      linhas: linhas,
      totalMin: totalMin,
      totalHoras: fmtHoras(totalMin),
      totalValor: Math.round(totalValor * 100) / 100,
      minutosNaoCobrados: minNaoCobrados,
      faixas: listaFaixas,
      precoUnico: listaFaixas.length === 1 ? listaFaixas[0].valorHora : null,
      semPreco: semPreco,
      resumoTexto: resumo ? (resumo.texto || '') : '',
      contextoEscolar: contextoEscolarDe(aluno),
      temasDoMes: temasDoMes,
      areasDoMes: areasDoMes,
      qtdEncontros: linhas.filter(function (l) { return l.cobravel || l.status !== 'cancelada'; }).length
    };
  }

  function calcularMesInteiro(db, mesIso) {
    var out = [];
    (db.alunos || []).forEach(function (a) {
      var f = calcularFechamento(db, a.id, mesIso);
      if (f && f.linhas.length) out.push(f);
    });
    out.sort(function (x, y) { return y.totalValor - x.totalValor; });
    return out;
  }

  // ---------- Markdown ----------
  // Regra da casa: nunca usar travessao (em-dash ou en-dash) em entregavel.

  function markdownFechamento(f, opcoes) {
    opcoes = opcoes || {};
    var L = [];
    L.push('# Controle de aulas');
    L.push('');
    L.push('**Aluno:** ' + f.alunoNome);
    if (f.responsavel) L.push('**Responsável:** ' + f.responsavel);
    L.push('**Mês:** ' + f.mesExtenso);
    if (f.grade) L.push('**Dias e horário:** ' + f.grade);
    L.push('');
    L.push('## Datas trabalhadas');
    L.push('');
    L.push('| Data | Dia | Horário | Duração | Situação | Cobrada | R$/h | Valor |');
    L.push('|---|---|---|---|---|---|---:|---:|');
    f.linhas.forEach(function (l) {
      L.push('| ' + ddmm(l.data) +
        ' | ' + l.dia +
        ' | ' + (l.hora || '') +
        ' | ' + fmtDuracao(l.duracaoMin) +
        ' | ' + l.statusRotulo +
        ' | ' + (l.cobravel ? 'sim' : 'não') +
        ' | ' + (l.valorHora !== null ? fmtMoeda(l.valorHora) : 'sem preço') +
        ' | ' + fmtMoeda(l.cobravel ? l.valor : 0) + ' |');
    });
    L.push('');
    L.push('**Total de horas cobradas:** ' + f.totalHoras + ' h (' + fmtHorasDecimal(f.totalMin) + ' horas)');
    if (f.minutosNaoCobrados > 0) {
      L.push('**Horas não cobradas:** ' + fmtHoras(f.minutosNaoCobrados) + ' h');
    }
    if (f.faixas.length > 1) {
      L.push('');
      L.push('Composição por valor vigente:');
      f.faixas.forEach(function (fx) {
        L.push('- ' + fmtHoras(fx.minutos) + ' h a ' + fmtMoeda(fx.valorHora) + '/h: ' + fmtMoeda(fx.valor));
      });
    }
    L.push('');
    L.push('**Total a cobrar:** ' + fmtMoeda(f.totalValor));
    if (f.semPreco.length) {
      L.push('');
      L.push('> Atenção: não há valor por hora vigente para ' + f.semPreco.map(ddmm).join(', ') + '.');
    }
    if (f.temasDoMes && f.temasDoMes.length) {
      L.push('');
      L.push('## Temas trabalhados');
      L.push('');
      f.temasDoMes.forEach(function (t) {
        L.push('- ' + t.titulo + ' (' + t.datas.map(ddmm).join(', ') + ')');
      });
    }

    if (f.areasDoMes && f.areasDoMes.length) {
      L.push('');
      L.push('## Áreas trabalhadas');
      L.push('');
      f.areasDoMes.forEach(function (a) {
        L.push('- ' + a.rotulo + (a.vezes > 1 ? ' (' + a.vezes + ' aulas)' : ''));
      });
    }

    L.push('');
    L.push('## Feedback');
    L.push('');
    L.push(f.resumoTexto ? f.resumoTexto : '(a preencher)');

    if (opcoes.incluirNotas) {
      var comNota = f.linhas.filter(function (l) { return l.temNota; });
      if (comNota.length) {
        L.push('');
        L.push('## Notas das aulas');
        comNota.forEach(function (l) {
          L.push('');
          L.push('### ' + ddmm(l.data) + ' (' + l.dia + ')');
          if (l.notaTexto) L.push(l.notaTexto);
          else L.push('(folha manuscrita registrada no aplicativo)');
        });
      }
    }
    L.push('');
    return L.join('\n');
  }

  function markdownMesInteiro(fechs, mesIso) {
    var L = [];
    L.push('# Fechamento do mês: ' + mesExtenso(mesIso));
    L.push('');
    L.push('| Aluno | Encontros | Horas cobradas | Valor |');
    L.push('|---|---:|---:|---:|');
    var totMin = 0, totVal = 0, totEnc = 0;
    fechs.forEach(function (f) {
      totMin += f.totalMin; totVal += f.totalValor; totEnc += f.qtdEncontros;
      L.push('| ' + f.alunoNome + ' | ' + f.qtdEncontros + ' | ' + f.totalHoras + ' | ' + fmtMoeda(f.totalValor) + ' |');
    });
    L.push('| **Total** | **' + totEnc + '** | **' + fmtHoras(totMin) + '** | **' + fmtMoeda(totVal) + '** |');
    L.push('');
    L.push('Alunos ativos no mês: ' + fechs.length + '.');
    L.push('Média por hora no mês: ' + (totMin > 0 ? fmtMoeda(totVal / (totMin / 60)) : fmtMoeda(0)) + '.');
    L.push('');
    fechs.forEach(function (f) {
      L.push('');
      L.push('---');
      L.push('');
      L.push(markdownFechamento(f, { incluirNotas: true }));
    });
    return L.join('\n');
  }

  // ---------- utilidades ----------

  function uid() {
    return 'x' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  /* Chave de busca: sem acento e sem maiúscula.
   *
   * Ela digita num teclado de tablet, onde o acento custa toques a mais. Antes
   * disto, procurar "fracao" não achava nada e "equacao" não achava nada, e a
   * lista aparecia vazia como se o assunto não existisse no banco.
   *
   * Normalizar em NFD separa a letra do acento, e a faixa 0300 a 036F é a dos
   * acentos combinantes. O ç também vira c, que é o que ela espera. */
  function chaveDeBusca(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  /* Casa um termo digitado com um texto qualquer, ignorando acento e caixa. */
  function casaBusca(texto, termo) {
    var t = chaveDeBusca(termo).trim();
    if (!t) return true;
    return chaveDeBusca(texto).indexOf(t) >= 0;
  }

  function nomeArquivo(s) {
    return String(s)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  return {
    MESES: MESES, DIAS_CURTO: DIAS_CURTO, DIAS_LONGO: DIAS_LONGO, STATUS: STATUS,
    pad2: pad2, partesData: partesData, dataLocal: dataLocal, isoDe: isoDe, hojeIso: hojeIso,
    diaSemana: diaSemana, diaSemanaCurto: diaSemanaCurto, diaSemanaLongo: diaSemanaLongo,
    ddmm: ddmm, ddmmaaaa: ddmmaaaa, mesExtenso: mesExtenso, mesDe: mesDe,
    diasDoMes: diasDoMes, primeiroDiaSemanaDoMes: primeiroDiaSemanaDoMes, mesAdjacente: mesAdjacente,
    fmtMoeda: fmtMoeda, fmtHoras: fmtHoras, fmtHorasDecimal: fmtHorasDecimal, fmtDuracao: fmtDuracao,
    precoVigente: precoVigente, validarPrecos: validarPrecos,
    gradeTexto: gradeTexto, aulasDaGradeNoMes: aulasDaGradeNoMes,
    domingoDePascoa: domingoDePascoa, feriadosDoAno: feriadosDoAno,
    feriadoEm: feriadoEm, feriadosDoMes: feriadosDoMes, deBR: deBR,
    criarSerie: criarSerie, editarSerie: editarSerie, serieDe: serieDe, descreveSerie: descreveSerie,
    datasDaSerieNoMes: datasDaSerieNoMes, materializarSerieNoMes: materializarSerieNoMes,
    garantirSeriesAte: garantirSeriesAte, aulasDaSerie: aulasDaSerie, alvosDoEscopo: alvosDoEscopo,
    aplicarEdicaoAula: aplicarEdicaoAula, excluirAulas: excluirAulas, achaAula: achaAula,
    repetirParaTras: repetirParaTras, preverRetroativo: preverRetroativo, temConteudo: temConteudo,
    calcularFechamento: calcularFechamento, calcularMesInteiro: calcularMesInteiro,
    markdownFechamento: markdownFechamento, markdownMesInteiro: markdownMesInteiro,
    AREAS: AREAS, rotuloArea: rotuloArea, temasDaAula: temasDaAula,
    MAPA: MAPA, NIVEIS: NIVEIS, itemDoMapa: itemDoMapa, rotulosDoMapa: rotulosDoMapa,
    rotuloNivel: rotuloNivel, mapeamentoNovo: mapeamentoNovo, mapeamentosDe: mapeamentosDe,
    mapeamentoAtual: mapeamentoAtual, mapeado: mapeado,
    lembreteDoMapeamento: lembreteDoMapeamento, textoDoLembrete: textoDoLembrete,
    contextoEscolarDe: contextoEscolarDe, ANOS_ESCOLARES: ANOS_ESCOLARES,
    conflitosDe: conflitosDe, minutosDaHora: minutosDaHora,
    dividirAula: dividirAula, desfazerDivisao: desfazerDivisao,
    podeDividir: podeDividir, metadesDe: metadesDe, somarMinutosNaHora: somarMinutosNaHora,
    uid: uid, nomeArquivo: nomeArquivo,
    chaveDeBusca: chaveDeBusca, casaBusca: casaBusca
  };
});
