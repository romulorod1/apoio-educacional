/* busca.js
 * Buscador de assunto.
 *
 * Um campo só, um resultado só, ordenado, e cada linha diz por que casou.
 *
 * O problema que isto resolve: a busca anterior comparava pedaço de texto cru,
 * então digitar mais piorava o resultado. "equação" achava 7 temas, "equação do
 * primeiro grau" achava zero, porque o título no banco é "Equações do 1º grau".
 * Ela digitava o nome certo do assunto e a tela ficava vazia.
 *
 * A regra aqui é outra, e é a mesma que Gmail e Drive usam:
 *
 *   1. procura no assunto e também dentro do conteúdo, com pesos diferentes;
 *   2. palavra rara pesa mais do que palavra comum, medida no próprio banco;
 *   3. não exige a ordem das palavras, e afrouxa a exigência antes de
 *      devolver tela vazia;
 *   4. reescreve o que foi digitado para o vocabulário do banco antes de
 *      procurar (apelido, sigla, plural, erro de digitação).
 *
 * Sem dependência de navegador: roda no Node para os testes.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Busca = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ================================================================ normalizar */

  function semAcento(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  /* Ordinais que o banco e ela escrevem de jeitos diferentes: o título diz
   * "1º grau" e ela digita "primeiro grau".
   *
   * Cardinal não entra aqui. "duas" virar 2 fazia "equações com duas
   * incógnitas" responder por "equação do 2º grau", que é outro assunto. */
  var ORDINAIS = {
    primeiro: '1', primeira: '1', primeiros: '1', primeiras: '1', '1o': '1', '1a': '1',
    segundo: '2', segunda: '2', segundos: '2', segundas: '2', '2o': '2', '2a': '2',
    terceiro: '3', terceira: '3', terceiros: '3', terceiras: '3', '3o': '3', '3a': '3',
    quarto: '4', quarta: '4', quartos: '4', quartas: '4', '4o': '4', '4a': '4'
  };

  /* Cardinais que só viram número quando vêm antes de grau, ano ou série.
   * Fora disso continuam sendo a palavra que ela escreveu. */
  var CARDINAIS = { um: '1', uma: '1', dois: '2', duas: '2', tres: '3', quatro: '4' };
  var DEPOIS_DO_NUMERO = { grau: 1, ano: 1, serie: 1, membro: 1, membros: 1 };

  /* Palavras terminadas em s que não são plural. Sem esta lista a regra de
   * "ais para al" transformava "mais" em "mal" e a busca devolvia o banco
   * quase inteiro. */
  var NAO_E_PLURAL = {
    mais: 1, menos: 1, seis: 1, dois: 1, duas: 1, tres: 1, depois: 1, apos: 1, atras: 1,
    pais: 1, lapis: 1, gas: 1, mes: 1, pos: 1, vies: 1, cais: 1, jamais: 1,
    demais: 1, ambos: 1, ambas: 1
  };

  /* Reduz plural do português ao singular, de forma grosseira e suficiente.
   * Não é um analisador de morfologia: é o mínimo para "equações" encontrar
   * "equação" e "polinômios" encontrar "polinômio". */
  function aoSingular(p) {
    if (p.length <= 3 || NAO_E_PLURAL[p]) return p;
    if (/oes$/.test(p)) return p.slice(0, -3) + 'ao';     // equacoes  -> equacao
    if (/aes$/.test(p)) return p.slice(0, -3) + 'ao';     // paes      -> pao
    if (/ais$/.test(p)) return p.slice(0, -2) + 'l';      // decimais  -> decimal
    if (/eis$/.test(p)) return p.slice(0, -2) + 'l';      // papeis    -> papel
    if (/ois$/.test(p)) return p.slice(0, -2) + 'l';      // farois    -> farol
    if (/uis$/.test(p)) return p.slice(0, -2) + 'l';      // funis     -> funil
    if (/ns$/.test(p)) return p.slice(0, -2) + 'm';       // homens    -> homem
    if (/[rzs]es$/.test(p)) return p.slice(0, -2);        // raizes    -> raiz
    if (/s$/.test(p)) return p.slice(0, -1);              // temas     -> tema
    return p;
  }

  /* Corta terminação de verbo, para "fatorar" encontrar "fatoração" e
   * "simplificando" encontrar "simplificação". Só corta se o que sobrar ainda
   * for uma palavra de tamanho decente, senão vira ruído. */
  var VERBAIS = ['ando', 'endo', 'indo', 'ada', 'ado', 'ar', 'er', 'ir'];
  function semVerbo(p) {
    for (var i = 0; i < VERBAIS.length; i++) {
      var s = VERBAIS[i];
      if (p.length >= s.length + 5 && p.slice(-s.length) === s) return p.slice(0, -s.length);
    }
    return p;
  }

  /* Uma palavra do texto ou da busca, na forma em que as duas se encontram. */
  function raiz(p) {
    var x = semAcento(p).replace(/[^a-z0-9]/g, '');
    if (!x) return '';
    if (ORDINAIS[x]) return ORDINAIS[x];
    return aoSingular(x);
  }

  function palavrasDe(texto) {
    var cru = semAcento(texto).split(/[^a-z0-9]+/);
    var out = [];
    for (var i = 0; i < cru.length; i++) {
      if (!cru[i]) continue;
      var r = raiz(cru[i]);
      if (r) out.push(r);
    }
    return out;
  }

  /* ================================================================ vocabulário */

  /* Palavras com que se pede uma busca, e não conteúdo de tema nenhum. Ela
   * digita "exercício de fração", e o que ela quer é fração. Estas nunca são
   * exigidas: se casarem, valem um empurrãozinho, e só. */
  var VAZIAS = {
    de: 1, da: 1, do: 1, das: 1, dos: 1, e: 1, o: 1, a: 1, os: 1, as: 1,
    em: 1, no: 1, na: 1, nos: 1, nas: 1, com: 1, por: 1, para: 1, um: 1, uma: 1,
    que: 1, se: 1, ao: 1, aos: 1, ou: 1, sem: 1,
    exercicio: 1, exercicios: 1, questao: 1, questoes: 1, problema: 1, problemas: 1,
    lista: 1, atividade: 1, atividades: 1, conteudo: 1, aula: 1, aulas: 1,
    materia: 1, tema: 1, temas: 1, assunto: 1, assuntos: 1, sobre: 1, tipo: 1,
    revisao: 1, professora: 1, dever: 1, tarefa: 1, prova: 1
  };

  /* O jeito que ela fala, traduzido para o jeito que o banco escreve.
   *
   * Isto existe porque há assunto que o banco cobre bem e nomeia de outro
   * jeito: o aluno chega dizendo que a prova é de Bhaskara, e a palavra
   * Bhaskara não aparece em lugar nenhum do banco, que fala em discriminante
   * e delta. Sem esta tabela a tela fica vazia num assunto que existe.
   *
   * Cada apelido é uma sequência de exigências, e cada exigência aceita
   * qualquer uma das suas alternativas. O teste confere que toda palavra
   * alvo existe mesmo no banco, para nenhuma tradução morta entrar aqui. */
  var APELIDOS = [
    /* As formas faladas da potencia. Elas existiam no texto do banco enquanto
     * as contas estavam escritas por extenso, e sumiram quando o banco passou
     * a usar simbolo. Ela continua falando assim, entao a busca precisa saber.
     * Frase mais longa vem primeiro: a primeira que casar vence. */
    ['elevado ao quadrado', [['potencia', 'expoente', 'quadrado']]],
    ['elevado ao cubo', [['potencia', 'expoente', 'cubo']]],
    ['elevado a', [['potencia', 'expoente']]],
    ['ao quadrado', [['quadrado', 'potencia', 'expoente']]],
    ['ao cubo', [['cubo', 'potencia', 'expoente']]],
    ['dividido por', [['divisao']]],

    // fórmula do 2º grau: o banco fala em delta e discriminante
    ['bhaskara', [['discriminante', 'delta']]],
    ['baskara', [['discriminante', 'delta']]],

    // o colégio diz análise combinatória, o banco quebrou em três temas
    ['analise combinatoria', [['arranjo', 'permutacao', 'combinacao', 'contagem']]],
    ['combinatoria', [['arranjo', 'permutacao', 'combinacao', 'contagem']]],

    // siglas do caderno, que o casamento por prefixo nunca alcança
    ['pa', [['progressao'], ['aritmetica']]],
    ['pg', [['progressao'], ['geometrica']]],
    ['tg', [['tangente']]],
    /* O normalizador descarta letra solta e pontuacao: "f(g(x))" vira consulta
     * vazia e "fog" e palavra desconhecida; "sen" nao e token de tema nenhum,
     * entao "sen(a+b)" nao chegava ao tema de identidades. */
    ['fog', [['composta']]],
    ['sen', [['seno']]],
    ['mmc', [['minimo'], ['multiplo']]],
    ['mdc', [['maximo'], ['divisor']]],

    // nome de sala contra nome de livro
    ['funcao do 1 grau', [['funcao'], ['afim']]],
    ['funcao 1 grau', [['funcao'], ['afim']]],
    ['funcao do 2 grau', [['funcao'], ['quadratica', 'parabola']]],
    ['funcao 2 grau', [['funcao'], ['quadratica', 'parabola']]],
    ['parabola', [['quadratica']]],

    // como se fala nos anos iniciais
    ['conta de dividir', [['divisao']]],
    ['conta de vezes', [['multiplicacao']]],
    ['conta de mais', [['adicao', 'soma']]],
    ['conta de menos', [['subtracao']]],
    ['vezes', [['multiplicacao']]],

    // outros nomes populares
    // nome da identidade contra o nome do capitulo
    ['quadrado da soma', [['produto'], ['notavel']]],
    ['quadrado da diferenca', [['produto'], ['notavel']]],
    ['soma pela diferenca', [['produto'], ['notavel']]],

    ['teorema de tales', [['tales']]],
    ['regra de 3', [['regra'], ['tres']]],
    ['raiz quadrada', [['raiz']]],
    ['numero negativo', [['inteiro', 'negativo']]],
    ['grafico de pizza', [['setor', 'grafico']]],
    ['conjunto numerico', [['conjunto', 'numero']]]
  ];

  /* Ano escolar dito de todo jeito, para virar filtro em vez de virar palavra
   * procurada. "fração 7 ano" tem que achar fração no 7º, e não procurar a
   * palavra ano dentro dos temas. */
  var ANOS = {
    '2 ano': '02', '3 ano': '03', '4 ano': '04', '5 ano': '05', '6 ano': '06',
    '7 ano': '07', '8 ano': '08', '9 ano': '09',
    '1 serie': 'em1', '2 serie': 'em2', '3 serie': 'em3',
    '1 medio': 'em1', '2 medio': 'em2', '3 medio': 'em3',
    'segundo ano': '02', 'terceiro ano': '03', 'quarto ano': '04',
    'quinto ano': '05', 'sexto ano': '06', 'setimo ano': '07',
    'oitavo ano': '08', 'nono ano': '09'
  };

  /* ================================================================ índice */

  /* O índice é montado uma vez, quando o banco é gerado, e chega pronto. Cada
   * tema vira listas de palavras já reduzidas, uma por peso:
   *
   *   t = título      r = resumo
   *   d = destaque    palavra que se repete no conteúdo, sinal de que o tema
   *                   trata mesmo do assunto e não o cita de passagem
   *   e = enunciados  x = explicação
   *
   * A palavra aparece só na lista de maior peso em que ocorre, e é isso que
   * mantém o arquivo pequeno. Montar isto no tablet a cada abertura não faz
   * sentido: o banco não muda entre uma aula e outra. */

  var CAMPOS = [['t', 'titulo'], ['r', 'resumo'], ['d', 'destaque'],
                ['e', 'enunciado'], ['x', 'explicacao']];
  var PESO = { titulo: 100, resumo: 40, destaque: 20, enunciado: 6, explicacao: 3 };
  var ONDE = ['titulo', 'resumo', 'destaque', 'enunciado', 'explicacao'];

  /* Quantas vezes a palavra precisa se repetir no conteúdo para virar
   * destaque. Medido no banco: com 4, cerca de 30 palavras por tema sobem,
   * e são as que descrevem o tema. */
  var VEZES_PARA_DESTAQUE = 4;

  function contar(texto) {
    var c = {};
    palavrasDe(texto || '').forEach(function (p) { c[p] = (c[p] || 0) + 1; });
    return c;
  }

  /* Constrói o índice a partir dos temas inteiros. Usado pelo gerador do banco
   * e pelos testes, nunca pelo aplicativo em uso. */
  function montarIndice(temas) {
    return temas.map(function (t) {
      var usado = {};
      var novas = function (conta, filtro) {
        var out = [];
        Object.keys(conta).forEach(function (p) {
          if (usado[p]) return;
          if (filtro && !filtro(conta[p])) return;
          usado[p] = 1; out.push(p);
        });
        return out.sort();
      };
      var cTit = contar(t.titulo);
      var cRes = contar(t.resumo);
      var cEnu = contar(t.enunciados);
      var cExp = contar(t.explicacao);
      var tit = novas(cTit);
      var res = novas(cRes);
      /* destaque sai do conteúdo, contando enunciados e explicação juntos */
      var cCon = {};
      Object.keys(cEnu).forEach(function (p) { cCon[p] = (cCon[p] || 0) + cEnu[p]; });
      Object.keys(cExp).forEach(function (p) { cCon[p] = (cCon[p] || 0) + cExp[p]; });
      var des = novas(cCon, function (n) { return n >= VEZES_PARA_DESTAQUE; })
        .filter(function (p) {
          /* número solto e palavra de ligação se repetem em todo tema e não
           * dizem do que o tema trata: fora do destaque. */
          return p.length >= 4 && !VAZIAS[p] && !/^[0-9]/.test(p);
        });
      var enu = novas(cEnu);
      var exp = novas(cExp);
      return {
        i: t.id, s: t.serie,
        t: tit.join(' '), r: res.join(' '), d: des.join(' '),
        e: enu.join(' '), x: exp.join(' ')
      };
    });
  }

  /* ================================================================ raridade */

  /* Peso inverso à frequência, o mesmo princípio de qualquer buscador: palavra
   * que aparece em quase todo tema não separa nada, palavra que aparece em
   * dois separa muito.
   *
   * Medido no banco: "exemplo", "erro" e "comum" aparecem nos 146 temas, e
   * hoje valem tanto quanto "hipotenusa", que aparece em 11. Sem isto, quem
   * decide a ordem da lista é o texto de rodapé dos exercícios.
   *
   * A conta roda uma vez, na primeira busca, e fica guardada no próprio
   * índice: 17 ms de uma vez só, contra guardar mais 54 KB no arquivo. */
  function medirRaridade(indice) {
    if (indice.__df) return indice.__df;
    var df = {}, n = indice.length;
    for (var k = 0; k < indice.length; k++) {
      var reg = indice[k], visto = {};
      for (var c = 0; c < CAMPOS.length; c++) {
        var lista = reg[CAMPOS[c][0]];
        if (!lista) continue;
        var ps = lista.split(' ');
        for (var i = 0; i < ps.length; i++) {
          if (ps[i] && !visto[ps[i]]) { visto[ps[i]] = 1; df[ps[i]] = (df[ps[i]] || 0) + 1; }
        }
      }
    }
    var peso = {};
    Object.keys(df).forEach(function (p) {
      /* fórmula de sempre, normalizada para uma palavra de raridade média
       * valer perto de 1, e a palavra que está em todo tema valer perto de 0 */
      peso[p] = Math.log(1 + (n - df[p] + 0.5) / (df[p] + 0.5)) / Math.log(15);
    });
    try {
      Object.defineProperty(indice, '__df', { value: peso, enumerable: false });
    } catch (e) { indice.__df = peso; }
    return peso;
  }

  function raridade(peso, termo) {
    if (peso[termo] != null) return peso[termo];
    /* palavra que não está no banco: se chegou aqui foi por prefixo, e vale
     * o mesmo que uma palavra rara */
    return 1.2;
  }

  /* ================================================================ procurar */

  /* Onde a palavra aparece neste tema, ou null se não aparece em lugar nenhum.
   * Procura a palavra inteira primeiro, e só depois aceita como início de
   * palavra, porque quem digitou inteiro quer o inteiro. */
  function ondeAparece(reg, termo, aceitaPrefixo) {
    var i, campo, lista;
    for (i = 0; i < CAMPOS.length; i++) {
      campo = CAMPOS[i];
      lista = reg[campo[0]];
      if (lista && (' ' + lista + ' ').indexOf(' ' + termo + ' ') >= 0) {
        return { onde: campo[1], exato: true, termo: termo };
      }
    }
    if (!aceitaPrefixo || termo.length < 3) return null;
    for (i = 0; i < CAMPOS.length; i++) {
      campo = CAMPOS[i];
      lista = reg[campo[0]];
      if (lista && (' ' + lista).indexOf(' ' + termo) >= 0) {
        return { onde: campo[1], exato: false, termo: termo };
      }
    }
    return null;
  }

  /* Um grupo é uma exigência que aceita alternativas: ou "quadratica" ou
   * "parabola" resolve a mesma exigência. Vale a melhor que casar. */
  function grupoAparece(reg, grupo, aceitaPrefixo) {
    var melhor = null;
    for (var i = 0; i < grupo.length; i++) {
      var a = ondeAparece(reg, grupo[i], aceitaPrefixo);
      if (!a) continue;
      if (!melhor || ONDE.indexOf(a.onde) < ONDE.indexOf(melhor.onde) ||
          (a.onde === melhor.onde && a.exato && !melhor.exato)) melhor = a;
    }
    return melhor;
  }

  function melhorLugar(onde) {
    for (var i = 0; i < ONDE.length; i++) {
      if (onde[ONDE[i]]) return ONDE[i];
    }
    return 'explicacao';
  }

  /* Exigir todas as palavras deixa a tela vazia quando ela descreve o que quer
   * em vez de nomear. Então o que manda é quantas exigências casaram, e casar
   * todas domina a ordenação. Quem casou pouco some da lista. */
  function pontuar(reg, grupos, vazios, minimo, peso) {
    var nota = 0, onde = {}, achou, casadas = 0, i;
    for (i = 0; i < grupos.length; i++) {
      achou = grupoAparece(reg, grupos[i], true);
      if (!achou) continue;
      casadas++;
      nota += PESO[achou.onde] * (achou.exato ? 1 : 0.7) * raridade(peso, achou.termo);
      onde[achou.onde] = true;
    }
    if (casadas < minimo) return null;

    for (i = 0; i < vazios.length; i++) {
      achou = ondeAparece(reg, vazios[i], false);
      if (achou) nota += PESO[achou.onde] * 0.05;
    }

    /* Quanto do título a busca cobriu. Um título curto e igual ao que ela
     * digitou tem que ganhar de um título longo que só contém a palavra no
     * meio: "Porcentagem" ganha de "Porcentagem, juros e descontos". */
    var doTitulo = reg.t ? reg.t.split(' ').length : 0;
    if (doTitulo) {
      var noTitulo = 0;
      for (i = 0; i < grupos.length; i++) {
        var a = grupoAparece(reg, grupos[i], true);
        if (a && a.onde === 'titulo') noTitulo++;
      }
      nota += (noTitulo / doTitulo) * 60;
    }

    var fracao = casadas / grupos.length;
    return {
      nota: fracao * fracao * 1000 + nota / grupos.length,
      /* a nota sem o prêmio por ter casado tudo. É ela que diz se o tema
       * trata do assunto ou só o menciona de passagem, e é por ela que a
       * cauda da lista é cortada. */
      qualidade: nota / grupos.length,
      completa: casadas === grupos.length,
      casadas: casadas,
      onde: melhorLugar(onde)
    };
  }

  function colher(indice, grupos, vazios, minimo, peso, serie) {
    var saida = [];
    for (var k = 0; k < indice.length; k++) {
      if (serie && indice[k].s !== serie) continue;
      var p = pontuar(indice[k], grupos, vazios, minimo, peso);
      if (p) {
        saida.push({
          id: indice[k].i, serie: indice[k].s, nota: p.nota, qualidade: p.qualidade,
          onde: p.onde, completa: p.completa, casadas: p.casadas, palavras: grupos.length
        });
      }
    }
    return saida;
  }

  /* ---------------------------------------------------------- ler a busca */

  /* Transforma o que ela digitou em: exigências, palavras opcionais e, se ela
   * mencionou, o ano escolar. É aqui que apelido e sigla viram vocabulário do
   * banco, antes de qualquer comparação. */
  function lerBusca(texto) {
    var cru = semAcento(texto).split(/[^a-z0-9]+/).filter(Boolean);

    /* cardinal só vira número quando vier antes de grau, ano ou série */
    var toks = [];
    for (var i = 0; i < cru.length; i++) {
      var p = cru[i];
      if (CARDINAIS[p] && DEPOIS_DO_NUMERO[semAcento(cru[i + 1] || '')]) {
        toks.push(CARDINAIS[p]);
      } else if (ORDINAIS[p]) {
        toks.push(ORDINAIS[p]);
      } else {
        toks.push(p);
      }
    }

    /* ano escolar mencionado vira filtro, e sai da lista de palavras */
    var serie = null;
    for (i = 0; i < toks.length - 1; i++) {
      var par = toks[i] + ' ' + toks[i + 1];
      if (ANOS[par]) { serie = ANOS[par]; toks.splice(i, 2); i--; }
    }
    if (!serie) {
      var solto = toks.indexOf('fundamental') >= 0 ? null : null;
      if (solto) serie = solto;
    }

    /* apelido: a frase mais longa que casar vence, e vira exigência do banco */
    var grupos = [], vazios = [], usado = {};
    for (i = 0; i < toks.length; i++) {
      if (usado[i]) continue;
      var casouApelido = false;
      for (var a = 0; a < APELIDOS.length; a++) {
        var chave = APELIDOS[a][0].split(' ');
        if (chave.length > toks.length - i) continue;
        var igual = true;
        for (var c = 0; c < chave.length; c++) {
          var meu = raiz(toks[i + c]), dele = raiz(chave[c]);
          if (meu === dele) continue;
          /* ela abrevia a primeira palavra e o resto vem inteiro:
           * "func 1 grau" tem que chegar em "função do 1º grau".
           * Palavra de ligação não abrevia nada: sem esta guarda, o "com" de
           * "exercício de área com fração" virava "análise combinatória". */
          if (c === 0 && meu.length >= 4 && !VAZIAS[meu] && dele.indexOf(meu) === 0) continue;
          igual = false; break;
        }
        if (!igual) continue;
        /* apelido de uma letra ou sigla curta só vale se for palavra inteira */
        APELIDOS[a][1].forEach(function (g) { grupos.push(g.slice()); });
        for (c = 0; c < chave.length; c++) usado[i + c] = 1;
        i += chave.length - 1;
        casouApelido = true;
        break;
      }
      if (casouApelido) continue;

      var r = raiz(toks[i]);
      if (!r) continue;
      if (VAZIAS[toks[i]] || VAZIAS[r]) { vazios.push(r); continue; }

      /* Letra solta é resto de digitação ("regra d tres"), e exigi-la joga o
       * resultado certo para fora da lista. */
      if (r.length === 1 && !/[0-9]/.test(r)) { vazios.push(r); continue; }

      /* Número solto só é exigência quando diz de que grau ou de que ano o
       * assunto é. Em "ângulos notáveis 30 45 60" os números são exemplo, e
       * exigi-los deixa a busca sem os temas de trigonometria. */
      if (/^[0-9]+$/.test(r) &&
          !DEPOIS_DO_NUMERO[semAcento(toks[i + 1] || '')] &&
          !DEPOIS_DO_NUMERO[semAcento(toks[i - 1] || '')]) {
        vazios.push(r); continue;
      }
      /* a forma sem terminação de verbo entra como alternativa, para
       * "fatorar" alcançar "fatoração" sem deixar de achar "fatorar" */
      var v = semVerbo(r);
      grupos.push(v !== r ? [r, v] : [r]);
    }

    return { grupos: grupos, vazios: vazios, serie: serie };
  }

  /* ---------------------------------------------------------- erro de digitação */

  /* Só é chamado quando a busca devolveu vazio, e só compara com as palavras
   * de título e resumo, que são poucas. Uma letra de diferença, nada além. */
  function umaLetraDeDiferenca(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    var i = 0, j = 0, erros = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++erros > 1) return false;
      if (a.length > b.length) i++;
      else if (a.length < b.length) j++;
      else { i++; j++; }
    }
    return erros + (a.length - i) + (b.length - j) <= 1;
  }

  function vocabularioDoTopo(indice) {
    if (indice.__voc) return indice.__voc;
    var v = {};
    indice.forEach(function (r) {
      (r.t + ' ' + r.r).split(' ').forEach(function (p) { if (p.length >= 5) v[p] = 1; });
    });
    var lista = Object.keys(v);
    try {
      Object.defineProperty(indice, '__voc', { value: lista, enumerable: false });
    } catch (e) { indice.__voc = lista; }
    return lista;
  }

  function corrigir(indice, grupos) {
    var voc = vocabularioDoTopo(indice), mudou = false;
    var saida = grupos.map(function (g) {
      var p = g[0];
      if (p.length < 5) return g;
      for (var i = 0; i < voc.length; i++) {
        if (voc[i] === p) return g;
      }
      for (i = 0; i < voc.length; i++) {
        if (umaLetraDeDiferenca(p, voc[i])) { mudou = true; return g.concat([voc[i]]); }
      }
      return g;
    });
    return mudou ? saida : null;
  }

  /* ---------------------------------------------------------- a busca */

  var LIMITE_PADRAO = 30;

  function procurar(indice, texto, opcoes) {
    opcoes = opcoes || {};
    var peso = medirRaridade(indice);
    var lido = lerBusca(texto);
    var grupos = lido.grupos, vazios = lido.vazios;

    /* Ela digitou só palavra vazia, do tipo "de". Aí elas voltam a valer,
     * senão a busca não filtra nada e a lista inteira aparece. */
    if (!grupos.length && vazios.length) {
      grupos = vazios.map(function (v) { return [v]; });
      vazios = [];
    }
    if (!grupos.length && !lido.serie) return null;

    /* Só o ano escolar, sem assunto: devolve o ano inteiro. */
    if (!grupos.length && lido.serie) {
      var doAno = indice.filter(function (r) { return r.s === lido.serie; })
        .map(function (r) {
          return { id: r.i, serie: r.s, nota: 0, onde: 'titulo', completa: true,
                   casadas: 0, palavras: 0 };
        });
      return { itens: doAno, completa: true, serie: lido.serie, corrigida: false, total: doAno.length };
    }

    /* A ordem aqui importa. Primeiro a busca exata, que é a que dá lista
     * curta e certa. Se der nada, tenta o erro de digitação de uma letra,
     * ANTES de afrouxar: uma letra trocada explica melhor a tela vazia do que
     * ela ter escrito uma palavra que o banco não tem. Só depois é que a
     * exigência cai, uma palavra de cada vez, porque tela vazia faz ela achar
     * que o assunto não existe no banco. */
    var piso = Math.max(1, grupos.length - 2);
    var minimo = grupos.length;
    var saida = colher(indice, grupos, vazios, minimo, peso, lido.serie);

    var corrigida = false;
    if (!saida.length) {
      var tentativa = corrigir(indice, grupos);
      if (tentativa) {
        saida = colher(indice, tentativa, vazios, tentativa.length, peso, lido.serie);
        if (saida.length) { corrigida = true; grupos = tentativa; }
      }
    }

    while (!saida.length && minimo > piso) {
      minimo--;
      saida = colher(indice, grupos, vazios, minimo, peso, lido.serie);
    }

    /* Se ela pediu um ano e não achou nada nele, procura no banco inteiro:
     * o assunto pode estar no ano anterior, que é do que a aula trata. */
    var foraDoAno = false;
    if (!saida.length && lido.serie) {
      foraDoAno = true;
      minimo = grupos.length;
      saida = colher(indice, grupos, vazios, minimo, peso, null);
      while (!saida.length && minimo > piso) {
        minimo--;
        saida = colher(indice, grupos, vazios, minimo, peso, null);
      }
    }

    saida.sort(function (a, b) {
      return b.nota - a.nota || String(a.id).localeCompare(String(b.id));
    });

    /* Corte de cauda. Se oito temas têm "fração" no título, o nono, que só
     * cita fração dentro de um exercício, não vale a rolagem: lista de 58
     * linhas é o mesmo que lista nenhuma.
     *
     * O corte é relativo ao melhor da vez, e não a um limite fixo, e é por
     * isso que ele não estraga a busca por conteúdo: quando o melhor
     * resultado já é uma menção dentro do exercício, nada é cortado, e ela
     * continua achando os temas de trigonometria ao procurar por Pitágoras. */
    if (saida.length > 5) {
      var corte = saida[0].qualidade * 0.12;
      var ate = saida.length;
      for (var i = 5; i < saida.length; i++) {
        if (saida[i].qualidade < corte) { ate = i; break; }
      }
      saida = saida.slice(0, ate);
    }

    /* A explicação é a evidência mais fraca que existe: a palavra passou por
     * ali uma vez, no meio de um comentário. Quando já há resultado bom o
     * bastante, esses não valem a linha. O enunciado continua valendo, porque
     * tema que traz o assunto nos exercícios é justamente o que ela quer.
     *
     * Só some quando sobra gente melhor: se a explicação é a única pista que
     * existe, ela fica, e a busca continua achando o que só o conteúdo sabe. */
    var fortes = saida.filter(function (x) { return x.onde !== 'explicacao'; });
    if (fortes.length >= 2) saida = fortes;

    var total = saida.length;
    var limite = opcoes.limite || LIMITE_PADRAO;
    return {
      itens: saida.slice(0, limite),
      total: total,
      completa: !!(saida.length && saida[0].completa),
      corrigida: corrigida,
      serie: foraDoAno ? null : lido.serie,
      foraDoAno: foraDoAno
    };
  }

  /* Rótulo que a tela mostra ao lado do resultado, para ela entender por que
   * aquele tema apareceu. Título não leva rótulo: é o caso esperado. */
  var ROTULO = {
    titulo: '',
    resumo: 'sobre este assunto',
    destaque: 'tratado nos exercícios',
    enunciado: 'aparece nos exercícios',
    explicacao: 'aparece na explicação'
  };

  return {
    semAcento: semAcento, raiz: raiz, aoSingular: aoSingular, semVerbo: semVerbo,
    palavrasDe: palavrasDe, montarIndice: montarIndice, procurar: procurar,
    ondeAparece: ondeAparece, lerBusca: lerBusca, medirRaridade: medirRaridade,
    umaLetraDeDiferenca: umaLetraDeDiferenca,
    PESO: PESO, ROTULO: ROTULO, VAZIAS: VAZIAS, APELIDOS: APELIDOS, ANOS: ANOS
  };
});
