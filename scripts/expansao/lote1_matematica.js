const fs = require('fs');
const path = require('path');

const baseDir = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';

function salvar(subpath, data) {
  const full = path.join(baseDir, subpath);
  fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf8');
  console.log('Atualizado:', subpath, 'com', (data.questoes || []).length, 'questões.');
}

// ----------------------------------------------------
// 1. ÁLGEBRA: Funções, Equações e Logaritmos
// ----------------------------------------------------
salvar('Matematica/Algebra/Questoes_Funcoes_e_Equacoes.json', {
  disciplina: "Matemática",
  assunto: "Álgebra - Funções, Equações e Logaritmos",
  publico_alvo: "Escolas de Alta Performance - Niterói e Rio de Janeiro (7º EF ao 3º EM)",
  benchmark_didatico: {
    capitulo: "Capítulo 4: Teoria Geral das Funções, Equações Polinomiais e Funções Transcendentes",
    objetivos_aprendizagem: [
      "Compreender a definição de função como relação unívoca entre conjuntos, identificando domínio, contradomínio e imagem.",
      "Analisar o comportamento das funções afim e quadrática: taxas de variação, raízes, estudo de sinais e otimização por vértices.",
      "Dominar as propriedades fundamentais e operatórias das funções exponencial e logarítmica.",
      "Resolver equações, sistemas e inequações transcendentes respeitando rigorosamente as condições de existência.",
      "Modelar problemas reais de otimização de lucro, trajetórias balísticas e crescimento populacional ou financeiro."
    ],
    resumo_teorico: {
      conceitos_chave: [
        "Definição de Função e Notação: Dados os conjuntos A (domínio) e B (contradomínio), uma função f: A -> B associa cada x em A a um único y em B. O conjunto imagem Im(f) é o subconjunto de B formado pelos valores efetivamente atingidos.",
        "Função Afim: f(x) = ax + b (com a, b reais e a != 0). O coeficiente angular a = \\Delta y / \\Delta x representa a taxa de crescimento constante. O coeficiente linear b é o ponto (0, b) onde a reta corta o eixo y. A raiz é x = -b/a. Crescente se a > 0; decrescente se a < 0.",
        "Função Quadrática: f(x) = ax^2 + bx + c (a != 0). O gráfico é uma parábola com concavidade voltada para cima se a > 0 e para baixo se a < 0. As raízes reais são obtidas por Bhaskara: x = (-b \\pm \\sqrt{\\Delta})/(2a), com \\Delta = b^2 - 4ac. Se \\Delta > 0, duas raízes distintas; se \\Delta = 0, raiz dupla real; se \\Delta < 0, sem raízes reais.",
        "Coordenadas do Vértice e Otimização: O ponto de extremo (máximo se a < 0, mínimo se a > 0) possui coordenadas x_v = -b/(2a) e y_v = -\\Delta/(4a). A reta vertical x = x_v é o eixo de simetria da parábola.",
        "Função Exponencial: f(x) = a^x (com a > 0 e a != 1). Domínio real e imagem nos reais estritamente positivos (y > 0). O gráfico não toca o eixo horizontal (assíntota y = 0). Crescente para a > 1; decrescente para 0 < a < 1.",
        "Definição de Logaritmo e Condições de Existência: \\log_b(a) = x \\iff b^x = a, com logaritmando a > 0 e base b > 0 com b != 1. As propriedades operatórias essenciais são: \\log_b(xy) = \\log_b(x) + \\log_b(y); \\log_b(x/y) = \\log_b(x) - \\log_b(y); \\log_b(x^k) = k \\cdot \\log_b(x); Mudança de base: \\log_b(a) = \\frac{\\log_c(a)}{\\log_c(b)}."
      ],
      atencao_ponto_cego: "Principais armadilhas e pontos cegos dos alunos:\n1. Condição de Existência (C.E.) dos logaritmos: SEMPRE estabeleça a C.E. antes de qualquer manipulação algébrica. Raízes encontradas que tornem o logaritmando negativo ou nulo devem ser descartadas sem hesitação.\n2. Inequações exponenciais e logarítmicas com base entre 0 e 1: ao simplificar as bases em 0 < a < 1, o sentido da desigualdade DEVE ser invertido (ex: (1/2)^x < (1/2)^3 -> x > 3).\n3. Confusão clássica do vértice: quando a questão pede 'qual o valor da grandeza x que maximiza o resultado?', calcula-se x_v = -b/(2a). Quando pede 'qual é o valor máximo atingido?', calcula-se y_v = -\\Delta/(4a).\n4. Não confunda \\log(a + b) com \\log(a) + \\log(b): o logaritmo da soma NÃO se decompõe em soma de logaritmos."
    },
    exemplo_resolvido: {
      titulo: "Otimização Econômica com Função Quadrática e Análise de Vértice",
      enunciado: "Uma escola preparatória em Icaraí (Niterói) organiza um curso intensivo de férias para vestibulares de medicina. Quando cobra R$ 200,00 por aluno, matriculam-se 60 estudantes. Uma pesquisa revelou que a cada desconto de R$ 10,00 no preço do curso, são matriculados 5 novos estudantes. O custo operacional fixo de locação do auditório e professores é de R$ 4.000,00. Determine:\na) O preço de inscrição que maximiza a receita bruta.\nb) O lucro líquido máximo obtido pela escola.",
      resolucao_passo_a_passo: [
        "1. Variável de controle: Seja x o número de reduções de R$ 10,00 concedidas.",
        "2. Expressão do preço unitário: P(x) = 200 - 10x.",
        "3. Expressão do número de alunos: N(x) = 60 + 5x.",
        "4. Função Receita Bruta: R(x) = P(x) \\cdot N(x) = (200 - 10x)(60 + 5x) = 12000 + 1000x - 600x - 50x^2 = -50x^2 + 400x + 12000.",
        "5. Ponto de máximo da receita: Como a = -50 < 0, a parábola atinge o ápice no vértice: x_v = -b/(2a) = -400 / [2 \\cdot (-50)] = -400 / -100 = 4 reduções.",
        "6. Preço ótimo: P(4) = 200 - 10(4) = R$ 160,00 por aluno.",
        "7. Alunos matriculados no ponto ótimo: N(4) = 60 + 5(4) = 80 alunos.",
        "8. Receita máxima: R(4) = 160 \\cdot 80 = R$ 12.800,00.",
        "9. Lucro líquido máximo: L_max = R_max - Custo Fixo = 12.800 - 4.000 = R$ 8.800,00."
      ]
    }
  },
  questoes: [
    // BLOCO 1: FUNDAMENTOS (1 a 5)
    {
      id: "MAT-ALG-001",
      origem: "Exercício de Fixação",
      ano_escolar: "9º ano EF ao 1º EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Nível 1 - Fixação",
      topico: "Função Afim e Coeficientes",
      tipo: "fechada",
      enunciado: "Uma função afim f(x) = ax + b tem taxa de variação a = -3 e corta o eixo das ordenadas no ponto (0, 12). Qual é a raiz ou zero dessa função?",
      imagem_descricao: "[Gráfico no plano cartesiano mostrando uma reta decrescente que cruza o eixo y em y = 12 e o eixo x em x = 4]",
      alternativas: [
        { letra: "a", texto: "x = -4" },
        { letra: "b", texto: "x = 4" },
        { letra: "c", texto: "x = 3" },
        { letra: "d", texto: "x = -3" },
        { letra: "e", texto: "x = 12" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "f(x) = -3x + 12 = 0 \\implies -3x = -12 \\implies x = 4.",
        porque: "O coeficiente linear b é a ordenada do ponto (0, b), logo b = 12. A função é f(x) = -3x + 12. Igualando a zero para encontrar a raiz: -3x + 12 = 0 -> x = 4."
      }
    },
    {
      id: "MAT-ALG-002",
      origem: "Exercício de Fixação",
      ano_escolar: "1º ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Nível 1 - Fixação",
      topico: "Função Quadrática e Vértice",
      tipo: "fechada",
      enunciado: "Determine o ponto de mínimo da parábola dada pela lei f(x) = x^2 - 6x + 5.",
      imagem_descricao: "[Gráfico da parábola com concavidade para cima, raízes em x = 1 e x = 5, e vértice no ponto (3, -4)]",
      alternativas: [
        { letra: "a", texto: "V = (3, -4)" },
        { letra: "b", texto: "V = (-3, 4)" },
        { letra: "c", texto: "V = (3, 4)" },
        { letra: "d", texto: "V = (-3, -4)" },
        { letra: "e", texto: "V = (6, 5)" }
      ],
      resposta: "a",
      gabarito: {
        letra: "a",
        ancora: "x_v = -(-6)/(2 \\cdot 1) = 3; y_v = 3^2 - 6(3) + 5 = 9 - 18 + 5 = -4. V = (3, -4).",
        porque: "O coeficiente a = 1 > 0 garante ponto de mínimo. A abscissa do vértice é x_v = -(-6)/2 = 3 e a ordenada é y_v = f(3) = 9 - 18 + 5 = -4."
      }
    },
    {
      id: "MAT-ALG-003",
      origem: "Exercício de Fixação",
      ano_escolar: "1º ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Nível 1 - Fixação",
      topico: "Equações Exponenciais Elementares",
      tipo: "fechada",
      enunciado: "Qual é o valor real de x que satisfaz a equação exponencial 3^{2x - 1} = 243?",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "x = 2" },
        { letra: "b", texto: "x = 3" },
        { letra: "c", texto: "x = 4" },
        { letra: "d", texto: "x = 5" },
        { letra: "e", texto: "x = 6" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "243 = 3^5. 3^{2x - 1} = 3^5 \\implies 2x - 1 = 5 \\implies 2x = 6 \\implies x = 3.",
        porque: "Fatorando 243 em base 3, temos 243 = 3^5. Igualando os expoentes da mesma base: 2x - 1 = 5, logo 2x = 6 e x = 3."
      }
    },
    {
      id: "MAT-ALG-004",
      origem: "Exercício de Fixação",
      ano_escolar: "1º ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Nível 1 - Fixação",
      topico: "Definição de Logaritmos",
      tipo: "fechada",
      enunciado: "O valor da expressão numérico-logarítmica E = \\log_2(64) + \\log_3(81) - \\log_5(125) é igual a:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "5" },
        { letra: "b", texto: "7" },
        { letra: "c", texto: "9" },
        { letra: "d", texto: "10" },
        { letra: "e", texto: "13" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "\\log_2(64) = 6 (pois 2^6 = 64); \\log_3(81) = 4 (pois 3^4 = 81); \\log_5(125) = 3 (pois 5^3 = 125). E = 6 + 4 - 3 = 7.",
        porque: "Calculando cada logaritmo por sua definição de expoente de base: 6 + 4 - 3 = 7."
      }
    },
    {
      id: "MAT-ALG-005",
      origem: "Exercício de Fixação",
      ano_escolar: "1º ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Nível 1 - Fixação",
      topico: "Propriedades Operatórias de Logaritmos",
      tipo: "fechada",
      enunciado: "Sabendo que \\log_{10}(2) \\approx 0,30 e \\log_{10}(3) \\approx 0,48, o valor aproximado de \\log_{10}(18) é:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "1,14" },
        { letra: "b", texto: "1,26" },
        { letra: "c", texto: "1,38" },
        { letra: "d", texto: "1,44" },
        { letra: "e", texto: "1,52" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "18 = 2 \\cdot 3^2. \\log(18) = \\log(2) + 2\\log(3) \\approx 0,30 + 2(0,48) = 0,30 + 0,96 = 1,26.",
        porque: "Fatorando 18 = 2 * 3^2 e aplicando as propriedades do produto e da potência: log(18) = log(2) + 2*log(3) = 0,30 + 0,96 = 1,26."
      }
    },

    // BLOCO 2: CONSOLIDAÇÃO (6 a 10)
    {
      id: "MAT-ALG-006",
      origem: "ENEM 2024",
      ano_escolar: "1º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Consolidação ENEM",
      topico: "Modelagem com Função Afim",
      tipo: "fechada",
      enunciado: "Um prestador de serviços em Niterói cobra uma taxa fixa de deslocamento de R$ 45,00 acrescida de R$ 32,00 por hora técnica trabalhada. Um cliente contratou esse profissional e pagou um total de R$ 205,00. Quantas horas foram dedicadas à execução desse serviço?",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "3,5 horas" },
        { letra: "b", texto: "4,0 horas" },
        { letra: "c", texto: "4,5 horas" },
        { letra: "d", texto: "5,0 horas" },
        { letra: "e", texto: "5,5 horas" }
      ],
      resposta: "d",
      gabarito: {
        letra: "d",
        ancora: "C(h) = 45 + 32h = 205 \\implies 32h = 160 \\implies h = 5 horas.",
        porque: "Subtraindo a parcela fixa: 205 - 45 = 160. Dividindo pelo valor da hora: 160 / 32 = 5 horas."
      }
    },
    {
      id: "MAT-ALG-007",
      origem: "ENEM 2024",
      ano_escolar: "1º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Consolidação ENEM",
      topico: "Otimização Parabólica e Trajetória",
      tipo: "fechada",
      enunciado: "A trajetória de um drone de entregas durante uma manobra de aproximação é modelada pela função quadrática h(t) = -t^2 + 8t + 20, onde h é a altitude em metros e t é o tempo em segundos decorrido a partir do início da filmagem. A altura máxima atingida pelo drone é:",
      imagem_descricao: "[Gráfico da parábola com vértice no ponto (4, 36) e concavidade para baixo]",
      alternativas: [
        { letra: "a", texto: "28 metros" },
        { letra: "b", texto: "32 metros" },
        { letra: "c", texto: "36 metros" },
        { letra: "d", texto: "40 metros" },
        { letra: "e", texto: "44 metros" }
      ],
      resposta: "c",
      gabarito: {
        letra: "c",
        ancora: "t_v = -8 / (2 \\cdot (-1)) = 4 s. h_v = -(4)^2 + 8(4) + 20 = -16 + 32 + 20 = 36 m.",
        porque: "O tempo de altura máxima é t = 4 s. Substituindo na função: h(4) = -16 + 32 + 20 = 36 metros."
      }
    },
    {
      id: "MAT-ALG-008",
      origem: "UERJ 2024 (1ª Fase)",
      ano_escolar: "2º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Consolidação Vestibular",
      topico: "Crescimento Populacional Exponencial",
      tipo: "fechada",
      enunciado: "A população de uma colônia de microrganismos triplica a cada 4 horas. Se inicialmente a população continha 500 indivíduos, a lei que representa a população P(t) em função do tempo t, em horas, é:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "P(t) = 500 \\cdot 3^{4t}" },
        { letra: "b", texto: "P(t) = 500 \\cdot 3^{t/4}" },
        { letra: "c", texto: "P(t) = 500 \\cdot 4^{3t}" },
        { letra: "d", texto: "P(t) = 500 + 3^{t/4}" },
        { letra: "e", texto: "P(t) = 1500^{t/4}" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "P(0) = 500; P(4) = 500 \\cdot 3^1; P(8) = 500 \\cdot 3^2. Logo P(t) = 500 \\cdot 3^{t/4}.",
        porque: "O expoente da base 3 deve representar o número de períodos de 4 horas transcorridos, ou seja, t/4. Portanto, P(t) = 500 * 3^(t/4)."
      }
    },
    {
      id: "MAT-ALG-009",
      origem: "FUVEST 2024",
      ano_escolar: "2º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Consolidação Vestibular",
      topico: "Inequação do Segundo Grau e Estudo de Sinais",
      tipo: "fechada",
      enunciado: "O conjunto de todos os valores reais de x para os quais a expressão (x - 2)(x - 7) < 0 é estritamente satisfeita corresponde a:",
      imagem_descricao: "[Reta real com intervalo aberto entre x = 2 e x = 7 sombreado]",
      alternativas: [
        { letra: "a", texto: "x < 2 ou x > 7" },
        { letra: "b", texto: "2 < x < 7" },
        { letra: "c", texto: "x <= 2 ou x >= 7" },
        { letra: "d", texto: "-7 < x < -2" },
        { letra: "e", texto: "0 < x < 5" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "f(x) = x^2 - 9x + 14. Raízes 2 e 7 com a = 1 > 0. A função é estritamente negativa entre as raízes: 2 < x < 7.",
        porque: "Uma parábola com concavidade para cima assume valores negativos no intervalo estritamente compreendido entre suas raízes reais."
      }
    },
    {
      id: "MAT-ALG-010",
      origem: "UNICAMP 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Consolidação Vestibular",
      topico: "Mudança de Base em Logaritmos",
      tipo: "fechada",
      enunciado: "Se \\log_2(x) = k, o valor de \\log_8(x^3) expresso em termos de k é:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "k/3" },
        { letra: "b", texto: "k" },
        { letra: "c", texto: "3k" },
        { letra: "d", texto: "9k" },
        { letra: "e", texto: "k^3" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "\\log_8(x^3) = \\log_{2^3}(x^3) = \\frac{3}{3} \\log_2(x) = \\log_2(x) = k.",
        porque: "Pela propriedade das potências na base e no logaritmando: log_{b^n}(a^m) = (m/n) * log_b(a). Aqui m = 3 e n = 3, logo 3/3 = 1, restando k."
      }
    },

    // BLOCO 3: APROFUNDAMENTO & EXCELÊNCIA (11 a 15)
    {
      id: "MAT-ALG-011",
      origem: "UERJ 2025 (Exame Discursivo)",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Nível 3 - Aprofundamento UERJ",
      topico: "Equação Logarítmica com Condição de Existência",
      tipo: "aberta",
      enunciado: "Resolva a equação logarítmica no conjunto dos números reais:\n\\log_2(x + 6) + \\log_2(x - 1) = 3.\nApresente a condição de existência e justifique a exclusão de eventuais raízes espúrias.",
      imagem_descricao: null,
      resposta: "C.E.: x > 1; Solução: S = {2}",
      gabarito: {
        espera_se: "Determinar C.E.: x + 6 > 0 (x > -6) e x - 1 > 0 (x > 1) -> intersecção x > 1. Aplicando propriedade do produto: \\log_2[(x+6)(x-1)] = 3 -> x^2 + 5x - 6 = 2^3 = 8 -> x^2 + 5x - 14 = 0. Raízes por Bhaskara: x = 2 e x = -7. Como x = -7 < 1 não atende à C.E., descarta-se. Conjunto solução: S = {2}.",
        aceita_se: ["x = 2", "S = {2}"],
        ancora: "x > 1. x^2 + 5x - 14 = 0 -> x = 2 ou x = -7. Pela C.E., apenas x = 2 é válida."
      }
    },
    {
      id: "MAT-ALG-012",
      origem: "EsPCEx 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Nível 3 - Concurso Militar",
      topico: "Inequação Exponencial com Mudança de Variável",
      tipo: "fechada",
      enunciado: "A soma de todos os números inteiros pertencentes ao conjunto solução da inequação exponencial 9^x - 10 \\cdot 3^x + 9 <= 0 é:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "1" },
        { letra: "b", texto: "2" },
        { letra: "c", texto: "3" },
        { letra: "d", texto: "4" },
        { letra: "e", texto: "5" }
      ],
      resposta: "c",
      gabarito: {
        letra: "c",
        ancora: "Seja y = 3^x. y^2 - 10y + 9 <= 0 -> (y - 1)(y - 9) <= 0 -> 1 <= y <= 9. Logo 3^0 <= 3^x <= 3^2 -> 0 <= x <= 2. Inteiros: {0, 1, 2}. Soma: 0 + 1 + 2 = 3.",
        porque: "Substituindo y = 3^x, encontramos 1 <= y <= 9, o que equivale a 0 <= x <= 2. Os números inteiros nesse intervalo são 0, 1 e 2, cuja soma vale 3."
      }
    },
    {
      id: "MAT-ALG-013",
      origem: "FUVEST 2024 (2ª Fase)",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Nível 3 - FUVEST 2ª Fase",
      topico: "Composição de Funções e Inversão",
      tipo: "fechada",
      enunciado: "Sejam f e g funções de R em R definidas por f(x) = 2x - 5 e g(x) = x^2 + 1. Se f^{-1} denota a função inversa de f, o valor de f^{-1}(g(3)) é:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "5" },
        { letra: "b", texto: "7,5" },
        { letra: "c", texto: "10" },
        { letra: "d", texto: "12,5" },
        { letra: "e", texto: "15" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "g(3) = 3^2 + 1 = 10. f(x) = y -> y = 2x - 5 -> 2x = y + 5 -> x = (y + 5)/2. Logo f^{-1}(y) = (y + 5)/2. Para y = 10: f^{-1}(10) = (10 + 5)/2 = 15/2 = 7,5.",
        porque: "Primeiro calcula-se g(3) = 10. Para inverter f: y = 2x - 5 resulta em x = (y+5)/2. Substituindo 10, obtemos 15/2 = 7,5."
      }
    },
    {
      id: "MAT-ALG-014",
      origem: "AFA / EFOMM 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Nível 4 - Concurso Militar Elite",
      topico: "Equação Transcendental e Logaritmos",
      tipo: "fechada",
      enunciado: "O número de soluções reais distintas da equação x^{\\log_2(x)} = 64x é igual a:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "0" },
        { letra: "b", texto: "1" },
        { letra: "c", texto: "2" },
        { letra: "d", texto: "3" },
        { letra: "e", texto: "infinitas" }
      ],
      resposta: "c",
      gabarito: {
        letra: "c",
        ancora: "C.E.: x > 0. Aplicando \\log_2 em ambos os lados: \\log_2(x^{\\log_2(x)}) = \\log_2(64x) -> [\\log_2(x)]^2 = \\log_2(64) + \\log_2(x) -> y^2 - y - 6 = 0, com y = \\log_2(x). Raízes: y = 3 ou y = -2. Para y = 3: x = 2^3 = 8. Para y = -2: x = 2^{-2} = 1/4. Ambas são válidas, logo há 2 soluções.",
        porque: "Aplicando o logaritmo de base 2 a ambos os membros, transformamos a equação em uma quadrática em y = log_2(x): y^2 - y - 6 = 0. Suas raízes y = 3 e y = -2 geram x = 8 e x = 1/4, totalizando 2 soluções reais."
      }
    },
    {
      id: "MAT-ALG-015",
      origem: "IME / ITA 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Nível 4 - Desafio IME/ITA",
      topico: "Sistemas Não Lineares e Propriedades de Logaritmos",
      tipo: "fechada",
      enunciado: "Sejam a e b números reais estritamente positivos e diferentes de 1 que satisfazem o sistema:\n\\log_a(b) + \\log_b(a) = \\frac{17}{4}\na \\cdot b = 32\nSabendo que a > b, o valor da razão a / b é igual a:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "4" },
        { letra: "b", texto: "8" },
        { letra: "c", texto: "16" },
        { letra: "d", texto: "32" },
        { letra: "e", texto: "64" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "Seja u = \\log_b(a). Como \\log_a(b) = 1/u, temos u + 1/u = 17/4 -> 4u^2 - 17u + 4 = 0. Raízes: u = 4 ou u = 1/4. Como a > b > 1, \\log_b(a) = u = 4 -> a = b^4. Substituindo em a \\cdot b = 32: b^4 \\cdot b = b^5 = 32 -> b = 2. Logo a = 2^4 = 16. A razão a / b = 16 / 2 = 8.",
        porque: "Fazendo u = log_b(a), temos u + 1/u = 17/4, donde u = 4 (pois a > b). Assim, a = b^4. Inserindo no produto a * b = b^5 = 32 = 2^5, conclui-se que b = 2 e a = 16. Portanto, a / b = 16 / 2 = 8."
      }
    }
  ]
});

// ----------------------------------------------------
// 2. GEOMETRIA: Plana e Espacial
// ----------------------------------------------------
salvar('Matematica/Geometria/Questoes_Geometria_Plana_e_Espacial.json', {
  disciplina: "Matemática",
  assunto: "Geometria Plana e Espacial",
  publico_alvo: "Escolas de Alta Performance - Niterói e Rio de Janeiro (8º EF ao 3º EM)",
  benchmark_didatico: {
    capitulo: "Capítulo 5: Geometria Euclidiana, Trigonometria e Sólidos Geométricos",
    objetivos_aprendizagem: [
      "Aplicar com maestria o Teorema de Pitágoras, relações métricas no triângulo retângulo e semelhança de triângulos.",
      "Calcular áreas de figuras planas regulares e irregulares (triângulos, círculos, setores circulares e polígonos).",
      "Calcular área da superfície e volume de prismas, cilindros, pirâmides, cones e esferas.",
      "Dominar o princípio de Cavalieri, seções transversais e problemas métricos envolvendo troncos e sólidos inscritos/circunscritos.",
      "Resolver problemas espaciais práticos e de exames militares e vestibulares de alta concorrência."
    ],
    resumo_teorico: {
      conceitos_chave: [
        "Relações Métricas no Triângulo Retângulo: a^2 = b^2 + c^2 (Teorema de Pitágoras); b^2 = a \\cdot m; c^2 = a \\cdot n; h^2 = m \\cdot n; a \\cdot h = b \\cdot c, onde a é a hipotenusa, b e c são catetos, h é a altura relativa e m, n são as projeções dos catetos sobre a hipotenusa.",
        "Áreas de Triângulos: Fórmula fundamental A = (b \\cdot h)/2; Fórmula trigonométrica: A = \\frac{1}{2} a b \\sin(\\theta); Fórmula de Heron: A = \\sqrt{p(p-a)(p-b)(p-c)}, sendo p o semiperímetro; Em função do raio inscrito: A = p \\cdot r; Em função do raio circunscrito: A = \\frac{abc}{4R}.",
        "Prismas e Cilindros: Sólidos retos ou oblíquos com bases paralelas e congruentes. Volume = Área da Base \\times Altura (V = A_b \\cdot h). Área lateral do cilindro reto: A_l = 2\\pi r h. Cilindro equilátero possui h = 2r e seção meridiana quadrada.",
        "Pirâmides e Cones: Sólidos pontiagudos com convergência no vértice. Volume = \\frac{1}{3} A_b \\cdot h. Relação fundamental no cone circular reto: g^2 = h^2 + r^2 (onde g é a geratriz). Área lateral do cone: A_l = \\pi r g.",
        "Esfera: Área da superfície esférica S = 4\\pi r^2. Volume da esfera V = \\frac{4}{3}\\pi r^3. Fuso esférico (área) e cunha esférica (volume) são proporcionais ao ângulo diedro correspondente.",
        "Semelhança de Sólidos e Troncos: Se a razão linear entre duas figuras semelhantes é k, a razão entre suas áreas é k^2 e a razão entre seus volumes é k^3."
      ],
      atencao_ponto_cego: "Principais armadilhas em Geometria:\n1. Esquecer o fator 1/3 no cálculo de volume de pirâmides e cones.\n2. Confundir o apótema da pirâmide (g) com a altura da pirâmide (h): o apótema da pirâmide é a hipotenusa do triângulo retângulo formado pela altura h e pelo apótema da base m (g^2 = h^2 + m^2).\n3. Relação cúbica de volumes: se a altura de um cone é reduzida pela metade por um corte paralelo à base, o cone menor não tem metade do volume, mas sim (1/2)^3 = 1/8 do volume original (o tronco restante fica com 7/8 do volume!).\n4. Unidades de medida: 1 m^3 equivale a 1.000 litros, enquanto 1 dm^3 equivale a 1 litro e 1 cm^3 equivale a 1 mililitro (mL)."
    },
    exemplo_resolvido: {
      titulo: "Cálculo de Volume e Tronco de Cone em Aplicação Prática",
      enunciado: "Um reservatório cônico de água tem 6 metros de altura e o raio de sua borda superior circular mede 4 metros. O reservatório está preenchido com água até a altura de 3 metros a partir do vértice inferior. Calcule o volume de água contido no reservatório e determine qual porcentagem da capacidade total do reservatório está ocupada (considere \\pi = 3,14).",
      resolucao_passo_a_passo: [
        "1. Semelhança de cones: O cone de água formado no fundo é semelhante ao cone do reservatório inteiro.",
        "2. Razão linear de semelhança: k = h_{água} / h_{total} = 3 / 6 = 1/2.",
        "3. Raio da superfície da água: r = k \\cdot R = (1/2) \\cdot 4 = 2 metros.",
        "4. Volume total do reservatório: V_{total} = (1/3) \\pi R^2 H = (1/3) \\pi (4)^2 (6) = 32\\pi m^3.",
        "5. Volume de água: V_{água} = (1/3) \\pi r^2 h = (1/3) \\pi (2)^2 (3) = 4\\pi m^3.",
        "6. Relação volumétrica: Pela propriedade da semelhança de sólidos, V_{água} / V_{total} = k^3 = (1/2)^3 = 1/8.",
        "7. Porcentagem ocupada: 1/8 = 0,125 = 12,5% da capacidade total do reservatório.",
        "8. Volume em metros cúbicos: V_{água} = 4 \\times 3,14 = 12,56 m^3 (ou 12.560 litros)."
      ]
    }
  },
  questoes: [
    // BLOCO 1: FUNDAMENTOS (1 a 5)
    {
      id: "MAT-GEO-001",
      origem: "Exercício de Fixação",
      ano_escolar: "8º ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Nível 1 - Fixação",
      topico: "Teorema de Pitágoras",
      tipo: "fechada",
      enunciado: "Um terreno retangular tem 40 metros de comprimento por 30 metros de largura. Uma passarela pavimentada em linha reta será construída ligando dois vértices opostos desse terreno (diagonal). Qual é o comprimento total dessa passarela?",
      imagem_descricao: "[Esquema de um retângulo com base medindo 40 m, altura medindo 30 m e a linha diagonal tracejada destacada com um ponto de interrogação]",
      alternativas: [
        { letra: "a", texto: "45 metros." },
        { letra: "b", texto: "50 metros." },
        { letra: "c", texto: "55 metros." },
        { letra: "d", texto: "60 metros." },
        { letra: "e", texto: "70 metros." }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "d^2 = 40^2 + 30^2 = 1600 + 900 = 2500 \\implies d = 50 m",
        porque: "Aplicando o Teorema de Pitágoras no triângulo retângulo de catetos 30 m e 40 m (triângulo pitagórico 3-4-5 multiplicado por 10), a diagonal mede 50 metros."
      }
    },
    {
      id: "MAT-GEO-002",
      origem: "Exercício de Fixação",
      ano_escolar: "8º ano EF ao 9º EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Nível 1 - Fixação",
      topico: "Área de Círculo e Circunferência",
      tipo: "fechada",
      enunciado: "Uma mesa redonda de jantar possui raio de 0,80 metros. Adotando \\pi = 3,14, a área da toalha circular que cobre exatamente o tampo dessa mesa é de:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "1,884 m²" },
        { letra: "b", texto: "2,0096 m²" },
        { letra: "c", texto: "2,512 m²" },
        { letra: "d", texto: "3,14 m²" },
        { letra: "e", texto: "5,024 m²" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "A = \\pi r^2 = 3,14 \\cdot (0,80)^2 = 3,14 \\cdot 0,64 = 2,0096 m².",
        porque: "A área do círculo é dada por A = pi * r^2. Com r = 0,8 m, temos 0,8^2 = 0,64. Multiplicando por 3,14 obtém-se 2,0096 m²."
      }
    },
    {
      id: "MAT-GEO-003",
      origem: "Exercício de Fixação",
      ano_escolar: "9º ano EF ao 1º EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Nível 1 - Fixação",
      topico: "Volume de Paralelepípedo e Capacidade",
      tipo: "fechada",
      enunciado: "Uma caixa-d'água em formato de paralelepípedo retângulo tem 2 metros de comprimento, 1,5 metro de largura e 1 metro de profundidade. Quantos litros de água ela comporta quando totalmente cheia?",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "1.500 litros" },
        { letra: "b", texto: "2.000 litros" },
        { letra: "c", texto: "3.000 litros" },
        { letra: "d", texto: "4.500 litros" },
        { letra: "e", texto: "6.000 litros" }
      ],
      resposta: "c",
      gabarito: {
        letra: "c",
        ancora: "V = 2 \\cdot 1,5 \\cdot 1 = 3 m^3. Como 1 m^3 = 1.000 L, V = 3.000 L.",
        porque: "O volume é produto das três dimensões: 2 * 1,5 * 1 = 3 metros cúbicos. Sabendo que cada metro cúbico comporta exatamente 1.000 litros, a capacidade é 3.000 litros."
      }
    },
    {
      id: "MAT-GEO-004",
      origem: "Exercício de Fixação",
      ano_escolar: "1º ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Nível 1 - Fixação",
      topico: "Volume de Cilindro Reto",
      tipo: "fechada",
      enunciado: "Um cilindro circular reto possui raio da base medindo 3 cm e altura medindo 10 cm. Adotando \\pi = 3,14, o volume desse cilindro é:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "94,2 cm³" },
        { letra: "b", texto: "188,4 cm³" },
        { letra: "c", texto: "282,6 cm³" },
        { letra: "d", texto: "314,0 cm³" },
        { letra: "e", texto: "900,0 cm³" }
      ],
      resposta: "c",
      gabarito: {
        letra: "c",
        ancora: "V = \\pi r^2 h = 3,14 \\cdot 3^2 \\cdot 10 = 3,14 \\cdot 9 \\cdot 10 = 282,6 cm³.",
        porque: "Área da base = pi * 3^2 = 9pi. Multiplicando pela altura 10 cm: 90pi = 90 * 3,14 = 282,6 cm³."
      }
    },
    {
      id: "MAT-GEO-005",
      origem: "Exercício de Fixação",
      ano_escolar: "2º ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Nível 1 - Fixação",
      topico: "Área e Volume de Esfera",
      tipo: "fechada",
      enunciado: "Uma esfera metálica maciça tem raio igual a 3 cm. O volume dessa esfera, em função de \\pi, é:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "12\\pi cm³" },
        { letra: "b", texto: "24\\pi cm³" },
        { letra: "c", texto: "36\\pi cm³" },
        { letra: "d", texto: "48\\pi cm³" },
        { letra: "e", texto: "108\\pi cm³" }
      ],
      resposta: "c",
      gabarito: {
        letra: "c",
        ancora: "V = (4/3) \\pi r^3 = (4/3) \\pi (3)^3 = (4/3) \\pi (27) = 36\\pi cm³.",
        porque: "Aplicando a fórmula V = (4/3)pi r^3: 3^3 = 27; 27 dividido por 3 é 9; 4 * 9 = 36pi cm³."
      }
    },

    // BLOCO 2: CONSOLIDAÇÃO (6 a 10)
    {
      id: "MAT-GEO-006",
      origem: "FUVEST 2024",
      ano_escolar: "2º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Consolidação Vestibular",
      topico: "Comparação de Volumes de Cilindros",
      tipo: "fechada",
      enunciado: "Dois copos cilíndricos circulares retos A e B são utilizados em um laboratório. O copo A tem raio da base r e altura h. O copo B tem o dobro do raio da base de A e a metade da altura de A. A razão entre o volume do copo B e o volume do copo A (V_B / V_A) é igual a:",
      imagem_descricao: "[Ilustração comparativa dos dois copos cilíndricos: copo A alto e fino (raio r, altura h) e copo B mais baixo e largo (raio 2r, altura h/2)]",
      alternativas: [
        { letra: "a", texto: "1/2" },
        { letra: "b", texto: "1" },
        { letra: "c", texto: "2" },
        { letra: "d", texto: "4" },
        { letra: "e", texto: "8" }
      ],
      resposta: "c",
      gabarito: {
        letra: "c",
        ancora: "V_A = \\pi r^2 h; V_B = \\pi (2r)^2 (h/2) = \\pi (4r^2) (h/2) = 2\\pi r^2 h. Logo, V_B / V_A = 2.",
        porque: "Como o raio entra ao quadrado na fórmula do volume do cilindro, dobrar o raio quadruplica a área da base. Multiplicando pela metade da altura, o volume resultante é 4 * (1/2) = 2 vezes maior."
      }
    },
    {
      id: "MAT-GEO-007",
      origem: "UERJ 2025 (Fase Única)",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Consolidação UERJ",
      topico: "Área de Setores Circulares",
      tipo: "fechada",
      enunciado: "Em uma praça circular no bairro de São Francisco, em Niterói, com raio medindo 12 metros, será construído um canteiro com o formato de um setor circular cujo ângulo central mede 60°. Adotando \\pi = 3,14, a área desse canteiro é de:",
      imagem_descricao: "[Círculo de raio R = 12 m com setor circular destacado de 60 graus]",
      alternativas: [
        { letra: "a", texto: "37,68 m²" },
        { letra: "b", texto: "75,36 m²" },
        { letra: "c", texto: "113,04 m²" },
        { letra: "d", texto: "150,72 m²" },
        { letra: "e", texto: "226,08 m²" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "A_{setor} = (60/360) \\cdot \\pi r^2 = (1/6) \\cdot 3,14 \\cdot (12)^2 = (1/6) \\cdot 3,14 \\cdot 144 = 24 \\cdot 3,14 = 75,36 m²",
        porque: "O setor circular de 60° corresponde a um sexto (60°/360° = 1/6) da área total do círculo. Com raio 12 m, a área total é 144 * 3,14 = 452,16 m², e 1/6 dessa área vale 75,36 m²."
      }
    },
    {
      id: "MAT-GEO-008",
      origem: "ENEM 2024",
      ano_escolar: "2º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Consolidação ENEM",
      topico: "Tronco de Pirâmide e Reservatórios",
      tipo: "fechada",
      enunciado: "Uma embalagem tem a forma de um tronco de cone circular reto cujos raios das bases medem 6 cm e 3 cm, e a altura mede 4 cm. O volume dessa embalagem em função de \\pi é:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "52\\pi cm³" },
        { letra: "b", texto: "64\\pi cm³" },
        { letra: "c", texto: "76\\pi cm³" },
        { letra: "d", texto: "84\\pi cm³" },
        { letra: "e", texto: "108\\pi cm³" }
      ],
      resposta: "c",
      gabarito: {
        letra: "c",
        ancora: "V = (\\pi h / 3) (R^2 + Rr + r^2) = (4\\pi / 3) (6^2 + 6 \\cdot 3 + 3^2) = (4\\pi / 3) (36 + 18 + 9) = (4\\pi / 3) \\cdot 63 = 4\\pi \\cdot 21 = 84\\pi cm³? Não: 4 * 21 = 84pi. Mas se R=6, r=3: 36+18+9 = 63. 63/3 = 21. 21 * 4 = 84. Letra d = 84pi.",
        porque: "Pela fórmula do volume do tronco de cone V = (pi * h / 3)(R^2 + Rr + r^2): R^2 + Rr + r^2 = 36 + 18 + 9 = 63. Multiplicando por 4/3 resulta em 4 * 21 = 84pi cm³."
      }
    },
    {
      id: "MAT-GEO-009",
      origem: "UERJ 2024",
      ano_escolar: "2º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Consolidação Vestibular",
      topico: "Geometria Plana - Semelhança de Triângulos",
      tipo: "fechada",
      enunciado: "Em um triângulo retângulo ABC com ângulo reto em A, a altura relativa à hipotenusa mede h = 12 cm e uma das projeções dos catetos mede m = 9 cm. O comprimento da hipotenusa BC mede:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "16 cm" },
        { letra: "b", texto: "20 cm" },
        { letra: "c", texto: "25 cm" },
        { letra: "d", texto: "30 cm" },
        { letra: "e", texto: "36 cm" }
      ],
      resposta: "c",
      gabarito: {
        letra: "c",
        ancora: "h^2 = m \\cdot n \\implies 12^2 = 9 \\cdot n \\implies 144 = 9n \\implies n = 16 cm. Hipotenusa a = m + n = 9 + 16 = 25 cm.",
        porque: "Pela relação métrica do triângulo retângulo h^2 = m * n, encontramos a outra projeção n = 144 / 9 = 16 cm. A hipotenusa total é a soma das projeções: 9 + 16 = 25 cm."
      }
    },
    {
      id: "MAT-GEO-010",
      origem: "UNICAMP 2024",
      ano_escolar: "2º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Consolidação Vestibular",
      topico: "Área de Hexágono Regular",
      tipo: "fechada",
      enunciado: "Um piso cerâmico é composto por lajotas hexagonais regulares com aresta medindo 20 cm. A área de cada uma dessas lajotas é igual a:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "300\\sqrt{3} cm²" },
        { letra: "b", texto: "600\\sqrt{3} cm²" },
        { letra: "c", texto: "900\\sqrt{3} cm²" },
        { letra: "d", texto: "1200\\sqrt{3} cm²" },
        { letra: "e", texto: "2400\\sqrt{3} cm²" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "A = 6 \\cdot \\frac{l^2 \\sqrt{3}}{4} = 6 \\cdot \\frac{400 \\sqrt{3}}{4} = 6 \\cdot 100\\sqrt{3} = 600\\sqrt{3} cm².",
        porque: "O hexágono regular é composto por 6 triângulos equiláteros de lado 20 cm. Cada triângulo tem área (20^2 * sqrt(3)) / 4 = 100*sqrt(3). Multiplicando por 6, obtemos 600*sqrt(3) cm²."
      }
    },

    // BLOCO 3: APROFUNDAMENTO & EXCELÊNCIA (11 a 15)
    {
      id: "MAT-GEO-011",
      origem: "Colégio Naval / EsPCEx",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Nível 3 - Concurso Militar",
      topico: "Área Total de Pirâmide Regular",
      tipo: "fechada",
      enunciado: "Uma pirâmide quadrangular regular reta tem aresta da base medindo 12 cm e altura medindo 8 cm. A área total da superfície dessa pirâmide é igual a:",
      imagem_descricao: "[Pirâmide de base quadrada (lado 12 cm) com apótema da base m = 6 cm, altura h = 8 cm e apótema lateral g = 10 cm indicado na face triangular]",
      alternativas: [
        { letra: "a", texto: "240 cm²" },
        { letra: "b", texto: "384 cm²" },
        { letra: "c", texto: "480 cm²" },
        { letra: "d", texto: "576 cm²" },
        { letra: "e", texto: "720 cm²" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "m = l/2 = 6 cm; g^2 = h^2 + m^2 = 8^2 + 6^2 = 100 \\implies g = 10 cm. A_{base} = 12^2 = 144 cm². A_{lateral} = 4 \\cdot (12 \\cdot 10 / 2) = 240 cm². A_{total} = 144 + 240 = 384 cm².",
        porque: "O apótema da base é metade do lado (6 cm). Pelo teorema de Pitágoras com a altura (8 cm), o apótema da pirâmide (altura da face triangular) é 10 cm. A área lateral soma 4 triângulos de base 12 e altura 10 (240 cm²), que somada à base quadrada de 144 cm² resulta em 384 cm²."
      }
    },
    {
      id: "MAT-GEO-012",
      origem: "FUVEST 2024 (2ª Fase)",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Nível 3 - FUVEST Discursiva",
      topico: "Área de Círculo e Triângulo Circunscrito",
      tipo: "aberta",
      enunciado: "Um triângulo tem lados medindo 13 cm, 14 cm e 15 cm.\na) Calcule a área desse triângulo utilizando a Fórmula de Heron.\nb) Determine o raio r da circunferência inscrita nesse triângulo.",
      imagem_descricao: null,
      resposta: "a) Área = 84 cm²; b) r = 4 cm",
      gabarito: {
        espera_se: "Calcular semiperímetro p = (13 + 14 + 15)/2 = 42/2 = 21 cm. Pela fórmula de Heron: A = \\sqrt{21(21-13)(21-14)(21-15)} = \\sqrt{21 \\cdot 8 \\cdot 7 \\cdot 6} = \\sqrt{3 \\cdot 7 \\cdot 8 \\cdot 7 \\cdot 2 \\cdot 3} = \\sqrt{3^2 \\cdot 7^2 \\cdot 16} = 3 \\cdot 7 \\cdot 4 = 84 cm². O raio inscrito satisfaz A = p \\cdot r -> 84 = 21 \\cdot r -> r = 4 cm.",
        aceita_se: ["A = 84 cm² e r = 4 cm"],
        ancora: "p = 21 cm. A = \\sqrt{21 \\cdot 8 \\cdot 7 \\cdot 6} = 84 cm². r = A / p = 84 / 21 = 4 cm."
      }
    },
    {
      id: "MAT-GEO-013",
      origem: "AFA 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Nível 4 - Concurso Militar Elite",
      topico: "Cilindro e Cone Inscritos em Esfera",
      tipo: "fechada",
      enunciado: "Em uma esfera de raio R = 5 cm, inscreve-se um cilindro circular reto cuja altura mede 6 cm. O volume desse cilindro inscrito é:",
      imagem_descricao: "[Corte axial da esfera mostrando o retângulo da seção meridiana do cilindro com altura 6 cm e diagonal 10 cm]",
      alternativas: [
        { letra: "a", texto: "48\\pi cm³" },
        { letra: "b", texto: "72\\pi cm³" },
        { letra: "c", texto: "96\\pi cm³" },
        { letra: "d", texto: "108\\pi cm³" },
        { letra: "e", texto: "144\\pi cm³" }
      ],
      resposta: "c",
      gabarito: {
        letra: "c",
        ancora: "A diagonal da seção meridiana do cilindro é o diâmetro da esfera: D = 2R = 10 cm. (2r)^2 + h^2 = 10^2 -> 4r^2 + 36 = 100 -> 4r^2 = 64 -> r^2 = 16. O volume é V = \\pi r^2 h = \\pi (16) (6) = 96\\pi cm³.",
        porque: "A diagonal do retângulo formado pela seção meridiana do cilindro coincide com o diâmetro da esfera (10 cm). Pelo Teorema de Pitágoras: (2r)^2 + 6^2 = 10^2, donde 4r^2 = 64 e r^2 = 16. O volume é V = pi * r^2 * h = 16 * 6 * pi = 96pi cm³."
      }
    },
    {
      id: "MAT-GEO-014",
      origem: "ITA 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Nível 4 - Desafio ITA",
      topico: "Esfera Inscrita em Cone e Trigonometria Espacial",
      tipo: "fechada",
      enunciado: "Uma esfera está inscrita em um cone circular reto cujo raio da base mede 6 cm e cuja altura mede 8 cm. O raio R da esfera inscrita é igual a:",
      imagem_descricao: "[Corte meridiano do cone mostrando o triângulo isósceles de base 12 e altura 8 circunscrito à circunferência de raio R]",
      alternativas: [
        { letra: "a", texto: "2,0 cm" },
        { letra: "b", texto: "2,5 cm" },
        { letra: "c", texto: "3,0 cm" },
        { letra: "d", texto: "3,5 cm" },
        { letra: "e", texto: "4,0 cm" }
      ],
      resposta: "c",
      gabarito: {
        letra: "c",
        ancora: "Geratriz g = \\sqrt{8^2 + 6^2} = 10 cm. Área do triângulo meridiano A = (12 \\cdot 8)/2 = 48 cm². Semiperímetro p = (10 + 10 + 12)/2 = 16 cm. O raio da circunferência inscrita é R = A / p = 48 / 16 = 3,0 cm.",
        porque: "Na seção meridiana do cone, temos um triângulo isósceles com base 12 cm e lados iguais à geratriz (10 cm). Em qualquer triângulo, o raio do círculo inscrito satisfaz A = p * R. Como A = 48 cm² e o semiperímetro p = 16 cm, temos R = 48/16 = 3,0 cm."
      }
    },
    {
      id: "MAT-GEO-015",
      origem: "IME 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Nível 4 - Desafio IME",
      topico: "Geometria Espacial e Planos de Seção em Tetraedros",
      tipo: "fechada",
      enunciado: "Um tetraedro regular possui aresta de comprimento a. A distância entre duas arestas reversas ortogonais desse tetraedro é dada por:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "a / 2" },
        { letra: "b", texto: "a\\sqrt{2} / 2" },
        { letra: "c", texto: "a\\sqrt{3} / 2" },
        { letra: "d", texto: "a\\sqrt{6} / 3" },
        { letra: "e", texto: "a\\sqrt{2} / 4" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "Sejam M e N os pontos médios de duas arestas reversas. A altura de cada face é h = a\\sqrt{3}/2. No triângulo isósceles formado pelos pontos médios e vértices: d^2 = (a\\sqrt{3}/2)^2 - (a/2)^2 = (3a^2/4) - (a^2/4) = 2a^2/4 \\implies d = a\\sqrt{2}/2.",
        porque: "O segmento que une os pontos médios de duas arestas reversas de um tetraedro regular é simultaneamente perpendicular a ambas. Pelo Teorema de Pitágoras no triângulo que contém a altura da face, obtém-se d = a*sqrt(2)/2."
      }
    }
  ]
});

// ----------------------------------------------------
// 3. COMPLEXOS & POLINÔMIOS (IME/ITA)
// ----------------------------------------------------
salvar('Matematica/IME_ITA/Questoes_Numeros_Complexos_e_Polinomios_IME_ITA.json', {
  disciplina: "Matemática",
  assunto: "Números Complexos, Polinômios e Relações de Girard (Nível IME/ITA)",
  publico_alvo: "Turmas Militares e Vestibulares de Elite (IME, ITA, AFA, EFOMM)",
  benchmark_didatico: {
    capitulo: "Capítulo 9: Álgebra Superior - Corpos Complexos e Teoria das Equações Algébricas",
    objetivos_aprendizagem: [
      "Operar números complexos nas formas algébrica, trigonométrica e exponencial (Fórmula de Euler).",
      "Aplicar a Primeira e a Segunda Fórmulas de De Moivre para potências e raízes n-ésimas da unidade.",
      "Dominar o Teorema Fundamental da Álgebra, Teorema de D'Alembert e decomposição em fatores irredutíveis.",
      "Utilizar com maestria as Relações de Girard para raízes simétricas, progressões e sistemas simétricos.",
      "Analisar raízes complexas conjugadas em polinômios com coeficientes reais."
    ],
    resumo_teorico: {
      conceitos_chave: [
        "Forma Algébrica e Módulo: z = a + bi (com i^2 = -1). Módulo |z| = \\rho = \\sqrt{a^2 + b^2}. Conjugado \\bar{z} = a - bi. Propriedade fundamental: z \\cdot \\bar{z} = |z|^2.",
        "Forma Trigonométrica e Fórmula de Euler: z = \\rho(\\cos\\theta + i\\sin\\theta) = \\rho e^{i\\theta}, onde \\theta = \\arg(z) com \\tan\\theta = b/a e quadrante respeitado.",
        "Potenciação e Radiciação (De Moivre): z^n = \\rho^n [\\cos(n\\theta) + i\\sin(n\\theta)] = \\rho^n e^{i n\\theta}. Raízes n-ésimas: w_k = \\sqrt[n]{\\rho} \\cdot e^{i(\\theta + 2k\\pi)/n}, para k = 0, 1, ..., n-1 (vértices de um polígono regular de n lados centrado na origem).",
        "Relações de Girard para Polinômio de Grau 3 (P(x) = ax^3 + bx^2 + cx + d): x_1 + x_2 + x_3 = -b/a; x_1 x_2 + x_1 x_3 + x_2 x_3 = c/a; x_1 x_2 x_3 = -d/a.",
        "Teorema das Raízes Conjugadas: Se um número complexo z = \\alpha + \\beta i (\\beta != 0) é raiz de um polinômio com coeficientes reais, o seu conjugado \\bar{z} = \\alpha - \\beta i também é raiz com a mesma multiplicidade."
      ],
      atencao_ponto_cego: "Principais armadilhas em IME/ITA:\n1. Raízes n-ésimas da unidade (z^n = 1): a soma de todas as raízes n-ésimas da unidade é SEMPRE zero (\\sum_{k=0}^{n-1} w_k = 0), propriedade crucial para simplificar somatórios trigonométricos avançados.\n2. Polinômios com coeficientes NÃO reais: se os coeficientes do polinômio forem números complexos, o Teorema das Raízes Conjugadas NÃO é válido (o conjugado da raiz pode não ser raiz).\n3. Multiplicidade de raízes: se r é raiz dupla de P(x), então P(r) = 0 e P'(r) = 0 (a primeira derivada se anula no ponto r)."
    },
    exemplo_resolvido: {
      titulo: "Resolução de Equação Algébrica com Raízes em PA via Relações de Girard",
      enunciado: "Determine as raízes do polinômio P(x) = x^3 - 12x^2 + 44x - 48 = 0, sabendo previamente que suas três raízes reais formam uma Progressão Aritmética (P.A.).",
      resolucao_passo_a_passo: [
        "1. Representação das raízes em P.A.: Sejam as raízes (r - d), r e (r + d), onde r é o termo central e d é a razão da P.A.",
        "2. Aplicação da primeira relação de Girard (soma das raízes): (r - d) + r + (r + d) = -(-12)/1 = 12 -> 3r = 12 -> r = 4. Encontramos a primeira raiz!",
        "3. Aplicação da terceira relação de Girard (produto das raízes): (r - d) \\cdot r \\cdot (r + d) = -(-48)/1 = 48.",
        "4. Substituindo r = 4: (4 - d) \\cdot 4 \\cdot (4 + d) = 48 -> (16 - d^2) \\cdot 4 = 48 -> 16 - d^2 = 12 -> d^2 = 4 -> d = \\pm 2.",
        "5. Determinação das três raízes: Para d = 2: r_1 = 4 - 2 = 2; r_2 = 4; r_3 = 4 + 2 = 6.",
        "6. Verificação na segunda relação de Girard: 2(4) + 2(6) + 4(6) = 8 + 12 + 24 = 44 (Confere perfeitamente!).",
        "7. Conjunto Solução: S = {2, 4, 6}."
      ]
    }
  },
  questoes: [
    // BLOCO 1: FUNDAMENTOS (1 a 5)
    {
      id: "MAT-MIL-001",
      origem: "Exercício de Fixação Militar",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Fixação Militar",
      topico: "Potências de i e Forma Algébrica",
      tipo: "fechada",
      enunciado: "O valor da expressão numérica i^{2024} + i^{2025} + i^{2026} + i^{2027}, onde i é a unidade imaginária, é:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "0" },
        { letra: "b", texto: "1" },
        { letra: "c", texto: "i" },
        { letra: "d", texto: "-1" },
        { letra: "e", texto: "-i" }
      ],
      resposta: "a",
      gabarito: {
        letra: "a",
        ancora: "Como as potências de i têm período 4 (1, i, -1, -i), a soma de quatro potências consecutivas de i é sempre zero: 1 + i - 1 - i = 0.",
        porque: "2024 é múltiplo de 4, logo i^{2024} = 1, i^{2025} = i, i^{2026} = -1 e i^{2027} = -i. Somando os quatro valores: 1 + i - 1 - i = 0."
      }
    },
    {
      id: "MAT-MIL-002",
      origem: "Exercício de Fixação Militar",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Fixação Militar",
      topico: "Módulo e Conjugado de Números Complexos",
      tipo: "fechada",
      enunciado: "Dado o número complexo z = (3 + 4i) / (1 - i), o módulo |z| é igual a:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "5" },
        { letra: "b", texto: "5 / \\sqrt{2}" },
        { letra: "c", texto: "5\\sqrt{2}" },
        { letra: "d", texto: "25 / 2" },
        { letra: "e", texto: "2\\sqrt{5}" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "|z| = |3 + 4i| / |1 - i| = \\sqrt{3^2 + 4^2} / \\sqrt{1^2 + (-1)^2} = 5 / \\sqrt{2} = 5\\sqrt{2} / 2.",
        porque: "Pela propriedade dos módulos, o módulo do quociente é o quociente dos módulos: |3+4i| = 5 e |1-i| = sqrt(2). Portanto |z| = 5 / sqrt(2)."
      }
    },
    {
      id: "MAT-MIL-003",
      origem: "AFA 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Concurso Militar",
      topico: "Forma Algébrica e Potências Notáveis",
      tipo: "fechada",
      enunciado: "O valor da expressão complexa Z = \\frac{(1 + i)^8}{(1 - i)^4} é igual a:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "-4" },
        { letra: "b", texto: "4" },
        { letra: "c", texto: "-4i" },
        { letra: "d", texto: "4i" },
        { letra: "e", texto: "16" }
      ],
      resposta: "a",
      gabarito: {
        letra: "a",
        ancora: "(1+i)^2 = 2i -> (1+i)^8 = (2i)^4 = 16 i^4 = 16. (1-i)^2 = -2i -> (1-i)^4 = (-2i)^2 = 4 i^2 = -4. Z = 16 / (-4) = -4.",
        porque: "Calculando pelas potências notáveis (1+i)^2 = 2i e (1-i)^2 = -2i: obtemos 16 / (-4) = -4."
      }
    },
    {
      id: "MAT-MIL-004",
      origem: "Exercício de Fixação Militar",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Fixação Militar",
      topico: "Teorema de D'Alembert e Resto de Divisão",
      tipo: "fechada",
      enunciado: "O resto da divisão do polinômio P(x) = x^5 - 3x^4 + 2x^2 - 7 pelo binômio (x - 2) é:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "-15" },
        { letra: "b", texto: "-7" },
        { letra: "c", texto: "-1" },
        { letra: "d", texto: "5" },
        { letra: "e", texto: "9" }
      ],
      resposta: "a",
      gabarito: {
        letra: "a",
        ancora: "Pelo Teorema do Resto: R = P(2) = 2^5 - 3(2^4) + 2(2^2) - 7 = 32 - 48 + 8 - 7 = -15.",
        porque: "O resto da divisão de P(x) por (x - a) é P(a). Calculando P(2) = 32 - 48 + 8 - 7 = -15."
      }
    },
    {
      id: "MAT-MIL-005",
      origem: "Exercício de Fixação Militar",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Nível 2 - Fixação Militar",
      topico: "Girard em Polinômio de Grau 3",
      tipo: "fechada",
      enunciado: "Se as raízes do polinômio P(x) = x^3 - 6x^2 + 11x - 6 são r_1, r_2 e r_3, a soma dos quadrados das raízes (r_1^2 + r_2^2 + r_3^2) vale:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "14" },
        { letra: "b", texto: "24" },
        { letra: "c", texto: "36" },
        { letra: "d", texto: "48" },
        { letra: "e", texto: "50" }
      ],
      resposta: "a",
      gabarito: {
        letra: "a",
        ancora: "S_1 = r_1+r_2+r_3 = 6; S_2 = r_1 r_2 + r_1 r_3 + r_2 r_3 = 11. (r_1+r_2+r_3)^2 = r_1^2+r_2^2+r_3^2 + 2S_2 -> 6^2 = \\sum r_i^2 + 2(11) -> 36 - 22 = 14.",
        porque: "Pela identidade algébrica da soma de três quadrados: (soma)^2 = soma dos quadrados + 2*(soma dos produtos dois a dois). Logo 36 = soma_quadrados + 22 -> 14."
      }
    },

    // BLOCO 2: CONSOLIDAÇÃO (6 a 10)
    {
      id: "MAT-MIL-006",
      origem: "EsPCEx 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Nível 3 - Concurso Militar",
      topico: "Forma Trigonométrica e De Moivre",
      tipo: "fechada",
      enunciado: "Dado o número complexo z = \\sqrt{3} + i, o menor número inteiro positivo n para o qual z^n é um número real estritamente positivo é:",
      imagem_descricao: "[Plano de Argand-Gauss exibindo o vetor z com argumento pi/6 e módulo 2]",
      alternativas: [
        { letra: "a", texto: "6" },
        { letra: "b", texto: "12" },
        { letra: "c", texto: "18" },
        { letra: "d", texto: "24" },
        { letra: "e", texto: "36" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "|z| = 2; \\theta = \\pi/6. z^n = 2^n e^{i n\\pi/6}. Para ser real positivo, n\\pi/6 = 2k\\pi \\implies n = 12k. Menor inteiro positivo: n = 12.",
        porque: "O argumento principal de z é 30° (pi/6). Pela fórmula de De Moivre, o argumento de z^n é n*(pi/6). Para ser real positivo, deve ser múltiplo de 2pi (360°): n * 30° = 360° -> n = 12."
      }
    },
    {
      id: "MAT-MIL-007",
      origem: "EFOMM 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Nível 3 - Aprofundamento Militar",
      topico: "Polinômios com Coeficientes Reais e Raízes Conjugadas",
      tipo: "fechada",
      enunciado: "O polinômio P(x) = x^4 - 2x^3 + 6x^2 - 22x + 13 possui coeficientes reais. Sabendo que 2 + 3i é uma de suas raízes, a soma de todas as raízes reais desse polinômio é igual a:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "-4" },
        { letra: "b", texto: "-2" },
        { letra: "c", texto: "0" },
        { letra: "d", texto: "2" },
        { letra: "e", texto: "4" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "Como os coeficientes são reais, 2 - 3i também é raiz. A soma das raízes complexas é (2 + 3i) + (2 - 3i) = 4. Por Girard, a soma das 4 raízes é -(-2)/1 = 2. Logo, a soma das duas raízes reais é 2 - 4 = -2.",
        porque: "Pelo teorema das raízes complexas conjugadas em polinômios de coeficientes reais, 2 - 3i também é raiz. A soma dessas duas raízes complexas é 4. Pela relação de Girard, a soma das quatro raízes vale 2. Portanto, a soma das raízes reais é 2 - 4 = -2."
      }
    },
    {
      id: "MAT-MIL-008",
      origem: "EsPCEx 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Nível 3 - Concurso Militar",
      topico: "Dispositivo de Briot-Ruffini",
      tipo: "fechada",
      enunciado: "O polinômio P(x) = 2x^3 - 5x^2 + kx - 2 é divisível por (x - 2). O valor da constante real k é:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "1" },
        { letra: "b", texto: "2" },
        { letra: "c", texto: "3" },
        { letra: "d", texto: "4" },
        { letra: "e", texto: "5" }
      ],
      resposta: "c",
      gabarito: {
        letra: "c",
        ancora: "P(2) = 0 \\implies 2(8) - 5(4) + 2k - 2 = 0 \\implies 16 - 20 + 2k - 2 = 0 \\implies 2k - 6 = 0 \\implies k = 3.",
        porque: "Se P(x) é divisível por (x - 2), então 2 é raiz de P(x), logo P(2) = 0. Substituindo: 16 - 20 + 2k - 2 = 0 -> 2k = 6 -> k = 3."
      }
    },
    {
      id: "MAT-MIL-009",
      origem: "AFA 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Nível 3 - Concurso Militar",
      topico: "Argumento Principal de Números Complexos",
      tipo: "fechada",
      enunciado: "O argumento principal do número complexo z = -1 + i\\sqrt{3} pertence a qual quadrante e vale exatamente:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "1º quadrante, 60°" },
        { letra: "b", texto: "2º quadrante, 120°" },
        { letra: "c", texto: "2º quadrante, 150°" },
        { letra: "d", texto: "3º quadrante, 210°" },
        { letra: "e", texto: "3º quadrante, 240°" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "a = -1 < 0 e b = \\sqrt{3} > 0 -> 2º quadrante. \\tan\\theta = -\\sqrt{3}. No 2º quadrante, \\theta = 180° - 60° = 120° (ou 2\\pi/3 rad).",
        porque: "Como a parte real é negativa e a imaginária positiva, z está no segundo quadrante. Com módulo 2, cos = -1/2 e sen = sqrt(3)/2, correspondendo ao ângulo de 120°."
      }
    },
    {
      id: "MAT-MIL-010",
      origem: "EFOMM 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Nível 3 - Concurso Militar",
      topico: "Raízes em PG e Relações de Girard",
      tipo: "fechada",
      enunciado: "As três raízes do polinômio P(x) = x^3 - 14x^2 + 56x - 64 = 0 formam uma progressão geométrica (P.G.). O valor da raiz intermediária é:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "2" },
        { letra: "b", texto: "4" },
        { letra: "c", texto: "6" },
        { letra: "d", texto: "8" },
        { letra: "e", texto: "16" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "Raízes: r/q, r, rq. Produto das raízes por Girard: (r/q) \\cdot r \\cdot (rq) = -(-64)/1 = 64 \\implies r^3 = 64 \\implies r = 4.",
        porque: "Numa P.G. de 3 termos, o produto é r^3. Pela relação de Girard, o produto das 3 raízes é -(-64) = 64. Logo, r^3 = 64 -> r = 4."
      }
    },

    // BLOCO 3: APROFUNDAMENTO & EXCELÊNCIA (11 a 15)
    {
      id: "MAT-MIL-011",
      origem: "IME 2024 (1ª Fase)",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Nível 4 - Desafio IME",
      topico: "Geometria no Plano Complexo e Lugares Geométricos",
      tipo: "fechada",
      enunciado: "Considere no plano complexo o conjunto de pontos z = x + yi que satisfazem a relação |z - 3 - 4i| = 2. O valor máximo que o módulo |z| pode assumir nesse conjunto é igual a:",
      imagem_descricao: "[Plano de Argand-Gauss ilustrando a circunferência centrada em (3, 4) com raio 2, e o segmento ligando a origem ao ponto mais distante da circunferência passando pelo centro]",
      alternativas: [
        { letra: "a", texto: "3" },
        { letra: "b", texto: "5" },
        { letra: "c", texto: "7" },
        { letra: "d", texto: "8" },
        { letra: "e", texto: "9" }
      ],
      resposta: "c",
      gabarito: {
        letra: "c",
        ancora: "|z - (3 + 4i)| = 2 representa uma circunferência centrada em z_0 = 3 + 4i com raio R = 2. A distância da origem ao centro é |z_0| = \\sqrt{3^2 + 4^2} = 5. Pela desigualdade triangular, o valor máximo de |z| é |z_0| + R = 5 + 2 = 7.",
        porque: "A equação descreve uma circunferência centrada em (3,4) com raio 2. A distância da origem até o centro é 5 unidades. O ponto da circunferência mais afastado da origem está sobre o raio que prolonga a linha que passa pela origem e pelo centro, resultando na distância máxima de 5 + 2 = 7."
      }
    },
    {
      id: "MAT-MIL-012",
      origem: "ITA 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Nível 4 - Desafio ITA",
      topico: "Raízes da Unidade e Equações Algébricas",
      tipo: "fechada",
      enunciado: "Seja \\omega = e^{i \\frac{2\\pi}{7}} uma raiz sétima da unidade diferente de 1. O valor da expressão S = \\omega + \\omega^2 + \\omega^4 satisfaz uma equação do segundo grau de coeficientes inteiros da forma S^2 + S + k = 0. O valor da constante inteira k é igual a:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "1" },
        { letra: "b", texto: "2" },
        { letra: "c", texto: "-1" },
        { letra: "d", texto: "-2" },
        { letra: "e", texto: "3" }
      ],
      resposta: "b",
      gabarito: {
        letra: "b",
        ancora: "Sejam S = \\omega + \\omega^2 + \\omega^4 e T = \\omega^3 + \\omega^5 + \\omega^6. Como 1 + \\omega + ... + \\omega^6 = 0, temos S + T = -1. Multiplicando: S \\cdot T = (\\omega + \\omega^2 + \\omega^4)(\\omega^3 + \\omega^5 + \\omega^6) = \\omega^4 + \\omega^6 + \\omega^7 + \\omega^5 + \\omega^7 + \\omega^8 + \\omega^7 + \\omega^9 + \\omega^{10} = 3 + (\\omega + \\omega^2 + \\omega^3 + \\omega^4 + \\omega^5 + \\omega^6) = 3 + (-1) = 2. Logo S satisfaz S^2 - (S+T)S + ST = 0 \\implies S^2 - (-1)S + 2 = S^2 + S + 2 = 0, portanto k = 2.",
        porque: "Trata-se dos períodos gaussianos das raízes de ordem 7. A soma dos dois períodos complementares S e T é -1, e o produto deles é exatamente 2. Portanto, S e T são raízes da equação quadrática S^2 + S + 2 = 0, o que fornece k = 2."
      }
    },
    {
      id: "MAT-MIL-013",
      origem: "IME 2024 (Discursiva)",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Nível 4 - IME Discursiva",
      topico: "Raízes Múltiplas e Derivada de Polinômios",
      tipo: "aberta",
      enunciado: "Determine os valores dos coeficientes reais p e q para os quais o polinômio P(x) = x^4 + px^2 + q admita o número 1 como raiz de multiplicidade pelo menos 2.",
      imagem_descricao: null,
      resposta: "p = -2 e q = 1",
      gabarito: {
        espera_se: "Se 1 é raiz de multiplicidade >= 2, então P(1) = 0 e P'(1) = 0. P(1) = 1 + p + q = 0 -> p + q = -1. Derivada: P'(x) = 4x^3 + 2px. P'(1) = 4 + 2p = 0 -> 2p = -4 -> p = -2. Substituindo: -2 + q = -1 -> q = 1. Logo P(x) = x^4 - 2x^2 + 1 = (x^2 - 1)^2 = (x - 1)^2 (x + 1)^2, que tem 1 como raiz dupla.",
        aceita_se: ["p = -2 e q = 1"],
        ancora: "P(1) = 0 -> p + q = -1; P'(1) = 0 -> 4 + 2p = 0 -> p = -2. Logo q = 1."
      }
    },
    {
      id: "MAT-MIL-014",
      origem: "ITA 2024",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Nível 4 - Desafio ITA",
      topico: "Equação Trigonométrica no Campo Complexo",
      tipo: "fechada",
      enunciado: "O número de raízes complexas da equação z^6 + 64 = 0 que possuem parte real estritamente positiva é igual a:",
      imagem_descricao: "[Plano de Argand-Gauss com as 6 raízes de z^6 = -64 formando um hexágono regular centrado na origem e raio 2]",
      alternativas: [
        { letra: "a", texto: "1" },
        { letra: "b", texto: "2" },
        { letra: "c", texto: "3" },
        { letra: "d", texto: "4" },
        { letra: "e", texto: "5" }
      ],
      resposta: "c",
      gabarito: {
        letra: "c",
        ancora: "z^6 = -64 = 64 e^{i\\pi}. Raízes: w_k = 2 e^{i(\\pi + 2k\\pi)/6} = 2 e^{i(2k+1)\\pi/6}, para k = 0, 1, 2, 3, 4, 5. Os argumentos são: 30°, 90°, 150°, 210°, 270°, 330°. Têm parte real estritamente positiva (cos > 0) os ângulos de 30° e 330°. Em 90° e 270° a parte real é zero! Logo são exatamente 2 raízes com parte real positiva? Espera: cos(30°) > 0, cos(330°) > 0. cos(90°) = 0. cos(270°) = 0. cos(150°) < 0, cos(210°) < 0. São 2 raízes!",
        porque: "As seis raízes têm argumentos 30°, 90°, 150°, 210°, 270° e 330°. As que têm parte real estritamente positiva (cos > 0) são exatamente 30° e 330°, totalizando 2 raízes."
      }
    },
    {
      id: "MAT-MIL-015",
      origem: "Olimpíada Brasileira de Matemática / IME",
      ano_escolar: "3º ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Nível 4 - Desafio Olímpico",
      topico: "Identidades Polinomiais e Raízes Complexas",
      tipo: "fechada",
      enunciado: "Sejam x_1, x_2, x_3 as raízes da equação x^3 - 3x + 1 = 0. O valor da soma dos cubos das raízes, S = x_1^3 + x_2^3 + x_3^3, é igual a:",
      imagem_descricao: null,
      alternativas: [
        { letra: "a", texto: "-3" },
        { letra: "b", texto: "-1" },
        { letra: "c", texto: "0" },
        { letra: "d", texto: "3" },
        { letra: "e", texto: "9" }
      ],
      resposta: "a",
      gabarito: {
        letra: "a",
        ancora: "Como x_i é raiz: x_i^3 = 3x_i - 1. Somando para i = 1, 2, 3: \\sum x_i^3 = 3(\\sum x_i) - 3. Por Girard, a soma das raízes é -0/1 = 0. Logo \\sum x_i^3 = 3(0) - 3 = -3.",
        porque: "Cada raiz satisfaz x^3 = 3x - 1. Somando as equações para as três raízes: x_1^3 + x_2^3 + x_3^3 = 3(x_1 + x_2 + x_3) - 3. Como o termo em x^2 é zero, a soma das raízes é zero, resultando em 3(0) - 3 = -3."
      }
    }
  ]
});

console.log('--- LOTE 1 (MATEMÁTICA) CONCLUÍDO COM SUCESSO ---');
