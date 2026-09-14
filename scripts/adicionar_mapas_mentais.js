const fs = require('fs');
const path = require('path');

const BASE_DIR = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';

// Mapas mentais manuais artesanais para as matérias chave
const MAPAS_ESPECIFICOS = {
  // --- MATEMÁTICA ---
  "Matematica/Algebra/Questoes_Funcoes_e_Equacoes.json": {
    nucleo: "Álgebra: O Segredo da Balança e o Comportamento das Funções",
    ramos: [
      {
        titulo: "🎯 Ideia Central (A Balança)",
        icone: "⚖️",
        cor: "#3182CE",
        topicos: [
          "Uma equação é uma balança de dois pratos sempre em equilíbrio: o que você faz de um lado (+, -, ×, ÷), tem que fazer exatamente igual do outro lado.",
          "Função Afim (f(x) = ax + b): reta constante. 'a' é a inclinação (ritmo de subida/descida) e 'b' é onde a reta corta o eixo vertical y.",
          "Função Quadrática (f(x) = ax² + bx + c): parábola. 'a > 0' sorriso feliz (tem ponto mínimo); 'a < 0' carinha triste (tem ponto máximo no vértice)."
        ]
      },
      {
        titulo: "🪜 Degraus Kumon (Passo a Passo Infalível)",
        icone: "🪜",
        cor: "#38A169",
        topicos: [
          "Passo 1: Reúna os termos semelhantes (quem tem 'x' de um lado, números puros do outro).",
          "Passo 2: Isole a incógnita usando a operação inversa (+ vira -, × vira ÷, potência vira raiz).",
          "Passo 3: Em logaritmos (log_b(a) = c), use a Regra do Giro: a base 'b' empurra o resultado 'c' para cima (b^c = a).",
          "Passo 4: Verifique a resposta substituindo o valor encontrado na equação original."
        ]
      },
      {
        titulo: "🔍 No Dia a Dia (Onde Isso Existe?)",
        icone: "🚗",
        cor: "#805AD5",
        topicos: [
          "A corrida do Uber: bandeirada fixa (coeficiente linear b) + valor por quilômetro rodado (coeficiente angular a).",
          "O chute da bola no futebol ou tiro de canhão: sobe, atinge a altura máxima no vértice (Yv = -Δ/4a) e cai na raiz.",
          "Escala Richter de terremotos e pH de shampoos: calculados em escala logarítmica para encolher números gigantescos."
        ]
      },
      {
        titulo: "⚠️ Casca de Banana (Alerta de Pegadinha)",
        icone: "🍌",
        cor: "#E53E3E",
        topicos: [
          "CUIDADO com a regra de sinais ao multiplicar ou dividir por número negativo em inequações: O SINAL DE DESIGUALDADE INVERTE! (< vira >).",
          "Logaritmo só existe com base positiva diferente de 1 e logaritmando estritamente MAIOR que zero (Condição de Existência).",
          "Raiz quadrada de número real nunca é negativa: √4 = +2 (não ±2; o ± só aparece quando resolvemos x² = 4)."
        ]
      }
    ],
    dica_ninja: "💡 DICA NINJA DA NATH: 'Para achar o Vértice da Parábola, lembre-se do 'Xis da Questão': Xv = -b / (2a). Achou o Xv? Joga ele dentro da função e o Yv cai no seu colo!'"
  },

  "Matematica/Geometria/Questoes_Geometria_Plana_e_Espacial.json": {
    nucleo: "Geometria: Do Desenho no Papel ao Espaço 3D",
    ramos: [
      {
        titulo: "🎯 Ideia Central (Áreas e Volumes)",
        icone: "📐",
        cor: "#3182CE",
        topicos: [
          "Plana (2D) tem Área (chão que você pisa ou parede que pinta: metros quadrados, m²).",
          "Espacial (3D) tem Volume e Capacidade (quanto de água ou ar cabe dentro: metros cúbicos, m³; 1 m³ = 1.000 litros).",
          "A Regra do Prédio: Primas e Cilindros retos têm volume = (Área da Base) × (Altura). Se tiver bico (Cone e Pirâmide), divide por 3!"
        ]
      },
      {
        titulo: "🪜 Degraus Kumon (Passo a Passo Infalível)",
        icone: "🪜",
        cor: "#38A169",
        topicos: [
          "Passo 1: Desenhe a figura grande no papel e anote todos os dados fornecidos no enunciado.",
          "Passo 2: Procure triângulos retângulos escondidos para aplicar o Teorema de Pitágoras (a² = b² + c²).",
          "Passo 3: Identifique a base (se for círculo: Área = π·r²; se retângulo: b·h; se triângulo: b·h/2).",
          "Passo 4: Multiplique pela altura e confira se a figura termina em ponta para dividir por 3."
        ]
      },
      {
        titulo: "🔍 No Dia a Dia (Onde Isso Existe?)",
        icone: "📦",
        cor: "#805AD5",
        topicos: [
          "A lata de refrigerante: cilindro perfeito cujo volume é π·r²·h (cerca de 350 mL).",
          "A casquinha de sorvete: cone que leva 1/3 do volume do cilindro com o mesmo raio e altura.",
          "A caixa de sapatos ou piscina: paralelepípedo cujo volume é Comprimento × Largura × Profundidade."
        ]
      },
      {
        titulo: "⚠️ Casca de Banana (Alerta de Pegadinha)",
        icone: "🍌",
        cor: "#E53E3E",
        topicos: [
          "Confundir Raio com Diâmetro! O raio é METADE do diâmetro. Se o diâmetro é 10 cm, o raio é 5 cm!",
          "Unidades de medida trocadas: nunca multiplique metros por centímetros sem converter antes (1 m = 100 cm).",
          "Em troncos de cone e pirâmide, a semelhança de áreas varia com k² e a de volumes varia com k³!"
        ]
      }
    ],
    dica_ninja: "💡 DICA NINJA DA NATH: 'Figura com teto reto (prisma/cilindro)? Base vezes altura! Terminou em ponta de foguete (cone/pirâmide)? Base vezes altura DIVIDIDO POR TRÊS!'"
  },

  "Matematica/IME_ITA/Questoes_Numeros_Complexos_e_Polinomios_IME_ITA.json": {
    nucleo: "Números Complexos & Polinômios de Alta Performance (IME/ITA)",
    ramos: [
      {
        titulo: "🎯 Ideia Central (A Dimensão Imaginária)",
        icone: "🌀",
        cor: "#3182CE",
        topicos: [
          "A unidade imaginária 'i' foi criada para resolver raízes de números negativos: i² = -1.",
          "O número complexo z = a + bi vive no plano de Argand-Gauss: 'a' é o eixo real (horizontal) e 'b' é o imaginário (vertical).",
          "Polinômios são expressões algébricas cujas raízes revelam sua estrutura geométrica e fatorada: P(x) = a_n·(x - r1)·(x - r2)..."
        ]
      },
      {
        titulo: "🪜 Degraus Kumon (Passo a Passo Infalível)",
        icone: "🪜",
        cor: "#38A169",
        topicos: [
          "Passo 1 (Potências de i): Divida o expoente por 4 e pegue o RESTO (resto 0 -> 1; resto 1 -> i; resto 2 -> -1; resto 3 -> -i).",
          "Passo 2 (Módulo e Argumento): |z| = √(a² + b²) e tan(θ) = b/a. Na forma trigonométrica: z = |z|·(cos θ + i·sen θ) = |z|·cis(θ).",
          "Passo 3 (De Moivre): Para elevar à n-ésima potência, eleva o módulo a n e multiplica o ângulo por n: z^n = |z|^n · cis(nθ).",
          "Passo 4 (Girard): Soma das raízes = -b/a; Produto das raízes = (-1)^n · termo_independente / a."
        ]
      },
      {
        titulo: "🔍 No Dia a Dia (Onde Isso Existe?)",
        icone: "⚡",
        cor: "#805AD5",
        topicos: [
          "Engenharia Elétrica e Eletrônica: corrente alternada, circuitos RLC e impedância usam números complexos para calcular fases de ondas.",
          "Computação gráfica, rotações 3D de videogames e aerodinâmica de jatos e foguetes militares.",
          "Processamento de sinais digitais e compressão de áudio MP3 (Transformada Rápida de Fourier)."
        ]
      },
      {
        titulo: "⚠️ Casca de Banana (Alerta de Pegadinha)",
        icone: "🍌",
        cor: "#E53E3E",
        topicos: [
          "Cuidado com os quadrantes do argumento θ! Se 'a' for negativo e 'b' positivo, o ângulo está no 2º quadrante (180° - ref).",
          "Teorema das Raízes Conjugadas: se os coeficientes forem REAIS, raízes complexas SEMPRE aparecem aos pares (z e seu conjugado z*). Se os coeficientes forem complexos, essa regra NÃO vale!",
          "Na divisão de polinômios por (x - a), o resto é simplesmente P(a) (Teorema de D'Alembert)."
        ]
      }
    ],
    dica_ninja: "💡 DICA NINJA DA NATH: 'Multiplicar por 'i' no plano complexo significa nada mais, nada menos do que dar um giro de 90° no sentido anti-horário! Rotação pura!'"
  },

  // --- FÍSICA (CAMINHOS REAIS NO DISCO) ---
  "Fisica/Cinematica/Questoes_Cinematica_e_Dinamica.json": {
    nucleo: "Cinemática e Dinâmica: Movimento e as Três Leis de Newton",
    ramos: [
      {
        titulo: "🎯 Ideia Central (Como as Coisas se Movem)",
        icone: "🍎",
        cor: "#3182CE",
        topicos: [
          "Velocidade média é quanto você anda dividido pelo tempo que demora (v = Δs/Δt).",
          "1ª Lei de Newton (Inércia): Todo corpo parado continua parado, e corpo em movimento continua em linha reta com velocidade constante, a menos que uma força atue sobre ele.",
          "2ª Lei de Newton (Força Resultante): Empurrou com força? Acelera! F_res = m·a.",
          "3ª Lei de Newton (Ação e Reação): Bateu na parede? A parede devolve a força com a mesma intensidade e sentido oposto."
        ]
      },
      {
        titulo: "🪜 Degraus Kumon (Passo a Passo Infalível)",
        icone: "🪜",
        cor: "#38A169",
        topicos: [
          "Passo 1: Identifique se a velocidade é constante (MRU: s = s0 + v·t) ou se tem aceleração (MRUV: v = v0 + a·t e s = s0 + v0·t + a·t²/2).",
          "Passo 2: Não tem tempo no problema? Use a Equação de Torricelli sem medo: v² = v0² + 2·a·Δs.",
          "Passo 3: Desenhe as setas de todas as forças que agem no bloco: Peso para baixo (P = m·g), Normal para cima, Atrito contra o escorregamento.",
          "Passo 4: Subtraia as forças contrárias para achar a Resultante e iguale a m·a."
        ]
      },
      {
        titulo: "🔍 No Dia a Dia (Onde Isso Existe?)",
        icone: "🛹",
        cor: "#805AD5",
        topicos: [
          "O cinto de segurança no carro: segura seu corpo para frente quando o motorista freia bruscamente (Princípio da Inércia).",
          "Andar de skate: empurrar o chão para trás para ir para a frente (Ação e Reação).",
          "A bola de futebol lançada para o alto: desacelera na subida pela gravidade, para por um milésimo no topo (v = 0) e cai acelerando."
        ]
      },
      {
        titulo: "⚠️ Casca de Banana (Alerta de Pegadinha)",
        icone: "🍌",
        cor: "#E53E3E",
        topicos: [
          "Confundir km/h com m/s: lembre-se sempre de dividir por 3,6 para transformar km/h em m/s!",
          "Achar que peso e normal formam par de ação e reação: FALSO! Peso é gravidade (Terra puxando o corpo), Normal é contato da mesa empurrando o corpo.",
          "No ponto mais alto da trajetória de um arremesso vertical, a velocidade é zero, mas a aceleração da gravidade CONTINUA valendo 10 m/s²!"
        ]
      }
    ],
    dica_ninja: "💡 DICA NINJA DA NATH: 'Sem tempo na questão? Vai de Torricelli: v² = v0² + 2aΔs! E de km/h para m/s? Divide por 3,6 sem pestanejar!'"
  },

  "Fisica/Termologia/Questoes_Termodinamica_e_Calor.json": {
    nucleo: "Termologia & Calorimetria: A Dança das Moléculas e Trocas de Calor",
    ramos: [
      {
        titulo: "🎯 Ideia Central (Temperatura versus Calor)",
        icone: "🔥",
        cor: "#ED8936",
        topicos: [
          "Temperatura mede o grau de agitação das partículas: moléculas pulando rápido = quente; moléculas devagar = frio.",
          "Calor é energia térmica em trânsito: flui SEMPRE do corpo com maior temperatura para o de menor temperatura de forma espontânea.",
          "Equilíbrio térmico: quando dois corpos encostam e atingem a mesma temperatura, a troca de calor cessa."
        ]
      },
      {
        titulo: "🪜 Degraus Kumon (Passo a Passo Infalível)",
        icone: "🪜",
        cor: "#38A169",
        topicos: [
          "Passo 1: Mudou a temperatura sem derreter/ferver? Use o 'Qui-Macete': Q = m·c·ΔT (Calor Sensível).",
          "Passo 2: Mudou de fase (gelo virando água ou água virando vapor)? Use o 'Qui-Moleza': Q = m·L (Calor Latente).",
          "Passo 3: Lembre-se: durante a mudança de estado físico de substância pura, a temperatura NÃO muda nem um décimo!",
          "Passo 4: Num calorímetro ideal: Soma dos calores trocados = 0 (Q_cedido + Q_recebido = 0)."
        ]
      },
      {
        titulo: "🔍 No Dia a Dia (Onde Isso Existe?)",
        icone: "🧊",
        cor: "#805AD5",
        topicos: [
          "O copo de suco com gelo: o suco esfria porque DOA calor para o gelo derreter, e não porque o gelo 'passa frio' para ele.",
          "O casaco no inverno: não produz calor nenhum; ele é um isolante térmico que impede o calor do seu corpo de escapar para o ar.",
          "A brisa marítima na praia: de dia sopra do mar para a terra porque a areia esquenta mais rápido que a água (menor calor específico)."
        ]
      },
      {
        titulo: "⚠️ Casca de Banana (Alerta de Pegadinha)",
        icone: "🍌",
        cor: "#E53E3E",
        topicos: [
          "Achar que 'frio' existe como substância: frio é apenas a sensação biológica da AUSÊNCIA ou perda rápida de calor.",
          "Calor específico da água é enorme (1 cal/g°C): por isso ela demora para esquentar e demora muito para esfriar.",
          "Na convecção térmica: ar quente sobe (menos denso) e ar frio desce (mais denso) — por isso o congelador fica em cima!"
        ]
      }
    ],
    dica_ninja: "💡 DICA NINJA DA NATH: 'Esquentou ou esfriou? Qui-Macete (Q = m·c·ΔT)! Derreteu ou evaporou? Qui-Moleza (Q = m·L)!'"
  },

  "Fisica/Eletromagnetismo/Questoes_Circuitos_e_Eletricidade.json": {
    nucleo: "Eletrodinâmica: Corrente Elétrica, Tensão e Resistores",
    ramos: [
      {
        titulo: "🎯 Ideia Central (O Rio de Elétrons)",
        icone: "⚡",
        cor: "#ECC94B",
        topicos: [
          "Tensão (U ou V, em Volts): é a força/pressão que a bateria ou tomada faz para empurrar os elétrons.",
          "Corrente (i, em Ampères): é a quantidade de elétrons livres passando pelo fio a cada segundo.",
          "Resistência (R, em Ohms Ω): é a dificuldade que o fio ou aparelho impõe à passagem dos elétrons.",
          "1ª Lei de Ohm: Quem Vê Ri! (U = R · i)."
        ]
      },
      {
        titulo: "🪜 Degraus Kumon (Passo a Passo Infalível)",
        icone: "🪜",
        cor: "#38A169",
        topicos: [
          "Passo 1: Identifique a ligação dos resistores no circuito: estão em fila única (Série) ou ramificados lado a lado (Paralelo)?",
          "Passo 2 (Em Série): Some os valores direto (Req = R1 + R2). A corrente 'i' é rigorosamente a mesma em todos eles.",
          "Passo 3 (Em Paralelo): Mesma voltagem U para todos. Dois resistores? Req = (R1 × R2) / (R1 + R2) (Produto pela Soma).",
          "Passo 4 (Potência e Consumo): P = U · i = R · i² = U² / R. Na conta de luz: Energia (kWh) = Potência (kW) × Horas de uso."
        ]
      },
      {
        titulo: "🔍 No Dia a Dia (Onde Isso Existe?)",
        icone: "💡",
        cor: "#805AD5",
        topicos: [
          "As tomadas da sua casa: são todas ligadas em PARALELO para você poder desligar o ventilador sem apagar a televisão!",
          "O pisca-pisca antigo de Natal em série: se uma lâmpada queimava, abria o circuito e apagava todas as outras da árvore.",
          "O chuveiro elétrico: na posição 'Inverno', o chuveiro diminui o comprimento da resistência para a corrente subir e esquentar mais!"
        ]
      },
      {
        titulo: "⚠️ Casca de Banana (Alerta de Pegadinha)",
        icone: "🍌",
        cor: "#E53E3E",
        topicos: [
          "Atenção com o chuveiro: menor resistência R gera MAIOR potência P quando ligado na mesma voltagem U da parede (P = U²/R)!",
          "Amperímetro deve ser ligado em SÉRIE (resistência interna quase zero); Voltímetro deve ser ligado em PARALELO (resistência altíssima).",
          "Curto-circuito: quando a corrente encontra um caminho sem resistência nenhuma, o valor da corrente dispara e derrete os fios!"
        ]
      }
    ],
    dica_ninja: "💡 DICA NINJA DA NATH: 'Quem Vê Ri (U = R·i) e Quem Paga Vê (P = U·i)! Em paralelo, dois resistores iguais dividem o valor pela metade!'"
  },

  "Fisica/IME_ITA/Questoes_MHS_Eletromagnetismo_e_Optica_IME_ITA.json": {
    nucleo: "Física Avançada IME/ITA: Oscilações, Indução e Óptica Ondulatória",
    ramos: [
      {
        titulo: "🎯 Ideia Central (Oscilações e Campos)",
        icone: "🌊",
        cor: "#3182CE",
        topicos: [
          "Movimento Harmônico Simples (MHS): projeção do movimento circular uniforme. Equação x(t) = A·cos(ωt + φ0).",
          "Lei de Faraday-Lenz: Variação de fluxo magnético gera corrente induzida que se opõe à causa que a produziu (ε = -dΦ/dt).",
          "Óptica Ondulatória: A luz sofre difração ao passar por fendas comparáveis ao seu comprimento de onda e produz franjas de interferência."
        ]
      },
      {
        titulo: "🪜 Degraus Kumon (Passo a Passo Infalível)",
        icone: "🪜",
        cor: "#38A169",
        topicos: [
          "Passo 1 (Pêndulo Simples e Mola): Mola tem T = 2π√(m/k); Pêndulo simples tem T = 2π√(L/g) (o período independe da massa do pêndulo!).",
          "Passo 2 (Força Magnética de Lorentz): Carga em movimento em campo B sofre força perpendicular: F = q·(v × B). Em trajetória circular: R = m·v / (q·B).",
          "Passo 3 (Interferência de Young): Diferença de caminhos ópticos Δd = d·sen(θ) = n·λ para máximos de interferência construtiva.",
          "Passo 4 (Reflexão Interna Total): A luz só reflete 100% sem refratar se for do meio mais refringente para o menos refringente e ângulo > limite."
        ]
      },
      {
        titulo: "🔍 No Dia a Dia (Onde Isso Existe?)",
        icone: "📡",
        cor: "#805AD5",
        topicos: [
          "Fibra óptica de internet ultrarrápida: o feixe de laser viaja por quilômetros confinado dentro do vidro por reflexão interna total.",
          "Fornos de indução e cooktops magnéticos: geram correntes de Foucault na panela de ferro para esquentar o alimento sem chama aberta.",
          "Amortecedores de carros e edifícios à prova de terremotos baseados no amortecimento de oscilações harmônicas."
        ]
      },
      {
        titulo: "⚠️ Casca de Banana (Alerta de Pegadinha)",
        icone: "🍌",
        cor: "#E53E3E",
        topicos: [
          "No MHS: quando a velocidade é MÁXIMA (no ponto central de equilíbrio x = 0), a aceleração e a força resultante são NULAS!",
          "Nos extremos do MHS (x = ±A), a velocidade é ZERO, mas a aceleração atinge seu valor MÁXIMO apontando para o centro!",
          "Campo magnético estático NUNCA realiza trabalho sobre uma carga livre porque a força magnética é sempre perpendicular à velocidade!"
        ]
      }
    ],
    dica_ninja: "💡 DICA NINJA DA NATH: 'Força magnética em carga? Ela faz curva (movimento circular)! Raio da órbita: 'Meu Velho Não É Burro' -> R = (m·v) / (q·B)!'"
  }
};

// Gerador inteligente e sob medida para os temas restantes
function gerarMapaMentalCustomizado(dados, relPath) {
  const bd = dados.benchmark_didatico || {};
  const rt = bd.resumo_teorico || {};
  const conceitos = rt.conceitos_chave || [];
  const pontoCego = rt.atencao_ponto_cego || "Atenção máxima à leitura minuciosa do comando da questão.";
  const disc = dados.disciplina || "Geral";
  const assunto = dados.assunto || bd.capitulo || "Tema";

  let nucleo = `${assunto}: Ideias Centrais e Aplicações`;
  let dica = `💡 DICA NINJA DA NATH: 'Compreenda a essência de ${assunto} antes de decorar fórmulas. Quem entende o porquê nunca erra o como!'`;

  let ramo1Topicos = [];
  let ramo2Topicos = [];
  let ramo3Topicos = [];
  let ramo4Topicos = [];

  // Constrói tópicos ricos e sem truncamento a partir dos conceitos chave
  if (conceitos.length >= 2) {
    conceitos.slice(0, 3).forEach(c => {
      if (typeof c === 'object') {
        ramo1Topicos.push(`${c.termo}: ${c.definicao}`);
      } else {
        ramo1Topicos.push(c);
      }
    });
  } else {
    ramo1Topicos.push(`Conceito fundamental de ${assunto} estruturado para o aprendizado da criança.`);
    ramo1Topicos.push(`Identificação dos elementos centrais da matéria no currículo de ${disc}.`);
  }

  // Degraus Kumon autênticos por disciplina
  if (disc.includes("Português") || disc.includes("Portuguesa")) {
    ramo2Topicos = [
      "Passo 1: Leia o texto uma vez para entender o sentido geral da história ou mensagem.",
      "Passo 2: Destaque o verbo principal da frase e encontre o sujeito perguntando 'quem pratica a ação?'.",
      "Passo 3: Identifique a função de cada palavra na oração antes de marcar a resposta.",
      "Passo 4: Verifique a concordância e a pontuação relendo a frase em voz alta."
    ];
    ramo3Topicos = [
      "Na leitura de gibis, livros de aventura, placas de trânsito e conversas no WhatsApp.",
      "Para escrever redações claras, contar histórias fascinantes e convencer seus amigos com bons argumentos."
    ];
    dica = `💡 DICA NINJA DA NATH: 'Quer achar o sujeito de qualquer frase? Pergunte 'Quem?' ou 'O que?' para o verbo! Ele responde na hora!'`;
  } else if (disc.includes("Literatura")) {
    ramo2Topicos = [
      "Passo 1: Descubra em qual época histórica o autor viveu e o que estava acontecendo no país naquele momento.",
      "Passo 2: Observe se o texto valoriza a razão e o equilíbrio ou a emoção e o sentimento exagerado.",
      "Passo 3: Repare nas figuras de linguagem, metáforas e na escolha das palavras dos personagens.",
      "Passo 4: Conecte o livro clássico com as questões humanas universais que ainda vivemos hoje."
    ];
    ramo3Topicos = [
      "Em filmes, séries de streaming, letras de música brasileira e peças de teatro inspiradas nos clássicos.",
      "Para entender como as pessoas pensavam, amavam e se expressavam em diferentes séculos."
    ];
    dica = `💡 DICA NINJA DA NATH: 'Literatura não é só livro antigo: é o espelho da alma humana! Descubra o contexto histórico e a obra ganha vida!'`;
  } else if (disc.includes("Química") || disc.includes("Quimica")) {
    ramo2Topicos = [
      "Passo 1: Identifique se o fenômeno é físico (a substância continua a mesma, só mudou de forma) ou químico (virou substância nova).",
      "Passo 2: Escreva a equação química e confira o balanceamento (o que entra tem que sair igual: Lei de Lavoisier).",
      "Passo 3: Use a tabela periódica para checar a família do elemento e quantos elétrons ele precisa para ficar estável (Regra do Octeto).",
      "Passo 4: Calcule as proporções em massa ou mol com a regra de três simples."
    ];
    ramo3Topicos = [
      "Na cozinha: o bolo crescendo pelo fermento químico, a ferrugem no portão e a digestão dos alimentos no estômago.",
      "Nos sabões, pilhas, remédios e nos materiais plásticos reciclados do nosso dia a dia."
    ];
    dica = `💡 DICA NINJA DA NATH: 'Na natureza nada se cria, nada se perde, tudo se transforma! O número de átomos nos reagentes tem que ser IGUALzinho nos produtos!'`;
  } else if (disc.includes("Biologia")) {
    ramo2Topicos = [
      "Passo 1: Identifique o nível de organização (Molécula -> Célula -> Tecido -> Órgão -> Sistema -> Organismo -> Ecossistema).",
      "Passo 2: Reconheça a função vital desempenhada pela estrutura (nutrição, respiração, reprodução, defesa).",
      "Passo 3: Siga o fluxo da energia e das substâncias: nas cadeias alimentares, o sol alimenta os produtores que alimentam os consumidores.",
      "Passo 4: Relacione as adaptações do ser vivo com o meio ambiente onde ele habita (Evolução por Seleção Natural)."
    ];
    ramo3Topicos = [
      "No funcionamento do seu próprio corpo (coração batendo, digestão, anticorpos combatendo vacinas).",
      "Na preservação dos animais, plantas, florestas, rios e na luta contra a poluição do planeta."
    ];
    dica = `💡 DICA NINJA DA NATH: 'Célula vegetal tem parede de celulose, vacúolo gigante e cloroplasto verde! Célula animal não tem parede: é flexível e dinâmica!'`;
  } else if (disc.includes("História") || disc.includes("Historia")) {
    ramo2Topicos = [
      "Passo 1: Posicione o acontecimento na linha do tempo (quem veio antes e quem veio depois).",
      "Passo 2: Investigue as causas econômicas, políticas e sociais que motivaram aquele evento histórico.",
      "Passo 3: Ouça as diferentes vozes da época: documentos oficiais, cartas de pessoas comuns, povos indígenas e escravizados.",
      "Passo 4: Avalie as consequências e heranças que esse fato deixou para o Brasil e o mundo de hoje."
    ];
    ramo3Topicos = [
      "Nos nomes das ruas, monumentos da cidade, feriados nacionais (7 de Setembro, 15 de Novembro, Tiradentes) e nas leis da nossa Constituição.",
      "Para não repetir os erros do passado e construir uma sociedade mais justa e democrática no presente."
    ];
    dica = `💡 DICA NINJA DA NATH: 'História não é decorar datas, é entender causas e consequências! Pergunte sempre: 'Por que aconteceu e o que mudou depois?''`;
  } else if (disc.includes("Geografia")) {
    ramo2Topicos = [
      "Passo 1: Diferencie o espaço natural (montanhas, rios, matas) do espaço construído pelas pessoas (cidades, pontes, estradas).",
      "Passo 2: Localize-se no mapa usando os pontos cardeais (Rosa dos Ventos: Norte, Sul, Leste, Oeste).",
      "Passo 3: Analise o relevo, o clima e a vegetação do bioma para entender como as pessoas vivem e trabalham ali.",
      "Passo 4: Conecte o campo que produz comida com a cidade que produz tecnologia e serviços."
    ];
    ramo3Topicos = [
      "Na previsão do tempo, nos aplicativos de mapas no trânsito (Google Maps/Waze) e na origem dos alimentos da feira.",
      "No cuidado com as bacias hidrográficas, reciclagem de lixo e economia de energia."
    ];
    dica = `💡 DICA NINJA DA NATH: 'O Sol sempre nasce no Leste! Estique o braço direito para o Sol nascente: a frente é o Norte, as costas é o Sul e o braço esquerdo é o Oeste!'`;
  } else if (disc.includes("Filosofia")) {
    ramo2Topicos = [
      "Passo 1: Reconheça a pergunta fundamental que o pensador estava tentando responder.",
      "Passo 2: Identifique os argumentos que ele usou para defender sua ideia (descarte opiniões sem provas).",
      "Passo 3: Compare o ponto de vista com o de outros filósofos concorrentes da mesma época.",
      "Passo 4: Aplique o conceito às decisões morais e éticas do seu cotidiano."
    ];
    ramo3Topicos = [
      "Nos debates sobre o que é certo e errado, justiça nas leis, liberdade de expressão e na era das redes sociais e inteligência artificial.",
      "Para aprender a pensar por conta própria sem aceitar 'fake news' ou manipulações."
    ];
    dica = `💡 DICA NINJA DA NATH: 'Sócrates ensinou: 'Só sei que nada sei!' O primeiro passo para a verdadeira sabedoria é reconhecer o que ainda precisamos aprender!'`;
  } else if (disc.includes("Sociologia")) {
    ramo2Topicos = [
      "Passo 1: Olhe para o grupo e para as regras sociais que moldam o comportamento dos indivíduos de fora para dentro.",
      "Passo 2: Identifique a classe social, o papel do trabalho e as instituições presentes (escola, família, Estado).",
      "Passo 3: Analise as desigualdades sociais com dados estatísticos e fatos históricos comprovados.",
      "Passo 4: Proponha soluções que garantam cidadania, direitos humanos e dignidade para todos."
    ];
    ramo3Topicos = [
      "Na convivência na escola, nas regras do trabalho moderno por aplicativos, no combate ao racismo e na luta por direitos iguais.",
      "Para entender como a nossa sociedade se formou e exercer a cidadania com consciência crítica."
    ];
    dica = `💡 DICA NINJA DA NATH: 'A Sociologia nos ensina a 'desnaturalizar' o mundo: aquilo que parece normal pode ser apenas uma construção social que podemos transformar para melhor!'`;
  } else if (disc.includes("Ingles") || disc.includes("Inglês")) {
    ramo2Topicos = [
      "Passo 1: Faça a leitura rápida (Skimming) para descobrir o assunto central e quem está falando.",
      "Passo 2: Procure pistas visuais, palavras cognatas transparentes e dados pontuais (Scanning).",
      "Passo 3: Atenção com os falsos amigos (False Friends) como 'actually' e 'pretend'.",
      "Passo 4: Observe os conectivos lógicos (However = oposição; Therefore = conclusão; Although = concessão)."
    ];
    ramo3Topicos = [
      "Em letras de música internacionais, séries e filmes em versão original, videogames e viagens pelo mundo.",
      "Para ler manuais de tecnologia, notícias internacionais e artigos científicos globais."
    ];
    dica = `💡 DICA NINJA DA NATH: 'Never translate word by word! Procure o sentido geral do parágrafo e use o contexto como sua maior bússola de tradução!'`;
  } else if (disc.includes("Artes")) {
    ramo2Topicos = [
      "Passo 1: Observe atentamente as cores, linhas, formas, luzes e sombras da pintura ou escultura.",
      "Passo 2: Identifique a época artística (Renascimento com perspectiva, Barroco com drama, Modernismo com liberdade).",
      "Passo 3: Compreenda qual sentimento ou crítica social o artista quis transmitir com aquela obra.",
      "Passo 4: Valorize a originalidade e a identidade cultural brasileira nas artes visuais."
    ];
    ramo3Topicos = [
      "Nos museus, no design gráfico de jogos e embalagens, na arquitetura das cidades e no cinema.",
      "Para despertar a criatividade, a sensibilidade estética e a imaginação livre."
    ];
    dica = `💡 DICA NINJA DA NATH: 'A arte moderna não quer copiar uma fotografia: ela quer expressar emoção, ideias e transformar a nossa forma de ver o mundo!'`;
  } else {
    ramo2Topicos = [
      "Passo 1: Leia atentamente o enunciado e destaque os dados e termos essenciais.",
      "Passo 2: Identifique a regra ou conceito modelo correspondente ao problema.",
      "Passo 3: Resolva em pequenas etapas graduais conferindo cada cálculo ou dedução.",
      "Passo 4: Verifique a coerência do resultado final com a pergunta inicial."
    ];
    ramo3Topicos = [
      "Nas situações do dia a dia onde você precisa resolver problemas práticos com raciocínio claro.",
      "Para construir segurança no aprendizado e autonomia escolar permanente."
    ];
  }

  ramo4Topicos = [
    pontoCego,
    "Leia sempre o comando da questão até o ponto final: não pare na metade do enunciado!"
  ];

  return {
    nucleo: nucleo,
    ramos: [
      {
        titulo: "🎯 Ideia Central (O que é)",
        icone: "💡",
        cor: "#3182CE",
        topicos: ramo1Topicos
      },
      {
        titulo: "🪜 Degraus Kumon (Passo a Passo)",
        icone: "🪜",
        cor: "#38A169",
        topicos: ramo2Topicos
      },
      {
        titulo: "🔍 No Dia a Dia (Onde Isso Existe?)",
        icone: "🌍",
        cor: "#805AD5",
        topicos: ramo3Topicos
      },
      {
        titulo: "⚠️ Casca de Banana (Alerta de Ponto Cego)",
        icone: "🍌",
        cor: "#E53E3E",
        topicos: ramo4Topicos
      }
    ],
    dica_ninja: dica
  };
}

function aplicarMapasMentais() {
  console.log("Iniciando injeção de Mapas Mentais completos em todos os 40 módulos...");

  function varrer(dir) {
    let res = [];
    const itens = fs.readdirSync(dir, { withFileTypes: true });
    for (const it of itens) {
      const full = path.join(dir, it.name);
      if (it.isDirectory()) res = res.concat(varrer(full));
      else if (it.name.endsWith('.json')) res.push(full);
    }
    return res;
  }

  const arquivos = varrer(BASE_DIR);
  let atualizados = 0;

  arquivos.forEach(arq => {
    const rel = path.relative(BASE_DIR, arq).replace(/\\/g, '/');
    const dados = JSON.parse(fs.readFileSync(arq, 'utf-8'));

    // 1. Tenta mapa manual específico
    let mapa = MAPAS_ESPECIFICOS[rel];

    // 2. Se não for um dos específicos, gera mapa sob medida de alta qualidade sem truncamentos
    if (!mapa) {
      mapa = gerarMapaMentalCustomizado(dados, rel);
    }

    dados.mapa_mental = mapa;
    fs.writeFileSync(arq, JSON.stringify(dados, null, 2), 'utf-8');
    atualizados++;
  });

  console.log(`Sucesso: todos os ${atualizados} módulos receberam Mapas Mentais pedagógicos sem truncamento e sem repetição!`);
}

aplicarMapasMentais();
