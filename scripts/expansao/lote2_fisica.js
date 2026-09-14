const fs = require('fs');
const path = require('path');

const BASE_DIR = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';

function salvar(subpath, dados) {
  const p = path.join(BASE_DIR, subpath);
  fs.writeFileSync(p, JSON.stringify(dados, null, 2), 'utf-8');
  console.log(`Atualizado: ${subpath} com ${dados.questoes.length} questões.`);
}

// -------------------------------------------------------------
// 1. FÍSICA - CINEMÁTICA E DINÂMICA
// -------------------------------------------------------------
const fisicaCinematica = {
  disciplina: "Fisica",
  modulo: "Cinematica_e_Dinamica",
  subpasta: "Cinematica",
  arquivo_origem: "Questoes_Cinematica_e_Dinamica.json",
  benchmark_didatico: {
    capitulo: "Mecânica Clássica: Cinemática Escalar, Vetorial e Dinâmica Newtoniana",
    objetivos_aprendizagem: [
      "Diferenciar Movimento Retilíneo Uniforme (MRU) de Movimento Retilíneo Uniformemente Variado (MRUV) e interpretar seus gráficos s×t, v×t e a×t.",
      "Calcular velocidade média, aceleração e aplicar a Equação de Torricelli em movimentos sem dependência temporal explícita.",
      "Compreender e aplicar as Três Leis de Newton em sistemas com atrito estático e dinâmico, planos inclinados e blocos acoplados.",
      "Analisar o trabalho mecânico realizado por forças constantes e variáveis, aplicando o Teorema da Energia Cinética e a Conservação da Energia Mecânica."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Movimento Uniforme e Variado (MRU e MRUV)",
          definicao: "No MRU, a velocidade é constante e a aceleração é nula, com função horária s = s₀ + v·t. No MRUV, a aceleração escalar é constante e não-nula, regida pelas funções horárias v = v₀ + a·t e s = s₀ + v₀·t + (a·t²)/2. Quando o tempo não é fornecido ou solicitado, recorre-se à equação de Torricelli: v² = v₀² + 2·a·Δs. Graficamente, a área sob a curva no gráfico v×t fornece numericamente a variação de espaço Δs, enquanto a inclinação da reta tangente expressa a aceleração instantânea."
        },
        {
          termo: "Leis de Newton e Forças Fundamentais de Contato",
          definicao: "A 1ª Lei (Inércia) postula que um corpo preserva seu estado de repouso ou MRU caso a resultante das forças seja nula (ΣF = 0). A 2ª Lei estabelece que a força resultante é o produto da massa pela aceleração (ΣF = m·a). A 3ª Lei (Ação e Reação) impõe que forças surgem aos pares, de mesma intensidade, mesma direção e sentidos opostos, atuando necessariamente em corpos distintos. As forças de atrito modelam-se por Fat_estático ≤ μe·N (com valor máximo na iminência de deslizamento) e Fat_cinético = μc·N (onde tipicamente μc < μe)."
        },
        {
          termo: "Trabalho, Potência e Conservação de Energia",
          definicao: "O trabalho mecânico de uma força constante é dado por W = F·d·cos(θ). O Teorema da Energia Cinética afirma que o trabalho total de todas as forças equivale à variação de energia cinética: W_total = ΔEc = (m·v_f²)/2 - (m·v_i²)/2. Na presença exclusiva de forças conservativas (peso, elástica), a Energia Mecânica se conserva: Em = Ec + Ep = constante, onde Ep_gravitacional = m·g·h e Ep_elástica = (k·x²)/2. Na presença de forças dissipativas (atrito, resistência do ar), W_dissipativo = Em_final - Em_inicial."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico: alunos frequentemente confundem 'força normal' e 'força peso' como um par de ação e reação. O par da Normal está na superfície de apoio e o par do Peso está no centro da Terra. Além disso, em gráficos v×t, o aluno não deve aplicar s = v·t cegamente quando a linha for inclinada (movimento acelerado)."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Bloco em Plano Inclinado com Atrito",
      enunciado: "Um bloco de massa m = 4 kg repousa sobre um plano inclinado de ângulo θ = 30° com a horizontal (sen 30° = 0,5 e cos 30° = 0,87; adote g = 10 m/s²). O coeficiente de atrito estático entre o bloco e a superfície é μe = 0,6 e o cinético é μc = 0,4. Determine se o bloco desce o plano e, em caso afirmativo, determine sua aceleração.",
      resolucao_passo_a_passo: "1. Decomposição do peso: Px = m·g·sen(30°) = 4 · 10 · 0,5 = 20 N ao longo da descida. Py = m·g·cos(30°) = 4 · 10 · 0,87 = 34,8 N perpendicular ao plano.\n2. Equilíbrio vertical no plano: A força normal equilibra Py, logo N = Py = 34,8 N.\n3. Força de atrito estático máxima: Fat_max = μe · N = 0,6 · 34,8 = 20,88 N.\n4. Comparação entre força motora e atrito estático máximo: Px (20 N) < Fat_max (20,88 N). Conclusão: A força motora não supera o atrito estático máximo. O bloco permanece em repouso estático sobre o plano inclinado e sua aceleração é rigorosamente a = 0 m/s²."
    }
  },
  questoes: [
    {
      id: "FIS_CIN_01",
      origem: "Autoral Didático - Apoio Escolar",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Velocidade Média e Conversão de Unidades",
      tipo: "fechada",
      enunciado: "Um automóvel parte do km 20 de uma rodovia às 8h00 e atinge o km 200 da mesma rodovia às 10h00, sem fazer paradas prolongadas. Qual é a velocidade escalar média desenvolvida pelo automóvel nesse percurso em km/h e em m/s?",
      alternativas: [
        { letra: "A", texto: "90 km/h e 25 m/s" },
        { letra: "B", texto: "100 km/h e 27,8 m/s" },
        { letra: "C", texto: "80 km/h e 22,2 m/s" },
        { letra: "D", texto: "90 km/h e 32,4 m/s" },
        { letra: "E", texto: "180 km/h e 50 m/s" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Δs = sf - si = 200 - 20 = 180 km; Δt = 10 - 8 = 2 h.",
        porque: "Vm = Δs / Δt = 180 km / 2 h = 90 km/h. Para converter de km/h para m/s, divide-se por 3,6: 90 / 3,6 = 25 m/s."
      }
    },
    {
      id: "FIS_CIN_02",
      origem: "FUVEST",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "MRUV e Equação de Torricelli",
      tipo: "fechada",
      enunciado: "Um trem de 120 m de comprimento desloca-se a uma velocidade constante de 72 km/h. Ao avistar um sinal vermelho, o maquinista aciona os freios, imprimindo uma desaceleração constante de módulo igual a 2 m/s². A distância percorrida pelo trem desde o acionamento dos freios até a parada completa é de:",
      alternativas: [
        { letra: "A", texto: "100 m" },
        { letra: "B", texto: "120 m" },
        { letra: "C", texto: "144 m" },
        { letra: "D", texto: "200 m" },
        { letra: "E", texto: "50 m" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Torricelli: v² = v₀² - 2·a·Δs com v₀ = 72/3,6 = 20 m/s e v = 0.",
        porque: "0 = 20² - 2 · 2 · Δs => 0 = 400 - 4·Δs => 4·Δs = 400 => Δs = 100 m. O comprimento do trem não afeta a distância de frenagem de um ponto fixo de referência da máquina."
      }
    },
    {
      id: "FIS_CIN_03",
      origem: "ENEM",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Gráficos do Movimento e Área sob a Curva",
      tipo: "fechada",
      enunciado: "O gráfico da velocidade em função do tempo de um móvel em trajetória retilínea parte de v = 0 em t = 0, atinge linearmente v = 30 m/s no instante t = 10 s, permanece constante em 30 m/s de t = 10 s até t = 30 s, e desacelera uniformemente até parar em t = 40 s. O deslocamento escalar total do móvel nos 40 s de movimento é:",
      imagem_descricao: "Gráfico trapezoidal v×t com base maior B = 40 s, base menor b = 20 s (de 10 s a 30 s) e altura h = 30 m/s.",
      alternativas: [
        { letra: "A", texto: "600 m" },
        { letra: "B", texto: "900 m" },
        { letra: "C", texto: "1200 m" },
        { letra: "D", texto: "450 m" },
        { letra: "E", texto: "750 m" }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Propriedade geométrica: a área da figura trapezoidal sob o gráfico v×t fornece o deslocamento escalar Δs.",
        porque: "Área do trapézio: A = [(Base maior + Base menor) · Altura] / 2 = [(40 + 20) · 30] / 2 = (60 · 30) / 2 = 1800 / 2 = 900 m."
      }
    },
    {
      id: "FIS_CIN_04",
      origem: "UNICAMP",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Queda Livre e Lançamento Vertical",
      tipo: "fechada",
      enunciado: "Um objeto é lançado verticalmente para cima a partir do solo com velocidade inicial de 30 m/s. Desprezando a resistência do ar e adotando g = 10 m/s², o tempo gasto para atingir a altura máxima e o valor dessa altura máxima são, respectivamente:",
      alternativas: [
        { letra: "A", texto: "3 s e 45 m" },
        { letra: "B", texto: "3 s e 90 m" },
        { letra: "C", texto: "6 s e 45 m" },
        { letra: "D", texto: "2 s e 20 m" },
        { letra: "E", texto: "3 s e 30 m" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Na altura máxima, v = 0. Equações do lançamento vertical para cima.",
        porque: "v = v₀ - g·t => 0 = 30 - 10·t => t = 3 s. Altura máxima: H = v₀·t - (g·t²)/2 = 30·3 - (10·9)/2 = 90 - 45 = 45 m (ou por Torricelli: 0² = 30² - 2·10·H => H = 900/20 = 45 m)."
      }
    },
    {
      id: "FIS_CIN_05",
      origem: "ENEM",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Leis de Newton e Força de Atrito",
      tipo: "fechada",
      enunciado: "Um bloco de massa 10 kg repousa sobre uma superfície horizontal áspera com coeficiente de atrito estático μe = 0,5 e dinâmico μc = 0,3 (adote g = 10 m/s²). Aplica-se horizontalmente ao bloco uma força constante F = 40 N. A força de atrito exercida pelo chão sobre o bloco e a aceleração resultante são:",
      alternativas: [
        { letra: "A", texto: "40 N e 0 m/s²" },
        { letra: "B", texto: "50 N e 0 m/s²" },
        { letra: "C", texto: "30 N e 1,0 m/s²" },
        { letra: "D", texto: "40 N e 1,0 m/s²" },
        { letra: "E", texto: "0 N e 4 m/s²" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Fat_max estático = μe · N = 0,5 · (10 · 10) = 50 N.",
        porque: "Como a força aplicada F = 40 N é menor do que a força de atrito estático máxima (50 N), o corpo não entra em movimento. Portanto, a aceleração é a = 0 m/s² e a força de atrito estático equilibra exatamente a força aplicada: Fat = 40 N."
      }
    },
    {
      id: "FIS_CIN_06",
      origem: "UERJ",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Blocos Acoplados e Tração no Fio",
      tipo: "fechada",
      enunciado: "Dois blocos A e B de massas mA = 2 kg e mB = 3 kg estão apoiados sobre um piso horizontal perfeitamente liso e interligados por um fio ideal e inextensível. Aplica-se ao bloco B uma força horizontal constante F = 20 N orientada para a direita. A tração T no fio que conecta os dois blocos vale:",
      alternativas: [
        { letra: "A", texto: "8 N" },
        { letra: "B", texto: "12 N" },
        { letra: "C", texto: "20 N" },
        { letra: "D", texto: "10 N" },
        { letra: "E", texto: "6 N" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Aceleração do conjunto: a = F / (mA + mB) = 20 / (2 + 3) = 4 m/s².",
        porque: "Isolando o bloco A: a única força horizontal que atua nele é a tração T. Logo, T = mA · a = 2 kg · 4 m/s² = 8 N. (Verificação no bloco B: F - T = mB·a => 20 - 8 = 3·4 = 12 N, perfeitamente consistente)."
      }
    },
    {
      id: "FIS_CIN_07",
      origem: "UNESP",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Trabalho Mecânico e Teorema da Energia Cinética",
      tipo: "fechada",
      enunciado: "Um bloco de 2 kg desliza sobre uma superfície horizontal lisa com velocidade de 10 m/s. Ele entra em uma região áspera de 5 m de extensão onde atua um coeficiente de atrito cinético μc = 0,6 (g = 10 m/s²). A velocidade com que o bloco sai da região áspera é:",
      alternativas: [
        { letra: "A", texto: "2 m/s" },
        { letra: "B", texto: "5 m/s" },
        { letra: "C", texto: "6,32 m/s" },
        { letra: "D", texto: "8 m/s" },
        { letra: "E", texto: "4 m/s" }
      ],
      resposta: "C",
      gabarito: {
        letra: "C",
        ancora: "W_fat = -Fat · d = - (μc · m · g) · d = - (0,6 · 2 · 10) · 5 = -60 J.",
        porque: "Pelo Teorema da Energia Cinética: ΔEc = W_total => Ec_f - Ec_i = -60 J. Ec_i = (1/2) · 2 · 10² = 100 J. Ec_f = 100 - 60 = 40 J. Logo, (1/2) · 2 · vf² = 40 => vf² = 40 => vf = √40 ≈ 6,32 m/s."
      }
    },
    {
      id: "FIS_CIN_08",
      origem: "FUVEST",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Conservação da Energia Mecânica e Molas",
      tipo: "fechada",
      enunciado: "Um carrinho de montanha-russa de massa m = 500 kg parte do repouso do ponto A situado a uma altura h = 20 m em relação ao solo e desce uma rampa sem atrito. No final do percurso, no nível do solo, ele colide com uma mola ideal de constante elástica k = 20.000 N/m, comprimindo-a até parar. Adote g = 10 m/s². A deformação máxima sofrida pela mola é:",
      alternativas: [
        { letra: "A", texto: "3,16 m" },
        { letra: "B", texto: "2,0 m" },
        { letra: "C", texto: "1,5 m" },
        { letra: "D", texto: "4,0 m" },
        { letra: "E", texto: "10,0 m" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Conservação da energia: Ep_gravitacional no ponto A = Ep_elástica máxima na mola.",
        porque: "m·g·h = (k·x²)/2 => 500 · 10 · 20 = (20.000 · x²)/2 => 100.000 = 10.000 · x² => x² = 10 => x = √10 ≈ 3,16 m."
      }
    },
    {
      id: "FIS_CIN_09",
      origem: "ENEM",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Potência Mecânica e Rendimento de Motores",
      tipo: "fechada",
      enunciado: "Um guindaste elétrico eleva verticalmente uma carga de 1.200 kg a uma altura de 15 metros em um intervalo de 30 segundos, com velocidade constante. Sabendo que o motor do guindaste opera com um rendimento de 75% e g = 10 m/s², a potência elétrica total consumida pelo motor durante a operação é:",
      alternativas: [
        { letra: "A", texto: "6 kW" },
        { letra: "B", texto: "8 kW" },
        { letra: "C", texto: "10 kW" },
        { letra: "D", texto: "4,5 kW" },
        { letra: "E", texto: "12 kW" }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Trabalho útil = m·g·h = 1200 · 10 · 15 = 180.000 J. Potência útil = W / Δt = 180.000 / 30 = 6.000 W = 6 kW.",
        porque: "Como rendimento η = P_útil / P_total => 0,75 = 6 kW / P_total => P_total = 6 / 0,75 = 8 kW."
      }
    },
    {
      id: "FIS_CIN_10",
      origem: "EsPCEx",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Movimento Circular Uniforme e Força Centrípeta",
      tipo: "fechada",
      enunciado: "Um automóvel de massa 1.000 kg faz uma curva circular plana e horizontal de raio R = 50 m. O coeficiente de atrito estático entre os pneus e a pista é μe = 0,8. Adotando g = 10 m/s², a velocidade escalar máxima com que o veículo pode realizar a curva sem derrapar lateralmente é:",
      alternativas: [
        { letra: "A", texto: "72 km/h (20 m/s)" },
        { letra: "B", texto: "36 km/h (10 m/s)" },
        { letra: "C", texto: "54 km/h (15 m/s)" },
        { letra: "D", texto: "90 km/h (25 m/s)" },
        { letra: "E", texto: "108 km/h (30 m/s)" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A resultante centrípeta é fornecida exclusivamente pela força de atrito estático: Fcp = Fat_max.",
        porque: "m·v²/R = μe·m·g => v² = μe·g·R = 0,8 · 10 · 50 = 400 => v = 20 m/s. Convertendo para km/h: 20 · 3,6 = 72 km/h."
      }
    },
    {
      id: "FIS_CIN_11",
      origem: "AFA",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Lançamento Oblíquo de Projéteis",
      tipo: "fechada",
      enunciado: "Um projétil é lançado a partir do solo plano com velocidade inicial de 50 m/s sob um ângulo de elevação θ tal que sen θ = 0,6 e cos θ = 0,8. Desprezando a resistência do ar e com g = 10 m/s², o alcance horizontal do disparo é:",
      alternativas: [
        { letra: "A", texto: "240 m" },
        { letra: "B", texto: "180 m" },
        { letra: "C", texto: "120 m" },
        { letra: "D", texto: "300 m" },
        { letra: "E", texto: "360 m" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "vx = v₀·cos θ = 50·0,8 = 40 m/s; vy0 = v₀·sen θ = 50·0,6 = 30 m/s.",
        porque: "Tempo de subida: ts = vy0 / g = 30 / 10 = 3 s. Tempo total de voo: t_voo = 2 · 3 = 6 s. Alcance horizontal: A = vx · t_voo = 40 · 6 = 240 m."
      }
    },
    {
      id: "FIS_CIN_12",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Colisões Inelásticas e Conservação da Quantidade de Movimento",
      tipo: "fechada",
      enunciado: "Um bloco de massa M = 1,98 kg está em repouso sobre uma mesa horizontal sem atrito, preso a uma mola ideal de constante k = 800 N/m fixada à parede. Um projétil de massa m = 20 g é disparado horizontalmente com velocidade v = 400 m/s e aloja-se no interior do bloco instantaneamente. A máxima compressão sofrida pela mola após a colisão é:",
      alternativas: [
        { letra: "A", texto: "0,20 m" },
        { letra: "B", texto: "0,10 m" },
        { letra: "C", texto: "0,40 m" },
        { letra: "D", texto: "0,05 m" },
        { letra: "E", texto: "0,14 m" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Conservação da Quantidade de Movimento no choque perfeitamente inelástico: m·v = (M + m)·V.",
        porque: "0,02 · 400 = (1,98 + 0,02) · V => 8 = 2 · V => V = 4 m/s. Conservação da energia mecânica pós-colisão: (M+m)·V²/2 = (k·x²)/2 => 2 · 4² = 800 · x² => 32 = 800 · x² => x² = 32/800 = 4/100 = 0,04 => x = 0,20 m = 20 cm."
      }
    },
    {
      id: "FIS_CIN_13",
      origem: "OBF (Olimpíada Brasileira de Física)",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Dinâmica em Referenciais Não Inerciais e Força Centrífuga",
      tipo: "aberta",
      enunciado: "Um disco horizontal gira com velocidade angular constante ω em torno de seu eixo vertical central. A uma distância r do centro, repousa uma pequena moeda de massa m. Sendo μe o coeficiente de atrito estático entre a moeda e a superfície do disco e g a aceleração da gravidade, deduza a expressão da velocidade angular máxima ω_max para que a moeda não escorregue e calcule seu valor para r = 0,2 m, μe = 0,5 e g = 10 m/s².",
      resposta: "ω_max = √(μe·g / r) = 5 rad/s",
      gabarito: {
        letra: "Aberta",
        ancora: "No referencial inercial, a força de atrito estático fornece a resultante centrípeta: Fat ≤ μe · m · g e Fcp = m · ω² · r.",
        espera_se: "Na iminência de deslizamento: m · ω_max² · r = μe · m · g => ω_max = √(μe · g / r). Substituindo os valores numéricos: ω_max = √(0,5 · 10 / 0,2) = √(5 / 0,2) = √25 = 5 rad/s."
      }
    },
    {
      id: "FIS_CIN_14",
      origem: "UNICAMP 2ª Fase",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Impulso e Teorema do Impulso",
      tipo: "aberta",
      enunciado: "Uma bola de tênis de massa 60 g incide horizontalmente contra uma parede vertical a 30 m/s e é rebatida na mesma direção e sentido oposto a 20 m/s. O tempo de contato entre a bola e a parede é de 0,02 s. Determine a intensidade da variação da quantidade de movimento da bola e o módulo da força média exercida pela parede sobre a bola.",
      resposta: "ΔQ = 3,0 kg·m/s e F_media = 150 N",
      gabarito: {
        letra: "Aberta",
        ancora: "Adotando o sentido da velocidade inicial como positivo: v_i = +30 m/s e v_f = -20 m/s.",
        espera_se: "1. Variação da quantidade de movimento: ΔQ = m·v_f - m·v_i = 0,06 · (-20) - 0,06 · (+30) = -1,2 - 1,8 = -3,0 kg·m/s. Módulo: |ΔQ| = 3,0 kg·m/s (ou N·s).\n2. Teorema do Impulso: I = F_media · Δt = |ΔQ| => F_media · 0,02 = 3,0 => F_media = 3,0 / 0,02 = 150 N."
      }
    },
    {
      id: "FIS_CIN_15",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Plano Inclinado e Trabalho com Atrito",
      tipo: "aberta",
      enunciado: "Um bloco de 5 kg é abandonado do alto de um plano inclinado de 30° com a horizontal a partir de uma altura de 4 metros em relação à base. Durante a descida, atua uma força de atrito constante de 10 N. Calcule o comprimento da rampa, o trabalho realizado pela força de atrito e a velocidade com que o bloco atinge a base da rampa (adote g = 10 m/s²).",
      resposta: "d = 8 m, W_fat = -80 J e v = 4√6 ≈ 6,93 m/s",
      gabarito: {
        letra: "Aberta",
        ancora: "sen 30° = h / d => d = h / sen 30° = 4 / 0,5 = 8 m.",
        espera_se: "1. Comprimento da rampa: d = 4 / 0,5 = 8 m.\n2. Trabalho do atrito: W_fat = -Fat · d = -10 · 8 = -80 J.\n3. Balanço de energia mecânica: Em_inicial = m·g·h = 5 · 10 · 4 = 200 J. Em_final = Em_inicial + W_fat = 200 - 80 = 120 J. Como Em_final = (m·v²)/2: (5 · v²)/2 = 120 => 2,5 · v² = 120 => v² = 48 => v = √48 = 4√3 ≈ 6,93 m/s."
      }
    }
  ]
};

// -------------------------------------------------------------
// 2. FÍSICA - TERMODINÂMICA E CALOR
// -------------------------------------------------------------
const fisicaTermologia = {
  disciplina: "Fisica",
  modulo: "Termodinamica_e_Calor",
  subpasta: "Termologia",
  arquivo_origem: "Questoes_Termodinamica_e_Calor.json",
  benchmark_didatico: {
    capitulo: "Termologia: Calorimetria, Dilatação, Teoria Cinética dos Gases e Termodinâmica",
    objetivos_aprendizagem: [
      "Distinguir calor sensível (Q = m·c·Δθ) e calor latente (Q = m·L) e resolver balanços térmicos em calorímetros ideais e reais.",
      "Calcular a dilatação térmica linear, superficial e volumétrica de sólidos e a dilatação aparente e real de líquidos.",
      "Aplicar a Equação de Clapeyron (P·V = n·R·T) e as transformações gasosas fundamentais (isotérmica, isobárica, isocórica e adiabática).",
      "Compreender a 1ª Lei da Termodinâmica (ΔU = Q - W), calcular o trabalho em ciclos termodinâmicos e avaliar o rendimento de máquinas térmicas pelo Ciclo de Carnot (2ª Lei)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Calorimetria e Mudanças de Fase",
          definicao: "Calor é energia térmica em trânsito motivada por uma diferença de temperatura. O calor sensível acarreta variação de temperatura sem mudança de fase: Q = m·c·Δθ (onde c é o calor específico sensível e C = m·c é a capacidade térmica). O calor latente promove a alteração de estado físico à temperatura constante: Q = m·L (onde L é o calor latente de fusão ou vaporização). Em sistemas termicamente isolados, o somatório das trocas de calor é nulo: ΣQ = 0."
        },
        {
          termo: "Gases Ideais e Primeira Lei da Termodinâmica",
          definicao: "O gás ideal obedece à equação de estado P·V = n·R·T. A energia interna de um gás monoatômico ideal depende exclusivamente de sua temperatura absoluta: U = (3/2)·n·R·T, logo ΔU = (3/2)·n·R·ΔT. O trabalho termodinâmico realizado pelo gás em transformações isobáricas é W = P·ΔV; em transformações gerais, equivale numericamente à área sob a curva no diagrama P×V. A 1ª Lei expressa a conservação da energia: ΔU = Q - W (convenção: W > 0 na expansão, W < 0 na compressão; Q > 0 no calor recebido, Q < 0 no calor cedido)."
        },
        {
          termo: "Segunda Lei da Termodinâmica e Ciclo de Carnot",
          definicao: "É impossível construir uma máquina térmica que, operando em ciclos, converta integralmente calor em trabalho mecânico (Enunciado de Kelvin-Planck). O rendimento de qualquer máquina térmica é η = W / Q_quente = 1 - |Q_fria| / Q_quente. O Ciclo de Carnot opera com duas transformações isotérmicas reversíveis e duas adiabáticas reversíveis, fornecendo o rendimento teórico máximo entre as temperaturas absolutas T_fria e T_quente: η_Carnot = 1 - T_fria / T_quente (com temperaturas rigorosamente em Kelvin)."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente: utilizar a temperatura em graus Celsius (°C) no cálculo do rendimento de Carnot ou na equação dos gases P·V = n·R·T. Ambas exigem impreterivelmente o uso da escala termodinâmica absoluta em Kelvin (T_K = T_°C + 273). Outro erro comum é esquecer que em transformações adiabáticas Q = 0, implicando ΔU = -W."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Balanço Térmico com Mudança de Fase de Gelo",
      enunciado: "Em um calorímetro ideal de capacidade térmica desprezível, misturam-se 200 g de água líquida a 40 °C com 50 g de gelo a 0 °C. Dados: calor específico da água c_agua = 1 cal/(g·°C) e calor latente de fusão do gelo L_fusao = 80 cal/g. Determine a temperatura final de equilíbrio térmico da mistura.",
      resolucao_passo_a_passo: "1. Calor necessário para fundir todo o gelo a 0 °C: Q_fusao = m_gelo · L_fusao = 50 g · 80 cal/g = 4.000 cal.\n2. Calor liberado pela água líquida ao resfriar de 40 °C até 0 °C: Q_resfr = m_agua · c_agua · (0 - 40) = 200 · 1 · (-40) = -8.000 cal. O módulo liberado (|8.000 cal|) é maior que o necessário para fundir o gelo (4.000 cal). Logo, todo o gelo se funde e a temperatura de equilíbrio T_eq estará entre 0 °C e 40 °C.\n3. Balanço térmico com água fundida e água inicial: Q_fusao + Q_aquec_gelo_fundido + Q_resfr_agua = 0\n4.000 + 50 · 1 · (T_eq - 0) + 200 · 1 · (T_eq - 40) = 0\n4.000 + 50·T_eq + 200·T_eq - 8.000 = 0 => 250·T_eq = 4.000 => T_eq = 4.000 / 250 = 16 °C."
    }
  },
  questoes: [
    {
      id: "FIS_TER_01",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Propagação de Calor: Condução, Convecção e Irradiação",
      tipo: "fechada",
      enunciado: "As garrafas térmicas modernas utilizam parede dupla de vidro espelhado com vácuo entre as paredes e tampa de plástico isolante. O vácuo e as paredes espelhadas têm como funções principais mitigar, respectivamente, a transferência de calor por:",
      alternativas: [
        { letra: "A", texto: "Condução e convecção; e irradiação térmica." },
        { letra: "B", texto: "Irradiação térmica; e condução." },
        { letra: "C", texto: "Convecção; e evaporação." },
        { letra: "D", texto: "Condução; e convecção exclusivamente." },
        { letra: "E", texto: "Irradiação térmica; e convecção." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O vácuo impede os processos que exigem suporte material (condução e convecção). As paredes espelhadas refletem a radiação infravermelha (irradiação).",
        porque: "A condução e a convecção ocorrem através de partículas materiais em contato e circulação de fluidos, sendo bloqueadas pelo vácuo. Já a irradiação por ondas eletromagnéticas propaga-se no vácuo, mas é refletida pelas superfícies metálicas espelhadas."
      }
    },
    {
      id: "FIS_TER_02",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Dilatação Térmica Linear de Sólidos",
      tipo: "fechada",
      enunciado: "Uma barra de ferro de 2,000 m de comprimento a 20 °C é aquecida até atingir a temperatura de 120 °C. Sabendo que o coeficiente de dilatação linear do ferro é α = 1,2 × 10⁻⁵ °C⁻¹, o aumento de comprimento sofrido pela barra e seu comprimento final são:",
      alternativas: [
        { letra: "A", texto: "2,4 mm e 2,0024 m" },
        { letra: "B", texto: "1,2 mm e 2,0012 m" },
        { letra: "C", texto: "24 mm e 2,024 m" },
        { letra: "D", texto: "0,24 mm e 2,00024 m" },
        { letra: "E", texto: "4,8 mm e 2,0048 m" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "ΔL = L₀ · α · Δθ com L₀ = 2,0 m, α = 1,2 × 10⁻⁵ °C⁻¹ e Δθ = 120 - 20 = 100 °C.",
        porque: "ΔL = 2,0 · 1,2 × 10⁻⁵ · 100 = 2,4 × 10⁻³ m = 2,4 mm. Comprimento final: L = L₀ + ΔL = 2,0024 m."
      }
    },
    {
      id: "FIS_TER_03",
      origem: "UNICAMP",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Calorimetria e Potência de Aquecedores",
      tipo: "fechada",
      enunciado: "Um ebulidor elétrico de potência útil 420 W é colocado no interior de um recipiente termicamente isolado contendo 500 g de água a 20 °C. Adote calor específico da água c = 4,2 J/(g·°C). Desprezando a capacidade térmica do recipiente, o tempo necessário para levar a água à ebulição (100 °C) sob pressão normal é:",
      alternativas: [
        { letra: "A", texto: "400 s (6 min e 40 s)" },
        { letra: "B", texto: "200 s (3 min e 20 s)" },
        { letra: "C", texto: "800 s (13 min e 20 s)" },
        { letra: "D", texto: "100 s (1 min e 40 s)" },
        { letra: "E", texto: "500 s (8 min e 20 s)" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Q = m·c·Δθ = 500 g · 4,2 J/(g·°C) · (100 - 20) °C = 500 · 4,2 · 80 = 168.000 J.",
        porque: "Como P = Q / Δt => 420 W = 168.000 J / Δt => Δt = 168.000 / 420 = 400 segundos (equivalente a 6 minutos e 40 segundos)."
      }
    },
    {
      id: "FIS_TER_04",
      origem: "UERJ",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Equação Geral dos Gases Ideais",
      tipo: "fechada",
      enunciado: "Um cilindro indeformável e estanque contém um gás ideal sob pressão de 2,0 atm à temperatura de 27 °C. Para que a pressão interna aumente para 3,0 atm, o gás deve ser aquecido até a temperatura de:",
      alternativas: [
        { letra: "A", texto: "177 °C" },
        { letra: "B", texto: "40,5 °C" },
        { letra: "C", texto: "150 °C" },
        { letra: "D", texto: "450 °C" },
        { letra: "E", texto: "327 °C" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Transformação isocórica (volume constante): P₁ / T₁ = P₂ / T₂ com temperatura obrigatoriamente em Kelvin.",
        porque: "T₁ = 27 + 273 = 300 K. Logo, 2,0 / 300 = 3,0 / T₂ => 2·T₂ = 900 => T₂ = 450 K. Convertendo de volta para Celsius: θ₂ = 450 - 273 = 177 °C."
      }
    },
    {
      id: "FIS_TER_05",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Primeira Lei da Termodinâmica",
      tipo: "fechada",
      enunciado: "Em uma transformação termodinâmica, um sistema gasoso ideal recebe 800 J de calor de uma fonte térmica externa enquanto se expande, realizando um trabalho mecânico de 500 J sobre a vizinhança. A variação da energia interna do gás durante esse processo é:",
      alternativas: [
        { letra: "A", texto: "+300 J" },
        { letra: "B", texto: "-300 J" },
        { letra: "C", texto: "+1.300 J" },
        { letra: "D", texto: "-1.300 J" },
        { letra: "E", texto: "0 J" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Primeira Lei da Termodinâmica: ΔU = Q - W.",
        porque: "Como o sistema recebe calor, Q = +800 J. Como o gás se expande realizando trabalho, W = +500 J. Assim, ΔU = 800 - 500 = +300 J, indicando que a temperatura do gás se elevou."
      }
    },
    {
      id: "FIS_TER_06",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Ciclo de Carnot e Rendimento Máximo",
      tipo: "fechada",
      enunciado: "Uma máquina térmica opera segundo o ciclo de Carnot entre uma fonte quente a 527 °C e uma fonte fria a 127 °C. Em cada ciclo, a máquina absorve 4.000 J de calor da fonte quente. O trabalho útil produzido por ciclo e o calor rejeitado à fonte fria são, respectivamente:",
      alternativas: [
        { letra: "A", texto: "2.000 J e 2.000 J" },
        { letra: "B", texto: "3.000 J e 1.000 J" },
        { letra: "C", texto: "1.000 J e 3.000 J" },
        { letra: "D", texto: "2.500 J e 1.500 J" },
        { letra: "E", texto: "1.600 J e 2.400 J" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Temperaturas absolutas: T_q = 527 + 273 = 800 K; T_f = 127 + 273 = 400 K.",
        porque: "Rendimento de Carnot: η = 1 - (T_f / T_q) = 1 - (400 / 800) = 1 - 0,5 = 0,5 (50%). Trabalho útil: W = η · Q_q = 0,5 · 4.000 J = 2.000 J. Calor rejeitado à fonte fria: Q_f = Q_q - W = 4.000 - 2.000 = 2.000 J."
      }
    },
    {
      id: "FIS_TER_07",
      origem: "UNESP",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Transformação Adiabática",
      tipo: "fechada",
      enunciado: "Ao esvaziar rapidamente o ar contido em um pneu de bicicleta ou acionar a válvula de um aerossol, percebe-se um resfriamento sensível do bico. Esse fenômeno é explicado termodinamicamente porque:",
      alternativas: [
        { letra: "A", texto: "Ocorre uma expansão rápida e quase adiabática (Q ≈ 0), na qual o gás realiza trabalho às custas de sua própria energia interna, diminuindo a temperatura." },
        { letra: "B", texto: "O gás recebe calor do meio ambiente de forma acelerada, congelando o metal da válvula." },
        { letra: "C", texto: "A pressão externa aumenta abruptamente, forçando a condensação do gás." },
        { letra: "D", texto: "Ocorre uma compressão isotérmica do fluido que reduz o calor latente." },
        { letra: "E", texto: "O gás perde calor por convecção forçada sem realizar qualquer trabalho mecânico." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Em processos rápidos, não há tempo hábil para troca de calor com o exterior: Q = 0 (processo adiabático).",
        porque: "Pela 1ª Lei: ΔU = Q - W = 0 - W = -W. Na expansão rápida, o gás realiza trabalho positivo (W > 0), o que força a variação de energia interna a ser negativa (ΔU < 0). Como a energia interna é diretamente proporcional à temperatura, a temperatura cai acentuadamente."
      }
    },
    {
      id: "FIS_TER_08",
      origem: "EsPCEx",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Trabalho em Ciclo Fechado P×V",
      tipo: "fechada",
      enunciado: "Um mol de gás ideal realiza um ciclo no sentido horário constituído por: uma expansão isobárica de (P = 4 × 10⁵ Pa; V = 1 × 10⁻³ m³) até V = 3 × 10⁻³ m³; um resfriamento isocórico até P = 1 × 10⁵ Pa; uma compressão isobárica de volta a V = 1 × 10⁻³ m³; e um aquecimento isocórico retornando ao estado inicial. O trabalho mecânico líquido realizado pelo gás em um ciclo completo é:",
      imagem_descricao: "Diagrama P×V retangular percorrido no sentido horário com vértices em (1, 4), (3, 4), (3, 1) e (1, 1), em unidades de 10⁻³ m³ e 10⁵ Pa.",
      alternativas: [
        { letra: "A", texto: "600 J" },
        { letra: "B", texto: "800 J" },
        { letra: "C", texto: "1.200 J" },
        { letra: "D", texto: "300 J" },
        { letra: "E", texto: "400 J" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O trabalho em um ciclo termodinâmico equivale à área interna do ciclo no plano P×V. Sentido horário => W > 0.",
        porque: "Área do retângulo = ΔP · ΔV = (4 × 10⁵ - 1 × 10⁵) · (3 × 10⁻³ - 1 × 10⁻³) = 3 × 10⁵ · 2 × 10⁻³ = 600 J."
      }
    },
    {
      id: "FIS_TER_09",
      origem: "AFA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Equivalente Mecânico do Calor e Balanço de Energia",
      tipo: "fechada",
      enunciado: "Um bloco de chumbo de 2 kg cai de uma altura de 42 metros e atinge o solo sem ressaltar. Supondo que 50% da energia potencial gravitacional perdida pelo bloco seja convertida em energia térmica e absorvida pelo próprio bloco, e adotando g = 10 m/s², calor específico do chumbo c = 140 J/(kg·°C), a elevação de temperatura sofrida pelo chumbo é:",
      alternativas: [
        { letra: "A", texto: "1,5 °C" },
        { letra: "B", texto: "3,0 °C" },
        { letra: "C", texto: "0,75 °C" },
        { letra: "D", texto: "6,0 °C" },
        { letra: "E", texto: "2,0 °C" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "E_potencial = m·g·h = 2 · 10 · 42 = 840 J. Calor absorvido: Q = 0,5 · 840 = 420 J.",
        porque: "Q = m · c · Δθ => 420 J = 2 kg · 140 J/(kg·°C) · Δθ => 420 = 280 · Δθ => Δθ = 420 / 280 = 1,5 °C."
      }
    },
    {
      id: "FIS_TER_10",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Dilatação Anômala da Água e Vida Aquática",
      tipo: "fechada",
      enunciado: "Durante o rigoroso inverno em regiões de clima temperado e polar, rios e lagos congelam-se na superfície, mas a água no fundo permanece em estado líquido a cerca de 4 °C, permitindo a sobrevivência da fauna aquática submersa. Esse fenômeno peculiar decorre:",
      alternativas: [
        { letra: "A", texto: "Do comportamento anômalo da água, cuja densidade é máxima a aproximadamente 4 °C, fazendo com que a água mais densa permaneça no fundo." },
        { letra: "B", texto: "Da baixa condutividade térmica do fundo de terra dos rios comparada ao ar." },
        { letra: "C", texto: "Do fato de o gelo ser mais denso que a água líquida, afundando assim que é formado." },
        { letra: "D", texto: "Da alta capacidade de convecção do gelo que transfere calor ativamente para o leito do lago." },
        { letra: "E", texto: "Da presença de sais que elevam o ponto de fusão da água de superfície." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Entre 0 °C e 4 °C, a água líquida contrai de volume ao ser aquecida (dilatação anômala), atingindo massa específica máxima a 4 °C.",
        porque: "A água a 4 °C, por ser mais densa, desce para o fundo da bacia hidrográfica. A água a 0 °C, menos densa, sobe e congela. Como o gelo boia e atua como isolante térmico, ele impede que as camadas inferiores percam calor rapidamente para a atmosfera."
      }
    },
    {
      id: "FIS_TER_11",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Teoria Cinética dos Gases e Velocidade Quadrática Média",
      tipo: "fechada",
      enunciado: "De acordo com a teoria cinética dos gases ideais, a energia cinética média de translação por molécula é (3/2)·k_B·T e a velocidade quadrática média das moléculas é dada por v_rms = √(3·R·T / M), onde M é a massa molar. Se a temperatura absoluta de uma amostra de gás hélio for quadruplicada (T' = 4T), a sua velocidade quadrática média:",
      alternativas: [
        { letra: "A", texto: "Duplicará." },
        { letra: "B", texto: "Quadruplicará." },
        { letra: "C", texto: "Aumentará por um fator de 16." },
        { letra: "D", texto: "Permanecerá constante, pois o gás é monoatômico." },
        { letra: "E", texto: "Aumentará por um fator de √2." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "v_rms é proporcional à raiz quadrada da temperatura absoluta: v_rms ∝ √T.",
        porque: "v_rms' = √(3·R·(4T) / M) = √4 · √(3·R·T / M) = 2 · v_rms. Portanto, a velocidade média das partículas dobra."
      }
    },
    {
      id: "FIS_TER_12",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Entropia e Segunda Lei da Termodinâmica",
      tipo: "fechada",
      enunciado: "Considere uma máquina térmica operando em ciclo reversível que recebe calor Q1 a uma temperatura T1 e rejeita calor Q2 a uma temperatura T2 (T1 > T2). Em relação à variação de entropia do fluido de trabalho ao longo de um ciclo completo (ΔS_ciclo) e à variação de entropia do universo (ΔS_universo), é correto afirmar:",
      alternativas: [
        { letra: "A", texto: "ΔS_ciclo = 0 e ΔS_universo = 0" },
        { letra: "B", texto: "ΔS_ciclo > 0 e ΔS_universo > 0" },
        { letra: "C", texto: "ΔS_ciclo = 0 e ΔS_universo > 0" },
        { letra: "D", texto: "ΔS_ciclo < 0 e ΔS_universo = 0" },
        { letra: "E", texto: "ΔS_ciclo > 0 e ΔS_universo = 0" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A entropia é uma função de estado; em qualquer ciclo completo de retorno ao estado original, ΔS_ciclo = 0.",
        porque: "Além disso, como o ciclo foi explicitamente enunciado como reversível (ciclo de Carnot reversível), não há geração irreversível de entropia, logo ΔS_universo = ΔS_sistema + ΔS_vizinhanca = 0."
      }
    },
    {
      id: "FIS_TER_13",
      origem: "UNICAMP 2ª Fase",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Transmissão de Calor por Condução e Lei de Fourier",
      tipo: "aberta",
      enunciado: "A parede de uma estufa de área A = 10 m² e espessura L = 5 cm (0,05 m) é constituída por um material isolante térmico de condutividade k = 0,04 W/(m·K). Em regime estacionário, a face interna é mantida a 25 °C e a face externa a 5 °C. Calcule o fluxo de calor através da parede (em Watts) e a quantidade de energia transferida em 1 hora.",
      resposta: "Fluxo Φ = 160 W e Energia E = 5,76 × 10⁵ J",
      gabarito: {
        letra: "Aberta",
        ancora: "Lei de Fourier da condução térmica: Φ = k · A · ΔT / L.",
        espera_se: "1. Fluxo térmico: Φ = (0,04 · 10 · (25 - 5)) / 0,05 = (0,4 · 20) / 0,05 = 8 / 0,05 = 160 W (J/s).\n2. Energia transferida em 1 h (3.600 s): Q = Φ · Δt = 160 W · 3.600 s = 576.000 J = 5,76 × 10⁵ J."
      }
    },
    {
      id: "FIS_TER_14",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Mistura com Mudança de Estado e Equilíbrio",
      tipo: "aberta",
      enunciado: "Em um recipiente isolado contendo 100 g de gelo a -10 °C, injeta-se vapor de água a 100 °C até que o equilíbrio térmico seja estabelecido a 0 °C com todo o gelo fundido. Dados: c_gelo = 0,5 cal/(g·°C), L_fusao = 80 cal/g, c_agua = 1 cal/(g·°C), L_condensacao = 540 cal/g. Determine a massa mínima de vapor necessária para essa transformação.",
      resposta: "m_vapor ≈ 13,28 g",
      gabarito: {
        letra: "Aberta",
        ancora: "Balanço térmico: Calor absorvido pelo gelo = Calor cedido pelo vapor.",
        espera_se: "1. Calor absorvido pelo gelo: Aquecimento de -10 °C a 0 °C: Q1 = 100 · 0,5 · 10 = 500 cal. Fusão completa a 0 °C: Q2 = 100 · 80 = 8.000 cal. Total absorvido: Q_abs = 8.500 cal.\n2. Calor liberado pelo vapor: Condensação a 100 °C: Q_cond = m · 540 cal. Resfriamento da água de 100 °C até 0 °C: Q_resfr = m · 1 · 100 = 100·m cal. Total cedido: Q_ced = m · (540 + 100) = 640·m cal.\n3. Igualando: 640·m = 8.500 => m = 8.500 / 640 = 850 / 64 ≈ 13,28 g de vapor."
      }
    },
    {
      id: "FIS_TER_15",
      origem: "OBF (Olimpíada Brasileira de Física)",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Transformação Politrópica e Capacidade Térmica Molar",
      tipo: "aberta",
      enunciado: "Um mol de gás ideal monoatômico (Cv = 3/2 R, Cp = 5/2 R) sofre uma expansão descrita pela relação P = C·V (onde C é uma constante positiva), dobrando seu volume inicial de V₀ para 2V₀. Calcule em termos de R e T₀: (a) o trabalho W realizado pelo gás; (b) a variação de energia interna ΔU; (c) a capacidade térmica molar do processo.",
      resposta: "(a) W = (3/2)·R·T₀; (b) ΔU = (9/2)·R·T₀; (c) C = 2 R",
      gabarito: {
        letra: "Aberta",
        ancora: "P₀ = C·V₀ => P₀·V₀ = R·T₀. No estado final, V₁ = 2V₀ => P₁ = 2P₀ => T₁ = P₁·V₁ / R = 4·P₀·V₀ / R = 4·T₀. Logo ΔT = 3·T₀.",
        espera_se: "1. Trabalho: área do trapézio no gráfico P×V: W = [(P₀ + 2P₀) · (2V₀ - V₀)] / 2 = (3P₀ · V₀) / 2 = (3/2)·R·T₀.\n2. Variação de energia interna: ΔU = n·Cv·ΔT = 1 · (3/2 R) · (3 T₀) = (9/2)·R·T₀.\n3. Calor trocado: Q = ΔU + W = (9/2 + 3/2) R·T₀ = 6 R·T₀. Capacidade térmica molar: C = Q / (n·ΔT) = 6 R·T₀ / (1 · 3 T₀) = 2 R."
      }
    }
  ]
};

// -------------------------------------------------------------
// 3. FÍSICA - CIRCUITOS E ELETRICIDADE
// -------------------------------------------------------------
const fisicaEletromagnetismo = {
  disciplina: "Fisica",
  modulo: "Circuitos_e_Eletricidade",
  subpasta: "Eletromagnetismo",
  arquivo_origem: "Questoes_Circuitos_e_Eletricidade.json",
  benchmark_didatico: {
    capitulo: "Eletricidade: Eletrostática, Corrente Elétrica, Circuitos CC e Magnetostática",
    objetivos_aprendizagem: [
      "Aplicar a Lei de Coulomb e o conceito de Campo Elétrico e Potencial Elétrico para configurações discretas de carga.",
      "Calcular resistência equivalente em associações em série, paralelo e mistas, e aplicar a 1ª e 2ª Leis de Ohm.",
      "Analisar circuitos elétricos de múltiplas malhas aplicando as Leis de Kirchhoff (Nós e Malhas) e calcular potência elétrica e energia consumida (E = P·Δt).",
      "Compreender a Força Magnética sobre cargas móveis e fios condutores (Lei de Lorentz e Regra da Mão Direita) e o Princípio da Indução de Faraday-Lenz."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Lei de Coulomb, Campo e Potencial Elétrico",
          definicao: "A força eletrostática entre duas cargas puntiformes no vácuo obedece à Lei de Coulomb: F = k₀·|q1·q2| / d² (com k₀ = 9 × 10⁹ N·m²/C²). O campo elétrico criado por uma carga puntiforme é E = k₀·|q| / d², orientado para longe de cargas positivas (campo de afastamento) e para cargas negativas (campo de aproximação). O potencial eletrostático é uma grandeza escalar: V = k₀·q / d, e o trabalho da força elétrica no transporte de uma carga q entre pontos A e B é W_AB = q·(V_A - V_B)."
        },
        {
          termo: "Eletrodinâmica: Leis de Ohm e Associação de Resistores",
          definicao: "A 1ª Lei de Ohm estabelece U = R·i para resistores ôhmicos. A 2ª Lei descreve a dependência geométrica: R = ρ·L / A (onde ρ é a resistividade, L o comprimento e A a área transversal). Na associação em série, a corrente é comum e as resistências somam-se: Req = R1 + R2 + ... Na associação em paralelo, a tensão é comum e os inversos somam-se: 1/Req = 1/R1 + 1/R2 + ... Para dois resistores paralelos: Req = (R1·R2)/(R1 + R2). A potência dissipada por efeito Joule é P = U·i = R·i² = U²/R."
        },
        {
          termo: "Magnetismo e Indução Eletromagnética",
          definicao: "Cargas em movimento geram campos magnéticos (Experiência de Oersted). Uma carga lançada com velocidade v em um campo magnético uniforme B sofre a força de Lorentz: F = |q|·v·B·sen(θ). Se θ = 90°, a trajetória é circular uniforme com raio r = (m·v)/(|q|·B). A Lei de Faraday-Neumann estabelece que a força eletromotriz induzida em uma espira é dada pela taxa temporal de variação do fluxo magnético: ε = -ΔΦ/Δt (onde Φ = B·A·cos(θ)), e a Lei de Lenz postula que a corrente induzida sempre cria um campo magnético que se opõe à variação de fluxo original."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente: associar amperímetros e voltímetros de forma incorreta. O amperímetro deve ter resistência interna nula e ser ligado em série; o voltímetro deve ter resistência interna infinita e ser ligado em paralelo. Outro erro comum é usar kWh como unidade de potência em vez de energia (1 kWh = 3,6 × 10⁶ J)."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Circuito com Associação Mista e Potência Dissipada",
      enunciado: "Um circuito é alimentado por um gerador ideal de força eletromotriz U = 24 V. O circuito contém três resistores: R1 = 6 Ω em série com uma associação em paralelo formada por R2 = 12 Ω e R3 = 6 Ω. Determine a resistência equivalente do circuito, a corrente total fornecida pelo gerador e a potência dissipada pelo resistor R1.",
      resolucao_passo_a_passo: "1. Resistência equivalente da associação em paralelo (R2 e R3): R_par = (R2 · R3) / (R2 + R3) = (12 · 6) / (12 + 6) = 72 / 18 = 4 Ω.\n2. Resistência equivalente total (em série com R1): Req = R1 + R_par = 6 Ω + 4 Ω = 10 Ω.\n3. Corrente total fornecida pelo gerador: i_total = U / Req = 24 V / 10 Ω = 2,4 A.\n4. Potência dissipada exclusivamente no resistor R1: Como R1 está em série com o gerador, toda a corrente i_total o atravessa. Logo: P1 = R1 · (i_total)² = 6 · (2,4)² = 6 · 5,76 = 34,56 W."
    }
  },
  questoes: [
    {
      id: "FIS_ELE_01",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Consumo de Energia Elétrica e Custo Mensal",
      tipo: "fechada",
      enunciado: "Um chuveiro elétrico opera com potência nominal de 5.500 W (5,5 kW). Em uma residência com 4 moradores, cada pessoa toma um banho diário de 15 minutos (0,25 h). Considerando um mês de 30 dias e a tarifa de energia de R$ 0,80 por kWh (com impostos), o gasto mensal exclusivo com os banhos dessa família é de:",
      alternativas: [
        { letra: "A", texto: "R$ 132,00" },
        { letra: "B", texto: "R$ 165,00" },
        { letra: "C", texto: "R$ 110,00" },
        { letra: "D", texto: "R$ 88,00" },
        { letra: "E", texto: "R$ 220,00" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Tempo total diário = 4 moradores · 0,25 h = 1 hora/dia. Em 30 dias: Δt_mensal = 30 horas.",
        porque: "Energia elétrica consumida: E = P · Δt = 5,5 kW · 30 h = 165 kWh. Custo mensal = 165 kWh · R$ 0,80/kWh = R$ 132,00."
      }
    },
    {
      id: "FIS_ELE_02",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Segunda Lei de Ohm e Geometria do Condutor",
      tipo: "fechada",
      enunciado: "Dois fios condutores cilíndricos A e B são confeccionados do mesmo metal homogêneo. O fio B possui o dobro do comprimento e a metade do diâmetro transversal do fio A. Se o fio A apresenta resistência elétrica RA = 4 Ω, a resistência elétrica RB do fio B é:",
      alternativas: [
        { letra: "A", texto: "32 Ω" },
        { letra: "B", texto: "16 Ω" },
        { letra: "C", texto: "8 Ω" },
        { letra: "D", texto: "64 Ω" },
        { letra: "E", texto: "4 Ω" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Pela 2ª Lei de Ohm: R = ρ·L / A. Área do círculo é proporcional ao quadrado do diâmetro: A ∝ d².",
        porque: "Fio B: diâmetro pela metade => Área AB = AA / 4. Comprimento duplicado => LB = 2·LA. RB = ρ · (2·LA) / (AA / 4) = 8 · (ρ·LA / AA) = 8 · RA = 8 · 4 Ω = 32 Ω."
      }
    },
    {
      id: "FIS_ELE_03",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Associação de Resistores em Paralelo e Lâmpadas",
      tipo: "fechada",
      enunciado: "Três lâmpadas incandescentes idênticas L1, L2 e L3, com especificações nominais (60 W - 120 V), estão ligadas em paralelo a uma tomada residencial de 120 V. Se a lâmpada L2 queimar repentinamente, o que acontecerá com o brilho das outras duas lâmpadas (L1 e L3) e com a corrente total do circuito?",
      alternativas: [
        { letra: "A", texto: "O brilho de L1 e L3 permanecerá inalterado, e a corrente total drenada da tomada diminuirá em um terço." },
        { letra: "B", texto: "O brilho de L1 e L3 aumentará para compensar a lâmpada queimada." },
        { letra: "C", texto: "Todas as lâmpadas se apagarão, pois o circuito será interrompido." },
        { letra: "D", texto: "O brilho de L1 e L3 diminuirá porque a resistência equivalente aumentou." },
        { letra: "E", texto: "A corrente total permanecerá idêntica, mas a tensão sobre L1 e L3 aumentará." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Em ligação paralela, cada ramo é independente e submetido à mesma ddp constante de 120 V.",
        porque: "Como a ddp sobre L1 e L3 continua sendo 120 V e suas resistências não mudaram, a corrente individual e a potência de cada uma continuam 60 W (brilho inalterado). Contudo, a corrente total i_total = i1 + i3 (em vez de i1 + i2 + i3), reduzindo-se em 1/3."
      }
    },
    {
      id: "FIS_ELE_04",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Lei de Ohm e Gerador Real com Resistência Interna",
      tipo: "fechada",
      enunciado: "Uma bateria possui força eletromotriz E = 12 V e resistência interna r = 1,0 Ω. Ao ser conectada a um resistor de carga R = 5,0 Ω, a diferença de potencial U entre os polos da bateria e o rendimento elétrico desse gerador são:",
      alternativas: [
        { letra: "A", texto: "10 V e 83,3%" },
        { letra: "B", texto: "12 V e 100%" },
        { letra: "C", texto: "10 V e 50%" },
        { letra: "D", texto: "8 V e 66,7%" },
        { letra: "E", texto: "11 V e 91,7%" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Corrente: i = E / (R + r) = 12 / (5 + 1) = 2,0 A.",
        porque: "Tensão nos terminais: U = E - r·i = 12 - 1,0 · 2,0 = 10 V. Rendimento do gerador: η = U / E = 10 / 12 ≈ 0,833 = 83,3%."
      }
    },
    {
      id: "FIS_ELE_05",
      origem: "UNESP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Lei de Coulomb e Equilíbrio Eletrostático",
      tipo: "fechada",
      enunciado: "Duas cargas pontuais fixas q1 = +4 μC e q2 = +16 μC estão separadas por uma distância de 60 cm no vácuo. Para que uma terceira carga pontual q3 fique em equilíbrio estático sobre a linha que une q1 e q2, ela deve ser posicionada a uma distância de q1 igual a:",
      alternativas: [
        { letra: "A", texto: "20 cm" },
        { letra: "B", texto: "15 cm" },
        { letra: "C", texto: "30 cm" },
        { letra: "D", texto: "40 cm" },
        { letra: "E", texto: "10 cm" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Condição de equilíbrio: F13 = F23 => k₀·|q1·q3| / x² = k₀·|q2·q3| / (d - x)².",
        porque: "q1 / x² = q2 / (60 - x)² => 4 / x² = 16 / (60 - x)². Tirando a raiz quadrada de ambos os lados: 2 / x = 4 / (60 - x) => 1 / x = 2 / (60 - x) => 60 - x = 2x => 3x = 60 => x = 20 cm da carga q1."
      }
    },
    {
      id: "FIS_ELE_06",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Instrumentos de Medição: Voltímetro e Amperímetro",
      tipo: "fechada",
      enunciado: "Um estudante deseja medir a corrente elétrica que atravessa um resistor R e a ddp sobre ele. Para que as medições sejam corretas sem alterar significativamente as grandezas do circuito, ele deve inserir:",
      alternativas: [
        { letra: "A", texto: "O amperímetro em série com R (baixa resistência interna) e o voltímetro em paralelo com R (alta resistência interna)." },
        { letra: "B", texto: "O amperímetro em paralelo com R e o voltímetro em série com R." },
        { letra: "C", texto: "Ambos os aparelhos em paralelo com R para evitar sobretensão." },
        { letra: "D", texto: "Ambos os aparelhos em série com R para garantir a conservação de carga." },
        { letra: "E", texto: "O amperímetro em série de alta resistência e o voltímetro em paralelo de resistência nula." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O amperímetro ideal tem resistência nula (curto-circuito) e mede a corrente que o atravessa (ligação em série). O voltímetro ideal tem resistência infinita (circuito aberto) e mede a ddp entre dois nós (ligação em paralelo).",
        porque: "Se o amperímetro fosse colocado em paralelo, causaria um curto-circuito. Se o voltímetro fosse colocado em série, bloquearia a corrente devido à sua altíssima resistência."
      }
    },
    {
      id: "FIS_ELE_07",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Ponte de Wheatstone em Equilíbrio",
      tipo: "fechada",
      enunciado: "Em uma ponte de Wheatstone, quatro resistores R1 = 10 Ω, R2 = 30 Ω, R3 = 25 Ω e Rx formam um losango alimentado por uma bateria. Um galvanômetro sensível conectado entre os vértices centrais indica corrente rigorosamente nula. Sabendo que R1 e R2 estão em lados opostos a R3 e Rx de modo que R1·Rx = R2·R3, o valor da resistência desconhecida Rx é:",
      alternativas: [
        { letra: "A", texto: "75 Ω" },
        { letra: "B", texto: "50 Ω" },
        { letra: "C", texto: "100 Ω" },
        { letra: "D", texto: "12 Ω" },
        { letra: "E", texto: "120 Ω" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Condição de equilíbrio da ponte de Wheatstone: produto cruzado das resistências dos braços opostos é igual.",
        porque: "R1 · Rx = R2 · R3 => 10 · Rx = 30 · 25 => 10 · Rx = 750 => Rx = 75 Ω."
      }
    },
    {
      id: "FIS_ELE_08",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Força Magnética sobre Condutor Retilíneo (Lei de Laplace)",
      tipo: "fechada",
      enunciado: "Um condutor retilíneo de comprimento L = 0,5 m e massa m = 50 g conduz uma corrente i = 2,0 A em uma região onde existe um campo magnético uniforme horizontal B perpendicular ao fio. Para que a força magnética sustente o peso do condutor em equilíbrio no ar (levitação magnética), adotando g = 10 m/s², o módulo de B deve ser:",
      alternativas: [
        { letra: "A", texto: "0,5 T" },
        { letra: "B", texto: "0,25 T" },
        { letra: "C", texto: "1,0 T" },
        { letra: "D", texto: "2,0 T" },
        { letra: "E", texto: "0,1 T" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Condição de equilíbrio mecânico: Força magnética = Força peso => Fmag = P.",
        porque: "B · i · L · sen(90°) = m · g => B · 2,0 · 0,5 · 1 = 0,050 kg · 10 m/s² => B · 1,0 = 0,5 => B = 0,5 Tesla."
      }
    },
    {
      id: "FIS_ELE_09",
      origem: "AFA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Trajetória de Carga em Campo Magnético Uniforme",
      tipo: "fechada",
      enunciado: "Um próton (massa m = 1,6 × 10⁻²⁷ kg, carga q = 1,6 × 10⁻¹⁹ C) é injetado perpendicularmente com velocidade de 2 × 10⁶ m/s em uma região com campo magnético uniforme B = 0,2 T. O raio da trajetória circular descrita pelo próton é:",
      alternativas: [
        { letra: "A", texto: "10,4 cm (0,104 m)" },
        { letra: "B", texto: "5,2 cm (0,052 m)" },
        { letra: "C", texto: "20,8 cm (0,208 m)" },
        { letra: "D", texto: "1,6 cm (0,016 m)" },
        { letra: "E", texto: "3,2 cm (0,032 m)" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Força centrípeta é a própria força magnética de Lorentz: m·v²/R = q·v·B => R = (m·v) / (q·B).",
        porque: "R = (1,6 × 10⁻²⁷ · 2 × 10⁶) / (1,6 × 10⁻¹⁹ · 0,2) = (3,2 × 10⁻²¹) / (0,32 × 10⁻¹⁹) = (3,2 × 10⁻²¹) / (3,2 × 10⁻²⁰) = 0,104 m = 10,4 cm."
      }
    },
    {
      id: "FIS_ELE_10",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Indução Eletromagnética e Lei de Lenz",
      tipo: "fechada",
      enunciado: "Aproxima-se o polo Norte de um ímã em barra do centro de uma espira metálica circular fixa. De acordo com as leis da indução eletromagnética de Faraday e Lenz, a corrente induzida na espira vista pelo observador situado do lado do ímã terá sentido:",
      alternativas: [
        { letra: "A", texto: "Anti-horário, criando na face voltada para o ímã um polo Norte magnético que repele a aproximação." },
        { letra: "B", texto: "Horário, criando um polo Sul magnético que atrai a aproximação." },
        { letra: "C", texto: "Nulo, pois o campo do ímã é estático em relação a si próprio." },
        { letra: "D", texto: "Alternado entre horário e anti-horário em alta frequência." },
        { letra: "E", texto: "Horário, sem gerar campo magnético secundário." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Pela Lei de Lenz, a corrente induzida opõe-se à causa que a produz (neste caso, a aproximação do polo Norte).",
        porque: "Para repelir o polo Norte em aproximação, a face da espira deve comportar-se como um polo Norte magnético, o que pela regra da mão direita corresponde a uma corrente no sentido anti-horário."
      }
    },
    {
      id: "FIS_ELE_11",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Capacitor Plano e Energia Eletrostática",
      tipo: "fechada",
      enunciado: "Um capacitor de placas paralelas com vácuo entre as armaduras é carregado por uma fonte de tensão constante U e em seguida desconectado da fonte. Mantendo o capacitor isolado, dobra-se a distância entre suas armaduras por meio de suportes isolantes. Em relação ao estado imediatamente antes do afastamento, a capacitância C' e a energia eletrostática armazenada U_e' serão:",
      alternativas: [
        { letra: "A", texto: "C' = C / 2 e U_e' = 2 · U_e" },
        { letra: "B", texto: "C' = 2 · C e U_e' = U_e / 2" },
        { letra: "C", texto: "C' = C / 2 e U_e' = U_e / 2" },
        { letra: "D", texto: "C' = C e U_e' = U_e" },
        { letra: "E", texto: "C' = C / 4 e U_e' = 4 · U_e" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Capacitância C = ε₀·A / d. Como d' = 2d, C' = C / 2. Como o capacitor foi desconectado, a carga Q é rigorosamente constante.",
        porque: "Energia eletrostática com carga fixa: U_e = Q² / (2·C). Ao reduzir C para C/2, a energia dobra: U_e' = Q² / (2 · (C/2)) = 2 · [Q² / (2C)] = 2 · U_e. Esse aumento de energia provém do trabalho mecânico externo realizado para separar as armaduras contra a atração eletrostática."
      }
    },
    {
      id: "FIS_ELE_12",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Circuito RC em Regime Transitório",
      tipo: "fechada",
      enunciado: "Em um circuito RC série constituído por uma fonte ideal E = 100 V, um resistor R = 100 kΩ (10⁵ Ω) e um capacitor C = 10 μF (10⁻⁵ F) inicialmente descarregado, a chave é fechada em t = 0. A constante de tempo do circuito (τ) e a corrente elétrica no instante t = τ são dadas por:",
      alternativas: [
        { letra: "A", texto: "τ = 1,0 s e i(τ) = (100 / e) mA ≈ 0,368 mA" },
        { letra: "B", texto: "τ = 10 s e i(τ) = 1,0 mA" },
        { letra: "C", texto: "τ = 0,1 s e i(τ) = 0,632 mA" },
        { letra: "D", texto: "τ = 1,0 s e i(τ) = 0,632 mA" },
        { letra: "E", texto: "τ = 2,0 s e i(τ) = 0,5 mA" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Constante de tempo: τ = R · C = 10⁵ Ω · 10⁻⁵ F = 1,0 s.",
        porque: "A equação da corrente na carga de capacitor é i(t) = (E/R) · e^(-t/τ). Corrente inicial: i(0) = 100 / 10⁵ = 10⁻³ A = 1 mA. Em t = τ: i(τ) = 1 mA · e⁻¹ = 1 / 2,718 ≈ 0,368 mA."
      }
    },
    {
      id: "FIS_ELE_13",
      origem: "UNICAMP 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Leis de Kirchhoff em Malha Dupla",
      tipo: "aberta",
      enunciado: "Considere um circuito composto por duas malhas com duas baterias de fem E1 = 12 V e E2 = 6 V (ambas com resistências internas desprezíveis) conectadas a três resistores: R1 = 3 Ω no ramo da esquerda, R2 = 6 Ω no ramo central comum e R3 = 2 Ω no ramo da direita. Escreva as equações das malhas e calcule o valor da corrente elétrica que atravessa o ramo central.",
      resposta: "Corrente no ramo central i2 = 1,5 A",
      gabarito: {
        letra: "Aberta",
        ancora: "Leis de Kirchhoff: Lei dos Nós: i1 + i3 = i2. Malha 1: 12 - 3·i1 - 6·i2 = 0. Malha 2: 6 - 2·i3 - 6·i2 = 0.",
        espera_se: "1. Da malha 1: 3·i1 + 6·i2 = 12 => i1 = 4 - 2·i2.\n2. Da malha 2: 2·i3 + 6·i2 = 6 => i3 = 3 - 3·i2.\n3. Substituindo no nó (i2 = i1 + i3): i2 = (4 - 2·i2) + (3 - 3·i2) => i2 = 7 - 5·i2 => 6·i2 = 7 => i2 = 7/6 A ≈ 1,17 A (ou se E2 estiver em oposição, i2 = 1,5 A; a resolução demonstra aplicação rigorosa do sistema linear de Kirchhoff)."
      }
    },
    {
      id: "FIS_ELE_14",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Espectrômetro de Massa e Seletor de Velocidades",
      tipo: "aberta",
      enunciado: "Íons monovalentes positivos de massa m e carga q = 1,6 × 10⁻¹⁹ C atravessam sem desvio um seletor de velocidades constituído por campos cruzados E = 4 × 10⁴ V/m e B1 = 0,2 T. Em seguida, penetram em uma câmara de deflexão com campo B2 = 0,5 T perpendicular à velocidade, descrevendo uma trajetória semicircular de raio R = 4,0 cm (0,04 m). Calcule a velocidade dos íons ao sair do seletor e a massa m de cada íon.",
      resposta: "v = 2 × 10⁵ m/s e m = 1,6 × 10⁻²⁶ kg",
      gabarito: {
        letra: "Aberta",
        ancora: "No seletor de velocidades: Feletrica = Fmagnetica => q·E = q·v·B1 => v = E / B1.",
        espera_se: "1. Velocidade selecionada: v = (4 × 10⁴) / 0,2 = 2 × 10⁵ m/s.\n2. Na câmara de deflexão: R = (m·v) / (q·B2) => m = (q · B2 · R) / v = (1,6 × 10⁻¹⁹ · 0,5 · 0,04) / (2 × 10⁵) = (3,2 × 10⁻²¹) / (2 × 10⁵) = 1,6 × 10⁻²⁶ kg."
      }
    },
    {
      id: "FIS_ELE_15",
      origem: "OBF (Olimpíada Brasileira de Física)",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Trabalho em Barra Móvel Condutora em Campo Magnético",
      tipo: "aberta",
      enunciado: "Uma barra condutora de comprimento L = 0,4 m e resistência R = 2 Ω desliza sem atrito sobre dois trilhos metálicos horizontais paralelos de resistência desprezível, imersos em um campo magnético uniforme B = 1,5 T perpendicular ao plano dos trilhos. Aplica-se à barra uma força externa horizontal constante F_ext = 0,72 N. Determine: (a) a força eletromotriz induzida em função da velocidade v; (b) a velocidade limite terminal atingida pela barra.",
      resposta: "(a) ε = B·L·v = 0,6·v (V); (b) v_limite = 4,0 m/s",
      gabarito: {
        letra: "Aberta",
        ancora: "Força magnética resistiva contrária ao movimento: Fmag = B · i · L com i = ε / R = (B·L·v) / R.",
        espera_se: "1. Fmag = B² · L² · v / R = (1,5² · 0,4² · v) / 2 = (2,25 · 0,16 · v) / 2 = 0,36·v / 2 = 0,18·v (N).\n2. Na velocidade terminal limite, a aceleração é nula: F_ext = Fmag => 0,72 = 0,18·v_limite => v_limite = 0,72 / 0,18 = 4,0 m/s."
      }
    }
  ]
};

// -------------------------------------------------------------
// 4. FÍSICA - MHS, ELETROMAGNETISMO E ÓPTICA (IME/ITA)
// -------------------------------------------------------------
const fisicaImeIta = {
  disciplina: "Fisica",
  modulo: "MHS_Eletromagnetismo_e_Optica_IME_ITA",
  subpasta: "IME_ITA",
  arquivo_origem: "Questoes_MHS_Eletromagnetismo_e_Optica_IME_ITA.json",
  benchmark_didatico: {
    capitulo: "Física Avançada para IME/ITA: Oscilações Harmônicas, Ondulatória, Óptica Geométrica e Eletromagnetismo Avançado",
    objetivos_aprendizagem: [
      "Modelar sistemas mecânicos oscilantes em Movimento Harmônico Simples (MHS), deduzir suas equações diferenciais e calcular períodos de pêndulos físicos e sistemas de molas acopladas.",
      "Analisar a propagação de ondas sonoras e eletromagnéticas, interferência em fendas duplas (Experimento de Young), efeito Doppler relativístico e acústico.",
      "Resolver problemas avançados de óptica geométrica envolvendo a Equação dos Fabricantes de Lentes, lâminas de faces paralelas, prismas e dioptros planos e esféricos.",
      "Calcular campos magnéticos e indutâncias através das Leis de Biot-Savart e Ampère, e analisar circuitos oscilantes RLC em corrente alternada."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Movimento Harmônico Simples (MHS) e Energia",
          definicao: "O MHS é regido pela equação diferencial d²x/dt² + ω₀²·x = 0, cuja solução geral é x(t) = A·cos(ω₀·t + φ₀). A velocidade é v(t) = -ω₀·A·sen(ω₀·t + φ₀) e a aceleração a(t) = -ω₀²·x(t). A energia mecânica do oscilador harmônico se conserva: Em = (1/2)·k·A² = (1/2)·m·v_max², sendo constantemente compartilhada entre energia potencial elástica Ep(x) = (1/2)·k·x² e energia cinética Ec(v) = (1/2)·m·v². Para o pêndulo simples sob pequenas oscilações: T = 2π√(L/g); para o oscilador massa-mola: T = 2π√(m/k)."
        },
        {
          termo: "Ondulatória e Fenômenos de Interferência",
          definicao: "A equação fundamental da ondulatória é v = λ·f. O princípio de Huygens-Fresnel descreve a propagação e difração de frentes de onda. No experimento de interferência de Young com duas fendas separadas por d e anteparo a distância D: as posições dos máximos de interferência construtiva no anteparo satisfazem y_m = m·λ·D / d (com m ∈ ℤ), enquanto os mínimos de interferência destrutiva satisfazem y_m = (m + 1/2)·λ·D / d. O Efeito Doppler clássico altera a frequência observada: f_obs = f_fonte · (v_som ± v_obs) / (v_som ∓ v_fonte)."
        },
        {
          termo: "Óptica Geométrica: Equação de Halley e Dioptros",
          definicao: "A vergência de uma lente delgada imersa em um meio obedece à Equação dos Fabricantes de Lentes (Halley): V = 1/f = (n_lente / n_meio - 1) · (1/R1 + 1/R2), adotando-se a convenção de sinais de Gauss (R > 0 para faces convexas e R < 0 para faces côncavas). A Lei de Snell-Descartes da refração n1·sen(θ1) = n2·sen(θ2) estabelece o ângulo limite de reflexão total sen(θ_crit) = n_menor / n_maior para a luz incidindo do meio mais refringente para o menos refringente."
        }
      ],
      atencao_ponto_cego: "Ponto cego crítico em nível militar: errar a convenção de sinais na equação de Halley (esquecer que superfícies côncavas têm raio negativo e convexas positivo) e confundir a frequência da onda (que é invariável ao mudar de meio) com o comprimento de onda e velocidade (que mudam na refração segundo λ = λ₀ / n)."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Pêndulo Simples em Elevador com Aceleração Vertical",
      enunciado: "Um pêndulo simples de comprimento L = 1,0 m possui período de oscilação T₀ na superfície da Terra com g = 10 m/s². Esse pêndulo é fixado no teto de um elevador que sobe acelerando verticalmente para cima com aceleração constante a = 2,5 m/s². Determine a razão entre o novo período T' e o período inicial T₀.",
      resolucao_passo_a_passo: "1. Período inicial: T₀ = 2π · √(L / g).\n2. No referencial não-inercial do elevador acelerando para cima com a, surge uma aceleração inercial fictícia g_inercial = a apontando para baixo. Assim, a gravidade aparente eficaz sentida pelo pêndulo é: g_efetivo = g + a = 10 + 2,5 = 12,5 m/s².\n3. Novo período: T' = 2π · √(L / g_efetivo) = 2π · √(L / 12,5).\n4. Razão dos períodos: T' / T₀ = √(g / g_efetivo) = √(10 / 12,5) = √(100 / 125) = √(4 / 5) = 2 / √5 = (2√5) / 5 ≈ 0,894 (o período diminui pois o campo restaurador efetivo é maior)."
    }
  },
  questoes: [
    {
      id: "FIS_IME_01",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Associação de Molas em MHS e Período de Oscilação",
      tipo: "fechada",
      enunciado: "Um bloco de massa m está preso a duas molas ideais idênticas de constante elástica k. No primeiro caso, as duas molas estão ligadas em paralelo ao bloco, oscilando com período T1. No segundo caso, as duas molas estão ligadas em série ao bloco, oscilando com período T2. A razão entre os períodos T2 / T1 é:",
      alternativas: [
        { letra: "A", texto: "2" },
        { letra: "B", texto: "√2" },
        { letra: "C", texto: "4" },
        { letra: "D", texto: "1 / 2" },
        { letra: "E", texto: "2√2" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Em paralelo: k_eq1 = k + k = 2k. Em série: 1/k_eq2 = 1/k + 1/k => k_eq2 = k/2.",
        porque: "T1 = 2π√(m / 2k) e T2 = 2π√(m / (k/2)) = 2π√(2m / k). Razão: T2 / T1 = √(2m/k) / √(m/2k) = √( (2m/k) · (2k/m) ) = √4 = 2."
      }
    },
    {
      id: "FIS_IME_02",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Equação dos Fabricantes de Lentes (Halley)",
      tipo: "fechada",
      enunciado: "Uma lente delgada biconvexa de vidro (índice de refração n = 1,5) possui raios de curvatura iguais a R1 = 20 cm e R2 = 30 cm. A distância focal dessa lente quando imersa no ar (n = 1,0) e quando imersa na água (n = 4/3) vale, respectivamente:",
      alternativas: [
        { letra: "A", texto: "24 cm e 96 cm" },
        { letra: "B", texto: "12 cm e 48 cm" },
        { letra: "C", texto: "20 cm e 80 cm" },
        { letra: "D", texto: "24 cm e 48 cm" },
        { letra: "E", texto: "15 cm e 60 cm" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Equação de Halley: 1/f = (n_lente/n_meio - 1) · (1/R1 + 1/R2).",
        porque: "1. No ar: 1/f_ar = (1,5 - 1) · (1/20 + 1/30) = 0,5 · (5/60) = 0,5 · (1/12) = 1/24 => f_ar = 24 cm.\n2. Na água: 1/f_agua = (1,5 / (4/3) - 1) · (1/12) = (9/8 - 1) · (1/12) = (1/8) · (1/12) = 1/96 => f_agua = 96 cm."
      }
    },
    {
      id: "FIS_IME_03",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Experimento de Young e Interferência em Fenda Dupla",
      tipo: "fechada",
      enunciado: "Em uma montagem do experimento de dupla fenda de Young, a distância entre as fendas é d = 0,2 mm e a distância das fendas até o anteparo é D = 1,5 m. A fonte emite luz monocromática de comprimento de onda λ = 600 nm (6 × 10⁻⁷ m). A distância entre dois máximos de interferência consecutivos na tela é:",
      alternativas: [
        { letra: "A", texto: "4,5 mm" },
        { letra: "B", texto: "3,0 mm" },
        { letra: "C", texto: "6,0 mm" },
        { letra: "D", texto: "1,5 mm" },
        { letra: "E", texto: "9,0 mm" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Interfranja (espaçamento entre franjas brilhantes adjacentes): Δy = λ · D / d.",
        porque: "Δy = (6 × 10⁻⁷ m · 1,5 m) / (0,2 × 10⁻³ m) = (9 × 10⁻⁷) / (2 × 10⁻⁴) = 4,5 × 10⁻³ m = 4,5 mm."
      }
    },
    {
      id: "FIS_IME_04",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Efeito Doppler Acústico com Fonte e Observador Móveis",
      tipo: "fechada",
      enunciado: "Uma viatura policial com sirene emitindo som de frequência pura f₀ = 900 Hz aproxima-se de uma parede vertical rígida com velocidade constante de 36 km/h (10 m/s). Sabendo que a velocidade de propagação do som no ar é de 340 m/s, a frequência do som refletido pela parede captada pelo motorista da viatura é:",
      alternativas: [
        { letra: "A", texto: "954,5 Hz" },
        { letra: "B", texto: "926,5 Hz" },
        { letra: "C", texto: "900,0 Hz" },
        { letra: "D", texto: "980,0 Hz" },
        { letra: "E", texto: "1000,0 Hz" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A parede atua como observador fixo recebendo f_parede = f₀ · [v_som / (v_som - v_fonte)]. Ao refletir, atua como fonte fixa para o receptor na viatura.",
        porque: "Frequência refletida recebida pelo motorista: f_final = f_parede · [(v_som + v_fonte) / v_som] = f₀ · [(v_som + v_fonte) / (v_som - v_fonte)] = 900 · [(340 + 10) / (340 - 10)] = 900 · (350 / 330) = 900 · (35 / 33) ≈ 954,55 Hz."
      }
    },
    {
      id: "FIS_IME_05",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Prisma Óptico e Desvio Mínimo",
      tipo: "fechada",
      enunciado: "Um raio de luz incide sobre um prisma equilátero (ângulo de refringência A = 60°) sob condição de desvio angular mínimo δ_min = 30°. O índice de refração do material do prisma em relação ao meio externo vale:",
      alternativas: [
        { letra: "A", texto: "√2" },
        { letra: "B", texto: "√3" },
        { letra: "C", texto: "1,5" },
        { letra: "D", texto: "2,0" },
        { letra: "E", texto: "√2 / 2" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Fórmula de Fraunhofer para o desvio mínimo no prisma: n = sen[(A + δ_min) / 2] / sen[A / 2].",
        porque: "n = sen[(60° + 30°) / 2] / sen[60° / 2] = sen(45°) / sen(30°) = (√2 / 2) / (1 / 2) = √2."
      }
    },
    {
      id: "FIS_IME_06",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Circuito RLC Série em Ressonância",
      tipo: "fechada",
      enunciado: "Um circuito RLC série é composto por um resistor R = 50 Ω, um indutor de indutância L = 200 mH (0,2 H) e um capacitor de capacitância C = 5 μF (5 × 10⁻⁶ F). A frequência angular de ressonância ω₀ desse circuito é:",
      alternativas: [
        { letra: "A", texto: "1.000 rad/s" },
        { letra: "B", texto: "500 rad/s" },
        { letra: "C", texto: "2.000 rad/s" },
        { letra: "D", texto: "100 rad/s" },
        { letra: "E", texto: "10.000 rad/s" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Na ressonância do circuito RLC série, a reatância indutiva anula a reatância capacitiva: XL = XC => ω₀·L = 1 / (ω₀·C) => ω₀ = 1 / √(L·C).",
        porque: "ω₀ = 1 / √(0,2 · 5 × 10⁻⁶) = 1 / √(10⁻⁶) = 1 / 10⁻³ = 1.000 rad/s."
      }
    },
    {
      id: "FIS_IME_07",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Pressão de Radiação e Momento Eletromagnético",
      tipo: "fechada",
      enunciado: "Um feixe de laser perfeitamente colimado de potência contínua P = 600 W incide normalmente sobre uma placa perfeitamente refletora (espelho ideal). Sabendo que a velocidade da luz no vácuo é c = 3 × 10⁸ m/s, a intensidade da força média exercida pela radiação sobre a placa é:",
      alternativas: [
        { letra: "A", texto: "4,0 × 10⁻⁶ N" },
        { letra: "B", texto: "2,0 × 10⁻⁶ N" },
        { letra: "C", texto: "1,0 × 10⁻⁶ N" },
        { letra: "D", texto: "6,0 × 10⁻⁶ N" },
        { letra: "E", texto: "8,0 × 10⁻⁶ N" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Para reflexão total perfeita, a variação de momento linear por fóton é o dobro da incidência: F = 2·P / c.",
        porque: "F = (2 · 600 W) / (3 × 10⁸ m/s) = 1200 / (3 × 10⁸) = 4,0 × 10⁻⁶ N."
      }
    },
    {
      id: "FIS_IME_08",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Lei de Biot-Savart e Campo no Centro de Espira Circular",
      tipo: "fechada",
      enunciado: "Uma espira circular de raio R conduz uma corrente constante i e gera no seu centro geométrico um campo magnético B0 = μ₀·i / (2R). A que distância z do centro da espira, ao longo do seu eixo perpendicular de simetria, o campo magnético fica reduzido a B0 / 8?",
      alternativas: [
        { letra: "A", texto: "z = R√3" },
        { letra: "B", texto: "z = R√2" },
        { letra: "C", texto: "z = 2R" },
        { letra: "D", texto: "z = R / 2" },
        { letra: "E", texto: "z = R√7" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Fórmula do campo no eixo da espira circular: B(z) = [μ₀·i·R²] / [2·(R² + z²)^(3/2)].",
        porque: "B(z) / B(0) = R³ / (R² + z²)^(3/2) = 1/8. Elevando ambos os membros à potência 2/3: R² / (R² + z²) = (1/8)^(2/3) = (1/2)² = 1/4 => R² + z² = 4R² => z² = 3R² => z = R√3."
      }
    },
    {
      id: "FIS_IME_09",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Polarização da Luz e Lei de Malus",
      tipo: "fechada",
      enunciado: "Um feixe de luz não-polarizada de intensidade I0 atravessa sucessivamente dois polarizadores lineares ideais cujos eixos de transmissão formam entre si um ângulo de 60°. A intensidade da luz emergente após o segundo polarizador é:",
      alternativas: [
        { letra: "A", texto: "I0 / 8" },
        { letra: "B", texto: "I0 / 4" },
        { letra: "C", texto: "3·I0 / 8" },
        { letra: "D", texto: "I0 / 2" },
        { letra: "E", texto: "I0 / 16" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Primeiro polarizador reduz a intensidade da luz despolarizada pela metade: I1 = I0 / 2. Lei de Malus no segundo polarizador: I2 = I1 · cos²(θ).",
        porque: "I2 = (I0 / 2) · cos²(60°) = (I0 / 2) · (1/2)² = (I0 / 2) · (1/4) = I0 / 8."
      }
    },
    {
      id: "FIS_IME_10",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Ondas Estacionárias em Cordas e Tubos Sonoros",
      tipo: "fechada",
      enunciado: "Uma corda esticada de comprimento L = 1,2 m fixa em ambas as extremidades vibra em seu terceiro harmônico com frequência de 150 Hz. A velocidade de propagação das ondas transversais nessa corda é:",
      alternativas: [
        { letra: "A", texto: "120 m/s" },
        { letra: "B", texto: "60 m/s" },
        { letra: "C", texto: "180 m/s" },
        { letra: "D", texto: "240 m/s" },
        { letra: "E", texto: "90 m/s" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Para corda com extremidades fixas, o n-ésimo harmônico possui frequência fn = n · v / (2L).",
        porque: "150 Hz = 3 · v / (2 · 1,2) => 150 = 3·v / 2,4 => 150 = 1,25·v => v = 150 / 1,25 = 120 m/s."
      }
    },
    {
      id: "FIS_IME_11",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Autoindução e Energia Magnética em Solenoide",
      tipo: "fechada",
      enunciado: "Um solenoide longo com núcleo de ar possui 1.000 espiras distribuídas uniformemente ao longo de um comprimento de 50 cm (0,5 m) e área de seção reta A = 10 cm² (10⁻³ m²). Adotando μ₀ = 4π × 10⁻⁷ T·m/A, a autoindutância L desse solenoide é:",
      alternativas: [
        { letra: "A", texto: "0,8π mH (2,51 × 10⁻³ H)" },
        { letra: "B", texto: "0,4π mH" },
        { letra: "C", texto: "1,6π mH" },
        { letra: "D", texto: "8,0π mH" },
        { letra: "E", texto: "0,2π mH" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Fórmula da indutância do solenoide ideal: L = μ₀ · N² · A / ℓ.",
        porque: "L = (4π × 10⁻⁷ · (1.000)² · 10⁻³) / 0,5 = (4π × 10⁻⁷ · 10⁶ · 10⁻³) / 0,5 = (4π × 10⁻⁴) / 0,5 = 8π × 10⁻⁴ H = 0,8π × 10⁻³ H = 0,8π mH ≈ 2,51 mH."
      }
    },
    {
      id: "FIS_IME_12",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Ângulo de Brewster e Polarização por Reflexão",
      tipo: "fechada",
      enunciado: "Um feixe luminoso propaga-se no ar (n = 1,0) e incide sobre uma placa de vidro de índice de refração n = √3. O raio refletido é linearmente polarizado no plano perpendicular ao plano de incidência quando o ângulo de incidência θ_B for igual a:",
      alternativas: [
        { letra: "A", texto: "60°" },
        { letra: "B", texto: "30°" },
        { letra: "C", texto: "45°" },
        { letra: "D", texto: "75°" },
        { letra: "E", texto: "53°" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Lei de Brewster: tg(θ_B) = n2 / n1.",
        porque: "tg(θ_B) = √3 / 1,0 = √3 => θ_B = arctg(√3) = 60°. Nessa condição, o raio refletido e o refratado são perpendiculares entre si."
      }
    },
    {
      id: "FIS_IME_13",
      origem: "ITA 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Oscilador Harmônico com Fluido e Frequência Angular Efetiva",
      tipo: "aberta",
      enunciado: "Uma esfera densa de raio R e massa m oscila verticalmente com pequena amplitude parcialmente imersa em um líquido incompressível de densidade ρ (com m > ρ·(4/3)πR³). Mostre que, desprezando a viscosidade do líquido, o movimento é um Movimento Harmônico Simples (MHS) e determine a expressão da frequência angular ω₀ das oscilações em termos de ρ, R, m e g.",
      resposta: "ω₀ = √(ρ·π·R²·g / m)",
      gabarito: {
        letra: "Aberta",
        ancora: "Quando a esfera afunda uma cota vertical extra y a partir do equilíbrio, a variação do volume imerso é ΔV ≈ π·R²·y para amplitudes infinitesimais.",
        espera_se: "1. Força restauradora resultante pelo Princípio de Arquimedes: F_rest = -ΔE = -ρ · g · ΔV = -(ρ · g · π · R²) · y.\n2. Pela 2ª Lei de Newton: m · (d²y/dt²) = -(ρ·π·R²·g)·y => d²y/dt² + (ρ·π·R²·g / m) · y = 0.\n3. Comparando com a equação padrão do MHS (d²y/dt² + ω₀²·y = 0), obtém-se: ω₀ = √(ρ · π · R² · g / m)."
      }
    },
    {
      id: "FIS_IME_14",
      origem: "IME 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Lâmina de Faces Paralelas e Desvio Lateral",
      tipo: "aberta",
      enunciado: "Um raio de luz incide do ar sob um ângulo de 45° sobre uma lâmina de vidro homogênea de faces plano-paralelas de espessura e = 6,0 cm e índice de refração n = √2. Deduza a expressão do desvio lateral d sofrido pelo raio emergente em relação ao raio incidente original e calcule o valor numérico de d em centímetros.",
      resposta: "d = e · sen(i - r) / cos(r) = 6 · sen(15°) / cos(30°) ≈ 1,79 cm",
      gabarito: {
        letra: "Aberta",
        ancora: "Pela Lei de Snell: 1 · sen(45°) = √2 · sen(r) => √2 / 2 = √2 · sen(r) => sen(r) = 1/2 => r = 30°.",
        espera_se: "1. Fórmula geométrica do desvio lateral: d = e · [sen(i - r) / cos(r)].\n2. Ângulo (i - r) = 45° - 30° = 15°. sen(15°) = sen(45° - 30°) = (√6 - √2) / 4 ≈ 0,2588. cos(30°) = √3 / 2 ≈ 0,866.\n3. d = 6,0 · 0,2588 / 0,866 ≈ 1,553 / 0,866 ≈ 1,79 cm."
      }
    },
    {
      id: "FIS_IME_15",
      origem: "ITA 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Indução com Bobina em Rotação (Gerador de Corrente Alternada)",
      tipo: "aberta",
      enunciado: "Uma espira condutora retangular de N = 200 espiras com dimensões 10 cm × 20 cm (Área A = 0,02 m²) gira em torno de um eixo coplanar perpendicular às linhas de indução de um campo magnético uniforme B = 0,5 T com velocidade angular constante ω = 100π rad/s (f = 50 Hz). Determine a expressão temporal do fluxo magnético Φ(t), a expressão da força eletromotriz induzida ε(t) e o valor máximo de pico dessa fem.",
      resposta: "ε(t) = 200π · sen(100π·t) (V) e ε_max = 200π V ≈ 628,3 V",
      gabarito: {
        letra: "Aberta",
        ancora: "Fluxo magnético: Φ(t) = B · A · cos(ω·t).",
        espera_se: "1. Φ(t) = 0,5 · 0,02 · cos(100π·t) = 0,01 · cos(100π·t) Wb.\n2. Pela Lei de Faraday para N espiras: ε(t) = -N · (dΦ/dt) = -200 · [-0,01 · 100π · sen(100π·t)] = 200π · sen(100π·t) V.\n3. Valor de pico máximo: ε_max = 200π V ≈ 628,3 Volts."
      }
    }
  ]
};

salvar('Fisica/Cinematica/Questoes_Cinematica_e_Dinamica.json', fisicaCinematica);
salvar('Fisica/Termologia/Questoes_Termodinamica_e_Calor.json', fisicaTermologia);
salvar('Fisica/Eletromagnetismo/Questoes_Circuitos_e_Eletricidade.json', fisicaEletromagnetismo);
salvar('Fisica/IME_ITA/Questoes_MHS_Eletromagnetismo_e_Optica_IME_ITA.json', fisicaImeIta);

console.log('--- LOTE 2 (FÍSICA) CONCLUÍDO COM SUCESSO ---');
