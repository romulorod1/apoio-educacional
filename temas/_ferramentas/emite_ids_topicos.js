#!/usr/bin/env node
/* Emite o identificador estável de cada tópico do catálogo banco/topicos.
 *
 * Por que existe. O aplicativo grava nas aulas dela o TÍTULO do tópico
 * (app.js:8026 registra {titulo, fonte:'topico', disciplina, grupo}, sem id),
 * e um tema de português vai apontar para tópicos por id no cabeçalho. Título
 * não serve de identificador: 56 títulos se repetem entre disciplinas e
 * qualquer retoque de grafia quebraria o vínculo. O id resolve isso, desde que
 * NUNCA mude. Por isso ele não é calculado da posição na lista, e sim lembrado
 * num registro (banco/topicos/_ids.json): título inserido no meio de um bloco
 * ganha o PRÓXIMO número livre do grupo e os vizinhos ficam com o que tinham;
 * título que sai da lista fica no registro marcado 'aposentado', e o número
 * dele nunca é dado a outro.
 *
 * Forma do id: <PREFIXO><GRUPO>-T<NN>. O prefixo vem do campo 'prefixo' de
 * cada disciplina em banco/topicos/indice.json. Para português e literatura
 * ele é o mesmo de Core.MATERIAS[...].temas.prefixo (core.js:1053), porque
 * tema e tópico da mesma matéria dividem a sigla. O '-T' é obrigatório:
 * Core.materiaDoTema (core.js:1112) devolve null para id com '-T', e é isso
 * que separa tópico de tema na trilha, que compara por igualdade de id.
 *
 * O que o emissor grava em cada bloco é uma lista 'ids' PARALELA a 'topicos'.
 * A lista 'topicos' continua lista de strings, byte a byte: o app v19 lê só o
 * título (app.js:7616-7619 e 8026) e ignora chaves desconhecidas do bloco, e
 * há uma janela, entre o deploy e o toque em atualizar, em que o app antigo lê
 * estes JSON pela rede. Se a forma de 'topicos' mudasse, ele gravaria objeto
 * no lugar de título nas aulas dela. Os arquivos são reescritos com
 * JSON.stringify sem recuo, que é exatamente a forma em que foram comitados
 * (46a0d11): fora do acréscimo de 'ids', nenhum byte muda.
 *
 * Casamento: um título casa com o registro por disciplina + grupo + título
 * EXATO. Trocar a grafia de um título é aposentar um tópico e criar outro, de
 * propósito: o tablet guardou a grafia antiga nas aulas.
 *
 *   node temas/_ferramentas/emite_ids_topicos.js             emite e grava
 *   node temas/_ferramentas/emite_ids_topicos.js --confere   só compara; sai 1 se houver
 *                                                            título sem id ou desalinhamento
 *   ... --pasta <dir>   usa outra pasta no lugar de banco/topicos (é como as
 *                       provas de _teste/testa_topicos_ids.js envenenam uma cópia)
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');
const Core = require(path.join(RAIZ, 'core.js'));

const args = process.argv.slice(2);
const CONFERE = args.indexOf('--confere') !== -1;
const iPasta = args.indexOf('--pasta');
const PASTA = (iPasta !== -1 && args[iPasta + 1]) ? path.resolve(args[iPasta + 1]) : path.join(RAIZ, 'banco', 'topicos');
const REGISTRO = path.join(PASTA, '_ids.json');
const FORMATO_REGISTRO = 'registro-de-ids-de-topicos';
const AVISO_REGISTRO = 'Gerado por temas/_ferramentas/emite_ids_topicos.js. Id emitido nunca e reusado nem renumerado; ' +
  'titulo que sai da lista fica aposentado e o numero dele nao volta. Nao edite a mao.';

const inicio = process.hrtime();
const problemas = [];

function rel(p) { return path.relative(RAIZ, p).replace(/\\/g, '/'); }
function leTexto(p) { return fs.readFileSync(p, 'utf8'); }
function falha(msg) {
  console.log('REPROVADO: ' + msg);
  process.exit(1);
}
function chaveDe(disciplina, grupo, titulo) { return disciplina + '\u0000' + grupo + '\u0000' + titulo; }
function grupoNoId(chaveGrupo) { return String(chaveGrupo).toUpperCase().replace(/-/g, ''); }
function numeroDoId(id) {
  const m = /-T(\d+)$/.exec(id);
  return m ? parseInt(m[1], 10) : 0;
}

/* 1. O índice, e a validação dos prefixos ANTES de emitir qualquer coisa: id
 * emitido com prefixo errado ficaria errado para sempre. */
const indice = JSON.parse(leTexto(path.join(PASTA, 'indice.json')));
const disciplinas = indice.disciplinas || [];
(function validaPrefixos() {
  const dono = {};
  disciplinas.forEach(function (d) {
    if (!/^[A-Z]{3}$/.test(d.prefixo || '')) {
      falha("disciplina '" + d.chave + "' sem 'prefixo' de três letras maiúsculas em " + rel(path.join(PASTA, 'indice.json')) +
        '; escolha um antes de emitir, porque id emitido nunca muda');
    }
    if (dono[d.prefixo]) falha("prefixo '" + d.prefixo + "' usado por '" + dono[d.prefixo] + "' e por '" + d.chave + "'");
    dono[d.prefixo] = d.chave;
  });
  /* Nenhum prefixo é começo de outro: com três letras fixas isso já vale, mas
   * a regra fica escrita para o dia em que alguém quiser quatro. */
  disciplinas.forEach(function (a) {
    disciplinas.forEach(function (b) {
      if (a !== b && b.prefixo.indexOf(a.prefixo) === 0) falha("prefixo '" + a.prefixo + "' é começo de '" + b.prefixo + "'");
    });
  });
  /* Contra a tabela única: tema e tópico da MESMA matéria dividem a sigla
   * (POR, LIT); matéria diferente não pode nem encostar nela (MAT). */
  Core.materiasComTemas().forEach(function (m) {
    disciplinas.forEach(function (d) {
      const mesma = m.topicos === d.chave;
      if (mesma && d.prefixo !== m.temas.prefixo) {
        falha("prefixo de '" + d.chave + "' é '" + d.prefixo + "' no índice e '" + m.temas.prefixo + "' em Core.MATERIAS; têm que ser iguais");
      }
      if (!mesma && (d.prefixo.indexOf(m.temas.prefixo) === 0 || m.temas.prefixo.indexOf(d.prefixo) === 0)) {
        falha("prefixo '" + d.prefixo + "' de '" + d.chave + "' colide com o prefixo de tema '" + m.temas.prefixo + "' da matéria '" + m.id + "'");
      }
    });
  });
})();

/* 2. Os arquivos de disciplina, com o texto original guardado para a comparação
 * byte a byte no fim. */
const arquivos = {};
let algumComIds = false;
disciplinas.forEach(function (d) {
  const p = path.join(PASTA, d.chave + '.json');
  const texto = leTexto(p);
  const dados = JSON.parse(texto);
  if (JSON.stringify(dados) !== texto) {
    falha(rel(p) + ' não está na forma compacta de JSON.stringify; reescrevê-lo mudaria bytes fora de ids, e isso é decisão humana');
  }
  (dados.grupos || []).forEach(function (g) {
    (g.blocos || []).forEach(function (b) { if (b.ids) algumComIds = true; });
  });
  arquivos[d.chave] = { caminho: p, texto: texto, dados: dados };
});

/* 3. O registro: a memória do que já foi emitido. Sem ele e com arquivo já
 * numerado, emitir de novo renumeraria tudo do zero; isso nunca é o que se
 * quer, então o emissor para e manda restaurar do git. */
let registro = {};
if (fs.existsSync(REGISTRO)) {
  const r = JSON.parse(leTexto(REGISTRO));
  if (!r || r.formato !== FORMATO_REGISTRO || !r.ids) falha(rel(REGISTRO) + ' com formato desconhecido');
  registro = r.ids;
} else if (algumComIds) {
  falha(rel(REGISTRO) + ' não existe, mas há arquivo com ids emitidos. Restaure o registro do git; emitir sem ele renumeraria os tópicos');
} else if (CONFERE) {
  falha(rel(REGISTRO) + ' não existe e nenhum tópico tem id: rode node temas/_ferramentas/emite_ids_topicos.js');
}

/* 4. O cálculo: cada título casa com o registro ou ganha o próximo número
 * livre do grupo. Nada é gravado aqui. */
const porChave = {};   /* disciplina\0grupo\0título -> id */
const proximo = {};    /* disciplina\0grupo -> próximo NN livre */
const posicaoDisciplina = {};
const posicaoGrupo = {};
disciplinas.forEach(function (d, i) {
  posicaoDisciplina[d.chave] = i;
  (d.grupos || []).forEach(function (g, j) { posicaoGrupo[d.chave + '\u0000' + g.chave] = j; });
});
Object.keys(registro).forEach(function (id) {
  const e = registro[id];
  const k = chaveDe(e.disciplina, e.grupo, e.titulo);
  if (porChave[k]) falha('registro corrompido: ' + porChave[k] + ' e ' + id + ' apontam para o mesmo título em ' + e.disciplina + '/' + e.grupo);
  porChave[k] = id;
  const d = disciplinas.filter(function (x) { return x.chave === e.disciplina; })[0];
  if (d && id.indexOf(d.prefixo + grupoNoId(e.grupo) + '-T') !== 0) {
    falha('o id ' + id + ' do registro não começa com ' + d.prefixo + grupoNoId(e.grupo) + '-T; o prefixo de ' + d.chave +
      ' mudou depois de ids emitidos, e id emitido não muda');
  }
  const kg = e.disciplina + '\u0000' + e.grupo;
  const n = numeroDoId(id);
  if (!proximo[kg] || n >= proximo[kg]) proximo[kg] = n + 1;
});

const vistos = {};
const novos = [];        /* {id, disciplina, grupo, bloco, posicao, titulo} */
const calculado = {};    /* disciplina -> grupos -> blocos -> [ids] */
disciplinas.forEach(function (d) {
  const arq = arquivos[d.chave].dados;
  calculado[d.chave] = (arq.grupos || []).map(function (g) {
    return (g.blocos || []).map(function (b) {
      return (b.topicos || []).map(function (titulo, i) {
        if (typeof titulo !== 'string') {
          falha('em ' + d.chave + '/' + g.chave + ' bloco "' + b.titulo + '" a posição ' + i + " de 'topicos' não é string; " +
            "'topicos' é lista de strings e o app grava o item direto na aula");
        }
        const k = chaveDe(d.chave, g.chave, titulo);
        if (vistos[k]) {
          falha('título repetido no mesmo grupo: "' + titulo + '" em ' + d.chave + '/' + g.chave + ' (bloco "' + b.titulo +
            '"); o id casa por disciplina, grupo e título exato, e dois iguais teriam o mesmo id');
        }
        vistos[k] = true;
        let id = porChave[k];
        if (!id) {
          const kg = d.chave + '\u0000' + g.chave;
          const n = proximo[kg] || 1;
          proximo[kg] = n + 1;
          id = d.prefixo + grupoNoId(g.chave) + '-T' + String(n).padStart(2, '0');
          if (registro[id]) falha('ia emitir ' + id + ' para "' + titulo + '", mas o registro já tem esse id');
          porChave[k] = id;
          novos.push({ id: id, disciplina: d.chave, grupo: g.chave, bloco: b.titulo, posicao: i, titulo: titulo });
        }
        return id;
      });
    });
  });
});
const aposentar = Object.keys(registro).filter(function (id) {
  const e = registro[id];
  return !e.aposentado && !vistos[chaveDe(e.disciplina, e.grupo, e.titulo)];
});
const reativar = Object.keys(registro).filter(function (id) {
  const e = registro[id];
  return !!e.aposentado && !!vistos[chaveDe(e.disciplina, e.grupo, e.titulo)];
});

/* 5. O registro novo, em ordem fixa (disciplina e grupo na ordem do índice,
 * depois o número), uma linha por id para o diff do git mostrar só o que
 * mudou. Entrada aposentada fica no lugar dela, com a marca. */
const registroNovo = {};
Object.keys(registro).forEach(function (id) {
  const e = registro[id];
  const n = { disciplina: e.disciplina, grupo: e.grupo, titulo: e.titulo };
  const fica = (e.aposentado && reativar.indexOf(id) === -1) || aposentar.indexOf(id) !== -1;
  if (fica) n.aposentado = true;
  registroNovo[id] = n;
});
novos.forEach(function (x) { registroNovo[x.id] = { disciplina: x.disciplina, grupo: x.grupo, titulo: x.titulo }; });
function ordena(a, b) {
  const ea = registroNovo[a], eb = registroNovo[b];
  const da = posicaoDisciplina[ea.disciplina], db = posicaoDisciplina[eb.disciplina];
  if ((da === undefined) !== (db === undefined)) return da === undefined ? 1 : -1;
  if (da !== db) return da < db ? -1 : 1;
  const ga = posicaoGrupo[ea.disciplina + '\u0000' + ea.grupo], gb = posicaoGrupo[eb.disciplina + '\u0000' + eb.grupo];
  if ((ga === undefined) !== (gb === undefined)) return ga === undefined ? 1 : -1;
  if (ga !== gb) return ga < gb ? -1 : 1;
  const na = numeroDoId(a), nb = numeroDoId(b);
  if (na !== nb) return na - nb;
  return a < b ? -1 : (a > b ? 1 : 0);
}
const ordem = Object.keys(registroNovo).sort(ordena);
const linhas = ordem.map(function (id, i) {
  return '    ' + JSON.stringify(id) + ': ' + JSON.stringify(registroNovo[id]) + (i < ordem.length - 1 ? ',' : '');
});
const textoRegistro = '{\n' +
  '  "formato": ' + JSON.stringify(FORMATO_REGISTRO) + ',\n' +
  '  "versao": 1,\n' +
  '  "aviso": ' + JSON.stringify(AVISO_REGISTRO) + ',\n' +
  '  "ids": {\n' + linhas.join('\n') + '\n  }\n}\n';
const registroAtual = fs.existsSync(REGISTRO) ? leTexto(REGISTRO).replace(/\r\n/g, '\n') : '';
const registroMudou = registroAtual !== textoRegistro;

/* 6. Os arquivos: só 'ids' entra ou muda em cada bloco. */
const saidas = {};
disciplinas.forEach(function (d) {
  const arq = arquivos[d.chave];
  const copia = JSON.parse(arq.texto);
  (copia.grupos || []).forEach(function (g, gi) {
    (g.blocos || []).forEach(function (b, bi) { b.ids = calculado[d.chave][gi][bi]; });
  });
  saidas[d.chave] = JSON.stringify(copia);
});

function segundos() {
  const t = process.hrtime(inicio);
  return (t[0] + t[1] / 1e9).toFixed(3) + ' s';
}

if (CONFERE) {
  /* Compara o que está gravado com o que o registro diz, bloco a bloco, e
   * aponta o bloco: um título inserido sem id deslocaria todos os seguintes
   * em silêncio, e é o bloco que quem lê precisa abrir. */
  disciplinas.forEach(function (d) {
    const arq = arquivos[d.chave].dados;
    let blocosRuins = 0;
    (arq.grupos || []).forEach(function (g, gi) {
      (g.blocos || []).forEach(function (b, bi) {
        const esperado = calculado[d.chave][gi][bi];
        const gravado = Array.isArray(b.ids) ? b.ids : null;
        const motivos = [];
        if (!gravado) motivos.push("bloco sem 'ids'");
        else if (gravado.length !== esperado.length) motivos.push("'topicos' tem " + esperado.length + " e 'ids' tem " + gravado.length);
        novos.filter(function (x) { return x.disciplina === d.chave && x.grupo === g.chave && x.bloco === b.titulo; })
          .forEach(function (x) { motivos.push('título sem id: "' + x.titulo + '" (posição ' + x.posicao + ', ganharia ' + x.id + ')'); });
        if (gravado) {
          for (let i = 0; i < esperado.length; i++) {
            if (gravado[i] !== esperado[i]) {
              motivos.push('posição ' + i + ' ("' + b.topicos[i] + '"): o arquivo diz ' + (gravado[i] || 'nada') + ' e o registro diz ' + esperado[i]);
              break;
            }
          }
        }
        if (motivos.length) {
          blocosRuins++;
          problemas.push('DESALINHADO ' + d.chave + '/' + g.chave + ' bloco "' + b.titulo + '": ' + motivos.join('; '));
        }
      });
    });
    const total = calculado[d.chave].reduce(function (s, g) { return s + g.reduce(function (t, b) { return t + b.length; }, 0); }, 0);
    console.log('  ' + d.chave + ': ' + total + ' títulos, ' + (blocosRuins ? blocosRuins + ' bloco(s) desalinhado(s)' : 'ids conferem'));
  });
  aposentar.forEach(function (id) {
    problemas.push('REGISTRO ATRASADO: ' + id + ' ("' + registro[id].titulo + '" em ' + registro[id].disciplina + '/' + registro[id].grupo +
      ') saiu da lista e ainda não está aposentado');
  });
  reativar.forEach(function (id) {
    problemas.push('REGISTRO ATRASADO: ' + id + ' ("' + registro[id].titulo + '") voltou à lista e ainda está aposentado');
  });
  if (!problemas.length && registroMudou) problemas.push('REGISTRO ATRASADO: ' + rel(REGISTRO) + ' não está na forma que o emissor gravaria');
  problemas.forEach(function (p) { console.log('  ' + p); });
  const totalIds = Object.keys(registroNovo).length;
  if (problemas.length) {
    console.log('REPROVADO: ' + problemas.length + ' problema(s) em ' + rel(PASTA) + '; rode node temas/_ferramentas/emite_ids_topicos.js e revise o diff (' + segundos() + ')');
    process.exit(1);
  }
  console.log('tudo confere: ' + totalIds + ' ids no registro, ' + Object.keys(vistos).length + ' títulos nos ' + disciplinas.length +
    ' arquivos, todos casados (' + segundos() + ')');
  process.exit(0);
}

/* Modo de escrita. */
let escritos = 0;
disciplinas.forEach(function (d) {
  const arq = arquivos[d.chave];
  const n = novos.filter(function (x) { return x.disciplina === d.chave; }).length;
  const a = aposentar.filter(function (id) { return registro[id].disciplina === d.chave; }).length;
  const total = calculado[d.chave].reduce(function (s, g) { return s + g.reduce(function (t, b) { return t + b.length; }, 0); }, 0);
  const mudou = saidas[d.chave] !== arq.texto;
  if (mudou) {
    fs.writeFileSync(arq.caminho, saidas[d.chave]);
    escritos++;
  }
  console.log('  ' + d.chave + ': ' + total + ' títulos, ' + n + ' ids novos, ' + a + ' aposentados, ' +
    (mudou ? 'arquivo escrito (' + Buffer.byteLength(arq.texto) + ' -> ' + Buffer.byteLength(saidas[d.chave]) + ' bytes)' : 'sem mudança'));
});
if (registroMudou) fs.writeFileSync(REGISTRO, textoRegistro);
console.log('  registro: ' + ordem.length + ' ids, ' + novos.length + ' novos, ' + aposentar.length + ' aposentados, ' +
  reativar.length + ' reativados, ' + (registroMudou ? 'escrito em ' + rel(REGISTRO) : 'sem mudança'));
if (!escritos && !registroMudou) {
  console.log('nada mudou: os ids gravados já batem com o registro (' + segundos() + ')');
} else {
  console.log(escritos + ' arquivo(s) escrito(s), ' + novos.length + ' ids emitidos, ' + aposentar.length + ' aposentados (' + segundos() + ')');
}
