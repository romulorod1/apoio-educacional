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
        notaPrivada: '',
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
    /* A anotação só dela segue a mesma regra da outra: é daquele encontro, e
     * nunca escorre para as irmãs da repetição. */
    if (mudancas.notaPrivada !== undefined) aula.notaPrivada = mudancas.notaPrivada;
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
   * ser jogado fora por causa de uma mudança de padrão.
   *
   * O assunto e as áreas contam pelo mesmo motivo, e não contavam. Quem manda
   * aqui é o editarSerie logo abaixo: ao mudar o padrão de uma repetição, ele
   * recria as ocorrências futuras e descarta as que considera vazias. Uma aula
   * cujo único registro fosse o assunto seria apagada sem aviso, levando junto
   * o passo de trilha que ela fechou. Preservar demais é o lado seguro do
   * erro: no máximo sobra uma aula que ela apaga com um toque. */
  function temConteudo(aula) {
    return !!(aula && ((aula.notaTexto && aula.notaTexto.trim()) ||
      (aula.notaPrivada && aula.notaPrivada.trim()) || aula.temNota ||
      (aula.anexos && aula.anexos.length) ||
      temasDaAula(aula).length ||
      (aula.areas && aula.areas.length)));
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
        notaPrivada: '',
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

  /* O último encontro com aquele aluno.
   *
   * Para lembrar onde os dois pararam, ela precisava fechar a janela da aula,
   * procurar a aula anterior no calendário e abri-la. Isto aqui devolve o mesmo
   * conteúdo pronto para caber no alto da aula de hoje.
   *
   * Só entra encontro que ACONTECEU: aula cancelada e falta não são um lugar
   * onde alguém parou. E só o que já passou, nunca uma aula marcada à frente,
   * mesmo que ela tenha adiantado alguma anotação.
   *
   * Devolve null quando não há nada de útil para mostrar, e a janela da aula
   * simplesmente não desenha o bloco: primeira aula de um aluno novo não pode
   * abrir com uma caixa vazia dizendo que não há nada.
   */
  function ultimoEncontro(db, alunoId, aulaAtual) {
    /* "Antes" é por data E horário, e não só por data: quando ela divide um
     * encontro em dois, as duas metades ficam no mesmo dia, e a primeira é
     * mesmo o encontro anterior da segunda. */
    var referencia = aulaAtual && aulaAtual.data
      ? aulaAtual
      : { data: hojeIso(), hora: '23:59' };
    var idAtual = aulaAtual && aulaAtual.id;
    var candidatas = ((db && db.aulas) || []).filter(function (a) {
      if (a.alunoId !== alunoId) return false;
      if (idAtual && a.id === idAtual) return false;
      if (!a.data || ordenarAulas(a, referencia) >= 0) return false;
      if (a.status === 'cancelada' || a.status === 'falta') return false;
      return true;
    }).sort(ordenarAulas);

    for (var i = candidatas.length - 1; i >= 0; i--) {
      var au = candidatas[i];
      var assuntos = temasDaAula(au).map(function (t) {
        return t.titulo || t.id || '';
      }).filter(Boolean);
      var areas = (au.areas || []).map(rotuloArea).filter(Boolean);
      var rendeu = (au.notaTexto || '').trim();
      var soMinha = (au.notaPrivada || '').trim();
      var folha = !!au.temNota;
      var anexos = (au.anexos || []).length;
      if (!assuntos.length && !areas.length && !rendeu && !soMinha && !folha && !anexos) continue;
      return {
        aulaId: au.id,
        data: au.data,
        diaSemana: diaSemanaLongo(au.data),
        assuntos: assuntos,
        areas: areas,
        oQueRendeu: rendeu,
        soMinha: soMinha,
        temFolha: folha,
        qtdAnexos: anexos
      };
    }
    return null;
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
   *
   * Metade disto é sobre o ALUNO e metade é sobre a MATÉRIA.
   *
   * A rotina de estudo, o jeito de aprender, deixar questão em branco, chutar,
   * estudar só na véspera, ficar ansioso perto da prova: isso é o mesmo aluno
   * em matemática e em história, e ela não deveria responder de novo a cada
   * matéria. Já em que ponto ele está, o que ele erra e o que ficou para trás
   * muda de uma matéria para outra e se repete por matéria.
   *
   * Por isso cada item diz `sobre: 'aluno'` ou `sobre: 'materia'`. E o item que
   * só existe em matemática carrega `so: 'matematica'`: cálculo mental, tabuada
   * e fração não são pergunta para quem dá aula de história.
   */
  var MAPA = [
    {
      chave: 'fortes',
      titulo: 'Pontos fortes',
      ajuda: 'O que já funciona e serve de apoio para o resto.',
      itens: [
        { id: 'calculo-mental', rotulo: 'Cálculo mental', sobre: 'materia', so: 'matematica' },
        { id: 'tabuada-ok', rotulo: 'Tabuada automatizada', sobre: 'materia', so: 'matematica' },
        { id: 'enunciado-ok', rotulo: 'Entende bem o enunciado', sobre: 'aluno' },
        { id: 'raciocinio-ok', rotulo: 'Raciocínio lógico', sobre: 'aluno' },
        { id: 'caderno-ok', rotulo: 'Caderno organizado', sobre: 'aluno' },
        { id: 'tarefa-ok', rotulo: 'Faz as tarefas em dia', sobre: 'aluno' },
        { id: 'pergunta', rotulo: 'Pergunta quando não entende', sobre: 'aluno' },
        { id: 'persiste', rotulo: 'Persiste na questão difícil', sobre: 'aluno' },
        { id: 'sozinho', rotulo: 'Trabalha bem sozinho', sobre: 'aluno' },
        { id: 'autocorrige', rotulo: 'Percebe e corrige o próprio erro', sobre: 'aluno' },
        /* Era "Gosta de matemática". O rótulo passou a dizer a matéria em vez de
         * dizer matemática, porque agora ele aparece dentro da matéria escolhida.
         * O identificador é o mesmo, então o que ela já marcou continua marcado. */
        { id: 'gosta', rotulo: 'Gosta da matéria', sobre: 'materia' },
        { id: 'pega-rapido', rotulo: 'Pega conceito novo com rapidez', sobre: 'aluno' },
        { id: 'conteudo-em-dia', rotulo: 'Está em dia com o conteúdo do ano', sobre: 'materia' },
        { id: 'base-solida', rotulo: 'Tem base sólida do que veio antes', sobre: 'materia' }
      ]
    },
    {
      chave: 'atencao',
      titulo: 'Pontos de atenção',
      ajuda: 'Onde ele costuma perder ponto. É o que vira plano de trabalho.',
      itens: [
        { id: 'sinal', rotulo: 'Erros de sinal', sobre: 'materia', so: 'matematica' },
        { id: 'tabuada-fraca', rotulo: 'Tabuada insegura', sobre: 'materia', so: 'matematica' },
        { id: 'fracao-fraca', rotulo: 'Se perde nas operações com frações', sobre: 'materia', so: 'matematica' },
        { id: 'decimal-fraca', rotulo: 'Erra na passagem entre decimal, fração e porcentagem', sobre: 'materia', so: 'matematica' },
        { id: 'enunciado-fraco', rotulo: 'Lê o enunciado sem entender o que se pede', sobre: 'aluno' },
        { id: 'nao-comeca', rotulo: 'Não sabe por onde começar', sobre: 'aluno' },
        { id: 'branco', rotulo: 'Deixa questão em branco', sobre: 'aluno' },
        { id: 'chuta', rotulo: 'Chuta sem tentar', sobre: 'aluno' },
        { id: 'nao-confere', rotulo: 'Não confere o resultado', sobre: 'aluno' },
        { id: 'nao-revisa', rotulo: 'Não revisa a prova depois de corrigida', sobre: 'aluno' },
        { id: 'vespera', rotulo: 'Estuda só na véspera', sobre: 'aluno' },
        { id: 'caderno-fraco', rotulo: 'Caderno incompleto', sobre: 'aluno' },
        { id: 'dispersa', rotulo: 'Dispersa com facilidade', sobre: 'aluno' },
        { id: 'depende', rotulo: 'Depende de ajuda para começar', sobre: 'aluno' },
        { id: 'fora-do-modelo', rotulo: 'Trava quando a questão foge do modelo', sobre: 'materia' },
        { id: 'ansiedade-prova', rotulo: 'Fica ansioso perto da prova', sobre: 'aluno' },
        { id: 'conteudo-atrasado', rotulo: 'Está atrás do conteúdo que a turma está vendo', sobre: 'materia' },
        { id: 'confunde-conceitos', rotulo: 'Confunde conceitos parecidos da matéria', sobre: 'materia' },
        { id: 'nao-retem', rotulo: 'Não lembra do que foi visto no encontro anterior', sobre: 'materia' }
      ]
    },
    {
      chave: 'lacunas',
      titulo: 'Lacunas de anos anteriores',
      /* A lista de lacunas só aparece onde ela é verdade.
       *
       * Matemática é escada: não dá para fazer equação do segundo grau sem
       * fração. História não é escada. Não saber Revolução Francesa não impede
       * aprender Primeira Guerra, e quem vai mal em história costuma ir mal em
       * ler e escrever, que é português, e não está faltando um assunto do ano
       * passado. Copiar esta lista nas outras onze matérias daria onze listas
       * que nunca receberiam uma marcação sequer. */
      soEmEscada: true,
      /* O grupo inteiro é sobre a matéria: cada item aqui herda isso, e não
       * precisa repetir `sobre` vinte e duas vezes. */
      sobre: 'materia',
      ajuda: 'O que ficou para trás e atrapalha o conteúdo de agora. ' +
        'Cada lacuna marcada monta a trilha dos assuntos que precisam vir antes, ' +
        'na ordem.',
      /* Cada item tem `busca`, que continua abrindo a lista de temas, e `alvos`,
       * que são os fins de trilha possíveis daquela lacuna, do ano mais baixo
       * para o mais alto.
       *
       * Os alvos são escritos à mão de propósito. Medido no banco de hoje: a
       * busca por "função" devolve sete temas do 1º ano do médio, todos
       * plausíveis, e escolher pelo ano do aluno pode pegar o errado; a busca por
       * "operações" devolve dez temas espalhados do 5º ano ao 3º do médio,
       * incluindo matrizes e polinômios; e "primeiro grau" e "segundo grau" não
       * casam com título nenhum, ou seja as duas lacunas de equação não tinham
       * alvo nenhum. Quem confirma o alvo é ela, com um toque, ao montar a
       * trilha: um toque por trilha, nunca por aula. */
      itens: [
        { id: 'naturais', rotulo: 'Operações com números naturais', busca: 'operações', alvos: ['MAT04-02', 'MAT05-02', 'MAT06-02'] },
        { id: 'tabuada', rotulo: 'Tabuada e multiplicação', busca: 'multiplicação', alvos: ['MAT03-04', 'MAT04-03'] },
        { id: 'divisao', rotulo: 'Divisão', busca: 'divisão', alvos: ['MAT03-05', 'MAT04-04'] },
        { id: 'fracoes', rotulo: 'Frações', busca: 'fração', alvos: ['MAT04-05', 'MAT05-03', 'MAT06-05', 'MAT06-06'] },
        { id: 'decimais', rotulo: 'Números decimais', busca: 'decimais', alvos: ['MAT04-06', 'MAT05-05', 'MAT06-07'] },
        { id: 'porcentagem', rotulo: 'Porcentagem', busca: 'porcentagem', alvos: ['MAT05-06', 'MAT06-08', 'MAT07-07'] },
        { id: 'inteiros', rotulo: 'Números negativos', busca: 'inteiros', alvos: ['MAT07-01', 'MAT07-02'] },
        { id: 'potencias', rotulo: 'Potenciação e raiz', busca: 'potência', alvos: ['MAT08-01', 'MAT09-02'] },
        { id: 'medidas', rotulo: 'Unidades de medida', busca: 'medida', alvos: ['MAT04-10', 'MAT05-10', 'MAT06-12'] },
        { id: 'algebrica', rotulo: 'Expressões algébricas', busca: 'algébric', alvos: ['MAT07-09', 'MAT08-05'] },
        { id: 'eq1', rotulo: 'Equação do primeiro grau', busca: 'primeiro grau', alvos: ['MAT07-10'] },
        { id: 'sistemas', rotulo: 'Sistemas de equações', busca: 'sistema', alvos: ['MAT08-10', 'MATEM2-06'] },
        { id: 'fatoracao', rotulo: 'Produtos notáveis e fatoração', busca: 'fatoração', alvos: ['MAT08-06', 'MAT08-07'] },
        { id: 'eq2', rotulo: 'Equação do segundo grau', busca: 'segundo grau', alvos: ['MAT09-04', 'MAT09-05'] },
        { id: 'proporcao', rotulo: 'Razão, proporção e regra de três', busca: 'proporção', alvos: ['MAT07-05', 'MAT07-06'] },
        { id: 'area', rotulo: 'Perímetro, área e volume', busca: 'área', alvos: ['MAT04-09', 'MAT05-09', 'MAT06-11', 'MAT07-13'] },
        { id: 'pitagoras', rotulo: 'Teorema de Pitágoras', busca: 'Pitágoras', alvos: ['MAT09-07'] },
        { id: 'semelhanca', rotulo: 'Semelhança e escala', busca: 'semelhança', alvos: ['MAT09-08'] },
        { id: 'trigonometria', rotulo: 'Trigonometria no triângulo retângulo', busca: 'trigonometria', alvos: ['MAT09-09', 'MATEM1-14'] },
        { id: 'funcoes', rotulo: 'Funções', busca: 'função', alvos: ['MAT09-10', 'MATEM1-03'] },
        { id: 'graficos', rotulo: 'Leitura de gráficos e estatística', busca: 'gráfico', alvos: ['MAT04-12', 'MAT05-12', 'MAT06-14', 'MATEM3-14'] },
        { id: 'probabilidade', rotulo: 'Probabilidade', busca: 'probabilidade', alvos: ['MAT07-14', 'MAT08-14', 'MAT09-14', 'MATEM2-10'] }
      ]
    },
    {
      chave: 'rotina',
      titulo: 'Rotina de estudo',
      /* Rotina e jeito de aprender são o mesmo aluno em qualquer matéria:
       * respondidos uma vez, valem para todas. */
      sobre: 'aluno',
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
      sobre: 'aluno',
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

  // ---------- as matérias do mapeamento ----------

  /* As matérias que ela dá. `escada` marca a matéria em que o conteúdo de um
   * ano depende mesmo do ano anterior: hoje só matemática, e é por isso que só
   * ali existe lista de lacunas.
   *
   * `apoiaEmMatematica` marca física e química. Quando um aluno trava nelas,
   * quase sempre o que falta é proporção, isolar a variável, potência de dez ou
   * trigonometria, que já existem no banco de temas e a busca já sabe achar:
   * não é preciso escrever uma lista de lacunas de física para isso funcionar.
   *
   * A última é "Outra", com o nome em branco, porque nenhuma lista prevê tudo. */
  var MATERIAS = [
    { id: 'matematica', rotulo: 'Matemática', escada: true },
    { id: 'portugues', rotulo: 'Português' },
    { id: 'redacao', rotulo: 'Redação' },
    { id: 'ingles', rotulo: 'Inglês' },
    { id: 'ciencias', rotulo: 'Ciências' },
    { id: 'fisica', rotulo: 'Física', apoiaEmMatematica: true },
    { id: 'quimica', rotulo: 'Química', apoiaEmMatematica: true },
    { id: 'biologia', rotulo: 'Biologia' },
    { id: 'historia', rotulo: 'História' },
    { id: 'geografia', rotulo: 'Geografia' },
    { id: 'filosofia', rotulo: 'Filosofia' },
    { id: 'sociologia', rotulo: 'Sociologia' },
    { id: 'outra', rotulo: 'Outra', livre: true }
  ];

  var MATERIA_PADRAO = 'matematica';

  function materiaPorId(id) {
    return MATERIAS.filter(function (m) { return m.id === String(id || ''); })[0] || null;
  }

  function rotuloMateria(m, id) {
    var mat = materiaPorId(id);
    if (!mat) return '';
    if (mat.livre) {
      var nome = ((dadosDaMateria(m, id) || {}).nome || '').trim();
      return nome || mat.rotulo;
    }
    return mat.rotulo;
  }

  /* A matéria tem lista de lacunas de ano anterior? Só onde a matéria é escada. */
  function temLacunaDeAnoAnterior(materiaId) {
    var mat = materiaPorId(materiaId);
    return !!(mat && mat.escada);
  }

  function sobreDoItem(grupo, item) {
    return item.sobre || grupo.sobre || 'materia';
  }

  /* Os itens de um grupo que são sobre o aluno: valem em qualquer matéria e
   * ficam respondidos uma vez só. */
  function itensDoAluno(chave) {
    var g = MAPA.filter(function (x) { return x.chave === chave; })[0];
    if (!g) return [];
    return g.itens.filter(function (i) { return sobreDoItem(g, i) === 'aluno'; });
  }

  /* Os itens de um grupo que são sobre a matéria escolhida. O item marcado com
   * `so` só aparece na matéria dele: tabuada não é pergunta de história. */
  function itensDaMateria(chave, materiaId) {
    var g = MAPA.filter(function (x) { return x.chave === chave; })[0];
    if (!g) return [];
    var alvo = String(materiaId || MATERIA_PADRAO);
    if (g.soEmEscada && !temLacunaDeAnoAnterior(alvo)) return [];
    return g.itens.filter(function (i) {
      if (sobreDoItem(g, i) !== 'materia') return false;
      return !i.so || i.so === alvo;
    });
  }

  /* Os grupos que aparecem para uma matéria, na ordem. */
  function gruposDaMateria(materiaId) {
    return MAPA.filter(function (g) {
      return itensDaMateria(g.chave, materiaId).length > 0;
    });
  }

  /* Os grupos que aparecem no bloco do aluno, na ordem. */
  function gruposDoAluno() {
    return MAPA.filter(function (g) { return itensDoAluno(g.chave).length > 0; });
  }

  /* Onde moram as marcações de cada matéria.
   *
   * Matemática continua em m.marcados, exatamente onde sempre esteve. Tudo o
   * que ela já marcou foi marcado sobre matemática, e é de lá que leem o
   * lembrete da aula, a ficha em PDF e a trilha. Mover isso para outro lugar
   * reescreveria o que ela já respondeu.
   *
   * As outras matérias nascem hoje e moram em m.porMateria[id], que nasce
   * vazio. O bloco do aluno mora sempre em m.marcados, para qualquer matéria:
   * é respondido uma vez.
   *
   * Por isso, em matemática, m.marcados.atencao guarda os itens do aluno e os
   * da matéria na mesma lista, que é o que ele sempre guardou. */
  function dadosDaMateria(m, materiaId) {
    if (!m) return null;
    var id = String(materiaId || MATERIA_PADRAO);
    return (m.porMateria && m.porMateria[id]) || null;
  }

  function garantirMateria(m, materiaId) {
    var id = String(materiaId || MATERIA_PADRAO);
    m.porMateria = m.porMateria || {};
    if (!m.porMateria[id]) m.porMateria[id] = { fortes: [], atencao: [], nome: '', cobranca: '' };
    var d = m.porMateria[id];
    ['fortes', 'atencao'].forEach(function (c) { d[c] = (d[c] || []).slice(); });
    if (typeof d.cobranca !== 'string') d.cobranca = '';
    if (typeof d.nome !== 'string') d.nome = '';
    return d;
  }

  /* O que está marcado na matéria escolhida, só os itens de matéria. */
  function marcadosDaMateria(m, materiaId) {
    var id = String(materiaId || MATERIA_PADRAO);
    var out = {};
    MAPA.forEach(function (g) {
      var permitidos = {};
      itensDaMateria(g.chave, id).forEach(function (i) { permitidos[i.id] = true; });
      var fonte = id === MATERIA_PADRAO
        ? ((m && m.marcados && m.marcados[g.chave]) || [])
        : (((dadosDaMateria(m, id) || {})[g.chave]) || []);
      out[g.chave] = fonte.filter(function (x) { return permitidos[x]; });
    });
    return out;
  }

  /* O que está marcado sobre o aluno, que vale em qualquer matéria. */
  function marcadosDoAluno(m) {
    var out = {};
    MAPA.forEach(function (g) {
      var permitidos = {};
      itensDoAluno(g.chave).forEach(function (i) { permitidos[i.id] = true; });
      out[g.chave] = ((m && m.marcados && m.marcados[g.chave]) || [])
        .filter(function (x) { return permitidos[x]; });
    });
    return out;
  }

  /* Marca ou desmarca um item de matéria. Devolve true se algo mudou. */
  function marcarNaMateria(m, materiaId, chave, itemId, ligado) {
    if (!m) return false;
    var id = String(materiaId || MATERIA_PADRAO);
    var lista;
    if (id === MATERIA_PADRAO) {
      m.marcados = m.marcados || {};
      m.marcados[chave] = m.marcados[chave] || [];
      lista = m.marcados[chave];
    } else {
      var d = garantirMateria(m, id);
      d[chave] = d[chave] || [];
      lista = d[chave];
    }
    var i = lista.indexOf(itemId);
    if (ligado && i < 0) { lista.push(itemId); return true; }
    if (!ligado && i >= 0) { lista.splice(i, 1); return true; }
    return false;
  }

  /* O que o colégio vai cobrar no bimestre naquela matéria, tirado da lista que
   * o aluno já manda. É o que entra no lugar das lacunas onde elas não existem. */
  function cobrancaDaMateria(m, materiaId) {
    return ((dadosDaMateria(m, materiaId) || {}).cobranca || '').trim();
  }

  function definirCobranca(m, materiaId, texto) {
    garantirMateria(m, materiaId).cobranca = String(texto || '');
  }

  /* As matérias que esse mapeamento já tem alguma coisa dentro. Matemática
   * entra sempre que houver marcação antiga, porque foi ali que ela nasceu. */
  function materiasDoMapeamento(m) {
    var out = [];
    MATERIAS.forEach(function (mat) {
      var marc = marcadosDaMateria(m, mat.id);
      var algum = Object.keys(marc).some(function (k) { return marc[k].length > 0; });
      if (algum || cobrancaDaMateria(m, mat.id)) out.push(mat.id);
    });
    if (!out.length) out.push(MATERIA_PADRAO);
    return out;
  }

  // ---------- para onde o aluno está indo ----------

  /* "Outro" fica em primeiro, com campo em branco, porque nenhuma lista prevê
   * tudo: uma criança pode estar estudando para uma prova de bolsa, para uma
   * banca, ou para nada além de parar de sofrer na aula de terça. */
  var OBJETIVOS = [
    { id: 'outro', rotulo: 'Outro', livre: true },
    { id: 'media', rotulo: 'Recuperar a média na escola' },
    { id: 'selecao-colegio', rotulo: 'Processo seletivo de colégio' },
    { id: 'vestibular', rotulo: 'Vestibular ou ENEM' },
    { id: 'fora', rotulo: 'Universidade fora do país' }
  ];

  function objetivoPorId(id) {
    return OBJETIVOS.filter(function (o) { return o.id === String(id || ''); })[0] || null;
  }

  /* O objetivo do mapeamento que vale hoje, já em português pronto para a tela.
   * Devolve null quando ela não registrou nenhum: o bloco simplesmente não
   * aparece, em vez de aparecer vazio. */
  function objetivoDe(aluno) {
    var m = mapeamentoAtual(aluno);
    if (!m || !m.objetivo) return null;
    var o = m.objetivo;
    var base = objetivoPorId(o.tipo);
    var livre = (o.descricao || '').trim();
    var rotulo = base ? (base.livre ? (livre || base.rotulo) : base.rotulo) : livre;
    if (!rotulo && !o.dataProva) return null;
    return {
      tipo: o.tipo || '',
      rotulo: rotulo,
      descricao: livre,
      dataProva: o.dataProva || ''
    };
  }

  /* Quantas semanas faltam para a prova.
   *
   * Devolve null sem data. `passou` diz que a data já ficou para trás, e aí
   * `semanas` é quantas se passaram: a aula não pode mentir que ainda falta
   * tempo. Abaixo de uma semana ela mostra os dias, que é o que importa ali. */
  function semanasAteAProva(dataIso, hojeRef) {
    if (!dataIso) return null;
    var hoje = hojeRef || hojeIso();
    var a = dataLocal(hoje), b = dataLocal(dataIso);
    if (!isFinite(a.getTime()) || !isFinite(b.getTime())) return null;
    var dias = Math.round((b - a) / 86400000);
    var passou = dias < 0;
    var absoluto = Math.abs(dias);
    return {
      data: dataIso,
      dias: dias,
      passou: passou,
      semanas: Math.floor(absoluto / 7),
      texto: passou
        ? (absoluto === 0 ? 'é hoje' : 'já passou')
        : (dias === 0 ? 'é hoje'
          : dias < 7 ? (dias === 1 ? 'falta 1 dia' : 'faltam ' + dias + ' dias')
            : (Math.floor(dias / 7) === 1 ? 'falta 1 semana'
              : 'faltam ' + Math.floor(dias / 7) + ' semanas'))
    };
  }

  function mapeamentoNovo() {
    return {
      id: uid(), data: hojeIso(), aulaId: null,
      escola: '', anoEscolar: '', anoEscolarOutro: '', professor: '', calendarioProvas: '',
      indicacao: '', motivo: '', expectativa: '',
      nivel: '', prioridades: '', plano: '',
      objetivo: { tipo: '', descricao: '', dataProva: '' },
      marcados: { fortes: [], atencao: [], lacunas: [], rotina: [], aprende: [] },
      porMateria: {}
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

  /* O ano escolar deixou de ser só a série do colégio.
   *
   * Não havia como registrar aluno em cursinho, aluno que saiu da escola, nem
   * aluno em sistema de fora: a lista ia do 2º ano ao 3º do médio e acabava.
   * Os três de baixo entram por isso, e "Outro" traz campo em branco, do mesmo
   * jeito que o objetivo. */
  var ANOS_ESCOLARES = {
    '02': '2º ano', '03': '3º ano', '04': '4º ano', '05': '5º ano', '06': '6º ano',
    '07': '7º ano', '08': '8º ano', '09': '9º ano',
    em1: '1º ano do médio', em2: '2º ano do médio', em3: '3º ano do médio',
    cursinho: 'Cursinho', fora: 'Fora da escola', outro: 'Outro'
  };

  /* A ordem em que a lista aparece na tela: as séries primeiro, na ordem da
   * escada, e os três casos de fora depois. */
  var ANOS_ESCOLARES_ORDEM = ['02', '03', '04', '05', '06', '07', '08', '09',
    'em1', 'em2', 'em3', 'cursinho', 'fora', 'outro'];

  function anoEscolarLivre(ano) { return String(ano || '') === 'outro'; }

  /* A série que o banco de temas entende, a partir do que ela registrou.
   *
   * O banco vai do 1º ano ao 3º do médio e não conhece cursinho. Cursinho lê
   * como 3º do médio, que é o conteúdo que ele revisa. "Fora da escola" e
   * "Outro" não viram série nenhuma: sem série o aplicativo propõe o começo
   * mais baixo da trilha, que é o lado seguro de errar. */
  function serieParaTemas(ano) {
    var a = String(ano || '');
    if (a === 'cursinho') return 'em3';
    if (ANOS_ESCOLARES[a] && a !== 'fora' && a !== 'outro') return a;
    return '';
  }

  /* Ano escolar e colégio, para o fechamento situar quem lê. Só aparece quando
   * a informação existe: nada de linha em branco no documento da família. */
  function contextoEscolarDe(aluno) {
    var m = mapeamentoAtual(aluno);
    var ano = (m && m.anoEscolar) || (aluno && aluno.anoEscolar) || '';
    var partes = [];
    if (anoEscolarLivre(ano)) {
      var livre = ((m && m.anoEscolarOutro) || (aluno && aluno.anoEscolarOutro) || '').trim();
      if (livre) partes.push(livre);
    } else if (ANOS_ESCOLARES[ano]) {
      partes.push(ANOS_ESCOLARES[ano]);
    }
    if (m && m.escola) partes.push(m.escola);
    return partes.join(', ');
  }

  // ---------- a proposta de acompanhamento ----------

  /* A proposta é o documento que ela manda para a família de um aluno NOVO,
   * antes de começar: quem é o aluno, o que ela observou, o que propõe
   * trabalhar, como funcionam os encontros e quanto custa.
   *
   * Mora ao lado do mapeamento e é irmã dele de propósito. Quase tudo o que a
   * proposta diz já foi respondido na aula de nivelamento ou na primeira
   * conversa com os pais, e ela não deveria responder duas vezes: propostaNova,
   * propostasDe e propostaAtual são as gêmeas de mapeamentoNovo, mapeamentosDe
   * e mapeamentoAtual, e preencherProposta traz o resto já preenchido.
   *
   * Guardar a proposta, e não regerá-la, é o que importa: quando a família
   * liga em dezembro perguntando "mas você não tinha falado R$ 109?", ela abre
   * a proposta que mandou.
   *
   * NADA aqui inventa taxonomia. As matérias vêm de MATERIAS, os pontos fortes
   * e de atenção do MAPA, as áreas de AREAS, o nível de NIVEIS e o ano escolar
   * de ANOS_ESCOLARES. O registro guarda só os identificadores, como o
   * mapeamento faz, para que corrigir um rótulo aqui conserte também as
   * propostas antigas. */

  /* Onde o encontro acontece. Ela atende dentro da casa das famílias, então é
   * esse o padrão. */
  var LOCAIS_ENCONTRO = [
    { id: 'casa', rotulo: 'Na casa de vocês' },
    { id: 'online', rotulo: 'Online' },
    { id: 'combinar', rotulo: 'A combinar' }
  ];

  function rotuloLocal(id) {
    var l = LOCAIS_ENCONTRO.filter(function (x) { return x.id === String(id || ''); })[0];
    return l ? l.rotulo : LOCAIS_ENCONTRO[0].rotulo;
  }

  /* O plano é PACOTE DE HORAS, e não mensalidade fixa.
   *
   * Esta é a decisão que sustenta todo o resto. Mensalidade fixa quebraria o
   * motor: calcularFechamento cobra aula por aula, e um mês com cinco terças
   * não pode custar o mesmo que um com quatro sem reescrever o fechamento.
   * Pacote de horas custa ZERO mudança, porque aluno.precos já é exatamente
   * isso: uma vigência com início, fim e valor por hora. O plano que a família
   * aceitar vira UMA linha ali, com início hoje e fim no fim do período, e o
   * fechamento dos meses seguintes sai certo sozinho. Aula cancelada com aviso
   * continua não cobrável, que é o que o combinado de remarcação promete.
   *
   * As semanas são 4, 12 e 24, e não 4,3: é o número que a família confere no
   * calendário e que ela consegue explicar em voz alta.
   *
   * E o plano é medido em SEMANAS também na hora de virar vigência, nunca em
   * meses de calendário. Três meses de calendário não contêm doze aulas
   * semanais: contêm treze. Medido com aula toda sexta a partir de 04/09 e
   * hora a R$ 123,50: a folha prometia doze encontros por R$ 2.223,00 e o
   * fechamento, que cobra aula por aula dentro da vigência, somava treze aulas
   * e R$ 2.407,75. Os dois documentos chegam à mesma família no mesmo mês. Por
   * isso não existe campo de meses aqui: quem precisar do fim da vigência
   * conta semanas. */
  var PLANOS = [
    { id: 'mensal', rotulo: 'Mensal', semanas: 4 },
    { id: 'trimestral', rotulo: 'Trimestral', semanas: 12 },
    { id: 'semestral', rotulo: 'Semestral', semanas: 24 }
  ];

  function planoPorId(id) {
    return PLANOS.filter(function (p) { return p.id === String(id || ''); })[0] || null;
  }

  function numeroOu(v, padrao) {
    var n = typeof v === 'string' ? Number(String(v).replace(',', '.')) : v;
    return (typeof n === 'number' && isFinite(n)) ? n : padrao;
  }

  /* Número por extenso no feminino, só até onde a frase precisa. Ela escreve
   * "duas folgas", e não "2 folgas": é uma carta para a família. */
  function porExtensoFem(n) {
    var nomes = ['nenhuma', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis'];
    return nomes[n] || String(n);
  }

  function comInicialMaiuscula(s) {
    s = String(s || '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function somaDiasIso(iso, dias) {
    return isoDe(somaDias(dataLocal(iso), dias));
  }

  /* Soma meses sem estourar o mês curto: 31 de janeiro mais um mês é o último
   * dia de fevereiro, e não 3 de março. */
  function somaMesesIso(iso, meses) {
    var p = partesData(iso);
    var d = new Date(p.a, p.m - 1 + meses, p.d);
    if (d.getDate() !== p.d) d = new Date(d.getFullYear(), d.getMonth(), 0);
    return isoDe(d);
  }

  /* Arredonda para baixo em degraus de R$ 0,50.
   *
   * Para baixo de propósito: arredondar para cima entregaria menos desconto do
   * que o percentual anunciado logo ao lado, e é a família que faz essa conta.
   * A passagem por centavos inteiros antes do degrau existe para o 0,95 de
   * ponto flutuante não derrubar o valor meio real inteiro. */
  function arredondaMeioReal(v) {
    var centavos = Math.round(numeroOu(v, 0) * 100);
    if (centavos <= 0) return 0;
    return Math.floor(centavos / 50) * 50 / 100;
  }

  function arredondaCentavos(v) {
    return Math.round(numeroOu(v, 0) * 100) / 100;
  }

  /* A âncora sugerida: o valor de hoje mais 15 por cento, para cima em múltiplo
   * de cinco.
   *
   * Ancorar num valor mais alto funciona, mas só sob uma condição, e a condição
   * é a diferença entre ferramenta e truque: a âncora tem que ser um preço que
   * ela REALMENTE cobraria. A aula avulsa custa mais caro de verdade, porque
   * sem compromisso ela não planeja a sequência dos assuntos nem prepara o
   * material com antecedência. Se ela não pegaria um aluno avulso por esse
   * valor, então o número é de vitrine, a família descobre na primeira conversa
   * com a vizinha, e o documento inteiro perde credibilidade junto.
   *
   * A âncora é o preço da linha AVULSA, e só dela. Os planos descem do preço
   * que ela cobra hoje, em calcularPlanos. Foi assim que o mensal voltou a
   * cair no preço dela: enquanto os planos desciam da âncora, os 15 por cento
   * de marcação ficavam por baixo de todo desconto e os três planos saíam
   * acima do que ela cobra. */
  function ancoraSugerida(valorHora) {
    var v = numeroOu(valorHora, 0);
    if (!(v > 0)) return 0;
    return Math.ceil(v * 1.15 / 5) * 5;
  }

  /* Os padrões dela, escritos uma vez e usados em toda proposta.
   *
   * Moram em db.ajustes.propostaPadrao, no mesmo lugar de exibirTemasEAreas e
   * valoresOcultos. Uma âncora só para todo mundo: Niterói é pequeno e as
   * famílias se falam, e duas propostas do mesmo mês com âncoras diferentes
   * custam as duas famílias de uma vez.
   *
   * Os três descontos são POR BAIXO DO PREÇO DELA, e é o que os torna legíveis:
   * zero no mensal quer dizer "o mensal é o meu preço de hoje", cinco no
   * trimestral quer dizer "cinco por cento abaixo dele". A escada de 0, 5 e 10
   * fica dentro da faixa de 5 a 15 por cento que a pesquisa achou em tutoria,
   * música e aula particular no Brasil. */
  var PROPOSTA_PADRAO = {
    cidade: 'Niterói',
    diasDeValidade: 30,
    valorHora: 0,
    ancora: 0,
    descontos: { mensal: 0, trimestral: 5, semestral: 10 },
    recomendado: 'trimestral',
    horasDeAviso: 24,
    folgasPorSemestre: 2,
    duracaoMin: 90,
    porSemana: 1,
    local: 'casa'
  };

  /* Acima disto o desconto deixa de ser desconto e vira o produto: atrai quem
   * decide por preço, corrói a margem e ainda desvaloriza a aula avulsa. */
  var LIMITE_DESCONTO = 25;

  /* O combinado de remarcação, na voz dela, como PADRÃO EDITÁVEL e nunca como
   * texto fixo: ela tem que poder mudar cada palavra antes de mandar.
   *
   * A ordem não é decorativa. Abre pelo trabalho pedagógico, que é o argumento
   * que só ela tem e que é verificável pela família, que recebe os PDFs. A
   * analogia do horário que não se revende é verdadeira e soa comercial vinda
   * de quem entra na casa da família toda semana, então ela não lidera.
   *
   * O item das folgas é o que faz o resto funcionar: tira dela o papel de
   * julgar se o motivo era bom o bastante, que é o que envenena a relação, e
   * tira da família a necessidade de inventar desculpa. Depois que a franquia
   * acaba, a regra fica fácil de aplicar exatamente porque deixou de ser
   * pessoal.
   *
   * O item de quando quem desmarca é ela não é gentileza: regra que pega um
   * lado só é cobrança, e a mesma regra dos dois lados é combinado. É o teste
   * que a família faz mentalmente, e é rápido de fazer.
   *
   * Os textos nascem com o número de horas e o de folgas já escritos por
   * extenso, montados a partir dos campos. Depois que ela edita uma frase, a
   * frase dela vence: por isso a montagem acontece na criação, e não na hora de
   * imprimir. */
  function combinadosPadrao(padrao) {
    var pd = padrao || PROPOSTA_PADRAO;
    var h = numeroOu(pd.horasDeAviso, 24);
    var f = numeroOu(pd.folgasPorSemestre, 2);
    return [
      { id: 'preparo', ligado: true, rotulo: 'Como a aula é montada',
        texto: 'Cada encontro é preparado antes: eu escolho o assunto olhando o que ficou errado na semana anterior e monto a explicação, a lista de exercícios e o gabarito daquela semana.' },
      { id: 'aviso', ligado: true, rotulo: 'Se precisarem desmarcar',
        texto: 'Me avisem por mensagem escrita no WhatsApp até ' + h + ' horas antes do início da aula. Com esse aviso eu remanejo a minha semana, a aula não é cobrada e a gente reagenda dentro do mesmo mês.' },
      { id: 'folgas', ligado: true, rotulo: comInicialMaiuscula(porExtensoFem(f)) + ' folgas por semestre',
        texto: 'Vida acontece. Cada família tem ' + porExtensoFem(f) + ' desmarcações em cima da hora por semestre que não são cobradas e sobre as quais vocês não precisam me dar explicação nenhuma. Usem quando precisarem, sem ficar sem graça comigo.' },
      /* A folha promete o que o motor faz, e o motor tem cobrável sim ou não.
       *
       * Este item dizia "entra no fechamento do mês como meia aula". O
       * fechamento cobra a aula cancelada que ela marca como cobrável pelo
       * valor inteiro: medido numa aula de 1h30 a R$ 133,00, a folha prometia
       * R$ 99,75 e o fechamento cobrava R$ 199,50, e as duas contas chegam à
       * mesma família no mesmo mês. Meia cobrança seria mudança de motor, e a
       * pesquisa até prefere os 50 por cento; enquanto ela não existir, o
       * texto padrão diz o valor da aula. A franquia de folgas acima é o que
       * mantém isso justo: ninguém paga na primeira vez. */
      { id: 'vespera', ligado: true, rotulo: 'Depois dessas ' + porExtensoFem(f),
        texto: 'A desmarcação com menos de ' + h + ' horas entra no fechamento do mês pelo valor da aula, porque o horário ficou reservado e o material daquela semana já estava preparado. Se der para encaixar uma reposição na mesma semana, eu ofereço.' },
      /* Falta sem aviso é a única linha que o motor já cobra sozinho, por
       * padrão, e era a única que a folha não contava. Separar falta de
       * desmarcação é unanimidade na pesquisa e é justo: uma coisa é um aviso
       * tardio, outra é ela ter atravessado a cidade. */
      { id: 'falta', ligado: true, rotulo: 'Falta sem aviso',
        texto: 'Aula sem aviso nenhum, comigo já na porta de vocês, conta como aula dada e não tem reposição: é diferente de desmarcar, e por isso o tratamento é outro. Se o atraso passar de trinta minutos sem notícia, eu considero falta e sigo o meu dia.' },
      { id: 'eu-desmarco', ligado: true, rotulo: 'Se quem desmarcar for eu',
        texto: 'Vale a mesma régua para mim: eu aviso o quanto antes e reponho a aula sem cobrar nada.' },
      { id: 'reposicao', ligado: true, rotulo: 'Como funciona a reposição',
        texto: 'Uma por mês e dentro do próprio mês. Assim não junta aula atrasada para novembro, quando não sobra horário para ninguém.' },
      /* A promessa de devolver o que foi pago e não usado supunha pacote pago
       * adiantado, e não é o que o aplicativo faz: a cobrança é mensal, pelas
       * aulas que aconteceram. Prometer devolução de um valor que nunca foi
       * recebido é promessa que a conta do mês desmente. */
      { id: 'parar', ligado: true, rotulo: 'Se quiserem parar',
        texto: 'É só me falar, de preferência com uma semana de antecedência para eu reorganizar a agenda. Não fica nada preso: como a cobrança é mensal, vocês pagam só as aulas que aconteceram até ali.' }
    ];
  }

  /* O que vem junto com a aula.
   *
   * As duas primeiras ela já faz e quase ninguém faz, e hoje isso é invisível
   * exatamente no momento em que a família está decidindo o preço. */
  function vantagensPadrao() {
    return [
      /* Sem pronome. Dizia "para o que ele precisa naquela semana", e metade
       * das crianças é menina: a família lê a primeira folha sobre a filha e
       * encontra um "ele". Tirar o pronome resolve inteiro e é mais barato,
       * mais curto e mais seguro do que criar campo de gênero, que seria uma
       * pergunta a mais na tela para consertar uma palavra. */
      { id: 'material', ligado: true,
        texto: 'Material próprio: explicação, lista de exercícios e gabarito em PDF, preparados para o que estiver faltando naquela semana.' },
      { id: 'fechamento', ligado: true,
        texto: 'Fechamento mensal por escrito: as datas, os assuntos trabalhados e o meu retorno sobre a evolução.' },
      { id: 'provas', ligado: true,
        texto: 'Acompanhamento do calendário de provas do colégio.' },
      { id: 'duvida', ligado: true,
        texto: 'Retorno por mensagem entre as aulas, para dúvida pontual.' }
    ];
  }

  function copiaItens(lista, molde) {
    var fonte = (lista && lista.length) ? lista : molde;
    return (fonte || []).map(function (i) {
      return {
        id: i.id || uid(),
        ligado: i.ligado !== false,
        rotulo: String(i.rotulo || ''),
        texto: String(i.texto || '')
      };
    });
  }

  /* Os itens guardados por ela POR CIMA do molde da casa, casando pelo id.
   *
   * Antes disto, a lista guardada substituía o molde inteiro, e a lista é
   * guardada na primeira proposta que ela gera, tenha editado alguma coisa ou
   * não. O efeito: um combinado corrigido aqui nunca mais chegava nela. Foi
   * exatamente o caso da desmarcação de véspera, que prometia meia aula, e do
   * combinado de falta sem aviso, que não existia: as duas correções morreriam
   * na primeira proposta já gerada.
   *
   * A regra é a mesma de sempre, só que item a item: o texto dela vence o da
   * casa, e o que ela nunca tocou acompanha a casa. Item novo entra na posição
   * que a casa deu; item que só ela tem fica no fim. */
  function mesclaItens(salvos, molde) {
    var dela = {};
    (salvos || []).forEach(function (i) { if (i && i.id) dela[i.id] = i; });
    var usados = {};
    var out = (molde || []).map(function (padrao) {
      var s = dela[padrao.id];
      if (s) usados[padrao.id] = true;
      return {
        id: padrao.id,
        ligado: s ? s.ligado !== false : padrao.ligado !== false,
        rotulo: String((s && s.rotulo) || padrao.rotulo || ''),
        texto: String((s && s.texto) || padrao.texto || '')
      };
    });
    (salvos || []).forEach(function (i) {
      if (!i || !i.id || usados[i.id]) return;
      out.push({
        id: i.id,
        ligado: i.ligado !== false,
        rotulo: String(i.rotulo || ''),
        texto: String(i.texto || '')
      });
    });
    return out;
  }

  /* Os padrões dela por cima dos padrões da casa. Campo que ela nunca mexeu
   * cai no embutido, e campo guardado torto não derruba a proposta. */
  function propostaPadraoDe(db) {
    var g = (db && db.ajustes && db.ajustes.propostaPadrao) || {};
    var out = {
      cidade: String(g.cidade || PROPOSTA_PADRAO.cidade),
      diasDeValidade: numeroOu(g.diasDeValidade, PROPOSTA_PADRAO.diasDeValidade),
      valorHora: numeroOu(g.valorHora, PROPOSTA_PADRAO.valorHora),
      ancora: numeroOu(g.ancora, PROPOSTA_PADRAO.ancora),
      descontos: {
        mensal: numeroOu(g.descontos && g.descontos.mensal, PROPOSTA_PADRAO.descontos.mensal),
        trimestral: numeroOu(g.descontos && g.descontos.trimestral, PROPOSTA_PADRAO.descontos.trimestral),
        semestral: numeroOu(g.descontos && g.descontos.semestral, PROPOSTA_PADRAO.descontos.semestral)
      },
      recomendado: planoPorId(g.recomendado) ? g.recomendado : PROPOSTA_PADRAO.recomendado,
      horasDeAviso: numeroOu(g.horasDeAviso, PROPOSTA_PADRAO.horasDeAviso),
      folgasPorSemestre: numeroOu(g.folgasPorSemestre, PROPOSTA_PADRAO.folgasPorSemestre),
      duracaoMin: numeroOu(g.duracaoMin, PROPOSTA_PADRAO.duracaoMin),
      porSemana: numeroOu(g.porSemana, PROPOSTA_PADRAO.porSemana),
      local: LOCAIS_ENCONTRO.filter(function (l) { return l.id === g.local; }).length
        ? g.local : PROPOSTA_PADRAO.local,
      modo: g.modo === 'planos' ? 'planos' : 'hora'
    };
    out.combinados = mesclaItens(g.combinados, combinadosPadrao(out));
    out.vantagens = mesclaItens(g.vantagens, vantagensPadrao());
    return out;
  }

  /* Gêmea de mapeamentoNovo. Nasce com os padrões dela e sem nenhum campo
   * obrigatório preenchido: quem preenche é preencherProposta ou ela. */
  function propostaNova(padrao) {
    var pd = padrao || propostaPadraoDe(null);
    var data = hojeIso();
    return {
      id: uid(),
      data: data,
      validaAte: somaDiasIso(data, pd.diasDeValidade),
      cidade: pd.cidade,
      aluno: '',
      responsavel: '',
      /* O nome que ela escreve quando acrescenta uma disciplina em "Outra".
       * Sem ele a folha diria "Outra" para a família, que é o tipo de palavra
       * que só faz sentido para quem programou a lista. */
      materiaOutra: '',
      colegio: '',
      anoEscolar: '',
      anoEscolarOutro: '',
      origem: 'conversa',
      aulaId: null,
      dataOrigem: '',
      materias: [],
      fortes: [],
      atencao: [],
      lacunas: [],
      nivel: '',
      objetivo: { tipo: '', descricao: '', dataProva: '' },
      texto: '',
      areas: [],
      encontro: { duracaoMin: pd.duracaoMin, porSemana: pd.porSemana, local: pd.local },
      combinados: { horas: pd.horasDeAviso, folgas: pd.folgasPorSemestre, itens: copiaItens(pd.combinados) },
      cobranca: {
        modo: pd.modo === 'planos' ? 'planos' : 'hora',
        valorHora: pd.valorHora,
        ancora: pd.ancora,
        descontos: {
          mensal: pd.descontos.mensal,
          trimestral: pd.descontos.trimestral,
          semestral: pd.descontos.semestral
        },
        recomendado: pd.recomendado
      },
      vantagens: copiaItens(pd.vantagens)
    };
  }

  function propostasDe(aluno) {
    return ((aluno && aluno.propostas) || []).slice()
      .sort(function (a, b) { return String(a.data).localeCompare(String(b.data)); });
  }

  /* A proposta que vale hoje é a mais recente. */
  function propostaAtual(aluno) {
    var lista = propostasDe(aluno);
    return lista.length ? lista[lista.length - 1] : null;
  }

  /* De cada ponto de atenção do mapeamento sai a área que trata dele.
   *
   * É uma tabelinha curta e proposital: ela confere e muda. O que a tabela
   * garante é que a seção "o que proponho trabalhar" não nasça vazia numa folha
   * que a família lê antes de decidir. */
  var AREA_DA_ATENCAO = {
    vespera: ['cronograma', 'disciplina'],
    branco: ['estrategia-prova'],
    chuta: ['estrategia-prova'],
    'nao-confere': ['estrategia-prova'],
    'enunciado-fraco': ['enunciado'],
    'nao-comeca': ['autonomia'],
    depende: ['autonomia'],
    dispersa: ['concentracao'],
    'ansiedade-prova': ['ansiedade'],
    'nao-revisa': ['analise-erros'],
    'caderno-fraco': ['material'],
    'conteudo-atrasado': ['revisao'],
    'fora-do-modelo': ['raciocinio'],
    'nao-retem': ['metodo'],
    sinal: ['base'],
    'tabuada-fraca': ['base'],
    'fracao-fraca': ['base'],
    'decimal-fraca': ['base']
  };

  function areasSugeridas(idsDeAtencao) {
    var out = [];
    (idsDeAtencao || []).forEach(function (id) {
      (AREA_DA_ATENCAO[id] || []).forEach(function (a) {
        if (out.indexOf(a) < 0) out.push(a);
      });
    });
    return out;
  }

  /* Uma proposta nova já preenchida com tudo o que o aplicativo sabe.
   *
   * O aluno pode ser nulo, que é o caso principal: a proposta é para aluno
   * NOVO, e ela gera antes de cadastrar.
   *
   * Os pontos de atenção nascem DESMARCADOS mesmo quando estão marcados no
   * mapeamento, e isto é a decisão mais importante desta função. A ficha de
   * mapeamento é interna e pode ser dura. A proposta é a primeira coisa que a
   * família lê sobre o próprio filho, e itens verdadeiros como "Chuta sem
   * tentar" e "Estuda só na véspera" viram acusação da criança na primeira
   * folha que os pais abrem. Os pontos fortes nascem marcados pelo mesmo
   * motivo, ao contrário.
   *
   * E as áreas de trabalho seguem os pontos de atenção MARCADOS, não os do
   * mapeamento. Elas nascem da mesma lista, então derivá-las da verdade
   * inteira escondia o defeito numa seção e o devolvia quatro centímetros
   * abaixo com outro rótulo: medido no mapeamento de dez pontos de atenção, a
   * proposta saía com zero pontos de atenção impressos e oito áreas marcadas,
   * entre elas "Concentração", que é "Dispersa com facilidade", e "Ansiedade
   * ou medo de prova", que é "Fica ansioso perto da prova". A área só nasce
   * marcada quando o ponto de atenção que a gerou está marcado, e como os
   * pontos de atenção nascem desmarcados, as áreas nascem vazias e ela marca
   * as duas coisas juntas, vendo o que a família vai ler. */
  function preencherProposta(db, aluno) {
    var p = propostaNova(propostaPadraoDe(db));
    if (aluno) {
      p.aluno = aluno.nome || '';
      p.responsavel = aluno.responsavel || '';
    }
    var m = mapeamentoAtual(aluno);
    if (m) {
      p.colegio = m.escola || '';
      p.anoEscolar = m.anoEscolar || '';
      p.anoEscolarOutro = m.anoEscolarOutro || '';
      p.origem = m.aulaId ? 'nivelamento' : 'conversa';
      p.aulaId = m.aulaId || null;
      p.dataOrigem = m.data || '';
      p.materias = materiasDoMapeamento(m);
      p.nivel = m.nivel || '';
      if (m.objetivo) {
        p.objetivo = {
          tipo: m.objetivo.tipo || '',
          descricao: m.objetivo.descricao || '',
          dataProva: m.objetivo.dataProva || ''
        };
      }
      var principal = p.materias[0] || MATERIA_PADRAO;
      var doAluno = marcadosDoAluno(m);
      var daMateria = marcadosDaMateria(m, principal);
      p.fortes = doAluno.fortes.concat(daMateria.fortes.filter(function (x) {
        return doAluno.fortes.indexOf(x) < 0;
      }));
      p.atencao = [];
      p.lacunas = temLacunaDeAnoAnterior(principal) ? daMateria.lacunas.slice() : [];
      p.areas = areasSugeridas(p.atencao);
    }
    /* Proposta sem matéria nenhuma sairia com o bloco de identificação pela
     * metade. Cai em matemática, que é a mesma saída que materiasDoMapeamento
     * já usa quando não há marcação nenhuma. */
    if (!p.materias.length) p.materias = [MATERIA_PADRAO];
    if (aluno && aluno.id) {
      /* A duração habitual só vale quando existe hábito. Sem aula nenhuma
       * lançada, ela devolve os 60 minutos de recurso, e a proposta sairia
       * propondo uma hora para quem ela combina hora e meia: o encontro de
       * mapeamento dela é de 90. */
      var temAula = ((db && db.aulas) || []).some(function (a) { return a.alunoId === aluno.id; });
      if (temAula) p.encontro.duracaoMin = duracaoHabitual(db, aluno.id);
      var g = aluno.grade;
      if (g && g.dias && g.dias.length) p.encontro.porSemana = g.dias.length;
    }
    var pv = precoVigente(aluno, p.data);
    if (pv) p.cobranca.valorHora = pv.valorHora;
    if (!(p.cobranca.valorHora > 0)) p.cobranca.valorHora = 100;
    if (!(p.cobranca.ancora > 0)) p.cobranca.ancora = ancoraSugerida(p.cobranca.valorHora);
    return p;
  }

  /* A conta dos planos, pura e sem banco nenhum.
   *
   * op = { valorHora, ancora, descontos: { mensal, trimestral, semestral },
   *        porSemana, duracaoMin }
   *
   * DOIS PREÇOS ENTRAM, e a diferença entre eles é o desenho inteiro:
   *   valorHora é o que ela cobra HOJE, e é a base dos três planos.
   *   ancora é o preço da aula avulsa, mais alto, e só serve à linha da avulsa.
   *
   * Três contas, e é de propósito que sejam as três que ela confere de cabeça:
   *   valor por hora do plano = preço de hoje vezes (1 menos o desconto)
   *   horas do período        = vezes por semana x duração x 4, 12 ou 24 semanas
   *   total do período        = valor por hora x horas do período
   *
   * Por que a base é o preço dela e não a âncora: descontando da âncora, o
   * desconto tem que primeiro desfazer os 15 por cento de marcação antes de
   * virar desconto de verdade, e os padrões de 0, 5 e 10 deixavam os TRÊS
   * planos acima do preço dela. Medido com a aluna de R$ 130,00 a hora: a
   * âncora nascia em R$ 150,00 e a folha oferecia mensal R$ 150,00, trimestral
   * R$ 142,50 e semestral R$ 135,00. Ela mandaria para a família uma tabela
   * inteira acima do próprio preço sem perceber. Descontando do preço dela, os
   * mesmos 0, 5 e 10 dão mensal R$ 130,00, trimestral R$ 123,50 e semestral
   * R$ 117,00: o mensal cai exatamente no que ela já cobra, os outros dois
   * caem abaixo, e o número que ela digita quer dizer o que está escrito ao
   * lado dele. A marcação continua existindo, onde ela é verdade: na avulsa.
   *
   * Enquanto o desconto for zero ou mais, nenhum plano passa do preço dela.
   * Isso é por construção, e não por sorte de arredondamento.
   *
   * A distância que a família calcula é outra: ela compara o plano com a
   * avulsa impressa ao lado. É essa a que acende o aviso, quando passa de 25
   * por cento. A escada de 0, 5 e 10 é criticável; a de 0, 15 e 30 lê como
   * desespero e ainda destrói a receita de quem teria pago cheio. */
  function calcularPlanos(op) {
    op = op || {};
    var ancora = Math.max(0, numeroOu(op.ancora, 0));
    /* A base é o preço de hoje. Sem ele a conta cai na âncora, que é o
     * comportamento antigo: torto, mas nunca NaN nem zero. */
    var base = Math.max(0, numeroOu(op.valorHora, 0));
    if (!(base > 0)) base = ancora;
    if (!(ancora > 0)) ancora = base;
    var porSemana = Math.max(1, Math.round(numeroOu(op.porSemana, 1)));
    var duracaoMin = Math.max(1, Math.round(numeroOu(op.duracaoMin, 60)));
    var horasPorEncontro = duracaoMin / 60;
    var descontos = op.descontos || {};
    var maior = 0;
    var linhas = PLANOS.map(function (pl) {
      var pedido = Math.max(0, Math.min(100, numeroOu(descontos[pl.id], 0)));
      var valorHora = arredondaMeioReal(base * (1 - pedido / 100));
      var encontros = porSemana * pl.semanas;
      var horas = Math.round(encontros * horasPorEncontro * 100) / 100;
      var real = base > 0 ? (base - valorHora) / base * 100 : 0;
      var daAvulsa = ancora > 0 ? (ancora - valorHora) / ancora * 100 : 0;
      if (daAvulsa > maior) maior = daAvulsa;
      var contra = arredondaCentavos(valorHora - base);
      return {
        id: pl.id, rotulo: pl.rotulo, semanas: pl.semanas,
        desconto: pedido,
        descontoReal: Math.round(real * 100) / 100,
        descontoDaAvulsa: Math.round(daAvulsa * 100) / 100,
        valorHora: valorHora,
        encontros: encontros,
        horas: horas,
        total: arredondaCentavos(valorHora * horas),
        economia: arredondaCentavos((ancora - valorHora) * horas),
        /* O que a linha significa contra o preço que ela cobra hoje, já em
         * português: é a única leitura que responde "eu estou dando desconto
         * ou aumentando o preço de alguém?", e é a pergunta que ela faz. */
        contraAtual: contra,
        comparada: contra === 0
          ? 'no seu preço de hoje'
          : (contra < 0
            ? fmtMoeda(-contra) + ' abaixo do seu preço de hoje'
            : fmtMoeda(contra) + ' ACIMA do seu preço de hoje')
      };
    });
    var avisos = [];
    if (maior > LIMITE_DESCONTO) {
      avisos.push('Desconto acima de ' + LIMITE_DESCONTO +
        ' por cento costuma soar como preço inventado.');
    }
    /* Âncora abaixo do preço dela imprimiria uma tabela em que a aula sem
     * compromisso sai mais barata do que o plano, e a família vê isso na
     * mesma folha. */
    if (base > 0 && ancora < base) {
      avisos.push('A aula avulsa está mais barata do que o seu preço de hoje: ' +
        'na folha, o plano ficaria mais caro do que não ter plano nenhum.');
    }
    return {
      ancora: ancora,
      /* O preço de hoje volta na conta para a tela poder escrever a
       * comparação sem ter que ir buscá-lo noutro canto do registro. */
      precoAtual: base,
      porSemana: porSemana,
      duracaoMin: duracaoMin,
      horasPorEncontro: horasPorEncontro,
      avulsa: {
        valorHora: ancora,
        valorEncontro: arredondaCentavos(ancora * horasPorEncontro),
        contraAtual: arredondaCentavos(ancora - base)
      },
      planos: linhas,
      maiorDesconto: Math.round(maior * 100) / 100,
      avisos: avisos,
      aviso: avisos[0] || ''
    };
  }

  /* A conta de uma proposta inteira. Tela e folha entram por aqui, e é o que
   * garante que as duas mostrem os mesmos quatro números: chamar calcularPlanos
   * direto obriga quem chama a lembrar de passar o preço de hoje, e quem
   * esquecer vê a tabela descer da âncora outra vez. */
  function contaDaProposta(proposta) {
    var c = (proposta && proposta.cobranca) || {};
    var e = (proposta && proposta.encontro) || {};
    return calcularPlanos({
      valorHora: c.valorHora,
      ancora: c.ancora,
      descontos: c.descontos,
      porSemana: e.porSemana,
      duracaoMin: e.duracaoMin
    });
  }

  function planoDaProposta(proposta, planoId) {
    var conta = contaDaProposta(proposta);
    return conta.planos.filter(function (p) { return p.id === String(planoId || ''); })[0] || null;
  }

  /* O elo com a cobrança, que é a parte que evita conta errada lá na frente.
   *
   * Se ela fecha o trimestral a R$ 109 no PDF e esquece de criar a vigência em
   * aluno.precos, calcularFechamento cobra o valor antigo e a família recebe em
   * outubro uma conta que não bate com a proposta que aceitou. Aqui sai a linha
   * pronta para entrar em aluno.precos: um toque, e o fechamento dos meses
   * seguintes já sai certo. Quem confere sobreposição continua sendo
   * validarPrecos.
   *
   * A janela fecha por SEMANAS, e é o que faz as duas contas baterem. A folha
   * promete 4, 12 ou 24 encontros; o fechamento cobra aula por aula dentro da
   * vigência. Fechando por mês de calendário, o trimestral abria uma janela de
   * 04/09 a 03/12, que tem treze sextas-feiras, e a família recebia em outubro
   * uma conta maior do que a proposta que aceitou. Fechando por semanas a
   * janela vai de 04/09 a 26/11, com doze sextas exatas.
   *
   * O menos um dia é para a vigência seguinte poder começar no dia certo sem
   * sobreposição. */
  function vigenciaDoPlano(proposta, planoId) {
    var pl = planoPorId(planoId);
    if (!pl) return null;
    var linha = planoDaProposta(proposta, planoId);
    if (!linha || !(linha.valorHora > 0)) return null;
    var inicio = (proposta && proposta.data) || hojeIso();
    return {
      id: uid(),
      inicio: inicio,
      fim: somaDiasIso(inicio, pl.semanas * 7 - 1),
      valorHora: linha.valorHora
    };
  }

  function rotuloObjetivoDaProposta(o) {
    if (!o) return '';
    var base = objetivoPorId(o.tipo);
    var livre = (o.descricao || '').trim();
    return base ? (base.livre ? (livre || base.rotulo) : base.rotulo) : livre;
  }

  /* Ano escolar e colégio da proposta, no formato do fechamento. Lê do próprio
   * registro, e não do aluno, porque a proposta principal é a de quem ainda não
   * está cadastrado. */
  function contextoEscolarDaProposta(p) {
    var partes = [];
    var ano = (p && p.anoEscolar) || '';
    if (anoEscolarLivre(ano)) {
      var livre = ((p && p.anoEscolarOutro) || '').trim();
      if (livre) partes.push(livre);
    } else if (ANOS_ESCOLARES[ano]) {
      partes.push(ANOS_ESCOLARES[ano]);
    }
    if (p && p.colegio) partes.push(p.colegio);
    return partes.join(', ');
  }

  /* O que a folha diz sobre a criança, além do nome dela.
   *
   * É o nível, o objetivo, os pontos fortes, as lacunas e as áreas de
   * trabalho: cada um deles abre uma seção. Sem nenhum, as três primeiras
   * seções somem e sobram o nome, a matéria, o combinado e o preço. */
  function falaDaCrianca(p) {
    var o = (p && p.objetivo) || {};
    return !!((p && p.nivel) || o.tipo || (o.descricao || '').trim() ||
      ((p && p.fortes) || []).length || ((p && p.lacunas) || []).length ||
      ((p && p.areas) || []).length);
  }

  /* O que falta para a proposta poder sair, em ordem de quem lê a folha.
   *
   * A terceira regra é a que a medição pediu. Para o aluno que ainda não
   * existe, que é o caso principal, não há mapeamento nenhum: medido na folha
   * mínima, das 444 palavras impressas 232 eram o combinado de desmarcação e
   * NENHUMA era sobre a criança. A família recebe um documento sobre regras e
   * preço, com o nome do filho no alto. Quando não há mapeamento, o parágrafo
   * escrito por ela deixa de ser opcional: é o único lugar da folha em que
   * alguém fala da criança.
   *
   * Devolve frases prontas para avisar, e não códigos: quem chama mostra a
   * primeira e para. */
  function pendenciasDaProposta(p) {
    var out = [];
    if (!((p && p.aluno) || '').trim()) {
      out.push('Informe o nome do aluno. A proposta é escrita sobre ele.');
    }
    if (!((p && p.responsavel) || '').trim()) {
      out.push('Informe o responsável. A proposta tem destinatário: é para quem decide.');
    }
    if (!falaDaCrianca(p) && !((p && p.texto) || '').trim()) {
      out.push('Escreva duas ou três linhas sobre a criança. Sem o mapeamento, ' +
        'este parágrafo é a única parte da folha que fala dela: sem ele a ' +
        'família recebe uma página de combinados e preço.');
    }
    return out;
  }

  /* Traduz o registro para a folha, do mesmo jeito que calcularFechamento
   * traduz o mês: o pdf.js não conhece o Core e não deve conhecer, então tudo
   * o que sai daqui já são rótulos em português prontos para imprimir. */
  function dadosDaProposta(aluno, proposta) {
    var p = proposta || propostaNova();
    var c = p.cobranca || {};
    var enc = p.encontro || {};
    var principal = (p.materias && p.materias[0]) || MATERIA_PADRAO;
    var comb = (p.combinados && p.combinados.itens) || [];
    var planos = c.modo === 'planos' ? contaDaProposta(p) : null;
    var recomendada = c.modo === 'planos' ? vigenciaDoPlano(p, c.recomendado) : null;

    var areasPorGrupo = [];
    AREAS.forEach(function (g) {
      var itens = g.itens
        .filter(function (i) { return (p.areas || []).indexOf(i.id) >= 0; })
        .map(function (i) { return i.rotulo; });
      if (itens.length) areasPorGrupo.push({ grupo: g.grupo, itens: itens });
    });

    var origem = p.origem === 'nivelamento'
      ? ('Aula de nivelamento' + (p.dataOrigem ? ' em ' + ddmm(p.dataOrigem) : ''))
      : 'Primeira conversa com vocês';

    return {
      aluno: p.aluno || (aluno && aluno.nome) || '',
      responsavel: p.responsavel || (aluno && aluno.responsavel) || '',
      contextoEscolar: contextoEscolarDaProposta(p),
      materias: (p.materias || []).map(function (id) {
        var mat = materiaPorId(id);
        if (mat && mat.livre) return String(p.materiaOutra || '').trim() || mat.rotulo;
        return mat ? mat.rotulo : '';
      }).filter(Boolean),
      cidade: p.cidade || PROPOSTA_PADRAO.cidade,
      data: p.data,
      validaAte: p.validaAte,
      origem: origem,
      nivel: rotuloNivel(p.nivel),
      objetivo: {
        rotulo: rotuloObjetivoDaProposta(p.objetivo),
        dataProva: (p.objetivo && p.objetivo.dataProva) || ''
      },
      texto: (p.texto || '').trim(),
      fortes: rotulosDoMapa('fortes', p.fortes),
      atencao: rotulosDoMapa('atencao', p.atencao),
      lacunas: temLacunaDeAnoAnterior(principal) ? rotulosDoMapa('lacunas', p.lacunas) : [],
      areas: areasPorGrupo,
      encontro: {
        duracaoMin: numeroOu(enc.duracaoMin, 90),
        porSemana: numeroOu(enc.porSemana, 1),
        local: rotuloLocal(enc.local)
      },
      combinados: comb.filter(function (i) { return i.ligado !== false; })
        .map(function (i) { return { rotulo: i.rotulo, texto: i.texto }; }),
      vantagens: (p.vantagens || []).filter(function (i) { return i.ligado !== false; })
        .map(function (i) { return i.texto; }),
      cobranca: {
        modo: c.modo === 'planos' ? 'planos' : 'hora',
        valorHora: numeroOu(c.valorHora, 0),
        recomendado: c.recomendado || ''
      },
      planos: planos,
      reservadoAte: recomendada ? ddmmaaaa(recomendada.fim) : ''
    };
  }

  // ---------- em que etapa o aluno está ----------

  /* As quatro etapas que ela já usa, marcadas em três frentes, cada uma com a
   * data em que mudou. É o que mostra que a criança andou, e não só que ela
   * teve aula.
   *
   * A etapa mora na ficha do aluno, e não na janela da aula. Fica lá parada,
   * mostrando o ponto, e não pede nada: quando ela perceber a mudança, e isso
   * leva semanas ou meses, toca uma vez no botão. Se o aplicativo perguntasse a
   * cada aula seriam quase cinquenta respostas por mês, ela responderia no
   * automático e o dado deixaria de valer.
   *
   * Não existe aqui nenhuma função que escolha a etapa sozinha, e isso é de
   * propósito: seria inventar uma avaliação que ela não fez. */
  var ETAPAS = [
    { id: 'apoio-total', rotulo: 'Apoio total', ajuda: 'Precisa de você ao lado o tempo todo.' },
    { id: 'apoio-parcial', rotulo: 'Apoio parcial', ajuda: 'Começa sozinho e trava no meio.' },
    { id: 'supervisao', rotulo: 'Supervisão', ajuda: 'Faz sozinho, e você confere depois.' },
    { id: 'autonomia', rotulo: 'Autonomia', ajuda: 'Faz e confere sozinho.' }
  ];

  var FRENTES_ETAPA = [
    { id: 'conteudo', rotulo: 'Conteúdo', ajuda: 'Dar conta da matéria em si.' },
    { id: 'autonomia', rotulo: 'Autonomia', ajuda: 'Estudar e se organizar sem alguém junto.' },
    { id: 'confianca', rotulo: 'Confiança', ajuda: 'Acreditar que consegue, na aula e na prova.' }
  ];

  function etapaPorId(id) {
    return ETAPAS.filter(function (e) { return e.id === String(id || ''); })[0] || null;
  }

  function frenteDeEtapaPorId(id) {
    return FRENTES_ETAPA.filter(function (f) { return f.id === String(id || ''); })[0] || null;
  }

  function rotuloEtapa(id) {
    var e = etapaPorId(id);
    return e ? e.rotulo : '';
  }

  /* Aluno de hoje não tem o campo, e isso tem que continuar funcionando. */
  function etapasDe(aluno) {
    return (((aluno && aluno.etapas) || []).filter(function (r) {
      return r && frenteDeEtapaPorId(r.frente) && etapaPorId(r.etapa) && r.desde;
    })).slice().sort(function (a, b) { return String(a.desde).localeCompare(String(b.desde)); });
  }

  function registrosDaFrente(aluno, frente) {
    return etapasDe(aluno).filter(function (r) { return r.frente === frente; });
  }

  /* Onde o aluno está naquela frente hoje, e desde quando. Null quando ela
   * ainda não marcou nada: a linha aparece igual, dizendo que não foi marcada. */
  function etapaAtual(aluno, frente) {
    var lista = registrosDaFrente(aluno, frente);
    if (!lista.length) return null;
    var r = lista[lista.length - 1];
    var anterior = lista.length > 1 ? lista[lista.length - 2] : null;
    return {
      etapa: r.etapa,
      rotulo: rotuloEtapa(r.etapa),
      desde: r.desde,
      indice: ETAPAS.map(function (e) { return e.id; }).indexOf(r.etapa),
      anterior: anterior ? { etapa: anterior.etapa, rotulo: rotuloEtapa(anterior.etapa), desde: anterior.desde } : null
    };
  }

  /* As três linhas, sempre as três, na ordem. */
  function quadroDeEtapas(aluno) {
    return FRENTES_ETAPA.map(function (f) {
      return { frente: f.id, rotulo: f.rotulo, ajuda: f.ajuda, atual: etapaAtual(aluno, f.id) };
    });
  }

  /* O toque de "mudou de etapa". Devolve o registro criado, ou null quando não
   * há nada a registrar.
   *
   * Marcar de novo a etapa em que ele já está não vira registro: encheria o
   * histórico de linhas iguais e apagaria a data em que a mudança aconteceu de
   * verdade. Trocar de etapa no mesmo dia substitui o registro do dia, porque a
   * segunda escolha é conserto do toque errado, e não um aluno que andou duas
   * etapas numa tarde. */
  function registrarEtapa(aluno, frente, etapaId, dataIso) {
    if (!aluno || !frenteDeEtapaPorId(frente) || !etapaPorId(etapaId)) return null;
    var quando = dataIso || hojeIso();
    var atual = etapaAtual(aluno, frente);
    if (atual && atual.etapa === etapaId) return null;
    aluno.etapas = (aluno.etapas || []).filter(function (r) {
      return !(r && r.frente === frente && r.desde === quando);
    });
    var registro = { id: uid(), frente: frente, etapa: etapaId, desde: quando };
    aluno.etapas.push(registro);
    return registro;
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
      notaPrivada: '',
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

  /* O mês olhando para o calendário: o que já aconteceu e o que ainda vai.
   *
   * A aula nasce marcada como realizada, inclusive a que está lá na frente no
   * calendário. Por isso, no dia primeiro, a tela já mostrava o valor do mês
   * inteiro como se todas as aulas tivessem acontecido. O conserto não dá
   * trabalho a ela: ninguém confirma aula por aula. Quem manda é a data. O que
   * já passou conta como dado, a aula de HOJE conta como dada, e o que está
   * marcado à frente vai para uma soma separada, de previsto.
   *
   * Os campos antigos continuam querendo dizer exatamente o que sempre
   * quiseram, o mês inteiro: totalMin, totalValor, totalHoras, faixas,
   * qtdEncontros e minutosNaoCobrados. O documento que a família recebe e o PDF
   * são feitos com eles, e são fechados com o mês já vencido, quando previsto e
   * realizado são a mesma coisa. O que é novo entra em campo novo, e quem não
   * conhece o campo novo continua lendo o que sempre leu.
   *
   * hojeRef existe para o teste poder fixar o dia. Sem ele, é o dia de hoje. */
  function calcularFechamento(db, alunoId, mesIso, hojeRef) {
    var aluno = (db.alunos || []).filter(function (a) { return a.id === alunoId; })[0];
    if (!aluno) return null;

    var hoje = hojeRef || hojeIso();

    var aulas = (db.aulas || []).filter(function (x) {
      return x.alunoId === alunoId && mesDe(x.data) === mesIso;
    }).sort(ordenarAulas);

    var linhas = [];
    var totalMin = 0, totalValor = 0, minNaoCobrados = 0;
    var minFeitos = 0, valorFeito = 0;
    var minPrevistos = 0;
    var minDadosSemCobrar = 0, minDesmarcados = 0;
    /* Duas contagens por faixa de preço: a do mês inteiro, que é a de sempre, e
     * a do que já aconteceu. A segunda existe porque o documento da família
     * passou a cobrar só o que já aconteceu, e a composição por valor vigente
     * embaixo dele tem que somar exatamente o mesmo. */
    var faixas = {}, faixasFeitas = {};
    var semPreco = [];

    for (var i = 0; i < aulas.length; i++) {
      var au = aulas[i];
      var st = STATUS[au.status] || STATUS.realizada;
      var cobravel = (typeof au.cobravel === 'boolean') ? au.cobravel : st.cobravelPadrao;
      var pv = precoVigente(aluno, au.data);
      var vh = pv ? pv.valorHora : null;
      var dur = au.duracaoMin || 0;
      var valor = (cobravel && vh !== null) ? (dur / 60) * vh : 0;
      /* A aula de hoje conta como dada. Só o que está depois de hoje é previsto. */
      var futura = au.data > hoje;
      var aconteceu = au.status !== 'cancelada' && au.status !== 'falta';

      if (cobravel && vh === null && dur > 0) semPreco.push(au.data);

      if (cobravel) {
        totalMin += dur;
        totalValor += valor;
        if (futura) minPrevistos += dur;
        else { minFeitos += dur; valorFeito += valor; }
        if (vh !== null) {
          var k = String(vh);
          if (!faixas[k]) faixas[k] = { valorHora: vh, minutos: 0, valor: 0 };
          faixas[k].minutos += dur;
          faixas[k].valor += valor;
          if (!futura) {
            if (!faixasFeitas[k]) faixasFeitas[k] = { valorHora: vh, minutos: 0, valor: 0 };
            faixasFeitas[k].minutos += dur;
            faixasFeitas[k].valor += valor;
          }
        }
      } else {
        minNaoCobrados += dur;
        /* As duas contas do item "o que você deu e não cobrou". A aula extra na
         * véspera da prova e o horário esticado entram em minutosDadosSemCobrar,
         * e só depois de terem acontecido: não dá para ter dado de graça uma
         * aula que ainda não chegou. O horário que ficou reservado e não virou
         * aula entra em minutosDesmarcados, tenha sido desmarcado com aviso ou
         * perdido por falta, porque para ela é a mesma coisa: guardou o horário
         * e não cobrou por ele. Somados, os dois nunca passam de
         * minutosNaoCobrados, que continua sendo o total de sempre. */
        if (!aconteceu) minDesmarcados += dur;
        else if (!futura) minDadosSemCobrar += dur;
      }

      linhas.push({
        id: au.id,
        data: au.data,
        dia: diaSemanaCurto(au.data),
        hora: au.hora || '',
        duracaoMin: dur,
        futura: futura,
        status: au.status || 'realizada',
        statusRotulo: st.rotulo,
        /* O mesmo rótulo, escrito para um documento.
         *
         * A aula nasce como realizada, inclusive a que está lá na frente no
         * calendário, e chamar de "Realizada" uma aula do dia 23 num documento
         * impresso no dia 3 é dizer à família que ela aconteceu. Na tela dela o
         * rótulo continua o de sempre: lá o dia da aula está à vista, e quem lê
         * é quem marcou. */
        statusNaFolha: (futura && (st === STATUS.realizada || st === STATUS.reposicao))
          ? (st === STATUS.reposicao ? 'Reposição marcada' : 'Marcada')
          : st.rotulo,
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
    /* Agrupa por chave sem acento e sem caixa, e não pelo título cru.
     *
     * O assunto passou a poder ser digitado por ela no campo Outro, e aí
     * 'frações' numa aula e 'Frações' na seguinte virariam duas linhas no
     * documento que a família lê. O primeiro título visto é o que aparece.
     * O objeto é sem protótipo porque a chave agora vem de texto livre, e um
     * assunto chamado 'constructor' não pode derrubar a conta. */
    var vistos = Object.create(null);
    var contagemAreas = {};
    /* A mesma lista, restrita ao que já aconteceu.
     *
     * Ela às vezes adianta o assunto da aula que ainda vai acontecer, e o
     * documento da família dizia "Frações (18/09)" em Temas TRABALHADOS no dia
     * 3. Quem lê entende que já foi dado. As duas listas existem para a tela
     * dela continuar mostrando o mês inteiro e o documento mostrar o que
     * aconteceu. */
    var temasFeitos = [];
    var vistosFeitos = Object.create(null);
    var contagemFeitas = {};
    function guardaTema(mapa, lista, titulo, data) {
      var chave = chaveDeBusca(titulo || '');
      if (mapa[chave]) {
        if (mapa[chave].datas.indexOf(data) < 0) mapa[chave].datas.push(data);
        return;
      }
      mapa[chave] = { titulo: titulo, datas: [data] };
      lista.push(mapa[chave]);
    }
    linhas.forEach(function (l) {
      l.temas.forEach(function (t) {
        guardaTema(vistos, temasDoMes, t.titulo, l.data);
        if (!l.futura) guardaTema(vistosFeitos, temasFeitos, t.titulo, l.data);
      });
      l.areas.forEach(function (id) {
        contagemAreas[id] = (contagemAreas[id] || 0) + 1;
        if (!l.futura) contagemFeitas[id] = (contagemFeitas[id] || 0) + 1;
      });
    });
    function listaDeAreas(cont) {
      return Object.keys(cont).map(function (id) {
        return { id: id, rotulo: rotuloArea(id), vezes: cont[id] };
      }).filter(function (a) { return a.rotulo; })
        .sort(function (a, b) { return b.vezes - a.vezes || a.rotulo.localeCompare(b.rotulo); });
    }
    var areasDoMes = listaDeAreas(contagemAreas);
    var areasFeitas = listaDeAreas(contagemFeitas);

    function listaDeFaixas(mapa) {
      return Object.keys(mapa).map(function (k) { return mapa[k]; })
        .sort(function (a, b) { return a.valorHora - b.valorHora; });
    }
    var listaFaixas = listaDeFaixas(faixas);
    var listaFaixasFeitas = listaDeFaixas(faixasFeitas);



    var contaEncontro = function (l) { return l.cobravel || l.status !== 'cancelada'; };

    /* O previsto sai por diferença, e não de uma soma própria, para que o que
     * aconteceu mais o previsto dê SEMPRE o total do mês na tela. Arredondar as
     * duas somas em separado deixaria um centavo sobrando quando a hora não
     * divide redondo, e um centavo que não fecha na tela do dinheiro dela vira
     * desconfiança do aplicativo inteiro. */
    var vTotal = Math.round(totalValor * 100) / 100;
    var vFeito = Math.round(valorFeito * 100) / 100;
    var vPrevisto = Math.round((vTotal - vFeito) * 100) / 100;

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
      totalValor: vTotal,
      minutosNaoCobrados: minNaoCobrados,
      /* Só para ela, nunca para a família. Ver item "o que você deu e não
       * cobrou": mostrar essa conta a quem paga transforma gentileza em dívida. */
      minutosDadosSemCobrar: minDadosSemCobrar,
      minutosDesmarcados: minDesmarcados,
      /* O dia de referência que separou o que aconteceu do que vai acontecer. */
      hoje: hoje,
      minFeitos: minFeitos,
      horasFeitas: fmtHoras(minFeitos),
      valorFeito: vFeito,
      minPrevistos: minPrevistos,
      horasPrevistas: fmtHoras(minPrevistos),
      valorPrevisto: vPrevisto,
      faixas: listaFaixas,
      precoUnico: listaFaixas.length === 1 ? listaFaixas[0].valorHora : null,
      /* Os três campos abaixo são a versão "só o que já aconteceu" de faixas,
       * temasDoMes e areasDoMes. Quem não conhecer os campos novos continua
       * lendo os de sempre, que continuam sendo o mês inteiro. */
      faixasFeitas: listaFaixasFeitas,
      precoUnicoFeito: listaFaixasFeitas.length === 1 ? listaFaixasFeitas[0].valorHora : null,
      semPreco: semPreco,
      resumoTexto: resumo ? (resumo.texto || '') : '',
      contextoEscolar: contextoEscolarDe(aluno),
      temasDoMes: temasDoMes,
      areasDoMes: areasDoMes,
      temasFeitos: temasFeitos,
      areasFeitas: areasFeitas,
      qtdEncontros: linhas.filter(contaEncontro).length,
      qtdEncontrosFeitos: linhas.filter(function (l) { return contaEncontro(l) && !l.futura; }).length,
      qtdEncontrosPrevistos: linhas.filter(function (l) { return contaEncontro(l) && l.futura; }).length
    };
  }

  function calcularMesInteiro(db, mesIso, hojeRef) {
    var out = [];
    (db.alunos || []).forEach(function (a) {
      var f = calcularFechamento(db, a.id, mesIso, hojeRef);
      if (f && f.linhas.length) out.push(f);
    });
    out.sort(function (x, y) { return y.totalValor - x.totalValor; });
    return out;
  }

  /* Os totais do mês somados de todos os alunos, já separando o que aconteceu
   * do que ainda vai acontecer. É o que a tela do fechamento mostra em cima:
   * o número grande é o realizado, e o previsto fica embaixo, menor. */
  function totaisDoMes(fechs) {
    var t = {
      alunos: 0, encontros: 0, encontrosFeitos: 0, encontrosPrevistos: 0,
      minutos: 0, valor: 0,
      minFeitos: 0, valorFeito: 0,
      minPrevistos: 0, valorPrevisto: 0,
      minutosDadosSemCobrar: 0, minutosDesmarcados: 0
    };
    (fechs || []).forEach(function (f) {
      if (!f) return;
      t.alunos += 1;
      t.encontros += f.qtdEncontros || 0;
      t.encontrosFeitos += f.qtdEncontrosFeitos || 0;
      t.encontrosPrevistos += f.qtdEncontrosPrevistos || 0;
      t.minutos += f.totalMin || 0;
      t.valor += f.totalValor || 0;
      t.minFeitos += f.minFeitos || 0;
      t.valorFeito += f.valorFeito || 0;
      t.minPrevistos += f.minPrevistos || 0;
      t.minutosDadosSemCobrar += f.minutosDadosSemCobrar || 0;
      t.minutosDesmarcados += f.minutosDesmarcados || 0;
    });
    t.valor = Math.round(t.valor * 100) / 100;
    t.valorFeito = Math.round(t.valorFeito * 100) / 100;
    /* Pela mesma razão de sempre: feito mais previsto tem que dar o total. */
    t.valorPrevisto = Math.round((t.valor - t.valorFeito) * 100) / 100;
    return t;
  }

  // ---------- cada aluno, desde quando e por quanto ----------

  /* Esta parte é só dela. Não entra em documento nenhum que a família receba.
   *
   * Uma linha por aluno, com desde quando ele estuda, quanto paga, há quantos
   * meses está nesse valor e quanto ele pesa no mês. Ao lado, uma sugestão de
   * reajuste, que é sugestão e nada mais: quem conhece cada família é ela. */

  /* Os dois números do IBGE que entram na sugestão.
   *
   * A referência é quanto as ESCOLAS subiram, e não a inflação geral: subitem
   * 8101003, Ensino fundamental, do IPCA. Em doze meses fechados em julho de
   * 2026 ele deu 8,81 por cento, contra 4,44 da inflação geral. As escolas
   * sobem quase o dobro, e isso se repete há cinco anos.
   *
   * Este par fica escrito aqui, com a data do mês a que se refere, porque ela
   * dá aula na casa das famílias e muitas vezes está sem sinal. Sem internet o
   * aplicativo usa este par e diz de quando ele é, para ela nunca olhar um
   * número sem saber se está velho. Com internet, baixa o par novo do IBGE e
   * guarda em db.ajustes.ibge. A busca nunca segura a tela. */
  var IBGE_ESCRITO = {
    escolas12m: 8.81,
    inflacao12m: 4.44,
    referencia: '2026-07'
  };

  /* Um pedido só traz os dois números, do mesmo lugar, e eles se atualizam
   * juntos: agregado 7060 do IPCA, variação acumulada em doze meses (variável
   * 2265), categoria 7169 para o índice geral e 107671 para o ensino
   * fundamental. */
  var IBGE_CAT_GERAL = '7169';
  var IBGE_CAT_ESCOLAS = '107671';
  var IBGE_URL = 'https://servicodados.ibge.gov.br/api/v3/agregados/7060/periodos/-1' +
    '/variaveis/2265?localidades=N1[1]&classificacao=315[' +
    IBGE_CAT_GERAL + ',' + IBGE_CAT_ESCOLAS + ']';

  function mesDoPeriodoIbge(p) {
    var s = String(p || '');
    if (!/^\d{6}$/.test(s)) return '';
    return s.slice(0, 4) + '-' + s.slice(4);
  }

  /* Lê a resposta do IBGE. Devolve null se faltar qualquer um dos dois números,
   * porque meio índice não serve para sugerir reajuste nenhum: nesse caso o
   * aplicativo continua com o que já tinha. */
  function lerIndicesDoIbge(dados) {
    if (!dados || !dados.length) return null;
    var out = { escolas12m: null, inflacao12m: null, referencia: '' };
    for (var i = 0; i < dados.length; i++) {
      var res = (dados[i] && dados[i].resultados) || [];
      for (var j = 0; j < res.length; j++) {
        var cls = (res[j].classificacoes || [])[0];
        var cat = (cls && cls.categoria) || {};
        var chave = Object.keys(cat)[0];
        if (chave !== IBGE_CAT_GERAL && chave !== IBGE_CAT_ESCOLAS) continue;
        var series = res[j].series || [];
        for (var k = 0; k < series.length; k++) {
          var serie = (series[k] && series[k].serie) || {};
          var periodos = Object.keys(serie).sort();
          if (!periodos.length) continue;
          var p = periodos[periodos.length - 1];
          var v = parseFloat(String(serie[p]).replace(',', '.'));
          if (!isFinite(v) || v < -50 || v > 100) continue;
          if (chave === IBGE_CAT_ESCOLAS) out.escolas12m = v;
          else out.inflacao12m = v;
          var m = mesDoPeriodoIbge(p);
          if (m > out.referencia) out.referencia = m;
        }
      }
    }
    if (out.escolas12m === null || out.inflacao12m === null || !out.referencia) return null;
    return out;
  }

  /* O par que vale agora: o baixado, se houver, e senão o escrito no código.
   * Sempre acompanhado de quando ele é, para ela saber a idade do número. */
  function indicesDeReajuste(db) {
    var g = db && db.ajustes && db.ajustes.ibge;
    if (g && typeof g.escolas12m === 'number' && typeof g.inflacao12m === 'number' && g.referencia) {
      return {
        escolas12m: g.escolas12m,
        inflacao12m: g.inflacao12m,
        referencia: g.referencia,
        baixadoEm: g.baixadoEm || '',
        baixado: true
      };
    }
    return {
      escolas12m: IBGE_ESCRITO.escolas12m,
      inflacao12m: IBGE_ESCRITO.inflacao12m,
      referencia: IBGE_ESCRITO.referencia,
      baixadoEm: '',
      baixado: false
    };
  }

  /* Quanto ela quer subir acima da inflação, em pontos percentuais, somado à
   * alta das escolas na hora de sugerir. Nasce em zero e é dela. */
  function margemDeReajuste(db) {
    var m = db && db.ajustes && db.ajustes.reajusteAcimaDaInflacao;
    if (typeof m !== 'number' || !isFinite(m)) return 0;
    if (m < 0) return 0;
    if (m > 20) return 20;
    return Math.round(m * 10) / 10;
  }

  /* Meses inteiros entre duas datas. Devolve null quando falta alguma. */
  function mesesEntre(deIso, ateIso) {
    if (!deIso || !ateIso) return null;
    var a = partesData(deIso), b = partesData(ateIso);
    if (!isFinite(a.a) || !isFinite(b.a)) return null;
    var n = (b.a - a.a) * 12 + (b.m - a.m);
    if (isFinite(a.d) && isFinite(b.d) && b.d < a.d) n -= 1;
    return n < 0 ? 0 : n;
  }

  function pctBR(v) {
    var s = (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
    return s.replace(/,00$/, '').replace(/(,\d)0$/, '$1') + '%';
  }

  /* A sugestão: o valor novo, quanto isso daria no ano e o motivo em português.
   * Sem preço cadastrado não há o que sugerir, e aí devolve null. */
  function sugestaoDeReajuste(valorHora, indices, margem, minutosDoMes, mesesNoValor) {
    if (typeof valorHora !== 'number' || !(valorHora > 0)) return null;
    var m = margem || 0;
    var pct = (indices.escolas12m || 0) + m;
    if (!(pct > 0)) return null;
    var novo = Math.round(valorHora * (1 + pct / 100) * 100) / 100;
    var porHora = Math.round((novo - valorHora) * 100) / 100;
    var horasDoMes = (minutosDoMes || 0) / 60;
    var noAno = Math.round(porHora * horasDoMes * 12 * 100) / 100;

    var motivo = 'As escolas subiram ' + pctBR(indices.escolas12m) +
      ' em doze meses, medido pelo IBGE até ' + mesExtenso(indices.referencia).toLowerCase() +
      '. A inflação geral no mesmo período foi ' + pctBR(indices.inflacao12m) + '.';
    if (m > 0) motivo += ' Somei os ' + pctBR(m) + ' acima que você escolheu.';
    if (typeof mesesNoValor === 'number') {
      if (mesesNoValor <= 0) motivo += ' Este valor começou a valer neste mês.';
      else if (mesesNoValor === 1) motivo += ' Você está com este valor há um mês.';
      else motivo += ' Você está com este valor há ' + mesesNoValor + ' meses.';
    }

    return {
      percentual: Math.round(pct * 100) / 100,
      valorAtual: valorHora,
      valorNovo: novo,
      porHora: porHora,
      noAno: noAno,
      motivo: motivo
    };
  }

  /* Desde quando o aluno estuda com ela.
   *
   * Três fontes, nesta ordem, e a primeira que existir manda:
   *   1. o campo "Aluno desde" da ficha, que foi ela quem escreveu;
   *   2. a data da primeira aula registrada;
   *   3. o começo da primeira vigência de preço.
   *
   * A ordem é o conserto de duas respostas para a mesma pergunta. Antes, isto
   * pegava a MAIS ANTIGA entre a primeira aula e a primeira vigência, e ignorava
   * o campo da ficha: com "Aluno desde" preenchido como 01/06/2026 e um preço
   * valendo desde 01/01/2026, a aba Histórico dizia 01/06/2026 e o painel de
   * valores dizia 01/01/2026. Ela decide reajuste olhando isso e repete o
   * número para a família.
   *
   * O começo da vigência fica por último porque é data de administração: um
   * preço pode ter sido cadastrado com data retroativa, ou antes da primeira
   * aula, sem que o aluno estudasse ali. Só vale quando não há nada melhor. */
  function desdeQuandoEstuda(db, aluno) {
    var escrito = String((aluno && aluno.desde) || '').trim();
    if (escrito) return escrito;

    var primeiraAula = '';
    ((db && db.aulas) || []).forEach(function (a) {
      if (!aluno || a.alunoId !== aluno.id || !a.data) return;
      if (!primeiraAula || a.data < primeiraAula) primeiraAula = a.data;
    });
    if (primeiraAula) return primeiraAula;

    var primeiraVigencia = '';
    ((aluno && aluno.precos) || []).forEach(function (p) {
      if (!p || !p.inicio) return;
      if (!primeiraVigencia || p.inicio < primeiraVigencia) primeiraVigencia = p.inicio;
    });
    return primeiraVigencia || '';
  }

  /* A lista inteira: uma linha por aluno com aula ou preço, ordenada por quanto
   * pesa no mês. Sem alerta e sem cobrança, só o que já está guardado. */
  function panoramaDeValores(db, mesIso, hojeRef) {
    var hoje = hojeRef || hojeIso();
    var indices = indicesDeReajuste(db);
    var margem = margemDeReajuste(db);
    var fechs = calcularMesInteiro(db, mesIso, hoje);
    var porAluno = {};
    fechs.forEach(function (f) { porAluno[f.aluno.id] = f; });

    var totalDoMes = 0;
    fechs.forEach(function (f) { totalDoMes += f.totalValor; });

    var linhas = [];
    (db.alunos || []).forEach(function (aluno) {
      var f = porAluno[aluno.id] || null;
      var temPreco = ((aluno.precos || []).length > 0);
      if (!f && !temPreco) return;

      var pv = precoVigente(aluno, hoje);
      var valorHora = pv ? pv.valorHora : null;
      var desde = desdeQuandoEstuda(db, aluno);
      var valorNoMes = f ? f.totalValor : 0;
      var minutosNoMes = f ? f.totalMin : 0;
      var mesesNoValor = pv && pv.inicio ? mesesEntre(pv.inicio, hoje) : null;

      linhas.push({
        alunoId: aluno.id,
        nome: aluno.nome,
        desde: desde,
        mesesEstudando: desde ? mesesEntre(desde, hoje) : null,
        valorHora: valorHora,
        desdeNesseValor: pv ? (pv.inicio || '') : '',
        mesesNoValor: mesesNoValor,
        minutosNoMes: minutosNoMes,
        valorNoMes: valorNoMes,
        fatiaDoMes: totalDoMes > 0 ? valorNoMes / totalDoMes : 0,
        sugestao: sugestaoDeReajuste(valorHora, indices, margem, minutosNoMes, mesesNoValor)
      });
    });

    linhas.sort(function (a, b) {
      return b.valorNoMes - a.valorNoMes || a.nome.localeCompare(b.nome);
    });

    return {
      mes: mesIso,
      hoje: hoje,
      indices: indices,
      margem: margem,
      totalDoMes: Math.round(totalDoMes * 100) / 100,
      linhas: linhas
    };
  }

  // ---------- Markdown ----------
  // Regra da casa: nunca usar travessao (em-dash ou en-dash) em entregavel.

  /* As duas listas do fechamento, temas e áreas, só saem no documento quando
   * ela mandar exibir.
   *
   * Foi decisão dela. Hoje o que ela usa é a agenda, o valor a receber e o texto
   * que escreve no fechamento; registrar assunto e marcar áreas são coisas que
   * está começando a explorar, e uma exploração não pode mudar sozinha o
   * documento que vai para a família. A caixa nasce desmarcada e fica lembrada:
   * quando ela decidir que o registro está do jeito que quer, marca uma vez.
   *
   * A tela dela continua mostrando tudo. O filtro é só do documento que sai. */
  function exibeListas(opcoes) {
    return !!(opcoes && opcoes.exibirTemasEAreas);
  }

  function markdownFechamento(f, opcoes) {
    opcoes = opcoes || {};
    var L = [];
    L.push('# Controle de aulas');
    L.push('');
    L.push('**Aluno:** ' + f.alunoNome);
    if (f.responsavel) L.push('**Responsável:** ' + f.responsavel);
    L.push('**Mês:** ' + f.mesExtenso);
    if (f.grade) L.push('**Dias e horário:** ' + f.grade);
    /* O documento que a família recebe nunca conta como dada uma aula que ainda
     * não aconteceu.
     *
     * A aula nasce marcada como realizada, inclusive a que está lá na frente no
     * calendário. Enquanto este documento somava o mês inteiro, mandá-lo no dia
     * 3 dizia à família que onze encontros tinham acontecido quando três
     * tinham. O item 02 desta rodada separou as duas somas no motor; aqui a
     * tabela se separa junto: em cima o que aconteceu até hoje, embaixo o que
     * está marcado à frente, com o total do mês fechado por escrito para
     * ninguém precisar somar.
     *
     * Com o mês vencido não há nada à frente, e aí sai exatamente o documento
     * de sempre, palavra por palavra: é assim que o fechamento fechado não
     * mudou de forma. */
    var previstas = (f.linhas || []).filter(function (l) { return l.futura; });
    var feitas = previstas.length
      ? f.linhas.filter(function (l) { return !l.futura; })
      : (f.linhas || []);
    var ate = previstas.length ? ' até ' + ddmm(f.hoje) : '';
    var minCobrados = previstas.length ? f.minFeitos : f.totalMin;
    var horasCobradas = previstas.length ? f.horasFeitas : f.totalHoras;
    var valorACobrar = previstas.length ? f.valorFeito : f.totalValor;
    var faixasACobrar = (previstas.length ? f.faixasFeitas : f.faixas) || f.faixas || [];
    var temasNoTexto = (previstas.length ? f.temasFeitos : f.temasDoMes) || f.temasDoMes || [];
    var areasNoTexto = (previstas.length ? f.areasFeitas : f.areasDoMes) || f.areasDoMes || [];

    var CABECALHO = ['| Data | Dia | Horário | Duração | Situação | Cobrada | R$/h | Valor |',
      '|---|---|---|---|---|---|---:|---:|'];
    function linhaDaTabela(l) {
      return '| ' + ddmm(l.data) +
        ' | ' + l.dia +
        ' | ' + (l.hora || '') +
        ' | ' + fmtDuracao(l.duracaoMin) +
        ' | ' + (l.statusNaFolha || l.statusRotulo) +
        ' | ' + (l.cobravel ? 'sim' : 'não') +
        ' | ' + (l.valorHora !== null ? fmtMoeda(l.valorHora) : 'sem preço') +
        ' | ' + fmtMoeda(l.cobravel ? l.valor : 0) + ' |';
    }

    L.push('');
    L.push('## Datas trabalhadas');
    L.push('');
    if (feitas.length || !previstas.length) {
      /* Sem nada marcado à frente, a tabela sai como sempre saiu, inclusive
       * vazia no mês sem aula nenhuma. */
      L.push(CABECALHO[0]);
      L.push(CABECALHO[1]);
      feitas.forEach(function (l) { L.push(linhaDaTabela(l)); });
      L.push('');
    } else {
      L.push('Nenhuma aula aconteceu até ' + ddmmaaaa(f.hoje) + '.');
      L.push('');
    }
    L.push('**Total de horas cobradas' + ate + ':** ' + horasCobradas + ' h (' + fmtHorasDecimal(minCobrados) + ' horas)');
    /* A conta do que ela deu e não cobrou só sai no documento da família
     * enquanto ela deixar. Nasce ligada, porque é assim que o fechamento sempre
     * foi, e ela desliga em Ajustes se achar que a comunicação ficou agressiva.
     *
     * Há um argumento dos dois lados, e por isso a escolha é dela: mostrar dá
     * valor ao que ela deu de graça, e mostrar também transforma gentileza em
     * dívida na cabeça de quem lê. */
    if (f.minutosNaoCobrados > 0 && (!opcoes || opcoes.mostrarNaoCobradas !== false)) {
      L.push('**Horas não cobradas:** ' + fmtHoras(f.minutosNaoCobrados) + ' h');
    }
    if (faixasACobrar.length > 1) {
      L.push('');
      L.push('Composição por valor vigente:');
      faixasACobrar.forEach(function (fx) {
        L.push('- ' + fmtHoras(fx.minutos) + ' h a ' + fmtMoeda(fx.valorHora) + '/h: ' + fmtMoeda(fx.valor));
      });
    }
    L.push('');
    L.push('**Total a cobrar' + ate + ':** ' + fmtMoeda(valorACobrar));
    if (f.semPreco.length) {
      L.push('');
      L.push('> Atenção: não há valor por hora vigente para ' + f.semPreco.map(ddmm).join(', ') + '.');
    }

    if (previstas.length) {
      L.push('');
      L.push('## Ainda marcadas neste mês');
      L.push('');
      L.push(CABECALHO[0]);
      L.push(CABECALHO[1]);
      previstas.forEach(function (l) { L.push(linhaDaTabela(l)); });
      L.push('');
      L.push('**Encontros ainda marcados:** ' + f.qtdEncontrosPrevistos);
      L.push('**Horas ainda por dar:** ' + f.horasPrevistas + ' h');
      L.push('**Valor destas datas:** ' + fmtMoeda(f.valorPrevisto));
      L.push('');
      L.push('> Estas datas ainda não aconteceram e não entram no total acima. ' +
        'Se todas acontecerem, o mês fecha em ' + f.qtdEncontros + ' encontro' +
        (f.qtdEncontros === 1 ? '' : 's') + ', ' + f.totalHoras + ' h e ' +
        fmtMoeda(f.totalValor) + '.');
    }

    if (exibeListas(opcoes) && temasNoTexto.length) {
      L.push('');
      L.push('## Temas trabalhados');
      L.push('');
      temasNoTexto.forEach(function (t) {
        L.push('- ' + t.titulo + ' (' + t.datas.map(ddmm).join(', ') + ')');
      });
    }

    if (exibeListas(opcoes) && areasNoTexto.length) {
      L.push('');
      L.push('## Áreas trabalhadas');
      L.push('');
      areasNoTexto.forEach(function (a) {
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
    /* Este documento é dela, e a tabela de cima continua sendo o mês inteiro:
     * é com ela que se planeja o mês. Mas o fechamento de cada aluno, logo
     * abaixo, passou a cobrar só o que já aconteceu, e uma linha dizendo 11
     * encontros em cima de um total de 3 encontros embaixo faria ela desconfiar
     * da conta. Esta linha diz qual é qual, e só aparece com o mês correndo. */
    var comFuturo = (fechs || []).filter(function (f) {
      return f && ((f.qtdEncontrosPrevistos || 0) > 0 || (f.minPrevistos || 0) > 0);
    });
    if (comFuturo.length && comFuturo[0].hoje) {
      L.push('');
      L.push('> A tabela acima é do mês inteiro. O fechamento de cada aluno, abaixo, ' +
        'traz o total do que já aconteceu até ' + ddmmaaaa(comFuturo[0].hoje) + '.');
    }
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

  // ---------- trilhas para fechar uma lacuna ----------

  /* A trilha é a sequência de assuntos que precisam vir antes daquele em que o
   * aluno travou, em ordem, derivada do pré-requisito que cada tema já declara.
   *
   * Ela existe porque marcar "Frações" no mapeamento levava a uma busca que
   * devolve dezoito temas em ordem de relevância, começando pelo 8º ano e
   * pulando para o 4º: uma lista sem ordem, em que ela decidia de cabeça por
   * onde começar. Aqui a ordem sai do grafo, e não da relevância.
   *
   * Tudo abaixo é função pura e recebe a lista de temas por argumento: assim
   * roda em node, no teste, sem navegador e sem rede. */

  var ORDEM_SERIE = ['01', '02', '03', '04', '05', '06', '07', '08', '09', 'em1', 'em2', 'em3'];

  function posDaSerie(s) {
    var i = ORDEM_SERIE.indexOf(String(s || ''));
    return i < 0 ? 99 : i;
  }

  /* O ano do aluno, com a mesma precedência que o contextoEscolarDe usa: o
   * mapeamento mais recente manda, e o cadastro do aluno é o recurso.
   *
   * Sai já traduzido para o que o banco de temas entende. Quem quiser o que ela
   * escolheu de verdade, para mostrar na tela, usa o contextoEscolarDe. */
  function anoEscolarDe(aluno) {
    var m = mapeamentoAtual(aluno);
    return serieParaTemas((m && m.anoEscolar) || (aluno && aluno.anoEscolar) || '');
  }

  function itemDaLacuna(lacunaId) {
    var achado = null;
    (MAPA || []).forEach(function (g) {
      if (g.chave !== 'lacunas') return;
      (g.itens || []).forEach(function (it) { if (it.id === lacunaId) achado = it; });
    });
    return achado;
  }

  /* Os fins de trilha possíveis de uma lacuna, e qual deles propor.
   *
   * O proposto é o mais alto que não passa do ano do aluno: dar conteúdo de 6º
   * ano para tapar buraco de aluno do 5º é adiantar, não recuperar. Aluno sem
   * ano registrado recebe o mais baixo, que é o lado seguro de errar, e a tela
   * diz de onde veio. Quem confirma é ela. */
  function alvosDaLacuna(temas, lacunaId, anoEscolar) {
    var item = itemDaLacuna(lacunaId);
    if (!item || !item.alvos || !item.alvos.length) return { candidatos: [], sugerido: '' };
    var porId = {};
    (temas || []).forEach(function (t) { porId[t.id] = t; });
    var candidatos = item.alvos.map(function (id) {
      var t = porId[id];
      return t ? { id: id, titulo: tituloDoTema(t), serie: t.serie } : null;
    }).filter(Boolean);
    if (!candidatos.length) return { candidatos: [], sugerido: '' };

    var sugerido = candidatos[0].id;
    if (anoEscolar) {
      var teto = posDaSerie(anoEscolar);
      candidatos.forEach(function (c) {
        if (posDaSerie(c.serie) <= teto) sugerido = c.id;
      });
    }
    return { candidatos: candidatos, sugerido: sugerido, rotulo: item.rotulo };
  }

  /* O título do tema, seja ele do formato do banco (pt.titulo) ou do índice
   * enxuto que o aplicativo baixa. */
  function tituloDoTema(t) {
    if (!t) return '';
    if (t.pt && t.pt.titulo) return t.pt.titulo;
    return t.titulo || t.id;
  }

  /* A escada até o alvo.
   *
   * Fecho transitivo para trás sobre os pré-requisitos, depois ordenação
   * topológica de Kahn com desempate por (ano, número do id).
   *
   * A topológica é necessária, e não enfeite: ordenar direto por ano e número
   * erra em dois pares do banco de hoje, MAT09-06 que depende de MAT09-07 e
   * MATEM1-09 que depende de MATEM1-15, e ordenar por dificuldade erra em cinco,
   * sendo o mais visível MAT06-03 (múltiplos e MMC), que é pré-requisito de
   * frações e tem dificuldade maior: a trilha de fração começaria por fração.
   *
   * O corte guarda os passos MAIS PRÓXIMOS do alvo, e dispara na maioria das
   * lacunas: porcentagem no 7º ano dá dez passos, potenciação no 8º dá nove,
   * probabilidade dá nove. Por isso os cortados voltam na resposta: a tela
   * oferece puxar mais de trás, um por vez. */
  function trilhaDerivada(temas, alvoId, opcoes) {
    opcoes = opcoes || {};
    var maximo = opcoes.maximo || 6;
    var porId = {};
    (temas || []).forEach(function (t) { porId[t.id] = t; });
    if (!porId[alvoId]) return { passos: [], cortados: [], alvo: null };

    // 1. fecho para trás, em largura, à prova de ciclo e de aresta quebrada
    var dentro = {};
    var fila = [alvoId];
    dentro[alvoId] = true;
    while (fila.length) {
      var id = fila.shift();
      var pres = (porId[id] && porId[id].prerequisitos) || [];
      for (var i = 0; i < pres.length; i++) {
        var p = pres[i];
        if (!porId[p] || dentro[p]) continue;
        dentro[p] = true;
        fila.push(p);
      }
    }

    // 2. ordenação topológica de Kahn, desempatando por ano e número
    var ids = Object.keys(dentro);
    var grau = {}, saiDe = {};
    ids.forEach(function (id) { grau[id] = 0; saiDe[id] = []; });
    ids.forEach(function (id) {
      ((porId[id].prerequisitos) || []).forEach(function (p) {
        if (!dentro[p]) return;
        grau[id]++;
        saiDe[p].push(id);
      });
    });
    var numeroDoId = function (id) {
      var m = String(id).match(/(\d+)$/);
      return m ? +m[1] : 0;
    };
    var antes = function (a, b) {
      var d = posDaSerie(porId[a].serie) - posDaSerie(porId[b].serie);
      if (d) return d;
      d = numeroDoId(a) - numeroDoId(b);
      if (d) return d;
      return a < b ? -1 : (a > b ? 1 : 0);
    };
    var prontos = ids.filter(function (id) { return !grau[id]; }).sort(antes);
    var ordem = [];
    while (prontos.length) {
      var atual = prontos.shift();
      ordem.push(atual);
      saiDe[atual].forEach(function (v) {
        grau[v]--;
        if (!grau[v]) prontos.push(v);
      });
      prontos.sort(antes);
    }

    var passos = ordem.map(function (id) {
      return {
        temaId: id, titulo: tituloDoTema(porId[id]),
        serie: porId[id].serie, duracaoMin: porId[id].duracaoMin || 60,
        feitoEm: null, aulaId: null
      };
    });

    /* O corte tira do começo, que é o mais distante do alvo. Sem o alvo a
     * trilha não faz sentido, então ele nunca sai. */
    var cortados = [];
    if (passos.length > maximo) {
      cortados = passos.slice(0, passos.length - maximo);
      passos = passos.slice(passos.length - maximo);
    }
    return { passos: passos, cortados: cortados, alvo: porId[alvoId] };
  }

  /* Quanto tempo cada encontro costuma durar com aquele aluno: a duração mais
   * frequente nas aulas dele, com 60 minutos de recurso. Nunca uma data de
   * término: o calendário dela tem cancelamento, prova e feriado, e data errada
   * é pior do que data nenhuma. */
  function duracaoHabitual(db, alunoId) {
    var contagem = {};
    ((db && db.aulas) || []).forEach(function (a) {
      if (a.alunoId !== alunoId) return;
      /* O campo é duracaoMin: é assim que a aula é gravada, em aulaNova e na
       * materialização da série. Enquanto isto lia a.duracao, que não existe
       * em aula nenhuma, a contagem ficava sempre vazia e a função devolvia os
       * 60 minutos de recurso para todo mundo. Media-se assim: uma aluna com
       * três aulas de 90 minutos lançadas recebia proposta oferecendo 1h, e a
       * tabela inteira de planos saía calculada sobre a duração errada. */
      var d = a.duracaoMin || 0;
      if (d > 0) contagem[d] = (contagem[d] || 0) + 1;
    });
    var melhor = 0, vezes = -1;
    Object.keys(contagem).forEach(function (d) {
      if (contagem[d] > vezes || (contagem[d] === vezes && +d > melhor)) {
        melhor = +d; vezes = contagem[d];
      }
    });
    return melhor || 60;
  }

  function encontrosPrevistos(passos, duracaoMin) {
    var soma = 0;
    (passos || []).forEach(function (p) { soma += p.duracaoMin || 60; });
    var d = duracaoMin || 60;
    return Math.max(1, Math.ceil(soma / d));
  }

  // ---------- as trilhas guardadas no aluno ----------

  function trilhasDe(aluno) {
    return (aluno && aluno.trilhas) || [];
  }

  function trilhasAtivas(aluno) {
    return trilhasDe(aluno).filter(function (t) { return !t.encerradaEm; });
  }

  function proximoPasso(trilha) {
    var ps = (trilha && trilha.passos) || [];
    for (var i = 0; i < ps.length; i++) if (!ps[i].feitoEm) return ps[i];
    return null;
  }

  function passosFeitos(trilha) {
    return ((trilha && trilha.passos) || []).filter(function (p) { return p.feitoEm; }).length;
  }

  /* Passo que o aluno já viu em alguma aula anterior nasce marcado, com a data
   * daquela aula. É aqui que as duas frentes se encostam: o registro de assunto
   * alimenta a trilha antes mesmo de ela existir. */
  function marcarOQueJaFoiDado(db, alunoId, passos) {
    var quando = {};
    ((db && db.aulas) || []).forEach(function (a) {
      if (a.alunoId !== alunoId) return;
      if (a.status && a.status !== 'realizada' && a.status !== 'reposicao') return;
      temasDaAula(a).forEach(function (t) {
        if (!t.id) return;
        if (!quando[t.id] || a.data > quando[t.id].data) quando[t.id] = { data: a.data, id: a.id };
      });
    });
    (passos || []).forEach(function (p) {
      var q = quando[p.temaId];
      if (!q) return;
      p.feitoEm = q.data;
      p.aulaId = q.id;
      p.jaEra = true;
    });
    return passos;
  }

  function criarTrilha(dados) {
    return {
      id: uid(),
      alunoId: dados.alunoId,
      lacunaId: dados.lacunaId || null,
      titulo: dados.titulo || '',
      alvoId: dados.alvoId,
      criadaEm: dados.criadaEm || hojeIso(),
      origem: dados.lacunaId ? 'lacuna' : 'manual',
      passos: dados.passos || [],
      encerradaEm: null,
      motivo: ''
    };
  }

  function moverPasso(trilha, de, para) {
    var ps = (trilha && trilha.passos) || [];
    if (de < 0 || de >= ps.length || para < 0 || para >= ps.length) return false;
    var x = ps.splice(de, 1)[0];
    ps.splice(para, 0, x);
    return true;
  }

  function removerPasso(trilha, indice) {
    var ps = (trilha && trilha.passos) || [];
    if (indice < 0 || indice >= ps.length) return false;
    ps.splice(indice, 1);
    return true;
  }

  function encerrarTrilha(trilha, data, motivo) {
    if (!trilha) return false;
    trilha.encerradaEm = data || hojeIso();
    trilha.motivo = motivo || '';
    return true;
  }

  /* O assunto registrado numa aula faz a trilha andar sozinha.
   *
   * Marca só o passo cujo tema é aquele, nunca os anteriores: pular etapa é
   * decisão dela, não do aplicativo. E carimba a data DA AULA, não a de hoje,
   * porque ela lança aula atrasada e usa repetir para trás.
   *
   * Só conta em aula realizada ou reposição. Falta sem aviso é aula que não
   * aconteceu, e cancelada também. */
  function marcarPassoPorAssunto(aluno, aula, item) {
    if (!aluno || !aula || !item || !item.id) return null;
    var st = aula.status || 'realizada';
    if (st !== 'realizada' && st !== 'reposicao') return null;
    var marcado = null;
    trilhasAtivas(aluno).forEach(function (tr) {
      if (marcado) return;
      (tr.passos || []).forEach(function (p) {
        if (marcado || p.feitoEm || p.temaId !== item.id) return;
        p.feitoEm = aula.data;
        p.aulaId = aula.id;
        marcado = { trilha: tr, passo: p };
      });
    });
    if (marcado) item.passoDe = marcado.trilha.id;
    return marcado;
  }

  /* Aula que deixou de acontecer desmarca os passos que ela tinha fechado. Sem
   * isto a trilha contaria como andado o que não foi dado, que é o pior tipo de
   * erro: o que fica calado. */
  function revisarPassosDaAula(aluno, aula) {
    if (!aluno || !aula) return 0;
    var st = aula.status || 'realizada';
    if (st === 'realizada' || st === 'reposicao') return 0;
    var n = 0;
    trilhasDe(aluno).forEach(function (tr) {
      (tr.passos || []).forEach(function (p) {
        if (p.aulaId !== aula.id) return;
        p.feitoEm = null;
        p.aulaId = null;
        n++;
      });
    });
    return n;
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
    totaisDoMes: totaisDoMes, panoramaDeValores: panoramaDeValores,
    indicesDeReajuste: indicesDeReajuste, margemDeReajuste: margemDeReajuste,
    sugestaoDeReajuste: sugestaoDeReajuste, lerIndicesDoIbge: lerIndicesDoIbge,
    desdeQuandoEstuda: desdeQuandoEstuda, mesesEntre: mesesEntre, pctBR: pctBR,
    IBGE_URL: IBGE_URL, IBGE_ESCRITO: IBGE_ESCRITO,
    markdownFechamento: markdownFechamento, markdownMesInteiro: markdownMesInteiro,
    AREAS: AREAS, rotuloArea: rotuloArea, temasDaAula: temasDaAula,
    ultimoEncontro: ultimoEncontro,
    MAPA: MAPA, NIVEIS: NIVEIS, itemDoMapa: itemDoMapa, rotulosDoMapa: rotulosDoMapa,
    rotuloNivel: rotuloNivel, mapeamentoNovo: mapeamentoNovo, mapeamentosDe: mapeamentosDe,
    mapeamentoAtual: mapeamentoAtual, mapeado: mapeado,
    MATERIAS: MATERIAS, MATERIA_PADRAO: MATERIA_PADRAO, materiaPorId: materiaPorId,
    rotuloMateria: rotuloMateria, temLacunaDeAnoAnterior: temLacunaDeAnoAnterior,
    itensDoAluno: itensDoAluno, itensDaMateria: itensDaMateria,
    gruposDoAluno: gruposDoAluno, gruposDaMateria: gruposDaMateria,
    marcadosDoAluno: marcadosDoAluno, marcadosDaMateria: marcadosDaMateria,
    marcarNaMateria: marcarNaMateria, garantirMateria: garantirMateria,
    cobrancaDaMateria: cobrancaDaMateria, definirCobranca: definirCobranca,
    materiasDoMapeamento: materiasDoMapeamento,
    OBJETIVOS: OBJETIVOS, objetivoPorId: objetivoPorId, objetivoDe: objetivoDe,
    LOCAIS_ENCONTRO: LOCAIS_ENCONTRO, rotuloLocal: rotuloLocal,
    PLANOS: PLANOS, planoPorId: planoPorId, PROPOSTA_PADRAO: PROPOSTA_PADRAO,
    LIMITE_DESCONTO: LIMITE_DESCONTO, propostaPadraoDe: propostaPadraoDe,
    combinadosPadrao: combinadosPadrao, vantagensPadrao: vantagensPadrao,
    propostaNova: propostaNova, propostasDe: propostasDe, propostaAtual: propostaAtual,
    preencherProposta: preencherProposta, areasSugeridas: areasSugeridas,
    calcularPlanos: calcularPlanos, ancoraSugerida: ancoraSugerida,
    contaDaProposta: contaDaProposta,
    planoDaProposta: planoDaProposta, vigenciaDoPlano: vigenciaDoPlano,
    pendenciasDaProposta: pendenciasDaProposta, falaDaCrianca: falaDaCrianca,
    dadosDaProposta: dadosDaProposta, arredondaMeioReal: arredondaMeioReal,
    somaDiasIso: somaDiasIso, somaMesesIso: somaMesesIso,
    semanasAteAProva: semanasAteAProva,
    ETAPAS: ETAPAS, FRENTES_ETAPA: FRENTES_ETAPA, etapaPorId: etapaPorId,
    rotuloEtapa: rotuloEtapa, etapasDe: etapasDe, registrosDaFrente: registrosDaFrente,
    etapaAtual: etapaAtual, quadroDeEtapas: quadroDeEtapas, registrarEtapa: registrarEtapa,
    lembreteDoMapeamento: lembreteDoMapeamento, textoDoLembrete: textoDoLembrete,
    contextoEscolarDe: contextoEscolarDe, ANOS_ESCOLARES: ANOS_ESCOLARES,
    ANOS_ESCOLARES_ORDEM: ANOS_ESCOLARES_ORDEM, anoEscolarLivre: anoEscolarLivre,
    serieParaTemas: serieParaTemas,
    conflitosDe: conflitosDe, minutosDaHora: minutosDaHora,
    dividirAula: dividirAula, desfazerDivisao: desfazerDivisao,
    podeDividir: podeDividir, metadesDe: metadesDe, somarMinutosNaHora: somarMinutosNaHora,
    uid: uid, nomeArquivo: nomeArquivo,
    chaveDeBusca: chaveDeBusca, casaBusca: casaBusca,
    alvosDaLacuna: alvosDaLacuna, trilhaDerivada: trilhaDerivada,
    duracaoHabitual: duracaoHabitual, encontrosPrevistos: encontrosPrevistos,
    trilhasDe: trilhasDe, trilhasAtivas: trilhasAtivas, proximoPasso: proximoPasso,
    passosFeitos: passosFeitos, marcarOQueJaFoiDado: marcarOQueJaFoiDado,
    criarTrilha: criarTrilha, moverPasso: moverPasso, removerPasso: removerPasso,
    encerrarTrilha: encerrarTrilha, marcarPassoPorAssunto: marcarPassoPorAssunto,
    revisarPassosDaAula: revisarPassosDaAula, anoEscolarDe: anoEscolarDe,
    itemDaLacuna: itemDaLacuna,
    exibeListas: exibeListas
  };
});
