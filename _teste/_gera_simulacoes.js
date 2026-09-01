/* _gera_simulacoes.js
 * Gera as duas simulações que o Rômulo pediu na devolução: o escopo do trabalho
 * (sugestão 7) e o dossiê do ciclo (sugestão 10).
 *
 * O aluno é o Marcelo, que é o caso de referência do aplicativo, com um
 * trimestre inventado de propósito para o documento ter o que mostrar.
 */
const fs = require('fs');
const path = require('path');
const proto = require('./_proto_documentos.js');

const SAIDA = process.argv[2] || __dirname;
const ALUNO = { nome: 'Marcelo Andrade' };

/* ---------------------------------------------------- escopo do trabalho */

const escopo = proto.gerarEscopoDoTrabalho({
  aluno: ALUNO,
  periodo: 'De 11 de agosto a 30 de novembro de 2026',
  abertura:
    'Este documento reúne o que foi entregue ao Marcelo neste período, além das horas de aula. ' +
    'Ele existe porque boa parte desse trabalho acontece fora do encontro e costuma ficar ' +
    'invisível: o diagnóstico inicial, o material montado para cada assunto, o registro de cada ' +
    'aula e o retorno mensal por escrito.',
  encontros: [
    { texto: '38 encontros de 1 hora, três vezes por semana', quando: 'ago a nov' },
    { texto: '2 aulas de reposição, sem cobrança adicional', quando: '28/08 e 14/10' },
    { texto: '1 encontro extra na véspera da prova do trimestre', quando: '19/11' }
  ],
  diagnostico: [
    { texto: 'Mapeamento inicial: pontos fortes, pontos de atenção, lacunas de anos anteriores, rotina de estudo e como ele aprende melhor', quando: '11/08' },
    { texto: 'Revisão do mapeamento ao fim do primeiro ciclo', quando: '12/11' },
    { texto: 'Plano de trabalho escrito, com prioridades para o período', quando: '11/08' },
    { texto: 'Acompanhamento da curva de autonomia em três frentes, com data de cada mudança', quando: 'contínuo' }
  ],
  material: [
    { texto: 'Material explicativo e lista de exercícios de Equações do primeiro grau', quando: '02/09' },
    { texto: 'Material explicativo e lista de Produtos notáveis, com gabarito separado', quando: '07/09' },
    { texto: 'Lista montada sob medida de Fatoração, 9 questões escolhidas para as lacunas dele', quando: '14/09' },
    { texto: 'Simulado curto no formato da prova do colégio, com tempo marcado', quando: '25/09' },
    { texto: 'Material de Semelhança de triângulos e trilha de base de três temas anteriores', quando: '21/10' },
    { texto: '31 folhas de aula escritas à mão, guardadas e disponíveis à família', quando: 'contínuo' }
  ],
  contas: [
    { texto: 'Fechamento mensal por escrito, com datas, temas e áreas trabalhadas', quando: 'set, out, nov' },
    { texto: 'Cartão do mês enviado à família, com a leitura do período', quando: 'set, out, nov' },
    { texto: 'Dossiê do ciclo, ao fim do trimestre', quando: '30/11' }
  ],
  rodape: 'No trimestre: 41 encontros, 6 temas trabalhados, 12 áreas de desenvolvimento.'
});
fs.writeFileSync(path.join(SAIDA, 'Simulacao_Escopo_do_Trabalho.pdf'), escopo);
console.log('escopo do trabalho: %d KB', Math.round(escopo.length / 1024));

/* ------------------------------------------------------- dossiê do ciclo */

const dossie = proto.gerarDossieDoCiclo({
  aluno: ALUNO,
  periodo: 'Setembro, outubro e novembro de 2026',
  contexto: '8º ano · Colégio Santo Inácio',
  numeros: [
    { valor: '41', rotulo: 'encontros' },
    { valor: '41:00 h', rotulo: 'de trabalho' },
    { valor: '6', rotulo: 'temas trabalhados' }
  ],
  mapeamento: {
    data: '2026-08-11',
    leitura:
      'O Marcelo entende conceito novo com facilidade e pergunta bem, mas nunca consolidou ' +
      'fração e fatoração. No oitavo ano isso aparece em quase tudo, então cada equação virava ' +
      'um problema de fração disfarçado. O plano combinado em agosto foi gastar as primeiras ' +
      'semanas na base sem largar o conteúdo do ano, e depois manter uma revisão semanal curta.',
    grupos: [
      { titulo: 'Pontos fortes', itens: ['Raciocínio lógico', 'Pergunta quando não entende', 'Pega conceito novo com rapidez', 'Trabalha bem sozinho'] },
      { titulo: 'Pontos de atenção', itens: ['Erros de sinal', 'Estuda só na véspera', 'Não confere o resultado', 'Trava quando a questão foge do modelo', 'Fica ansioso perto da prova'] },
      { titulo: 'Lacunas de anos anteriores', itens: ['Frações', 'Produtos notáveis e fatoração', 'Equação do primeiro grau', 'Razão, proporção e regra de três'] },
      { titulo: 'Como aprende melhor', itens: ['Vendo o desenho ou o gráfico', 'Do exemplo para a regra'] }
    ]
  },
  curva: {
    meses: ['ago', 'set', 'out', 'nov'],
    frentes: [
      { nome: 'Conteúdo',  pontos: [{ i: 0, etapa: 1 }, { i: 1.2, etapa: 2 }, { i: 2.6, etapa: 3 }] },
      { nome: 'Autonomia', pontos: [{ i: 0, etapa: 1 }, { i: 2.0, etapa: 2 }] },
      { nome: 'Confiança', pontos: [{ i: 0, etapa: 2 }, { i: 1.6, etapa: 3 }, { i: 3.0, etapa: 4 }] }
    ]
  },
  temas: [
    { rotulo: 'Fatoração de polinômios', valor: 9 },
    { rotulo: 'Equação do segundo grau', valor: 8 },
    { rotulo: 'Produtos notáveis', valor: 7 },
    { rotulo: 'Equações do primeiro grau', valor: 6 },
    { rotulo: 'Semelhança de triângulos', valor: 6 },
    { rotulo: 'Razão e proporção', valor: 5 }
  ],
  areas: [
    { rotulo: 'Retomada de base de anos anteriores', valor: 18 },
    { rotulo: 'Raciocínio lógico', valor: 12 },
    { rotulo: 'Correção de prova e análise de erros', valor: 9 },
    { rotulo: 'Estratégia de prova', valor: 7 },
    { rotulo: 'Revisão para prova', valor: 6 },
    { rotulo: 'Ansiedade ou medo de prova', valor: 5 },
    { rotulo: 'Método de estudo', valor: 4 },
    { rotulo: 'Persistir na questão difícil', valor: 3 }
  ],
  porMes: [
    { rotulo: 'Setembro', valor: 13 },
    { rotulo: 'Outubro', valor: 14 },
    { rotulo: 'Novembro', valor: 14 }
  ],
  narrativa: [
    {
      titulo: 'O que aconteceu',
      texto:
        'O trimestre começou na base. Setembro inteiro foi frações, produtos notáveis e fatoração, ' +
        'que eram as lacunas mais caras do mapeamento de agosto. A partir de outubro voltamos ao ' +
        'conteúdo do ano, e a equação do segundo grau entrou já apoiada na fatoração que ele passou ' +
        'a dominar. Novembro foi semelhança de triângulos e a preparação para a prova do trimestre.'
    },
    {
      titulo: 'O que isso significa',
      texto:
        'A mudança mais importante não foi de conteúdo. Na aula do dia 13 de setembro ele encontrou ' +
        'sozinho três dos quatro erros da própria lista, o que não acontecia antes. No simulado do ' +
        'dia 25 terminou dentro do tempo, sem travar na primeira questão difícil. São exatamente os ' +
        'dois pontos que mais pesavam contra ele em prova, e os dois saíram do campo do "ele não ' +
        'sabe" para o campo do "ele já sabe se corrigir". Na curva de autonomia, a frente de ' +
        'Conteúdo saiu de apoio total em agosto e chegou a supervisão em outubro: hoje ele faz ' +
        'sozinho e eu confiro.'
    },
    {
      titulo: 'O que ainda pede atenção',
      texto:
        'Os erros de sinal caíram bastante, mas ainda aparecem quando ele acelera. E a rotina de ' +
        'estudo continua concentrada perto da prova, o que é o ponto que menos avançou no trimestre. ' +
        'A frente de Autonomia é a que está mais atrás, em apoio parcial, e é onde o trabalho do ' +
        'próximo ciclo se concentra.'
    }
  ],
  proximo:
    'Manter a revisão semanal curta, que é o que sustenta o que já foi conquistado, e trabalhar a ' +
    'montagem do cronograma para que o estudo deixe de se concentrar na véspera. Em conteúdo, ' +
    'entrar em funções, que é o assunto do primeiro trimestre do ano que vem, com a base de ' +
    'álgebra agora resolvida.'
});
fs.writeFileSync(path.join(SAIDA, 'Simulacao_Dossie_do_Ciclo.pdf'), dossie);
console.log('dossiê do ciclo:    %d KB', Math.round(dossie.length / 1024));
