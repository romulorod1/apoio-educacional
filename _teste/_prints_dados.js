/* _prints_dados.js
 * Banco de demonstração para os prints da apresentação.
 *
 * Os nomes são os que já vêm na carga inicial do aplicativo. O que muda aqui é
 * que o banco está ABASTECIDO: valor por hora cadastrado para todos, mapeamento
 * feito, temas anexados, áreas marcadas e histórico de alguns meses. É o estado
 * real de uso dela hoje, não o estado do primeiro dia.
 *
 * Nada aqui vai para o aplicativo publicado. Serve só para gerar imagem.
 */

const ALUNOS = [
  { nome: 'Daniel',    cor: '#1F3A5F', valor: 150, desde: '2024-03-04', ano: 'em1', dias: [1, 3], hora: '17:00', dur: 120 },
  { nome: 'Marcelo',   cor: '#2E7D6B', valor: 130, desde: '2025-02-10', ano: '08',  dias: [1, 3, 5], hora: '15:30', dur: 60 },
  { nome: 'Guilherme', cor: '#C9A961', valor: 140, desde: '2025-08-18', ano: '09',  dias: [2, 4], hora: '14:00', dur: 90 },
  { nome: 'Lucas',     cor: '#7C5E9B', valor: 130, desde: '2025-09-01', ano: '07',  dias: [2, 4], hora: '16:00', dur: 60 },
  { nome: 'Cecília',   cor: '#B4453C', valor: 145, desde: '2024-08-12', ano: '09',  dias: [2, 4], hora: '18:00', dur: 90 },
  { nome: 'Mariah',    cor: '#3E7CA8', valor: 120, desde: '2026-03-02', ano: '05',  dias: [5], hora: '10:00', dur: 60 },
  { nome: 'Paula',     cor: '#6B8E4E', valor: 120, desde: '2026-02-16', ano: '06',  dias: [3], hora: '09:00', dur: 60 },
  { nome: 'Marina',    cor: '#A8577E', valor: 125, desde: '2025-11-10', ano: '04',  dias: [5], hora: '14:00', dur: 60 },
  { nome: 'Mateus',    cor: '#4A7C7E', valor: 110, desde: '2026-05-04', ano: '03',  dias: [1], hora: '10:30', dur: 60 },
  { nome: 'Eduardo',   cor: '#8B6F47', valor: 110, desde: '2026-06-01', ano: '06',  dias: [4], hora: '11:00', dur: 60 },
  { nome: 'Rafael',    cor: '#5C6B8A', valor: 100, desde: '2026-07-06', ano: '02',  dias: [2], hora: '09:00', dur: 60 },
  { nome: 'Theo',      cor: '#9B6A4F', valor: 100, desde: '2026-07-13', ano: '04',  dias: [3], hora: '16:30', dur: 60 }
];

/* Mapeamento completo só para o Marcelo, que é o caso de referência do
   aplicativo, e um mais curto para a Cecília. Os demais ficam sem, porque é
   assim que uma carteira de verdade se parece: nem tudo está pronto. */
const MAPA_MARCELO = {
  escola: 'Colégio Santo Inácio', anoEscolar: '08', professor: 'Ricardo Salles',
  calendarioProvas: 'Trimestral, duas provas e um trabalho por trimestre',
  indicacao: 'Indicação de outra família',
  motivo: 'Caiu de média no segundo bimestre e ficou inseguro antes das provas.',
  expectativa: 'Recuperar a média e chegar ao ensino médio sem buraco de base.',
  nivel: '2',
  prioridades: 'Fechar fatoração até o fim de setembro.\nCriar rotina de revisão semanal.',
  plano: 'Entende rápido e pergunta bem, mas nunca consolidou fração e fatoração. ' +
    'No oitavo ano isso aparece em quase tudo. Plano: duas semanas de base sem largar ' +
    'o conteúdo do ano, e depois revisão semanal curta.',
  marcados: {
    fortes: ['raciocinio-ok', 'pergunta', 'pega-rapido', 'sozinho'],
    atencao: ['sinal', 'vespera', 'nao-confere', 'fora-do-modelo', 'ansiedade-prova'],
    lacunas: ['fracoes', 'fatoracao', 'eq1', 'proporcao'],
    rotina: ['lugar-calmo', 'material-completo', 'agenda-cheia'],
    aprende: ['visual', 'exemplo-regra']
  }
};

const TEMAS_POR_AULA = [
  [{ id: 'MAT08-03', titulo: 'Equações do primeiro grau', lingua: 'pt', partes: ['material', 'lista'], exercicios: 9 }],
  [{ id: 'MAT08-03', titulo: 'Equações do primeiro grau', lingua: 'pt', partes: ['lista'], exercicios: 6 }],
  [{ id: 'MAT08-05', titulo: 'Produtos notáveis', lingua: 'pt', partes: ['material', 'lista'], exercicios: 10 }],
  [{ id: 'MAT08-05', titulo: 'Produtos notáveis', lingua: 'pt', partes: ['lista', 'gabarito'], exercicios: 8 }],
  [{ id: 'MAT08-06', titulo: 'Fatoração de polinômios', lingua: 'pt', partes: ['material', 'lista'], exercicios: 9 }]
];

const AREAS_POR_AULA = [
  ['base', 'linguagem', 'metodo'],
  ['base', 'analise-erros', 'confianca'],
  ['base', 'raciocinio'],
  ['estrategia-prova', 'revisao', 'ansiedade'],
  ['raciocinio', 'enunciado', 'autonomia']
];

const NOTAS = [
  'Retomada de equação do primeiro grau. Ele lembrava do procedimento, mas trocava o sinal ao passar para o outro lado. Trabalhamos o porquê antes da regra.',
  'Corrigimos a lista questão a questão. Ele encontrou sozinho três dos quatro erros, o que não acontecia em julho.',
  'Entrada em produtos notáveis. Travou no quadrado da diferença e voltamos duas vezes ao mesmo exemplo até ele fazer sozinho.',
  'Simulado curto com tempo marcado, no formato da prova do colégio. Conversamos sobre ordem de resolução e sobre não travar na primeira questão difícil.',
  'Fatoração por fator comum e agrupamento. Boa aula: ele montou os dois primeiros sozinho a partir do enunciado.'
];

function uid() { return 'x' + Math.random().toString(36).slice(2, 10); }
function pad2(n) { return (n < 10 ? '0' : '') + n; }

/* Monta o banco inteiro. Recebe o mês de referência no formato AAAA-MM. */
function montar(mesRef) {
  const [ano, mes] = mesRef.split('-').map(Number);
  const db = { versao: 1, alunos: [], series: [], aulas: [], resumos: [], ajustes: {} };

  ALUNOS.forEach((a) => {
    const aluno = {
      id: uid(), nome: a.nome, responsavel: '', cor: a.cor, ativo: true,
      desde: a.desde, anoEscolar: a.ano,
      obs: '', obsPedagogicas: '',
      precos: [{ id: uid(), inicio: a.desde, fim: null, valorHora: a.valor }],
      mapeamentos: []
    };
    // Um reajuste antigo para alguns, para a ficha de relacionamento ter o que mostrar.
    if (['Daniel', 'Cecília', 'Marcelo'].indexOf(a.nome) >= 0) {
      aluno.precos = [
        { id: uid(), inicio: a.desde, fim: '2025-12-31', valorHora: a.valor - 20 },
        { id: uid(), inicio: '2026-01-01', fim: null, valorHora: a.valor }
      ];
    }
    if (a.nome === 'Marcelo') {
      aluno.responsavel = 'Patrícia Andrade';
      aluno.mapeamentos = [Object.assign({ id: uid(), data: '2026-08-11', aulaId: null }, MAPA_MARCELO)];
    }
    if (a.nome === 'Cecília') {
      aluno.responsavel = 'Renata Portella';
      aluno.mapeamentos = [{
        id: uid(), data: '2026-08-25', aulaId: null,
        escola: 'Colégio Salesiano', anoEscolar: '09', professor: '',
        calendarioProvas: '', indicacao: '', motivo: 'Preparação para o ensino médio.',
        expectativa: '', nivel: '3',
        prioridades: 'Semelhança e trigonometria antes da prova do trimestre.',
        plano: '',
        marcados: {
          fortes: ['calculo-mental', 'tarefa-ok', 'caderno-ok'],
          atencao: ['dispersa', 'vespera'],
          lacunas: ['proporcao', 'semelhanca'],
          rotina: ['horario-fixo', 'usa-agenda'],
          aprende: ['fazendo']
        }
      }];
    }
    db.alunos.push(aluno);

    // Grade recorrente do mês de referência.
    const serieId = uid();
    db.series.push({
      id: serieId, alunoId: aluno.id, dias: a.dias, hora: a.hora, duracaoMin: a.dur,
      inicio: mesRef + '-01', fim: null, exclusoes: []
    });

    const ultimo = new Date(ano, mes, 0).getDate();
    for (let d = 1; d <= ultimo; d++) {
      const iso = mesRef + '-' + pad2(d);
      const dia = new Date(ano, mes - 1, d).getDay();
      if (a.dias.indexOf(dia) < 0) continue;
      db.aulas.push({
        id: uid(), alunoId: aluno.id, serieId: serieId, destacada: false,
        data: iso, hora: a.hora, duracaoMin: a.dur,
        status: 'realizada', cobravel: true,
        notaTexto: '', temNota: false, anexos: [], areas: [], temas: []
      });
    }
  });

  // O Marcelo é o aluno com registro completo, que é o que aparece nos prints.
  const marcelo = db.alunos.filter(x => x.nome === 'Marcelo')[0];
  const doMarcelo = db.aulas.filter(x => x.alunoId === marcelo.id).sort((x, y) => x.data.localeCompare(y.data));
  doMarcelo.forEach((aula, i) => {
    if (i >= NOTAS.length) return;
    aula.notaTexto = NOTAS[i];
    aula.temNota = true;
    aula.areas = AREAS_POR_AULA[i];
    aula.temas = TEMAS_POR_AULA[i];
  });

  // Uma aula desmarcada com aviso, e a reposição. É o que acontece de verdade.
  if (doMarcelo.length > 6) {
    doMarcelo[6].status = 'cancelada';
    doMarcelo[6].cobravel = false;
    doMarcelo[6].notaTexto = 'Desmarcada na véspera, prova de história no dia seguinte.';
    doMarcelo[6].temNota = true;
  }

  db.resumos.push({
    alunoId: marcelo.id, mes: mesRef,
    texto: 'Mês em que a base começou a fechar. O Marcelo entrou sem segurança em fatoração, ' +
      'que era a lacuna mais cara do mapeamento de agosto, e sai fatorando por fator comum e ' +
      'agrupamento sem precisar de apoio.\n\nO ganho maior não foi de conteúdo. Ele encontrou ' +
      'sozinho três dos quatro erros da própria lista, o que não acontecia antes.'
  });

  db.ajustes = { versaoVista: '1.7.0', ultimaCopia: mesRef + '-02', valoresOcultos: false };
  return db;
}

module.exports = { montar, ALUNOS };
