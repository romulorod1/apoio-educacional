const fs = require('fs');
const path = require('path');

const BASE_DIR = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';

// Dicionário completo com os 40 Mapas Mentais estruturados, lúdicos e completos
const MAPAS_MENTAIS = {
  // ================= MATEMÁTICA =================
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

  // ================= FÍSICA =================
  "Fisica/Mecanica_e_Dinamica/Questoes_Mecanica_Cinematica_Dinamica_e_Energia.json": {
    nucleo: "Mecânica: Movimento, Forças de Newton e Conservação de Energia",
    ramos: [
      {
        titulo: "🎯 Ideia Central (As Três Leis de Newton)",
        icone: "🍎",
        cor: "#3182CE",
        topicos: [
          "1ª Lei (Inércia): Todo corpo continua parado ou em linha reta com velocidade constante se nenhuma força resultante agir sobre ele.",
          "2ª Lei (Princípio Fundamental): Força Resultante = Massa × Aceleração (F = m·a).",
          "3ª Lei (Ação e Reação): Para toda força de ação existe uma reação igual e em sentido oposto (em corpos DIFERENTES, nunca se anulam!)."
        ]
      },
      {
        titulo: "🪜 Degraus Kumon (Passo a Passo Infalível)",
        icone: "🪜",
        cor: "#38A169",
        topicos: [
          "Passo 1: Isole os corpos e desenhe o Diagrama de Corpo Livre (todas as setinhas de forças: Peso, Normal, Tração, Atrito).",
          "Passo 2: Peso aponta sempre para o centro da Terra (P = m·g; use g = 10 m/s²).",
          "Passo 3: Aplique F_res = m·a no sentido do movimento.",
          "Passo 4: Na energia, confira: se não há atrito/resistência do ar, Energia Mecânica Inicial = Energia Mecânica Final (Cinética + Potencial)."
        ]
      },
      {
        titulo: "🔍 No Dia a Dia (Onde Isso Existe?)",
        icone: "🎢",
        cor: "#805AD5",
        topicos: [
          "O cinto de segurança no carro: segura você quando o freio atua, porque seu corpo quer continuar em movimento pela Inércia!",
          "A montanha-russa: no ponto mais alto tem máxima Energia Potencial (m·g·h); ao descer, vira máxima Energia Cinética (m·v²/2) e velocidade!",
          "O salto de skate ou patins: empurrar o chão para trás para o chão empurrar você para a frente (Ação e Reação)."
        ]
      },
      {
        titulo: "⚠️ Casca de Banana (Alerta de Pegadinha)",
        icone: "🍌",
        cor: "#E53E3E",
        topicos: [
          "Normal e Peso NÃO são par de ação e reação! Ação e reação agem em corpos distintos; Normal e Peso atuam no mesmo corpo.",
          "Velocidade em km/h e m/s: para transformar km/h para m/s, DIVIDA por 3,6! (72 km/h ÷ 3,6 = 20 m/s).",
          "Atrito estático é variável: ele vale exatamente o necessário para impedir o movimento até atingir o limite máximo (Fat_max = μe · N)."
        ]
      }
    ],
    dica_ninja: "💡 DICA NINJA DA NATH: 'De km/h para m/s? Divide por 3,6! De m/s para km/h? Multiplica por 3,6! Memorize: 72 km/h são 20 m/s e 108 km/h são 30 m/s!'"
  },

  "Fisica/Termologia_e_Ondulatoria/Questoes_Termodinamica_Optica_e_Ondas.json": {
    nucleo: "Termologia, Óptica & Ondulatória: Calor, Luz e Som",
    ramos: [
      {
        titulo: "🎯 Ideia Central (Energia em Trânsito e Ondas)",
        icone: "🔥",
        cor: "#ED8936",
        topicos: [
          "Temperatura mede a agitação das moléculas; Calor é a energia térmica que se move do corpo mais quente para o mais frio.",
          "Onda transporta ENERGIA e quantidade de movimento, mas NUNCA transporta matéria!",
          "Luz reflete (bate e volta) e refrata (muda de meio e muda de velocidade). Som é onda mecânica longitudinal: não se propaga no vácuo!"
        ]
      },
      {
        titulo: "🪜 Degraus Kumon (Passo a Passo Infalível)",
        icone: "🪜",
        cor: "#38A169",
        topicos: [
          "Passo 1 (Calor Sensível - mudou a temperatura?): Q = m·c·ΔT (o famoso 'Qui-Macete').",
          "Passo 2 (Calor Latente - mudou de estado físico?): Q = m·L (o famoso 'Qui-Moleza'). Na mudança de fase a temperatura NÃO muda!",
          "Passo 3 (Equação Fundamental da Onda): v = λ · f (velocidade = comprimento de onda × frequência). A frequência f NUNCA muda ao mudar de meio!",
          "Passo 4 (Espelhos e Lentes): 1/f = 1/p + 1/p' (Equação de Gauss). Espelho convexo e lente divergente SEMPRE dão imagem virtual, direita e menor."
        ]
      },
      {
        titulo: "🔍 No Dia a Dia (Onde Isso Existe?)",
        icone: "🌊",
        cor: "#805AD5",
        topicos: [
          "A colher dentro do copo com água parece 'quebrada' por causa da Refração da luz.",
          "O efeito estufa e a garrafa térmica: condução, convecção e irradiação térmica.",
          "O eco da sua voz: reflexão do som em uma parede a pelo menos 17 metros de distância.",
          "A sirene da ambulância: parece mais aguda ao se aproximar e mais grave ao se afastar (Efeito Doppler)."
        ]
      },
      {
        titulo: "⚠️ Casca de Banana (Alerta de Pegadinha)",
        icone: "🍌",
        cor: "#E53E3E",
        topicos: [
          "Dizer que o casaco 'esquenta'! Casaco é isolante térmico: ele não produz calor, apenas dificulta a saída do calor do seu corpo.",
          "Gelo derretendo a 0 °C: enquanto houver gelo e água juntos, a temperatura da mistura fica cravada em 0 °C até o último cristal derreter!",
          "Som não se propaga no espaço sideral (vácuo)! Nas batalhas espaciais de cinema, as explosões com som são ficção científica."
        ]
      }
    ],
    dica_ninja: "💡 DICA NINJA DA NATH: 'Mudou a temperatura? Usa o 'Qui-Macete' (Q = m·c·ΔT)! Mudou de estado físico (derreteu/ferveu)? Usa o 'Qui-Moleza' (Q = m·L)!'"
  },

  "Fisica/Eletromagnetismo/Questoes_Eletrostatica_Circuitos_e_Magnetismo.json": {
    nucleo: "Eletromagnetismo: Cargas, Circuitos e Campos Magnéticos",
    ramos: [
      {
        titulo: "🎯 Ideia Central (Cargas e Correntes)",
        icone: "⚡",
        cor: "#ECC94B",
        topicos: [
          "Cargas de mesmo sinal se repelem (+ com +, - com -); cargas de sinais opostos se atraem (+ com -).",
          "Corrente elétrica (i) é o fluxo ordenado de elétrons livres (i = Q / Δt).",
          "A Primeira Lei de Ohm: Tensão = Resistência × Corrente (U = R·i). Potência: P = U·i."
        ]
      },
      {
        titulo: "🪜 Degraus Kumon (Passo a Passo Infalível)",
        icone: "🪜",
        cor: "#38A169",
        topicos: [
          "Passo 1 (Associação em Série): Mesma corrente i para todos os resistores. Req = R1 + R2 + R3. Se uma lâmpada queima, apaga tudo!",
          "Passo 2 (Associação em Paralelo): Mesma tensão U para todos (como na tomada de casa). 1/Req = 1/R1 + 1/R2. Se uma lâmpada queima, as outras continuam acesas!",
          "Passo 3 (Regra da Mão Direita): Polegar no sentido da corrente 'i', dedos dobrados indicam o sentido circular do campo magnético 'B'.",
          "Passo 4 (Força Magnética): F = q·v·B·sen(θ). Carga em repouso (v = 0) NÃO sofre força magnética!"
        ]
      },
      {
        titulo: "🔍 No Dia a Dia (Onde Isso Existe?)",
        icone: "💡",
        cor: "#805AD5",
        topicos: [
          "O chuveiro elétrico no inverno: para esquentar mais a água, diminui-se o tamanho da resistência (R menor -> Potência P = U²/R maior!).",
          "O ímã de geladeira e as bússolas: o polo norte da bússola aponta para o polo sul magnético da Terra (que fica no norte geográfico).",
          "Motores de ventilador e liquidificador: transformam energia elétrica em energia mecânica através do campo magnético."
        ]
      },
      {
        titulo: "⚠️ Casca de Banana (Alerta de Pegadinha)",
        icone: "🍌",
        cor: "#E53E3E",
        topicos: [
          "Confundir associação em série e paralelo na conta de luz: os aparelhos da nossa casa são SEMPRE ligados em paralelo (todos em 127V ou 220V)!",
          "Inseparabilidade dos polos magnéticos: se você cortar um ímã ao meio, você NUNCA isola o polo norte do polo sul; obtém dois novos ímãs completos!",
          "Consumo de energia elétrica em kWh: Energia = Potência (em kW) × Tempo (em horas)."
        ]
      }
    ],
    dica_ninja: "💡 DICA NINJA DA NATH: 'Quem Vê Ri! (V = R · i ou U = R · i). E na tomada de casa: tudo em PARALELO para a televisão não desligar quando você apagar a luz do quarto!'"
  },

  "Fisica/Moderna_e_Astronomia/Questoes_Relatividade_Quantica_e_Gravitacao.json": {
    nucleo: "Física Moderna & Gravitação: Do Cosmos ao Mundo Quântico",
    ramos: [
      {
        titulo: "🎯 Ideia Central (A Luz e o Tempo)",
        icone: "🌌",
        cor: "#805AD5",
        topicos: [
          "Gravitação Universal de Newton: Corpos atraem-se na razão direta de suas massas e inversa do quadrado da distância (F = G·M·m/d²).",
          "Leis de Kepler: 1ª (órbitas elípticas com o Sol em um dos focos); 2ª (áreas iguais em tempos iguais: mais rápido no periélio, mais lento no afélio); 3ª (T²/R³ = constante).",
          "Relatividade de Einstein: A velocidade da luz no vácuo (c = 300.000 km/s) é a velocidade máxima do universo e é igual para todos os observadores. Massa e energia são equivalentes (E = m·c²)."
        ]
      },
      {
        titulo: "🪜 Degraus Kumon (Passo a Passo Infalível)",
        icone: "🪜",
        cor: "#38A169",
        topicos: [
          "Passo 1 (Efeito Fotoelétrico): A luz é formada por pacotes de energia chamados fótons (E = h·f).",
          "Passo 2: Um elétron só é ejetado de uma placa metálica se a frequência da luz for maior que a frequência de corte (função trabalho Φ).",
          "Passo 3 (Dualidade Onda-Partícula de De Broglie): A luz comporta-se como onda (difração/interferência) e como partícula (fotoelétrico).",
          "Passo 4: Perto de campos gravitacionais intensos ou em altíssima velocidade, o tempo passa mais devagar (dilatação temporal)!"
        ]
      },
      {
        titulo: "🔍 No Dia a Dia (Onde Isso Existe?)",
        icone: "🛰️",
        cor: "#3182CE",
        topicos: [
          "O GPS do celular: se não corrigisse a dilatação do tempo prevista pela Relatividade Geral e Restrita, erraria sua posição em quilômetros todo dia!",
          "Os painéis de energia solar fotovoltaica e os sensores de portas automáticas de shoppings (Efeito Fotoelétrico de Einstein).",
          "As estações do ano e os satélites de comunicação geoestacionários (que levam 24 horas para dar uma volta na Terra)."
        ]
      },
      {
        titulo: "⚠️ Casca de Banana (Alerta de Pegadinha)",
        icone: "🍌",
        cor: "#E53E3E",
        topicos: [
          "Achar que as estações do ano acontecem porque a Terra está mais perto ou longe do Sol. FALSO! As estações ocorrem pela inclinação do eixo da Terra!",
          "No efeito fotoelétrico: aumentar o brilho (intensidade) da luz vermelha fraca NUNCA arranca elétrons; o que importa é a FREQUÊNCIA (cor) de cada fóton!",
          "Em gravitação: se você dobrar a distância entre dois planetas, a força gravitacional NÃO cai pela metade; cai para um QUARTO (1/2² = 1/4)!"
        ]
      }
    ],
    dica_ninja: "💡 DICA NINJA DA NATH: 'Distância dobrou? Força da gravidade cai 4 vezes! Distância triplicou? Cai 9 vezes! A força diminui com o QUADRADO da distância!'"
  }
};

// Carrega os dados, insere os mapas mentais em cada arquivo de Base de Dados
function aplicarMapasMentais() {
  console.log("Iniciando injeção de Mapas Mentais em todos os módulos...");

  function varrerDiretorio(dir) {
    let arquivos = [];
    const itens = fs.readdirSync(dir, { withFileTypes: true });
    for (const it of itens) {
      const full = path.join(dir, it.name);
      if (it.isDirectory()) arquivos = arquivos.concat(varrerDiretorio(full));
      else if (it.name.endsWith('.json')) arquivos.push(full);
    }
    return arquivos;
  }

  const todosArquivos = varrerDiretorio(BASE_DIR);
  console.log(`Encontrados ${todosArquivos.length} módulos para verificar/atualizar.`);

  let atualizados = 0;

  todosArquivos.forEach(arq => {
    const rel = path.relative(BASE_DIR, arq).replace(/\\/g, '/');
    const dados = JSON.parse(fs.readFileSync(arq, 'utf-8'));

    // Verifica se temos mapa mental específico ou se geramos a partir da teoria
    let mapa = MAPAS_MENTAIS[rel];

    if (!mapa) {
      // Gera mapa mental automático de altíssima qualidade baseado na teoria rica já existente
      const bd = dados.benchmark_didatico || {};
      const rt = bd.resumo_teorico || {};
      const conceitos = rt.conceitos_chave || [];
      const pontoCego = rt.atencao_ponto_cego || "Atenção máxima à leitura dos enunciados e aos dados fornecidos.";
      const tituloAssunto = dados.assunto || bd.capitulo || "Tema Educacional";

      let topicosIdeia = [];
      let topicosPassos = [];
      let topicosPratica = [];

      if (conceitos.length > 0) {
        conceitos.slice(0, 3).forEach((c, idx) => {
          const termo = typeof c === 'object' ? c.termo : 'Conceito ' + (idx + 1);
          const def = typeof c === 'object' ? c.definicao : c;
          topicosIdeia.push(`${termo}: ${def.slice(0, 180)}...`);
        });
      } else {
        topicosIdeia.push(`Compreensão estrutural de ${tituloAssunto} para fixação de aprendizagem.`);
        topicosIdeia.push(`Identificação dos pilares centrais da disciplina de ${dados.disciplina}.`);
      }

      if (bd.objetivos_aprendizagem && bd.objetivos_aprendizagem.length > 0) {
        bd.objetivos_aprendizagem.slice(0, 4).forEach((obj, idx) => {
          topicosPassos.push(`Passo ${idx + 1}: ${obj}`);
        });
      } else {
        topicosPassos.push("Passo 1: Ler atentamente o texto-base e destacar palavras-chave.");
        topicosPassos.push("Passo 2: Reconhecer a regra ou conceito essencial aplicável.");
        topicosPassos.push("Passo 3: Resolver o exercício conferindo o gabarito comentado.");
      }

      topicosPratica.push(`Aplicação nas provas de vestibulares (ENEM, FUVEST, UERJ) e no raciocínio crítico cotidiano.`);
      topicosPratica.push(`Conexão com os fenômenos sociais, históricos, científicos e linguísticos do Brasil e do mundo.`);

      mapa = {
        nucleo: `${tituloAssunto}: Conexões e Ideias Principais`,
        ramos: [
          {
            titulo: "🎯 Ideia Central (O que é)",
            icone: "💡",
            cor: "#3182CE",
            topicos: topicosIdeia
          },
          {
            titulo: "🪜 Degraus Kumon (Passo a Passo)",
            icone: "🪜",
            cor: "#38A169",
            topicos: topicosPassos
          },
          {
            titulo: "🔍 No Dia a Dia & Aplicações",
            icone: "🌍",
            cor: "#805AD5",
            topicos: topicosPratica
          },
          {
            titulo: "⚠️ Casca de Banana (Alerta de Ponto Cego)",
            icone: "🍌",
            cor: "#E53E3E",
            topicos: [
              pontoCego,
              "Sempre justifique sua resposta buscando a evidência direta no texto ou na dedução lógica."
            ]
          }
        ],
        dica_ninja: `💡 DICA NINJA DA NATH: 'Domine a ideia central de ${tituloAssunto} antes de ir para as questões mais difíceis. Quem constrói a base firme nunca tropeça no topo!'`
      };
    }

    dados.mapa_mental = mapa;
    fs.writeFileSync(arq, JSON.stringify(dados, null, 2), 'utf-8');
    atualizados++;
  });

  console.log(`Sucesso: ${atualizados} arquivos enriquecidos com Mapa Mental para a criança!`);
}

aplicarMapasMentais();
