const fs = require('fs');
const path = require('path');

const BASE_DIR = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';

function salvar(subpath, dados) {
  const p = path.join(BASE_DIR, subpath);
  fs.writeFileSync(p, JSON.stringify(dados, null, 2), 'utf-8');
  console.log(`Atualizado: ${subpath} com ${dados.questoes.length} questões.`);
}

// -------------------------------------------------------------
// 1. QUÍMICA - INTRODUÇÃO À QUÍMICA E MATÉRIA (6º AO 9º ANO EF)
// -------------------------------------------------------------
const quimicaEF = {
  disciplina: "Quimica",
  modulo: "Introducao_a_Quimica_e_Materia_6ao9ano",
  subpasta: "Anos_Finais_6to9EF",
  arquivo_origem: "Questoes_Introducao_a_Quimica_e_Materia_6ao9ano.json",
  benchmark_didatico: {
    capitulo: "Fundamentos da Matéria: Estados Físicos, Substâncias, Misturas e Métodos de Separação",
    objetivos_aprendizagem: [
      "Distinguir matéria, corpo e objeto, e reconhecer as propriedades gerais e específicas da matéria (massa, volume, densidade, ponto de fusão e ebulição).",
      "Identificar os estados físicos da matéria (sólido, líquido, gasoso) e as mudanças de estado físico (fusão, solidificação, vaporização, condensação, sublimação).",
      "Diferenciar substâncias puras (simples e compostas) de misturas homogêneas (soluções) e heterogêneas.",
      "Selecionar e explicar métodos adequados de separação de misturas (filtração, decantação, destilação simples e fracionada, centrifugação, flotação e catação)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Estados Físicos da Matéria e Mudanças de Fase",
          definicao: "A matéria é formada por partículas em constante agitação. No estado sólido, as partículas possuem arranjo espacial ordenado, forma e volume definidos e baixa energia cinética. No estado líquido, há maior liberdade de deslizamento entre as partículas, resultando em volume constante e forma variável (adaptada ao recipiente). No estado gasoso, as forças de atração são desprezíveis, havendo grande espaçamento, forma e volume variáveis (alta compressibilidade e expansibilidade). As mudanças endotérmicas (absorvem calor) são fusão, vaporização (evaporação, ebulição, calefação) e sublimação. As exotérmicas (liberam calor) são solidificação, condensação/liquefação e ressublimação."
        },
        {
          termo: "Substâncias Puras e Misturas",
          definicao: "Uma substância pura possui composição química fixa e propriedades constantes e bem definidas, apresentando temperaturas fixas durante a fusão e a ebulição em gráficos de aquecimento. Substâncias simples são formadas por átomos de um único elemento químico (O₂, H₂, Fe, He), enquanto compostas são formadas por dois ou mais elementos combinados quimicamente (H₂O, NaCl, CO₂). Já as misturas são constituídas por duas ou mais substâncias físicas independentes; podem ser homogêneas (monofásicas, como água com sal dissolvido ou ar atmosférico filtrado) ou heterogêneas (polifásicas, como água e óleo, sangue, leite ou granito)."
        },
        {
          termo: "Métodos de Separação de Misturas",
          definicao: "A separação de misturas baseia-se nas diferenças entre as propriedades físicas dos componentes. Para misturas heterogêneas: filtração (separa sólido insolúvel de líquido), decantação (baseada na diferença de densidade entre líquidos imiscíveis ou sólido/líquido), centrifugação (decantação acelerada), separação magnética (atração de ferro por ímã) e flotação (uso de líquido com densidade intermediária). Para misturas homogêneas: destilação simples (separa sólido dissolvido de líquido aproveitando a diferença extrema de ponto de ebulição, ex.: sal e água) e destilação fracionada (separa líquidos miscíveis com pontos de ebulição próximos, ex.: água e álcool, ou frações do petróleo)."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente no Ensino Fundamental: classificar leite e sangue como misturas homogêneas apenas pela aparência a olho nu. Ao microscópio óptico, revelam glóbulos de gordura e células em suspensão, sendo coloides/misturas heterogêneas. Outro erro comum é confundir 'evaporação' (lenta, à temperatura ambiente) com 'ebulição' (rápida, turbulenta, em temperatura fixa sob dada pressão)."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Análise de Gráfico de Aquecimento",
      enunciado: "Ao aquecer uma amostra homogênea ao nível do mar, observou-se que a fusão iniciou-se a 0 °C e terminou a 0 °C (patamar constante). Contudo, durante a ebulição, a temperatura subiu continuamente de 102 °C a 108 °C. A amostra trata-se de substância pura, mistura comum, mistura eutética ou mistura azeotrópica?",
      resolucao_passo_a_passo: "1. Uma substância pura apresenta dois patamares horizontais constantes bem definidos: tanto na fusão quanto na ebulição.\n2. Uma mistura comum não apresenta patamares constantes em nenhuma das duas mudanças de fase.\n3. Uma mistura azeotrópica comporta-se como substância pura na ebulição (patamar constante na ebulição) e varia na fusão.\n4. Uma mistura eutética comporta-se como substância pura na fusão (temperatura de fusão rigorosamente constante) e varia durante a ebulição.\n5. Como a amostra possui temperatura constante de fusão (0 °C) e faixa variável de ebulição (102 °C a 108 °C), conclui-se que se trata de uma Mistura Eutética (por exemplo, gelo com proporção específica de sal)."
    }
  },
  questoes: [
    {
      id: "QUI_EF_01",
      origem: "Autoral Pedagógico - Apoio Escolar",
      ano_escolar: "6º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Mudanças de Estado Físico",
      tipo: "fechada",
      enunciado: "Em uma manhã fria de inverno, uma pessoa percebe que o espelho do banheiro fica embaçado após um banho quente. Passados alguns minutos com a porta aberta, o espelho seca completamente. Os fenômenos físicos responsáveis, respectivamente, pelo embaçamento e pela secagem do espelho são:",
      alternativas: [
        { letra: "A", texto: "Condensação e evaporação." },
        { letra: "B", texto: "Fusão e vaporização." },
        { letra: "C", texto: "Sublimação e solidificação." },
        { letra: "D", texto: "Liquefação e fusão." },
        { letra: "E", texto: "Ebulição e condensação." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O vapor de água entra em contato com a superfície fria do vidro e passa do estado gasoso para o líquido (condensação). Depois, as gotículas passam gradualmente para a atmosfera (evaporação).",
        porque: "O embaçamento é a condensação (gás para líquido) do vapor d'água na superfície de vidro a menor temperatura. A secagem posterior é a evaporação (líquido para vapor) à temperatura ambiente."
      }
    },
    {
      id: "QUI_EF_02",
      origem: "OBQ-Jr (Olimpíada Brasileira de Química Júnior)",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Separação de Misturas Heterogêneas",
      tipo: "fechada",
      enunciado: "Um estudante derrubou acidentalmente limalha de ferro, areia fina e cloreto de sódio (sal de cozinha) em um mesmo recipiente. Para separar completamente esses três componentes em sua forma sólida pura, a sequência mais adequada e eficiente de procedimentos é:",
      alternativas: [
        { letra: "A", texto: "Separação magnética (ímã) para o ferro, adição de água para dissolver o sal, filtração para reter a areia e evaporação/destilação da água para recuperar o sal." },
        { letra: "B", texto: "Filtração direta da mistura seca, seguida de catação manual e decantação com óleo." },
        { letra: "C", texto: "Adição de água e destilação fracionada com ferro e areia juntos." },
        { letra: "D", texto: "Centrifugação da mistura seca seguida de flotação com álcool." },
        { letra: "E", texto: "Dissolução fracionada de todos os componentes em álcool etílico." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "1. O ferro possui propriedades ferromagnéticas e é atraído pelo ímã. 2. A água dissolve apenas o sal (dissolução seletiva). 3. A filtração separa o resíduo insolúvel (areia). 4. A evaporação ou destilação separa o soluto (sal).",
        porque: "A sequência proposta utiliza as propriedades magnéticas do ferro, a solubilidade diferencial do sal em água frente à insolubilidade da areia, e a grande diferença de ponto de ebulição entre a água e o sal sólido."
      }
    },
    {
      id: "QUI_EF_03",
      origem: "Colégio Militar",
      ano_escolar: "7º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Conceito de Densidade e Flutuação",
      tipo: "fechada",
      enunciado: "Três líquidos imiscíveis A (densidade = 0,8 g/cm³), B (densidade = 1,0 g/cm³) e C (densidade = 1,3 g/cm³) são colocados cuidadosamente em uma proveta graduada. Em seguida, adiciona-se uma esfera maciça com massa de 45 g e volume de 50 cm³. É correto afirmar que:",
      alternativas: [
        { letra: "A", texto: "A esfera flutuará na interface entre o líquido A e o líquido B." },
        { letra: "B", texto: "A esfera afundará até o fundo da proveta, abaixo do líquido C." },
        { letra: "C", texto: "A esfera flutuará na superfície superior do líquido A." },
        { letra: "D", texto: "A esfera ficará em equilíbrio entre o líquido B e o líquido C." },
        { letra: "E", texto: "Os três líquidos se misturarão espontaneamente ao contato com a esfera." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Densidade da esfera: d = m / V = 45 g / 50 cm³ = 0,9 g/cm³.",
        porque: "Na proveta, os líquidos se organizam de cima para baixo em ordem crescente de densidade: A (0,8) no topo, B (1,0) no meio e C (1,3) no fundo. Como a esfera tem densidade 0,9 g/cm³, ela afunda no líquido A (0,9 > 0,8) e flutua sobre o líquido B (0,9 < 1,0)."
      }
    },
    {
      id: "QUI_EF_04",
      origem: "OBQ-Jr",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Substâncias Simples, Compostas e Misturas",
      tipo: "fechada",
      enunciado: "Considere quatro sistemas constituídos em recipientes fechados: Sistema I: Gás oxigênio (O₂) e gás ozônio (O₃); Sistema II: Vapor de água (H₂O) e água líquida pura; Sistema III: Gás carbônico (CO₂) e gás nitrogênio (N₂); Sistema IV: Diamante (C) e Grafita (C). São, respectivamente, exemplos de alótropos e substância pura homogênea:",
      alternativas: [
        { letra: "A", texto: "Sistema I e IV são misturas/alótropos de um mesmo elemento; Sistema II é uma substância pura em duas fases físicas distintas (homogênea em composição química)." },
        { letra: "B", texto: "Sistema I é substância pura simples e Sistema III é elemento químico." },
        { letra: "C", texto: "Sistema II é mistura binária e Sistema IV é composto iônico." },
        { letra: "D", texto: "Sistema III é alótropo e Sistema I é mistura heterogênea." },
        { letra: "E", texto: "Todos os sistemas são substâncias puras compostas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Alotropia é o fenômeno em que um mesmo elemento forma substâncias simples diferentes (O₂/O₃ e Grafita/Diamante). Água líquida e vapor de água pura constituem uma única substância pura (H₂O).",
        porque: "O e C formam variedades alotrópicas clássicas. O Sistema II, embora tenha duas fases físicas (líquida e gasosa), é rigorosamente uma substância química pura única."
      }
    },
    {
      id: "QUI_EF_05",
      origem: "Apoio Escolar - Avaliação Formativa",
      ano_escolar: "6º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Transformações Físicas vs. Químicas",
      tipo: "fechada",
      enunciado: "No dia a dia ocorrem inúmeras transformações da matéria. Classifique as seguintes ocorrências em fenômeno físico (F) ou fenômeno químico (Q):\n(1) Amassar uma latinha de alumínio.\n(2) Enferrujamento de um prego de ferro exposto ao ar úmido.\n(3) Queima de uma vela de parafina.\n(4) Fusão de cubos de gelo colocados em um copo de suco.",
      alternativas: [
        { letra: "A", texto: "F, Q, Q, F" },
        { letra: "B", texto: "F, F, Q, Q" },
        { letra: "C", texto: "Q, Q, F, F" },
        { letra: "D", texto: "F, Q, F, Q" },
        { letra: "E", texto: "Q, F, Q, F" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Fenômenos físicos não alteram a composição química das moléculas; fenômenos químicos formam novas substâncias por quebra e formação de ligações.",
        porque: "(1) Amassar alumínio altera apenas a forma macroscópica (F). (2) Ferrugem forma óxidos/hidróxidos de ferro por oxidação (Q). (3) Queima é combustão com liberação de CO₂ e H₂O (Q). (4) Fusão de gelo é simples mudança de fase de H₂O (F)."
      }
    },
    {
      id: "QUI_EF_06",
      origem: "Colégio Pedro II",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Destilação Fracionada e Petróleo",
      tipo: "fechada",
      enunciado: "O petróleo cru extraído de poços marítimos é uma mistura complexa de centenas de hidrocarbonetos com massas molares diversas. Nas refinarias, ele é separado em frações comerciais de grande utilidade (gás GLP, gasolina, querosene, óleo diesel e asfalto) por meio de qual processo industrial?",
      alternativas: [
        { letra: "A", texto: "Destilação fracionada em torre de pratos, baseada na diferença das temperaturas de ebulição." },
        { letra: "B", texto: "Decantação estática por densidade em tanques abertos." },
        { letra: "C", texto: "Filtração sob vácuo através de membranas de cerâmica." },
        { letra: "D", texto: "Centrifugação de alta velocidade acoplada a campos magnéticos." },
        { letra: "E", texto: "Cristalização fracionada em banho de gelo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A destilação fracionada separa frações de misturas homogêneas de líquidos miscíveis que possuem pontos de ebulição distintos.",
        porque: "À medida que o vapor sobe pela torre de fracionamento, as frações de cadeias mais pesadas (maior ponto de ebulição) condensam nos pratos inferiores, enquanto os gases e frações mais voláteis atingem o topo da coluna."
      }
    },
    {
      id: "QUI_EF_07",
      origem: "OBQ-Jr",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Estrutura Atômica Fundamental: Prótons, Nêutrons e Elétrons",
      tipo: "fechada",
      enunciado: "O átomo de cloro-35 neutro possui número atômico Z = 17 e número de massa A = 35. Ao receber um elétron, forma o ânion cloreto (Cl⁻). O número de prótons, nêutrons e elétrons presentes no íon Cl⁻ é, respectivamente:",
      alternativas: [
        { letra: "A", texto: "17 prótons, 18 nêutrons e 18 elétrons." },
        { letra: "B", texto: "17 prótons, 17 nêutrons e 18 elétrons." },
        { letra: "C", texto: "18 prótons, 18 nêutrons e 17 elétrons." },
        { letra: "D", texto: "17 prótons, 18 nêutrons e 16 elétrons." },
        { letra: "E", texto: "35 prótons, 17 nêutrons e 18 elétrons." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Z = prótons = 17. Nêutrons = A - Z = 35 - 17 = 18. Ânion monovalente recebe 1 elétron: elétrons = 17 + 1 = 18.",
        porque: "O ganho de elétrons afeta apenas a eletrosfera, mantendo inalterada a composição nuclear (número de prótons e nêutrons)."
      }
    },
    {
      id: "QUI_EF_08",
      origem: "IFSP / IFs Técnicos",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Curvas de Aquecimento e Misturas Eutéticas/Azeotrópicas",
      tipo: "fechada",
      enunciado: "O álcool etílico hidratado comercial (96% de etanol e 4% de água em volume) não consegue ter sua pureza aumentada além de 96% por simples destilação fracionada em pressão normal. Isso ocorre porque essa composição constitui:",
      alternativas: [
        { letra: "A", texto: "Uma mistura azeotrópica, que entra em ebulição à temperatura fixa de aproximadamente 78,1 °C com vapor de composição idêntica à do líquido." },
        { letra: "B", texto: "Uma mistura eutética com temperatura constante de solidificação." },
        { letra: "C", texto: "Uma reação química espontânea de esterificação irreversível." },
        { letra: "D", texto: "Um coloide insolúvel que bloqueia os poros do condensador." },
        { letra: "E", texto: "Uma substância pura composta formada por ligação covalente tripla." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Misturas azeotrópicas comportam-se como substâncias puras durante a vaporização/ebulição, gerando vapor com idêntico teor dos componentes.",
        porque: "Como a composição do vapor gerado na fervura de uma mistura azeotrópica é exatamente igual à do líquido original, a destilação comum atinge seu limite físico, exigindo agentes de arrasto ou destilação a vácuo para obtenção de álcool anidro."
      }
    },
    {
      id: "QUI_EF_09",
      origem: "Colégio Militar",
      ano_escolar: "7º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Solubilidade e Ponto de Saturação",
      tipo: "fechada",
      enunciado: "O coeficiente de solubilidade do nitrato de potássio (KNO₃) a 20 °C é de 30 g por 100 g de água. Se adicionarmos 40 g de KNO₃ a 100 g de água a 20 °C com agitação constante e deixarmos o sistema em repouso, teremos:",
      alternativas: [
        { letra: "A", texto: "Uma solução saturada com 30 g dissolvidos e 10 g de corpo de fundo (precipitado)." },
        { letra: "B", texto: "Uma solução insaturada com 40 g completamente dissolvidos." },
        { letra: "C", texto: "Uma solução supersaturada instável homogênea." },
        { letra: "D", texto: "Uma suspensão coloidal sem precipitação de cristais." },
        { letra: "E", texto: "Uma solução saturada contendo exatamente 40 g de soluto dissolvido." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A quantidade máxima de soluto que 100 g de água consegue dissolver a 20 °C é exatamente 30 g.",
        porque: "O excesso de soluto adicionado (40 g - 30 g = 10 g) não se dissolve e deposita-se no fundo do béquer como precipitado (corpo de chão), resultando em um sistema heterogêneo bifásico (solução saturada + sólido não dissolvido)."
      }
    },
    {
      id: "QUI_EF_10",
      origem: "OBQ-Jr",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Tratamento de Água e Etapas Físico-Químicas",
      tipo: "fechada",
      enunciado: "Nas Estações de Tratamento de Água (ETA), a água bruta dos mananciais recebe sulfato de alumínio e cal hidratada para agregar as impurezas em flocos maiores. Em seguida, a água passa lentamente por tanques onde esses flocos assentam no fundo pela ação da gravidade. Essas duas etapas consecutivas são denominadas:",
      alternativas: [
        { letra: "A", texto: "Floculação e decantação." },
        { letra: "B", texto: "Filtração e desinfecção." },
        { letra: "C", texto: "Fluoretação e aeração." },
        { letra: "D", texto: "Centrifugação e destilação." },
        { letra: "E", texto: "Flotação e cloração." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A coagulação/floculação agrega partículas coloidais; a decantação permite que esses flocos densos se depositem no fundo do tanque antes da filtração em leito de areia.",
        porque: "O sulfato de alumínio atua como coagulante promovendo a floculação. Os flocos resultantes são suficientemente pesados para decantar espontaneamente no fundo do decantador."
      }
    },
    {
      id: "QUI_EF_11",
      origem: "Colégio Naval",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Modelos Atômicos: Dalton, Thomson, Rutherford e Bohr",
      tipo: "fechada",
      enunciado: "Associe corretamente os postulados históricos aos seus respectivos autores:\n(I) O átomo é uma esfera maciça, indivisível, indestrutível e homogênea (bola de bilhar).\n(II) O átomo é uma esfera de carga positiva incrustada de corpúsculos negativos (pudim de passas).\n(III) O átomo possui um núcleo diminuto positivo e denso cercado por uma imensa eletrosfera vazia.\n(IV) Os elétrons giram em órbitas circulares quantizadas e emitem luz apenas ao saltar para níveis de menor energia.",
      alternativas: [
        { letra: "A", texto: "I - Dalton, II - Thomson, III - Rutherford, IV - Bohr." },
        { letra: "B", texto: "I - Thomson, II - Dalton, III - Bohr, IV - Rutherford." },
        { letra: "C", texto: "I - Rutherford, II - Bohr, III - Thomson, IV - Dalton." },
        { letra: "D", texto: "I - Dalton, II - Rutherford, III - Thomson, IV - Bohr." },
        { letra: "E", texto: "I - Bohr, II - Thomson, III - Dalton, IV - Rutherford." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Cronologia da teoria atômica clássica: Dalton (1808), Thomson (1897), Rutherford (1911) e Bohr (1913).",
        porque: "Dalton propôs o modelo atômico corpuscular indivisível. Thomson descobriu o elétron ('pudim de passas'). Rutherford comprovou o vazio atômico e o núcleo denso pelo espalhamento de partículas alfa em lâmina de ouro. Bohr introduziu os postulados quânticos de níveis e saltos eletrônicos."
      }
    },
    {
      id: "QUI_EF_12",
      origem: "OBQ-Jr Fase Nacional",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Isótopos, Isóbaros, Isótonos e Espécies Isoeletrônicas",
      tipo: "fechada",
      enunciado: "Considere as espécies químicas: A (Z = 20, A = 40), B (Z = 19, A = 39) e o íon C²⁺ derivado de A. É correto afirmar sobre as relações atômicas entre essas entidades que:",
      alternativas: [
        { letra: "A", texto: "A e B são isótonos (ambos possuem 20 nêutrons), e o íon C²⁺ possui 18 elétrons, sendo isoeletrônico do gás nobre argônio (Z = 18)." },
        { letra: "B", texto: "A e B são isótopos de mesmo elemento químico." },
        { letra: "C", texto: "A e B são isóbaros de mesma massa nuclear." },
        { letra: "D", texto: "O íon C²⁺ possui 22 elétrons por ter carga positiva." },
        { letra: "E", texto: "A e C²⁺ possuem números diferentes de prótons no núcleo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Nêutrons de A = 40 - 20 = 20. Nêutrons de B = 39 - 19 = 20 (isótonos). Elétrons de C²⁺ = 20 - 2 = 18.",
        porque: "Isótonos são espécies com o mesmo número de nêutrons (20). O cátion divalente perdeu 2 elétrons da sua camada de valência, ficando com 18 elétrons, o mesmo que o Argônio (espécies isoeletrônicas)."
      }
    },
    {
      id: "QUI_EF_13",
      origem: "OBQ-Jr 2ª Fase",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Cálculo de Densidade e Identificação de Materiais",
      tipo: "aberta",
      enunciado: "Um anel metálico de 38,6 g supostamente feito de ouro puro (densidade do ouro = 19,3 g/cm³) é mergulhado em uma proveta graduada contendo inicialmente 20,0 mL de água. Ao inserir o anel, o nível da água sobe para 22,0 mL. (a) Calcule o volume ocupado pelo anel. (b) Calcule a densidade calculada da peça. (c) Conclua com justificativa física se o anel é de fato de ouro maciço.",
      resposta: "(a) V = 2,0 mL (cm³); (b) d = 19,3 g/cm³; (c) Sim, a densidade coincide exatamente com a do ouro puro.",
      gabarito: {
        letra: "Aberta",
        ancora: "Método de deslocamento de líquido de Arquimedes para medição de volume irregular.",
        espera_se: "1. Volume deslocado: V = V_final - V_inicial = 22,0 - 20,0 = 2,0 mL = 2,0 cm³.\n2. Densidade calculada: d = massa / volume = 38,6 g / 2,0 cm³ = 19,3 g/cm³.\n3. Conclusão: Como o valor experimental calculado (19,3 g/cm³) é rigorosamente igual à densidade tabelada para o ouro puro maciço, o anel é genuinamente de ouro."
      }
    },
    {
      id: "QUI_EF_14",
      origem: "Colégio de Aplicação UFRJ",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Dissolução Térmica e Curvas de Solubilidade",
      tipo: "aberta",
      enunciado: "A solubilidade do sulfato de cobre pentahidratado em água varia conforme a temperatura: a 20 °C dissolvem-se 20 g de sal por 100 g de água; a 80 °C dissolvem-se 55 g de sal por 100 g de água. Uma solução saturada preparada com 200 g de água a 80 °C é resfriada até 20 °C. Determine a massa de sal que precipitará na forma sólida de cristais no fundo do recipiente.",
      resposta: "Massa precipitada = 70 g de sal",
      gabarito: {
        letra: "Aberta",
        ancora: "Proporcionalidade direta com a massa de solvente (200 g de água = 2 × 100 g).",
        espera_se: "1. A 80 °C: massa dissolvida em 200 g de água = 2 × 55 g = 110 g de soluto.\n2. A 20 °C: capacidade máxima de dissolução em 200 g de água = 2 × 20 g = 40 g de soluto.\n3. Massa que cristaliza/precipita por resfriamento: m_cristais = 110 g - 40 g = 70 g."
      }
    },
    {
      id: "QUI_EF_15",
      origem: "OBQ-Jr Fase Final",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Lei de Lavoisier e Lei de Proust em Reações Químicas",
      tipo: "aberta",
      enunciado: "Em um recipiente fechado e hermético, 12 g de carbono puro reagem completamente com 32 g de gás oxigênio gerando 44 g de dióxido de carbono (CO₂). Em um segundo experimento no mesmo sistema fechado, colocam-se 30 g de carbono para reagir com 64 g de oxigênio. Com base nas leis ponderais de Lavoisier e Proust: (a) Qual reagente está em excesso e qual a massa desse excesso? (b) Qual a massa total de CO₂ produzida no segundo experimento?",
      resposta: "(a) Carbono em excesso com 6 g não reagidos; (b) Massa de CO₂ formada = 88 g.",
      gabarito: {
        letra: "Aberta",
        ancora: "Lei de Proust (proporções constantes): razão C : O₂ = 12 g : 32 g = 3 : 8.",
        espera_se: "1. No 2º experimento há 64 g de O₂ (o dobro de 32 g). Portanto, a massa necessária de carbono para reagir completamente é 2 × 12 g = 24 g de carbono.\n2. Como foram fornecidos 30 g de carbono, o carbono é o reagente em excesso, sobrando: 30 g - 24 g = 6 g de carbono puro sem reagir.\n3. Pela Lei de Lavoisier (conservação da massa dos reagentes que de fato reagiram): Massa de CO₂ = 24 g de C + 64 g de O₂ = 88 g de CO₂."
      }
    }
  ]
};

// -------------------------------------------------------------
// 2. QUÍMICA - TABELA PERIÓDICA E LIGAÇÕES QUÍMICAS (GERAL E INORGÂNICA)
// -------------------------------------------------------------
const quimicaGeral = {
  disciplina: "Quimica",
  modulo: "Tabela_Periodica_e_Ligacoes_Quimicas",
  subpasta: "Geral_e_Inorganica",
  arquivo_origem: "Questoes_Tabela_Periodica_e_Ligacoes_Quimicas.json",
  benchmark_didatico: {
    capitulo: "Química Geral: Propriedades Periódicas, Ligações Químicas, Geometria e Funções Inorgânicas",
    objetivos_aprendizagem: [
      "Compreender a organização da Tabela Periódica moderna (grupos e períodos) e analisar as propriedades periódicas (raio atômico, energia de ionização, eletronegatividade e afinidade eletrônica).",
      "Diferenciar e caracterizar ligações iônicas, covalentes (moleculares e coordenadas/dativas) e metálicas, correlacionando-as às propriedades macroscópicas das substâncias.",
      "Determinar a geometria molecular (Teoria RPVPE / VSEPR) e a polaridade de moléculas poliatômicas.",
      "Identificar e nomear as principais funções inorgânicas (ácidos, bases, sais e óxidos) segundo Arrhenius e prever reações de neutralização total e parcial."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Tabela Periódica e Propriedades Periódicas",
          definicao: "Os elementos estão dispostos em ordem crescente de número atômico (Z). O período indica a quantidade de camadas eletrônicas; o grupo reúne elementos com distribuição de valência similar. O Raio Atômico cresce para a esquerda e para baixo (maior número de camadas e menor carga nuclear efetiva). A Energia de Ionização (energia para remover um elétron no estado gasoso) e a Eletronegatividade (atração por elétrons em ligação química) crescem para a direita e para cima (excluindo os gases nobres na eletronegatividade de Pauling)."
        },
        {
          termo: "Ligações Químicas e Forças Intermoleculares",
          definicao: "Ligação Iônica: transferência definitiva de elétrons entre metal (baixa eletronegatividade, forma cátions) e ametal (alta eletronegatividade, forma ânions), formando retículos cristalinos de alto ponto de fusão e que conduzem corrente quando fundidos ou em solução aquosa. Ligação Covalente: compartilhamento de pares eletrônicos entre ametais/hidrogênio. Ligação Metálica: mar de elétrons livres circundando cátions fixos (alta condutividade elétrica e térmica no estado sólido, ductilidade e maleabilidade). As forças intermoleculares (Dispersão de London < Dipolo-Dipolo < Ligações de Hidrogênio) regem pontos de ebulição de compostos moleculares."
        },
        {
          termo: "Geometria Molecular e Funções Inorgânicas",
          definicao: "A repulsão dos pares de elétrons da camada de valência (RPVPE) define geometrias: 2 nuvens = linear (BeH₂, CO₂); 3 nuvens = trigonal plana (BF₃) ou angular (SO₂); 4 nuvens = tetraédrica (CH₄), piramidal (NH₃) ou angular (H₂O). Nas funções inorgânicas: Ácidos liberam H⁺ em água (HCl, H₂SO₄); Bases liberam OH⁻ (NaOH, Ca(OH)₂); Sais resultam da neutralização entre ácido e base (NaCl, CaCO₃); Óxidos são compostos binários com oxigênio (CO₂, CaO, SO₃)."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico: confundir ligação covalente polar com molécula polar. Uma molécula pode ter ligações altamente polares e, devido à simetria geométrica (momento dipolar resultante nulo, μ_res = 0), ser globalmente apolar (como CO₂, CCl₄ e BF₃)."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Geometria e Polaridade da Água e do Gás Carbônico",
      enunciado: "Explique por que a molécula de dióxido de carbono (CO₂) é apolar enquanto a molécula de água (H₂O) é polar, embora ambas possuam três átomos e ligações polares.",
      resolucao_passo_a_passo: "1. Átomo central do CO₂: Carbono (4 elétrons na camada de valência) realiza duas duplas ligações com os oxigênios (O=C=O). Não sobram pares de elétrons não-ligantes no carbono. As 2 nuvens eletrônicas adotam a geometria Linear (ângulo de 180°). Os dois vetores momento de dipolo elétrico (C→O) têm mesmo módulo, mesma direção e sentidos opostos, anulando-se: μ_res = 0. A molécula é rigorosamente Apolar.\n2. Átomo central da H₂O: Oxigênio (6 elétrons na camada de valência) realiza duas ligações simples com os hidrogênios e mantém dois pares de elétrons isolados (não-ligantes). As 4 nuvens repelem-se para os vértices de um tetraedro distorcido, gerando geometria Angular (ângulo de ~104,5°). Os vetores momento de dipolo (H→O) não se cancelam, resultando em um momento dipolar permanente (μ_res ≠ 0). A molécula é intensamente Polar."
    }
  },
  questoes: [
    {
      id: "QUI_GER_01",
      origem: "ENEM",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Propriedades da Ligação Iônica e Condutividade",
      tipo: "fechada",
      enunciado: "O cloreto de sódio sólido (sal de cozinha comum) não conduz corrente elétrica. No entanto, quando dissolvido em água líquida ou quando fundido a mais de 800 °C, torna-se um excelente condutor elétrico. Essa condutividade em meio aquoso ou fundido deve-se à:",
      alternativas: [
        { letra: "A", texto: "Presença de íons livres (Na⁺ e Cl⁻) com mobilidade para transportar carga." },
        { letra: "B", texto: "Liberação de elétrons livres metálicos da rede cristalina." },
        { letra: "C", texto: "Formação de moléculas covalentes polares gasosas." },
        { letra: "D", texto: "Reação do cloro com o oxigênio atmosférico liberando prótons." },
        { letra: "E", texto: "Redução do sódio a sódio metálico no estado líquido." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Compostos iônicos sólidos possuem íons presos firmemente no retículo cristalino; ao fundir ou dissolver em água, os íons ganham livre mobilidade.",
        porque: "A corrente elétrica em eletrólitos líquidos consiste no deslocamento ordenado de cátions e ânions solvatados livres, fenômeno inexistente no estado sólido rígido."
      }
    },
    {
      id: "QUI_GER_02",
      origem: "FUVEST",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Propriedades Periódicas: Raio Atômico e Energia de Ionização",
      tipo: "fechada",
      enunciado: "Considere os elementos sódio (₁₁Na), magnésio (₁₂Mg) e cloro (₁₇Cl), todos pertencentes ao terceiro período da Tabela Periódica. Comparando-se esses átomos neutros em seu estado fundamental, é correto afirmar que:",
      alternativas: [
        { letra: "A", texto: "O sódio possui o maior raio atômico e o cloro possui a maior primeira energia de ionização." },
        { letra: "B", texto: "O cloro possui o maior raio atômico devido ao maior número de prótons." },
        { letra: "C", texto: "O magnésio possui menor energia de ionização do que o sódio." },
        { letra: "D", texto: "Todos possuem raios atômicos idênticos por terem 3 camadas ocupadas." },
        { letra: "E", texto: "O sódio é o mais eletronegativo do grupo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Ao longo de um período (da esquerda para a direita), a carga nuclear Z cresce, aumentando a atração sobre os elétrons, o que contrai o raio atômico e eleva a energia de ionização.",
        porque: "O Na (Z = 11) tem menor carga nuclear no mesmo período, logo seus elétrons são menos atraídos (maior raio). O Cl (Z = 17) atrai fortemente seus elétrons de valência (menor raio e maior energia de ionização)."
      }
    },
    {
      id: "QUI_GER_03",
      origem: "UNICAMP",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Geometria Molecular e Teoria RPVPE",
      tipo: "fechada",
      enunciado: "As moléculas de amônia (NH₃) e trifluoreto de boro (BF₃) possuem três átomos periféricos ligados ao átomo central. No entanto, suas geometrias moleculares são, respectivamente:",
      alternativas: [
        { letra: "A", texto: "Piramidal e trigonal plana." },
        { letra: "B", texto: "Trigonal plana e piramidal." },
        { letra: "C", texto: "Ambas trigonais planas." },
        { letra: "D", texto: "Ambas piramidais." },
        { letra: "E", texto: "T-invertido e linear." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O nitrogênio possui 5 elétrons de valência (3 compartilhados + 1 par isolado, totalizando 4 nuvens = piramidal). O boro possui 3 elétrons de valência (todos compartilhados, 3 nuvens = trigonal plana).",
        porque: "O par de elétrons isolado no topo do nitrogênio exerce repulsão sobre as ligações N-H, empurrando-as para baixo e formando uma pirâmide trigonal. O boro não possui par isolado, distribuindo as ligações simetricamente a 120° em um mesmo plano."
      }
    },
    {
      id: "QUI_GER_04",
      origem: "UERJ",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Ligações de Hidrogênio e Ponto de Ebulição",
      tipo: "fechada",
      enunciado: "A água (H₂O, massa molar 18 g/mol) ferve a 100 °C sob pressão de 1 atm, enquanto o sulfeto de hidrogênio (H₂S, massa molar 34 g/mol), que pertence ao mesmo grupo da tabela periódica, é um gás à temperatura ambiente e ferve a cerca de -60 °C. Essa acentuada diferença de volatilidade é explicada porque:",
      alternativas: [
        { letra: "A", texto: "Entre as moléculas de água formam-se fortes ligações de hidrogênio devido à alta eletronegatividade e pequeno tamanho do oxigênio." },
        { letra: "B", texto: "O sulfeto de hidrogênio é um composto puramente iônico." },
        { letra: "C", texto: "As moléculas de água possuem geometria linear e o H₂S possui geometria tetraédrica." },
        { letra: "D", texto: "O oxigênio realiza ligações covalentes apolares que concentram calor." },
        { letra: "E", texto: "A massa molar do H₂S é menor do que a da água, tornando-o mais volátil." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Ligações de hidrogênio ocorrem quando o H está covalentemente ligado a átomos altamente eletronegativos e pequenos (F, O, N).",
        porque: "Embora o H₂S tenha maior massa molar, ele interage apenas por dipolo permanente mais fraco, enquanto a rede tridimensional de ligações de hidrogênio na água líquida exige considerável energia térmica para ser rompida."
      }
    },
    {
      id: "QUI_GER_05",
      origem: "UNESP",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Funções Inorgânicas: Óxidos Ácidos e Chuva Ácida",
      tipo: "fechada",
      enunciado: "Gases poluentes como o dióxido de enxofre (SO₂) e o dióxido de nitrogênio (NO₂), liberados pela combustão de derivados fósseis, reagem com o vapor d'água na atmosfera formando gotículas de ácido sulfúrico e ácido nítrico, gerando o fenômeno da chuva ácida. Esses gases são classificados quimicamente como:",
      alternativas: [
        { letra: "A", texto: "Óxidos ácidos (anidridos)." },
        { letra: "B", texto: "Óxidos básicos de caráter alcalino." },
        { letra: "C", texto: "Óxidos neutros que não reagem com água." },
        { letra: "D", texto: "Peróxidos instáveis." },
        { letra: "E", texto: "Sais anidros de neutralização." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Óxidos moleculares de ametais com nox elevado que reagem com água para formar oxiácidos são chamados óxidos ácidos ou anidridos.",
        porque: "SO₂ + H₂O → H₂SO₃; SO₃ + H₂O → H₂SO₄; 2 NO₂ + H₂O → HNO₂ + HNO₃. Esses óxidos conferem pH ácido às precipitações atmosféricas."
      }
    },
    {
      id: "QUI_GER_06",
      origem: "ENEM",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Polaridade das Moléculas e Princípio da Solubilidade",
      tipo: "fechada",
      enunciado: "Em acidentes com derramamento de petróleo no mar, o óleo flutua na superfície da água e não se mistura com ela. Esse comportamento decorre essencialmente do fato de:",
      alternativas: [
        { letra: "A", texto: "O petróleo ser composto predominantemente por hidrocarbonetos apolares e de menor densidade que a água, que é fortemente polar." },
        { letra: "B", texto: "O petróleo ter alto teor de íons livres que repelem as moléculas de água." },
        { letra: "C", texto: "A água formar ligações metálicas que impedem a penetração do óleo." },
        { letra: "D", texto: "A água e os hidrocarbonetos possuírem idêntica polaridade e mesmo momento de dipolo." },
        { letra: "E", texto: "O petróleo evaporar instantaneamente ao tocar a água." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Regra geral de solubilidade: 'semelhante dissolve semelhante'. Substâncias apolares não são solúveis em solventes polares.",
        porque: "A água é polar e interage intensamente por ligações de hidrogênio; os hidrocarbonetos do petróleo são apolares e interagem por forças fracas de London. Somado à menor densidade do óleo (~0,85 g/cm³ vs 1,0 g/cm³), ele forma uma película superficial sobrenadante."
      }
    },
    {
      id: "QUI_GER_07",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Número de Oxidação (NOX) e Reações Redox",
      tipo: "fechada",
      enunciado: "No íon dicromato (Cr₂O₇²⁻), amplamente empregado em testes de bafômetro e reações de oxidação orgânica, o número de oxidação (NOX) do átomo de cromo é:",
      alternativas: [
        { letra: "A", texto: "+6" },
        { letra: "B", texto: "+3" },
        { letra: "C", texto: "+7" },
        { letra: "D", texto: "+12" },
        { letra: "E", texto: "+4" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Em íons poliatômicos, a soma algébrica dos números de oxidação de todos os átomos é igual à carga líquida do íon.",
        porque: "2 · NOX(Cr) + 7 · (-2) = -2 => 2 · NOX(Cr) - 14 = -2 => 2 · NOX(Cr) = +12 => NOX(Cr) = +6."
      }
    },
    {
      id: "QUI_GER_08",
      origem: "EsPCEx",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Distribuição Eletrônica de Cátions de Transição e Diagrama de Pauling",
      tipo: "fechada",
      enunciado: "O elemento ferro (₂₆Fe) possui número atômico 26. A distribuição eletrônica em subníveis de energia para o cátion férrico (Fe³⁺) em seu estado fundamental é:",
      alternativas: [
        { letra: "A", texto: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁵" },
        { letra: "B", texto: "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d³" },
        { letra: "C", texto: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁶" },
        { letra: "D", texto: "1s² 2s² 2p⁶ 3s² 3p⁶ 4s¹ 3d⁴" },
        { letra: "E", texto: "1s² 2s² 2p⁴ 3s² 3p⁶ 4s² 3d⁵" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Os elétrons devem ser removidos primeiramente da camada de valência mais externa (nível 4s) antes do subnível d mais interno.",
        porque: "Átomo neutro de Fe (26 elétrons): [Ar] 4s² 3d⁶. Ao formar Fe³⁺, perdem-se 2 elétrons do subnível mais externo 4s e em seguida 1 elétron do subnível 3d, restando: [Ar] 3d⁵, que é uma configuração de subnível d semipreenchido com estabilidade quântica especial."
      }
    },
    {
      id: "QUI_GER_09",
      origem: "AFA",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Raio Iônico de Espécies Isoeletrônicas",
      tipo: "fechada",
      enunciado: "Considere a série de espécies químicas isoeletrônicas com 10 elétrons: N³⁻, O²⁻, F⁻, Na⁺ e Mg²⁺. A ordem estritamente decrescente de raio iônico dessas espécies é:",
      alternativas: [
        { letra: "A", texto: "N³⁻ > O²⁻ > F⁻ > Na⁺ > Mg²⁺" },
        { letra: "B", texto: "Mg²⁺ > Na⁺ > F⁻ > O²⁻ > N³⁻" },
        { letra: "C", texto: "Na⁺ > Mg²⁺ > N³⁻ > O²⁻ > F⁻" },
        { letra: "D", texto: "Todos possuem raios rigorosamente idênticos." },
        { letra: "E", texto: "F⁻ > O²⁻ > N³⁻ > Mg²⁺ > Na⁺" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Para espécies isoeletrônicas, quanto maior o número de prótons (Z), maior a atração nuclear exercida sobre o mesmo número de elétrons, logo menor é o raio da espécie.",
        porque: "Z(N) = 7, Z(O) = 8, Z(F) = 9, Z(Na) = 11, Z(Mg) = 12. Como o N³⁻ possui apenas 7 prótons atraindo 10 elétrons, ele expande-se ao máximo. O Mg²⁺ tem 12 prótons atraindo 10 elétrons, contraindo-se ao máximo."
      }
    },
    {
      id: "QUI_GER_10",
      origem: "ENEM",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Reação de Neutralização e Aplicação na Agricultura",
      tipo: "fechada",
      enunciado: "O solo do Cerrado brasileiro é naturalmente ácido e rico em alumínio tóxico para muitas culturas vegetais. Para corrigir a acidez do solo e fornecer cálcio e magnésio essenciais à nutrição vegetal, os agrônomos realizam a 'calagem', aplicando pó de:",
      alternativas: [
        { letra: "A", texto: "Calcário dolomítico (CaCO₃ e MgCO₃), um sal de hidrólise básica." },
        { letra: "B", texto: "Ácido sulfúrico concentrado diluído." },
        { letra: "C", texto: "Cloreto de sódio refinado." },
        { letra: "D", texto: "Sulfato de amônio de caráter fortemente ácido." },
        { letra: "E", texto: "Nitrato de potássio puro sem carbonato." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O ânion carbonato (CO₃²⁻) reage com os íons H⁺ do solo ácido (neutralização), formando água e liberando CO₂, elevando o pH para níveis ótimos.",
        porque: "O calcário contém carbonatos de cálcio e magnésio, que neutralizam a acidez e precipitam os íons de alumínio tóxico na forma insolúvel de hidróxido de alumínio."
      }
    },
    {
      id: "QUI_GER_11",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Geometria Molecular com Hibridização e Expansão do Octeto",
      tipo: "fechada",
      enunciado: "A molécula de pentafluoreto de fósforo (PF₅) e a molécula de tetrafluoreto de enxofre (SF₄) apresentam átomos centrais com camada de valência expandida. As geometrias moleculares de PF₅ e SF₄ são, respectivamente:",
      alternativas: [
        { letra: "A", texto: "Bipirâmide trigonal e gangorra (tetraédrica distorcida)." },
        { letra: "B", texto: "Octaédrica e quadrado planar." },
        { letra: "C", texto: "Bipirâmide trigonal e tetraédrica regular." },
        { letra: "D", texto: "Piramidal de base quadrada e em forma de T." },
        { letra: "E", texto: "Trigonal plana e linear." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "P possui 5 elétrons ligantes e 0 par isolado (5 nuvens = bipirâmide trigonal). S possui 6 elétrons de valência (4 ligantes + 1 par isolado = 5 nuvens = gangorra).",
        porque: "No SF₄, o par de elétrons isolado ocupa a posição equatorial mais espaçosa (ângulo de 120° com outros equatoriais), forçando os 4 átomos de flúor a assumirem a forma tridimensional de gangorra (see-saw)."
      }
    },
    {
      id: "QUI_GER_12",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Ciclo de Born-Haber e Energia Reticular",
      tipo: "fechada",
      enunciado: "No ciclo termodinâmico de Born-Haber para a formação de um haleto alcalino iônico sólido M⁺X⁻ a partir de seus elementos nos estados padrão, a etapa responsável pela maior liberação de energia (mais exotérmica) que estabiliza a rede cristalina é a:",
      alternativas: [
        { letra: "A", texto: "Energia reticular (energia de rede cristalina)." },
        { letra: "B", texto: "Entalpia de atomização do metal." },
        { letra: "C", texto: "Primeira energia de ionização do metal." },
        { letra: "D", texto: "Energia de dissociação da ligação halogênio-halogênio." },
        { letra: "E", texto: "Afinidade eletrônica do halogênio." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A energia reticular (U_reticular) mede a atração eletrostática coulombiana coletiva ao aproximar os íons gasosos infinitamente separados para formar o retículo cristalino sólido rígido.",
        porque: "Embora a afinidade eletrônica do halogênio libere energia, seu módulo é modesto (~350 kJ/mol), ao passo que a energia de rede cristalina libera valores da ordem de 700 a 1000+ kJ/mol, sendo o motor termodinâmico fundamental que torna a formação de sais iônicos globalmente exotérmica."
      }
    },
    {
      id: "QUI_GER_13",
      origem: "UNICAMP 2ª Fase",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Forças Intermoleculares e Solubilidade em Vitaminas",
      tipo: "aberta",
      enunciado: "As vitaminas são classificadas em hidrossolúveis (solúveis em água, como a Vitamina C) e lipossolúveis (solúveis em lipídios e solventes apolares, como a Vitamina A). A estrutura da Vitamina C possui quatro grupos hidroxila (-OH) e anel oxigenado, enquanto a Vitamina A possui uma longa cadeia hidrocarbônica com 20 carbonos e apenas um grupo -OH terminal. Explique, com base nas forças intermoleculares, essa diferença de solubilidade.",
      resposta: "Vitamina C interage por múltiplas ligações de hidrogênio com a água; Vitamina A é predominantemente apolar lipofílica.",
      gabarito: {
        letra: "Aberta",
        ancora: "A presença numerosa de hidroxilas (-OH) na vitamina C possibilita intensa formação de ligações de hidrogênio com a água.",
        espera_se: "A vitamina C possui alta densidade de grupos polares hidrofílicos (-OH) capazes de doar e aceitar pontes de hidrogênio, tornando-a hidrossolúvel. Já a vitamina A possui uma extensa cauda hidrofóbica apolar (20 carbonos) cujas fracas interações de dispersão de London prevalecem sobre a única hidroxila polar, tornando-a insolúvel em água e altamente solúvel em gorduras e óleos (lipossolúvel)."
      }
    },
    {
      id: "QUI_GER_14",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Balanceamento Redox pelo Método do Íon-Elétron",
      tipo: "aberta",
      enunciado: "Em meio aquoso ácido, o íon permanganato (MnO₄⁻) oxida o ânion oxalato (C₂O₄²⁻) produzindo íons manganês (Mn²⁺) e gás carbônico (CO₂). Escreva as semirreações de oxidação e redução e apresente a equação iônica global devidamente balanceada.",
      resposta: "2 MnO₄⁻ + 5 C₂O₄²⁻ + 16 H⁺ → 2 Mn²⁺ + 10 CO₂ + 8 H₂O",
      gabarito: {
        letra: "Aberta",
        ancora: "Método do íon-elétron em meio ácido com conservação estrita de massa e carga.",
        espera_se: "1. Semirreação de redução: MnO₄⁻ + 8 H⁺ + 5 e⁻ → Mn²⁺ + 4 H₂O (multiplica por 2).\n2. Semirreação de oxidação: C₂O₄²⁻ → 2 CO₂ + 2 e⁻ (multiplica por 5).\n3. Somando e cancelando os 10 elétrons trocados: 2 MnO₄⁻ + 5 C₂O₄²⁻ + 16 H⁺ → 2 Mn²⁺ + 10 CO₂ + 8 H₂O."
      }
    },
    {
      id: "QUI_GER_15",
      origem: "OBQ (Olimpíada Brasileira de Química)",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Acidez de Oxiácidos e Regra de Pauling",
      tipo: "aberta",
      enunciado: "A força ácida de oxiácidos inorgânicos com fórmula HaXOb pode ser estimada pela regra empírica de Linus Pauling através da diferença (b - a). Aplique essa regra para comparar e justificar a ordem crescente de força ácida entre o ácido hipocloroso (HClO), ácido fosfórico (H₃PO₄) e ácido perclórico (HClO₄), explicando o fundamento eletrônico da estabilização da base conjugada.",
      resposta: "HClO (fraco) < H₃PO₄ (moderado) < HClO₄ (muito forte)",
      gabarito: {
        letra: "Aberta",
        ancora: "Quanto maior o número de oxigênios não ligados a hidrogênio (b - a), maior a atração indutiva de elétrons e maior a dispersão por ressonância da carga negativa do ânion gerado.",
        espera_se: "1. HClO: b - a = 1 - 1 = 0 (ácido fraco, Ka ~ 10⁻⁸).\n2. H₃PO₄: b - a = 4 - 3 = 1 (ácido moderado/médio, Ka1 ~ 10⁻²).\n3. HClO₄: b - a = 4 - 1 = 3 (ácido fortíssimo, Ka >> 1).\nFundamento eletrônico: Os oxigênios terminais exercem fortíssimo efeito indutivo retirador de densidade eletrônica sobre a ligação O-H, enfraquecendo-a e facilitando a ionização do próton H⁺. Além disso, a carga negativa no ânion perclorato (ClO₄⁻) é deslocalizada por ressonância simétrica entre quatro átomos de oxigênio equivalentes, conferindo extraordinária estabilidade à base conjugada."
      }
    }
  ]
};

// -------------------------------------------------------------
// 3. QUÍMICA - ESTEQUIOMETRIA, TERMOQUÍMICA E ELETROQUÍMICA (FÍSICO-QUÍMICA)
// -------------------------------------------------------------
const quimicaFisicoQuimica = {
  disciplina: "Quimica",
  modulo: "Estequiometria_Termoquimica_e_Eletroquimica",
  subpasta: "Fisico_Quimica",
  arquivo_origem: "Questoes_Estequiometria_Termoquimica_e_Eletroquimica.json",
  benchmark_didatico: {
    capitulo: "Físico-Química: Cálculos Estequiométricos, Termoquímica, Cinética, Equilíbrio e Eletroquímica",
    objetivos_aprendizagem: [
      "Realizar cálculos estequiométricos envolvendo reagente limitante, reagente em excesso, grau de pureza de matérias-primas e rendimento percentual da reação.",
      "Calcular variações de entalpia (ΔH) utilizando entalpias padrão de formação, energias de ligação e a Lei de Hess.",
      "Analisar fatores que afetam a velocidade de reação e aplicar a expressão da Lei da Velocidade.",
      "Calcular constantes de equilíbrio químico (Kc e Kp), prever deslocamentos de equilíbrio pelo Princípio de Le Chatelier e calcular fem de pilhas galvânicas e eletrólise quantitativa (Leis de Faraday)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Cálculos Estequiométricos Avançados",
          definicao: "A base da estequiometria são as proporções molares dadas pelos coeficientes estequiométricos da reação balanceada. Na presença de proporções não estequiométricas, identifica-se o reagente limitante (aquele que se esgota primeiro e dita a quantidade máxima teórica de produtos). Reagentes impuros exigem correção prévia: m_pura = m_amostra · (%pureza). O rendimento real da reação é calculado por: Rendimento = (massa_obtida_experimental / massa_teorica_calculada) · 100%."
        },
        {
          termo: "Termoquímica e Lei de Hess",
          definicao: "Processos endotérmicos absorvem calor (ΔH > 0), enquanto exotérmicos liberam calor (ΔH < 0). Pela Lei de Hess, a variação de entalpia depende exclusivamente dos estados inicial e final: ΔH_global = Σ ΔH_etapas. Por entalpias de formação: ΔH°_reacao = Σ n·ΔH°f(produtos) - Σ m·ΔH°f(reagentes). Por energias de ligação (todas positivas para quebra): ΔH_reacao = Σ E_ligacao(quebradas nos reagentes) - Σ E_ligacao(formadas nos produtos)."
        },
        {
          termo: "Equilíbrio Químico e Eletroquímica",
          definicao: "No equilíbrio, as taxas direta e inversa igualam-se: Kc = [produtos]^coef / [reagentes]^coef. O Princípio de Le Chatelier estabelece que o sistema reage opondo-se à perturbação imposta (aumento de temperatura favorece o sentido endotérmico; aumento de pressão favorece o lado de menor volume gasoso). Nas pilhas galvânicas espontâneas (ΔG < 0): o ânodo oxida (polo negativo) e o cátodo reduz (polo positivo), com ddp padrão ΔE° = E°_reducao(cátodo) - E°_reducao(ânodo) > 0. Na eletrólise não-espontânea: Q = i · t = n_e⁻ · F (onde F = 96.500 C/mol de elétrons)."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente: ao usar energias de ligação, inverter os sinais. A quebra de ligações SEMPRE consome energia (+), enquanto a formação de novas ligações SEMPRE libera energia (-). Outro erro clássico em pilhas é multiplicar os potenciais de redução pelo coeficiente estequiométrico ao balancear a equação (potenciais de redução são grandezas intensivas e NUNCA devem ser multiplicados)."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Rendimento e Reagente Limitante na Síntese da Amônia",
      enunciado: "Na síntese de Haber-Bosch, misturam-se 60 g de gás hidrogênio (H₂, massa molar 2 g/mol) com 140 g de gás nitrogênio (N₂, massa molar 28 g/mol) sob alta pressão e temperatura. A equação balanceada é N₂(g) + 3 H₂(g) → 2 NH₃(g). Se a reação produz 85 g de amônia (NH₃, massa molar 17 g/mol), determine o reagente limitante e o rendimento percentual do processo.",
      resolucao_passo_a_passo: "1. Número de mols iniciais: n(H₂) = 60 g / 2 g/mol = 30 mols. n(N₂) = 140 g / 28 g/mol = 5 mols.\n2. Proporção estequiométrica: 1 mol de N₂ precisa de 3 mols de H₂. Logo, 5 mols de N₂ necessitam de 5 · 3 = 15 mols de H₂. Como temos 30 mols de H₂ disponíveis, o N₂ é o reagente limitante (e o H₂ está em excesso).\n3. Rendimento teórico com base no limitante N₂: 1 mol de N₂ produz 2 mols de NH₃. 5 mols de N₂ produzem 10 mols de NH₃. Massa teórica de NH₃ = 10 mols · 17 g/mol = 170 g.\n4. Rendimento percentual da reação: Rendimento = (Massa real obtida / Massa teórica) · 100% = (85 g / 170 g) · 100% = 50%."
    }
  },
  questoes: [
    {
      id: "QUI_FIS_01",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Estequiometria Básica de Combustão Completa",
      tipo: "fechada",
      enunciado: "A combustão completa do gás metano (CH₄ + 2 O₂ → CO₂ + 2 H₂O) é amplamente utilizada no aquecimento de água e na cocção de alimentos. A queima completa de 32 g de gás metano (massa molar = 16 g/mol) consome uma quantidade de gás oxigênio (O₂, massa molar = 32 g/mol) igual a:",
      alternativas: [
        { letra: "A", texto: "128 g (4 mols)" },
        { letra: "B", texto: "64 g (2 mols)" },
        { letra: "C", texto: "32 g (1 mol)" },
        { letra: "D", texto: "256 g (8 mols)" },
        { letra: "E", texto: "96 g (3 mols)" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "1 mol de CH₄ (16 g) reage com 2 mols de O₂ (2 · 32 = 64 g).",
        porque: "Para queimar 32 g de CH₄ (32 / 16 = 2 mols de metano), são necessários 2 · 2 = 4 mols de O₂. Massa de O₂ = 4 mols · 32 g/mol = 128 g."
      }
    },
    {
      id: "QUI_FIS_02",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Lei de Hess e Cálculo de Variação de Entalpia",
      tipo: "fechada",
      enunciado: "Dadas as equações termoquímicas:\n(I) C(grafita) + O₂(g) → CO₂(g)   ΔH₁ = -394 kJ/mol\n(II) CO(g) + 1/2 O₂(g) → CO₂(g)   ΔH₂ = -283 kJ/mol\nA variação de entalpia da reação de combustão incompleta C(grafita) + 1/2 O₂(g) → CO(g) vale:",
      alternativas: [
        { letra: "A", texto: "-111 kJ/mol" },
        { letra: "B", texto: "+111 kJ/mol" },
        { letra: "C", texto: "-677 kJ/mol" },
        { letra: "D", texto: "+677 kJ/mol" },
        { letra: "E", texto: "-55,5 kJ/mol" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Mantém a equação (I) e inverte a equação (II): ΔH_reacao = ΔH₁ - ΔH₂.",
        porque: "C(graf) + O₂(g) → CO₂(g)  (ΔH = -394 kJ). CO₂(g) → CO(g) + 1/2 O₂(g)  (ΔH = +283 kJ). Somando as equações: C(graf) + 1/2 O₂(g) → CO(g) com ΔH = -394 + 283 = -111 kJ/mol."
      }
    },
    {
      id: "QUI_FIS_03",
      origem: "UNICAMP",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Pilha de Daniell e Potencial Padrão",
      tipo: "fechada",
      enunciado: "A clássica pilha de Daniell é montada com semicelas de zinco e cobre imersas em suas respectivas soluções salinas 1 mol/L a 25 °C. Dados os potenciais padrão de redução: Zn²⁺ + 2e⁻ → Zn (E° = -0,76 V) e Cu²⁺ + 2e⁻ → Cu (E° = +0,34 V). A força eletromotriz padrão (ΔE°) e a espécie que se oxida no ânodo são:",
      alternativas: [
        { letra: "A", texto: "+1,10 V e zinco metálico (Zn)." },
        { letra: "B", texto: "+1,10 V e cobre metálico (Cu)." },
        { letra: "C", texto: "+0,42 V e íon zinco (Zn²⁺)." },
        { letra: "D", texto: "-1,10 V e íon cobre (Cu²⁺)." },
        { letra: "E", texto: "+0,76 V e zinco metálico." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O cobre possui maior potencial de redução (+0,34 V > -0,76 V), atuando como cátodo redutor; o zinco possui menor potencial, atuando como ânodo oxidante.",
        porque: "ΔE° = E°_catodo - E°_anodo = (+0,34 V) - (-0,76 V) = +0,34 + 0,76 = +1,10 V. No ânodo ocorre a oxidação espontânea: Zn(s) → Zn²⁺(aq) + 2e⁻."
      }
    },
    {
      id: "QUI_FIS_04",
      origem: "UERJ",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Deslocamento de Equilíbrio e Princípio de Le Chatelier",
      tipo: "fechada",
      enunciado: "Considere o sistema gasoso em equilíbrio contido em um cilindro com êmbolo móvel: N₂O₄(g) [incolor] ⇌ 2 NO₂(g) [castanho-avermelhado]  (ΔH = +57 kJ/mol). Para intensificar a coloração castanha do sistema (aumentar a quantidade de NO₂), deve-se:",
      alternativas: [
        { letra: "A", texto: "Aumentar a temperatura e diminuir a pressão total (aumentar o volume)." },
        { letra: "B", texto: "Diminuir a temperatura e aumentar a pressão." },
        { letra: "C", texto: "Adicionar um catalisador metálico ao cilindro." },
        { letra: "D", texto: "Comprimir o êmbolo bruscamente reduzindo o volume." },
        { letra: "E", texto: "Diminuir a temperatura mantendo o volume constante." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A reação direta é endotérmica (ΔH > 0) e produz expansão molar gasosa (1 mol de gás gera 2 mols de gás).",
        porque: "Pelo Princípio de Le Chatelier: o aquecimento favorece o sentido endotérmico (direto), e a redução de pressão favorece o sentido de maior número de mols de gás (formação de NO₂)."
      }
    },
    {
      id: "QUI_FIS_05",
      origem: "UNESP",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Cinética Química e Papel do Catalisador",
      tipo: "fechada",
      enunciado: "Os conversores catalíticos instalados no escapamento dos automóveis convertem poluentes tóxicos como monóxido de carbono (CO) e óxidos de nitrogênio (NOx) em gases inócuos (CO₂ e N₂). O uso do catalisador acelera essas reações porque:",
      alternativas: [
        { letra: "A", texto: "Oferece um caminho reacional alternativo com menor energia de ativação, sem alterar a entalpia da reação (ΔH)." },
        { letra: "B", texto: "Aumenta a energia de ativação e eleva a temperatura de queima." },
        { letra: "C", texto: "Aumenta o valor numérico da variação de entalpia (ΔH) tornando a reação mais exotérmica." },
        { letra: "D", texto: "Consome-se estequiometricamente como reagente da combustão." },
        { letra: "E", texto: "Desloca o equilíbrio químico aumentando o rendimento teórico máximo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Catalisadores aumentam a velocidade das reações direta e inversa pela redução da barreira de energia de ativação.",
        porque: "O catalisador não altera a entalpia dos reagentes nem dos produtos (ΔH permanece constante), nem altera a constante de equilíbrio; ele apenas reduz o tempo necessário para o sistema atingir o equilíbrio."
      }
    },
    {
      id: "QUI_FIS_06",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Eletrólise Quantitativa e Primeira Lei de Faraday",
      tipo: "fechada",
      enunciado: "Uma peça metálica é submetida a um processo de niquelação galvânica por eletrólise aquosa de sulfato de níquel (NiSO₄). A redução do íon níquel é descrita por Ni²⁺(aq) + 2e⁻ → Ni(s). Aplica-se uma corrente constante de 9,65 A durante 1.000 segundos. Dado: constante de Faraday = 96.500 C/mol de elétrons; massa molar do níquel = 58,7 g/mol. A massa de níquel metálico depositada na peça é:",
      alternativas: [
        { letra: "A", texto: "2,935 g" },
        { letra: "B", texto: "5,870 g" },
        { letra: "C", texto: "1,468 g" },
        { letra: "D", texto: "11,74 g" },
        { letra: "E", texto: "0,587 g" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Carga total Q = i · t = 9,65 A · 1.000 s = 9.650 C.",
        porque: "Número de mols de elétrons: n_e⁻ = 9.650 C / 96.500 C/mol = 0,10 mol de e⁻. Como cada mol de Ni²⁺ consome 2 mols de elétrons, depositam-se 0,10 / 2 = 0,05 mol de Ni. Massa depositada = 0,05 mol · 58,7 g/mol = 2,935 g."
      }
    },
    {
      id: "QUI_FIS_07",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Cálculo de pH e Equilíbrio de Ácido Fraco",
      tipo: "fechada",
      enunciado: "Uma solução aquosa de ácido acético (CH₃COOH) de concentração 0,1 mol/L encontra-se ionizada a 25 °C. Sabendo que a constante de ionização ácida é Ka = 1,8 × 10⁻⁵ e admitindo que a ionização é pequena (1 - α ≈ 1), a concentração de íons H⁺ e o pH aproximado da solução são: (Dado: √1,8 ≈ 1,34; log 1,34 ≈ 0,13)",
      alternativas: [
        { letra: "A", texto: "[H⁺] = 1,34 × 10⁻³ mol/L e pH ≈ 2,87" },
        { letra: "B", texto: "[H⁺] = 1,8 × 10⁻³ mol/L e pH = 3,00" },
        { letra: "C", texto: "[H⁺] = 0,1 mol/L e pH = 1,00" },
        { letra: "D", texto: "[H⁺] = 1,34 × 10⁻² mol/L e pH ≈ 1,87" },
        { letra: "E", texto: "[H⁺] = 1,8 × 10⁻⁵ mol/L e pH = 4,74" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Lei da diluição de Ostwald para eletrólitos fracos: [H⁺] = √(Ka · M).",
        porque: "[H⁺] = √(1,8 × 10⁻⁵ · 0,1) = √(1,8 × 10⁻⁶) = √1,8 × 10⁻³ = 1,34 × 10⁻³ mol/L. pH = -log(1,34 × 10⁻³) = 3 - log(1,34) = 3 - 0,13 = 2,87."
      }
    },
    {
      id: "QUI_FIS_08",
      origem: "EsPCEx",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Produto de Solubilidade (Kps) e Efeito do Íon Comum",
      tipo: "fechada",
      enunciado: "O produto de solubilidade do cloreto de prata (AgCl) em água pura a 25 °C é Kps = 1,6 × 10⁻¹⁰. Se adicionarmos AgCl sólido a uma solução aquosa de cloreto de sódio (NaCl) de concentração 0,1 mol/L, a solubilidade molar do AgCl nessa solução salina será:",
      alternativas: [
        { letra: "A", texto: "1,6 × 10⁻⁹ mol/L" },
        { letra: "B", texto: "1,26 × 10⁻⁵ mol/L" },
        { letra: "C", texto: "1,6 × 10⁻¹⁰ mol/L" },
        { letra: "D", texto: "4,0 × 10⁻⁵ mol/L" },
        { letra: "E", texto: "1,6 × 10⁻¹¹ mol/L" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Efeito do íon comum (Cl⁻ já presente em alta concentração da dissociação do NaCl).",
        porque: "No equilíbrio: AgCl(s) ⇌ Ag⁺(aq) + Cl⁻(aq). Como [Cl⁻] provém majoritariamente do NaCl (0,1 mol/L): Kps = [Ag⁺] · [Cl⁻] => 1,6 × 10⁻¹⁰ = S · (0,1) => S = 1,6 × 10⁻¹⁰ / 0,1 = 1,6 × 10⁻⁹ mol/L (a solubilidade cai drasticamente em comparação com a água pura, onde S = √Kps = 1,26 × 10⁻⁵ mol/L)."
      }
    },
    {
      id: "QUI_FIS_09",
      origem: "AFA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Energia Livre de Gibbs e Espontaneidade de Reações",
      tipo: "fechada",
      enunciado: "Uma reação química endotérmica (ΔH > 0) que ocorre com aumento de desordem do sistema (aumento de entropia, ΔS > 0) apresenta qual comportamento termodinâmico de espontaneidade?",
      alternativas: [
        { letra: "A", texto: "É não-espontânea em baixas temperaturas e torna-se espontânea a partir de uma dada temperatura elevada (T > ΔH / ΔS)." },
        { letra: "B", texto: "É espontânea em qualquer temperatura." },
        { letra: "C", texto: "É não-espontânea em qualquer temperatura." },
        { letra: "D", texto: "É espontânea apenas no zero absoluto." },
        { letra: "E", texto: "Ocorre com diminuição de energia livre exclusivamente sob resfriamento extremo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Relação de Gibbs-Helmholtz: ΔG = ΔH - T·ΔS. Critério de espontaneidade: ΔG < 0.",
        porque: "Como ΔH > 0 e ΔS > 0, o termo (-T·ΔS) é negativo. Em temperaturas suficientemente altas (T > ΔH/ΔS), o produto T·ΔS supera o valor de ΔH, tornando ΔG negativo (processo espontâneo, como na fusão do gelo acima de 0 °C)."
      }
    },
    {
      id: "QUI_FIS_10",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Estequiometria com Pureza de Calcário",
      tipo: "fechada",
      enunciado: "Uma indústria de cimento aquece 500 kg de uma amostra de calcário com 80% de pureza em carbonato de cálcio (CaCO₃, massa molar = 100 g/mol) para produzir cal virgem (CaO, massa molar = 56 g/mol) pela reação térmica de calcinação: CaCO₃(s) → CaO(s) + CO₂(g). Supondo rendimento de 100% na decomposição, a massa de cal virgem obtida é:",
      alternativas: [
        { letra: "A", texto: "224 kg" },
        { letra: "B", texto: "280 kg" },
        { letra: "C", texto: "500 kg" },
        { letra: "D", texto: "180 kg" },
        { letra: "E", texto: "320 kg" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Massa pura de reagente: m(CaCO₃) = 500 kg · 0,80 = 400 kg.",
        porque: "Pela estequiometria: 100 g de CaCO₃ produzem 56 g de CaO. Assim: 400 kg de CaCO₃ produzem (400 · 56) / 100 = 4 · 56 = 224 kg de CaO."
      }
    },
    {
      id: "QUI_FIS_11",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Equação de Nernst e Potencial Fora do Estado Padrão",
      tipo: "fechada",
      enunciado: "Para a semirreação de redução 2 H⁺(aq) + 2e⁻ ⇌ H₂(g, 1 atm), cujo potencial padrão de redução é E° = 0,00 V a 25 °C, o potencial de eletrodo quando imerso em uma solução com pH = 4,0 sob pressão de 1 atm de gás H₂ é dado por (adote 2,303·R·T/F = 0,059 V):",
      alternativas: [
        { letra: "A", texto: "-0,236 V" },
        { letra: "B", texto: "+0,236 V" },
        { letra: "C", texto: "-0,118 V" },
        { letra: "D", texto: "+0,118 V" },
        { letra: "E", texto: "0,00 V" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Equação de Nernst: E = E° - (0,059 / n) · log(Q). Aqui Q = P(H₂) / [H⁺]².",
        porque: "pH = 4 => [H⁺] = 10⁻⁴ M. Logo, [H⁺]² = 10⁻⁸. Q = 1 / 10⁻⁸ = 10⁸. E = 0,00 - (0,059 / 2) · log(10⁸) = - (0,059 / 2) · 8 = - 0,059 · 4 = -0,236 V."
      }
    },
    {
      id: "QUI_FIS_12",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Lei de Velocidade Integrada de Primeira Ordem e Meia-Vida",
      tipo: "fechada",
      enunciado: "A decomposição de uma substância farmacêutica em solução aquosa segue cinética química de primeira ordem com constante de velocidade k = 6,93 × 10⁻³ min⁻¹. O tempo de meia-vida (t_1/2) desse fármaco e o tempo necessário para que 87,5% da substância inicial se decomponha são, respectivamente: (Dado: ln 2 ≈ 0,693)",
      alternativas: [
        { letra: "A", texto: "100 minutos e 300 minutos" },
        { letra: "B", texto: "50 minutos e 150 minutos" },
        { letra: "C", texto: "100 minutos e 200 minutos" },
        { letra: "D", texto: "70 minutos e 210 minutos" },
        { letra: "E", texto: "10 minutos e 30 minutos" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Para reação de 1ª ordem: t_1/2 = ln 2 / k = 0,693 / 6,93 × 10⁻³ = 100 minutos.",
        porque: "Quando 87,5% se decompõe, restam 12,5% (1/8 da quantidade original). Como (1/2)³ = 1/8, decorreram exatamente 3 tempos de meia-vida: t = 3 · 100 min = 300 minutos."
      }
    },
    {
      id: "QUI_FIS_13",
      origem: "UNICAMP 2ª Fase",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Titulação Ácido-Base e Ponto de Equivalência",
      tipo: "aberta",
      enunciado: "Uma alíquota de 25,0 mL de uma solução aquosa de ácido clorídrico (HCl) de concentração desconhecida é titulada com uma solução padrão de hidróxido de sódio (NaOH) 0,10 mol/L. O ponto de viragem do indicador fenolftaleína ocorre após a adição de exatamente 20,0 mL da base. Calcule a concentração molar da solução de HCl e a massa em gramas de HCl contida em 500 mL dessa solução (massa molar do HCl = 36,5 g/mol).",
      resposta: "[HCl] = 0,08 mol/L e Massa em 500 mL = 1,46 g",
      gabarito: {
        letra: "Aberta",
        ancora: "No ponto de equivalência de ácido e base monopróticos: n_acido = n_base => M_acido · V_acido = M_base · V_base.",
        espera_se: "1. M_acido · 25,0 mL = 0,10 mol/L · 20,0 mL => M_acido = 2,0 / 25,0 = 0,08 mol/L.\n2. Número de mols em 500 mL (0,5 L): n = 0,08 mol/L · 0,5 L = 0,04 mol de HCl.\n3. Massa em 500 mL: m = 0,04 mol · 36,5 g/mol = 1,46 g."
      }
    },
    {
      id: "QUI_FIS_14",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Constante de Equilíbrio em Fase Gasosa (Kp e Kc)",
      tipo: "aberta",
      enunciado: "Em um recipiente fechado de volume constante a 500 K, introduz-se pentacloreto de fósforo (PCl₅) gasoso sob pressão inicial de 1,0 atm. Estabelecido o equilíbrio PCl₅(g) ⇌ PCl₃(g) + Cl₂(g), verifica-se que a pressão total no interior do recipiente subiu para 1,4 atm. Calcule as pressões parciais de cada gás no equilíbrio e determine o valor da constante Kp sob essa temperatura.",
      resposta: "P(PCl₅) = 0,6 atm; P(PCl₃) = 0,4 atm; P(Cl₂) = 0,4 atm e Kp ≈ 0,267 atm",
      gabarito: {
        letra: "Aberta",
        ancora: "Tabela de equilíbrio de pressões parciais: PCl₅ inicial = 1,0 atm; no equilíbrio: (1,0 - x) + x + x = P_total.",
        espera_se: "1. Pressão total: 1,0 + x = 1,4 atm => x = 0,4 atm.\n2. Pressões parciais no equilíbrio: P(PCl₃) = 0,4 atm; P(Cl₂) = 0,4 atm; P(PCl₅) = 1,0 - 0,4 = 0,6 atm.\n3. Cálculo de Kp: Kp = [P(PCl₃) · P(Cl₂)] / P(PCl₅) = (0,4 · 0,4) / 0,6 = 0,16 / 0,6 = 4 / 15 ≈ 0,267 atm."
      }
    },
    {
      id: "QUI_FIS_15",
      origem: "OBQ (Olimpíada Brasileira de Química)",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Soluções-Tampão e Equação de Henderson-Hasselbalch",
      tipo: "aberta",
      enunciado: "Deseja-se preparar uma solução-tampão com pH = 5,0 misturando-se ácido acético (CH₃COOH, pKa = 4,74) e acetato de sódio (CH₃COONa). (a) Escreva a equação de Henderson-Hasselbalch que rege o sistema. (b) Calcule a razão molar necessária [Acetato] / [Ácido Acético]. (c) Explique sucintamente o mecanismo químico de tamponamento quando pequenas quantidades de ácido forte (H⁺) são adicionadas ao sistema.",
      resposta: "(a) pH = pKa + log([A⁻]/[HA]); (b) Razão molar ≈ 1,82; (c) O ânion acetato consome o excesso de H⁺ regenerando ácido fraco não-ionizado.",
      gabarito: {
        letra: "Aberta",
        ancora: "Equação de Henderson-Hasselbalch para tampões de ácido fraco e seu sal correspondente.",
        espera_se: "1. pH = pKa + log([Acetato] / [Ácido]).\n2. 5,0 = 4,74 + log([Acetato] / [Ácido]) => log([Acetato] / [Ácido]) = 0,26 => [Acetato] / [Ácido] = 10^(0,26) ≈ 1,82.\n3. Mecanismo de tamponamento: Ao adicionar íons H⁺ externos, eles reagem prontamente com a base conjugada presente no meio: CH₃COO⁻(aq) + H⁺(aq) → CH₃COOH(aq). Como o produto formado é um ácido fraco fracamente ionizado, a concentração de H⁺ livre sofre variação desprezível, estabilizando o pH do meio biológico ou laboratorial."
      }
    }
  ]
};

// -------------------------------------------------------------
// 4. QUÍMICA - MILITARES E OLIMPÍADAS (OBQ, IME, ITA)
// -------------------------------------------------------------
const quimicaMilitares = {
  disciplina: "Quimica",
  modulo: "Quimica_OBQ_IME_ITA",
  subpasta: "Militares_e_Olimpiadas",
  arquivo_origem: "Questoes_Quimica_OBQ_IME_ITA.json",
  benchmark_didatico: {
    capitulo: "Química Superior: Química Orgânica Mecanística, Teoria dos Orbitais Moleculares, Termodinâmica Química e Cinética Avançada",
    objetivos_aprendizagem: [
      "Compreender mecanismos de reações orgânicas clássicas (SN1, SN2, E1, E2, Adição Eletrofílica e Substituição Eletrofílica Aromática).",
      "Aplicar a Teoria dos Orbitais Moleculares (TOM) e a Teoria da Ligação de Valência (TLV) para prever ordem de ligação, paramagnetismo e aromaticidade (Regra de Hückel).",
      "Resolver problemas complexos de equilíbrio iônico e simultâneo (hidrólise de sais anfipróticos, solubilidade com complexação por ligantes).",
      "Analisar diagramas termodinâmicos de Pourbaix e de Ellingham e calcular potenciais de pilhas de concentração e sobretensão em processos eletroquímicos."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Mecanismos de Reações Orgânicas e Isomeria Óptica",
          definicao: "Nas substituições nucleofílicas: SN2 ocorre em etapa única concertada com inversão de configuração de Walden (favorecida por substratos primários e nucleófilos fortes); SN1 ocorre em duas etapas via intermediário carbocátion planar com racemização (favorecida por substratos terciários e solventes próticos). Na estereoquímica: moléculas quirais (com carbono assimétrico e ausência de plano de simetria) apresentam isomeria óptica (enantiômeros dextrogiro e levogiro, com rotações ópticas de mesmo módulo e sinais opostos). Diastereoisômeros são estereoisômeros que não são imagens especulares e possuem propriedades físicas diferentes."
        },
        {
          termo: "Aromaticidade e Regra de Hückel",
          definicao: "Um composto é classificado como aromático quando satisfaz quatro critérios rigorosos: (1) estrutura cíclica; (2) planaridade (hibridização sp² ou sp em todos os átomos do anel); (3) sistema completamente conjugado com sobreposição contínua de orbitais p paralelos; e (4) presença de (4n + 2) elétrons π deslocalizados (onde n é um número inteiro não-negativo: 2, 6, 10, 14...). Compostos que atendem aos três primeiros critérios, mas possuem 4n elétrons π (como ciclobutadieno), são especialmente instáveis (antiaromáticos)."
        },
        {
          termo: "Teoria dos Orbitais Moleculares (TOM) e Paramagnetismo",
          definicao: "A combinação linear de orbitais atômicos (LCAO) forma orbitais moleculares ligantes (menor energia) e antiligantes (maior energia). A ordem de ligação é calculada por OL = (N_elétrons_ligantes - N_elétrons_antiligantes) / 2. A substância é paramagnética se possuir elétrons desemparelhados em seus orbitais moleculares (como o O₂, que possui 2 elétrons desemparelhados nos orbitais π*2py e π*2pz, explicando experimentalmente sua atração por ímãs, o que a teoria clássica de Lewis não previa)."
        }
      ],
      atencao_ponto_cego: "Ponto cego militar crítico: tentar explicar o paramagnetismo da molécula de O₂ usando a estrutura de Lewis tradicional. Pela TLV ou Lewis clássico, todos os elétrons aparecem emparelhados (O=O), falhando catastroficamente; apenas o diagrama de orbitais moleculares explica os dois elétrons desemparelhados nos orbitais antiligantes π*."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Aromaticidade do Cátion Ciclopropenila e do Ânion Ciclopentadienila",
      enunciado: "Aplique a Regra de Hückel e critérios de aromaticidade para determinar se o cátion ciclopropenila (C₃H₃⁺) e o ânion ciclopentadienila (C₅H₅⁻) são aromáticos, antiaromáticos ou não-aromáticos.",
      resolucao_passo_a_passo: "1. Cátion ciclopropenila (C₃H₃⁺): Trata-se de um anel de 3 membros plano. Há uma dupla ligação (2 elétrons π) e um carbono com carga positiva que possui um orbital p vazio perpendicular ao plano. Todos os 3 carbonos têm hibridização sp², garantindo conjugação cíclica completa. Número de elétrons π = 2. Teste da regra de Hückel: 4n + 2 = 2 => 4n = 0 => n = 0 (inteiro válido). Conclusão: É um íon Aromático de altíssima estabilidade termodinâmica.\n2. Ânion ciclopentadienila (C₅H₅⁻): Anel plano de 5 membros com duas duplas ligações conjugadas (4 elétrons π) e um carbono com par de elétrons isolado carregado negativamente. Esse par de elétrons ocupa um orbital p deslocalizado, totalizando 4 + 2 = 6 elétrons π no ciclo planar conjugado. Teste da regra de Hückel: 4n + 2 = 6 => 4n = 4 => n = 1 (inteiro válido). Conclusão: É uma espécie intensamente Aromática, o que explica por que o ciclopentadieno tem pKa extraordinariamente baixo (~16) para um hidrocarboneto."
    }
  },
  questoes: [
    {
      id: "QUI_MIL_01",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Teoria dos Orbitais Moleculares e Paramagnetismo do O₂",
      tipo: "fechada",
      enunciado: "De acordo com a Teoria dos Orbitais Moleculares (TOM), a molécula de gás oxigênio (O₂) em seu estado fundamental possui ordem de ligação e comportamento magnético dados por:",
      alternativas: [
        { letra: "A", texto: "Ordem de ligação 2 e caráter paramagnético, com 2 elétrons desemparelhados em orbitais antiligantes π*." },
        { letra: "B", texto: "Ordem de ligação 2 e caráter diamagnético, com todos os elétrons emparelhados." },
        { letra: "C", texto: "Ordem de ligação 3 e caráter ferromagnético." },
        { letra: "D", texto: "Ordem de ligação 1 e caráter paramagnético." },
        { letra: "E", texto: "Ordem de ligação 2,5 e caráter diamagnético." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Distribuição eletrônica dos orbitais moleculares de valência para O₂: σ2s² σ*2s² σ2pz² π2px² π2py² π*2px¹ π*2py¹.",
        porque: "Ordem de ligação = (8 elétrons ligantes - 4 elétrons antiligantes) / 2 = 4 / 2 = 2. Como existem 2 elétrons desemparelhados (um em cada orbital degenerate π*), a molécula é paramagnética."
      }
    },
    {
      id: "QUI_MIL_02",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Mecanismo SN1 vs SN2 em Haletos de Alquila",
      tipo: "fechada",
      enunciado: "Ao reagir o (R)-2-bromobutano opticamente puro com hidróxido de sódio em dimetilsulfóxido (DMSO, solvente aprótico polar), o produto principal obtido e a estereoquímica do carbono quiral resultante serão:",
      alternativas: [
        { letra: "A", texto: "(S)-butan-2-ol com inversão de configuração óptica completa (mecanismo SN2)." },
        { letra: "B", texto: "Mistura racêmica de butan-2-ol sem atividade óptica (mecanismo SN1)." },
        { letra: "C", texto: "(R)-butan-2-ol com retenção estrita de configuração (mecanismo SNi)." },
        { letra: "D", texto: "But-2-eno exclusivamente, sem produtos de substituição." },
        { letra: "E", texto: "1-bromobutano por transposição intramolecular de carbocátion." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O nucleófilo forte (OH⁻) e o solvente polar aprótico (DMSO) favorecem fortemente o mecanismo bimolecular SN2.",
        porque: "No ataque SN2, o nucleófilo ataca o carbono eletrofílico pela face oposta ao grupo abandonador (ataque dorsal 'backside attack'), gerando o estado de transição pentacoordenado e promovendo a clássica inversão de Walden da quiralidade: o enantiômero (R) converte-se estequiometricamente no enantiômero (S)."
      }
    },
    {
      id: "QUI_MIL_03",
      origem: "OBQ (Olimpíada Brasileira de Química)",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Aromaticidade e Heterociclos",
      tipo: "fechada",
      enunciado: "Considere os seguintes compostos cíclicos: I. Benzeno; II. Piridina; III. Pirrol; IV. Ciclo-octatetraeno (COT). Quais deles são formalmente aromáticos segundo a Regra de Hückel?",
      alternativas: [
        { letra: "A", texto: "I, II e III apenas." },
        { letra: "B", texto: "I e II apenas." },
        { letra: "C", texto: "I, II, III e IV." },
        { letra: "D", texto: "I e IV apenas." },
        { letra: "E", texto: "II e III apenas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "I (benzeno: 6 elétrons π, aromático); II (piridina: 6 elétrons π no anel com o par isolado do N sp² no plano, aromático); III (pirrol: 4 elétrons π das duplas + par isolado do N em orbital p deslocalizado = 6 elétrons π, aromático).",
        porque: "O ciclo-octatetraeno (IV) possui 8 elétrons π (4n, violando Hückel); para evitar a instabilidade da antiaromaticidade, ele adota conformação não-planar em forma de banheira (tub-shaped), sendo classificado como não-aromático."
      }
    },
    {
      id: "QUI_MIL_04",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Cinética Química e Lei de Arrhenius",
      tipo: "fechada",
      enunciado: "Para uma dada reação química em fase gasosa, a constante de velocidade quadruplica (k₂ = 4·k₁) quando a temperatura é elevada de 300 K para 320 K. Adotando R = 8,31 J/(mol·K) e ln 4 ≈ 1,386, a energia de ativação dessa reação vale aproximadamente:",
      alternativas: [
        { letra: "A", texto: "55,3 kJ/mol" },
        { letra: "B", texto: "27,6 kJ/mol" },
        { letra: "C", texto: "110,6 kJ/mol" },
        { letra: "D", texto: "83,1 kJ/mol" },
        { letra: "E", texto: "14,5 kJ/mol" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Equação de Arrhenius na forma linearizada de dois pontos: ln(k₂ / k₁) = (Ea / R) · [(1 / T₁) - (1 / T₂)].",
        porque: "1,386 = (Ea / 8,31) · [(1 / 300) - (1 / 320)] = (Ea / 8,31) · [20 / (96.000)] = (Ea / 8,31) · (1 / 4.800). Ea = 1,386 · 8,31 · 4.800 ≈ 55.285 J/mol ≈ 55,3 kJ/mol."
      }
    },
    {
      id: "QUI_MIL_05",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Equilíbrio de Complexação e Solubilidade de Precipitado",
      tipo: "fechada",
      enunciado: "O cloreto de prata (AgCl, Kps = 1,8 × 10⁻¹⁰) é quase insolúvel em água pura, mas dissolve-se prontamente em excesso de solução aquosa concentrada de amônia (NH₃). Essa dissolução acentuada ocorre devido à:",
      alternativas: [
        { letra: "A", texto: "Formação do íon complexo estável diaminprata(I), [Ag(NH₃)₂]⁺, que consome íons Ag⁺ livres deslocando o equilíbrio de solubilidade para a direita." },
        { letra: "B", texto: "Redução dos cátions prata a prata coloidal metálica pelo nitrogênio." },
        { letra: "C", texto: "Precipitação de cloreto de amônio gasoso inflamável." },
        { letra: "D", texto: "Aumento da constante Kps do AgCl pela polaridade da água." },
        { letra: "E", texto: "Neutralização ácido-base com liberação violenta de cloro gasoso." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Equilíbrios simultâneos de solubilidade e formação de complexo: AgCl(s) ⇌ Ag⁺ + Cl⁻ e Ag⁺ + 2 NH₃ ⇌ [Ag(NH₃)₂]⁺ (Kf ~ 1,7 × 10⁷).",
        porque: "A amônia atua como base de Lewis doando pares eletrônicos para os orbitais vazios do cátion Ag⁺ (ácido de Lewis). A constante de formação do complexo é enorme, sequestrando quase a totalidade dos íons Ag⁺ livres e forçando o sal sólido a se dissolver totalmente."
      }
    },
    {
      id: "QUI_MIL_06",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Substituição Eletrofílica Aromática e Efeitos Dirigentes",
      tipo: "fechada",
      enunciado: "A nitração do anisol (metoxibenzeno, C₆H₅OCH₃) utilizando mistura sulfonítrica concentrada (HNO₃ + H₂SO₄) fornece como produtos principais os isômeros orto e para. O grupo metóxi (-OCH₃) atua como:",
      alternativas: [
        { letra: "A", texto: "Ativante forte e dirigente orto/para, devido à ressonância positiva (+R / +M) do par de elétrons isolado do oxigênio deslocalizado no anel." },
        { letra: "B", texto: "Desativante fraco e dirigente meta, devido ao efeito indutivo negativo do oxigênio." },
        { letra: "C", texto: "Ativante moderado e dirigente meta exclusivo." },
        { letra: "D", texto: "Grupo inerte que impede reações de substituição no núcleo aromático." },
        { letra: "E", texto: "Desativante forte por impedimento estérico severo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Embora o oxigênio seja eletronegativo (-I), seu efeito de ressonância doador (+M) é predominante, estabilizando o complexo de Wheland nas posições orto e para.",
        porque: "Nas formas de ressonância do intermediário nas posições orto e para, surge uma estrutura com todos os átomos com o octeto completo graças à doação do par do oxigênio, conferindo estabilização excepcional que não ocorre na posição meta."
      }
    },
    {
      id: "QUI_MIL_07",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Eletrólise Ígnea e Produção do Alumínio (Processo Hall-Héroult)",
      tipo: "fechada",
      enunciado: "Na produção industrial do alumínio metálico pelo processo Hall-Héroult, a alumina pura (Al₂O₃) possui ponto de fusão superior a 2.000 °C. Para viabilizar a eletrólise ígnea a cerca de 950 °C, adiciona-se criolita (Na₃AlF₆), que atua fundamentalmente como:",
      alternativas: [
        { letra: "A", texto: "Solvente fundente que diminui o ponto de fusão da mistura eutética e aumenta a condutividade elétrica do banho." },
        { letra: "B", texto: "Catalisador homogêneo que oxida o oxigênio a gás ozônio." },
        { letra: "C", texto: "Agente redutor químico que substitui a passagem de corrente elétrica." },
        { letra: "D", texto: "Inibidor de corrosão para proteger as paredes de ferro da cuba eletrolítica." },
        { letra: "E", texto: "Eletrólito de sacrifício que se consome formando gás flúor tóxico." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A criolita atua como fundente, baixando o ponto de fusão operacional de 2.050 °C para ~950 °C.",
        porque: "Essa redução drástica de temperatura viabiliza energeticamente a produção mundial de alumínio, além de fornecer elevada condutividade iônica no estado líquido."
      }
    },
    {
      id: "QUI_MIL_08",
      origem: "OBQ Fase Nacional",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Acidez de Fenóis Substituídos e Efeitos Eletrônicos",
      tipo: "fechada",
      enunciado: "Considere os compostos: I. Fenol (pKa = 9,95); II. 4-Nitrofenol (pKa = 7,15); III. 2,4,6-Trinitrofenol (Ácido pícrico, pKa = 0,38). A acentuada elevação da acidez do ácido pícrico em relação ao fenol comum é explicada pelo:",
      alternativas: [
        { letra: "A", texto: "Forte efeito indutivo atrator (-I) e de ressonância atratora de elétrons (-M) dos três grupos nitro nas posições orto e para, estabilizando fortemente a base conjugada (fenolato)." },
        { letra: "B", texto: "Aumento do caráter básico do anel aromático que neutraliza prótons." },
        { letra: "C", texto: "Efeito hiperconjugativo doador que fortalece a ligação oxigênio-hidrogênio." },
        { letra: "D", texto: "Fato de os grupos nitro impedirem a deslocalização dos elétrons π." },
        { letra: "E", texto: "Caráter apolar induzido que repele a solvatação por moléculas de água." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Os grupos -NO₂ são fortíssimos desativantes do anel (-I e -M), dispersando intensamente a carga negativa do ânion fenolato.",
        porque: "Nas posições 2, 4 e 6 (ambas as ortos e a para), a carga negativa deslocalizada do oxigênio alcança diretamente os átomos de nitrogênio dos grupos nitro, gerando diversas estruturas de ressonância adicionais altamente estáveis, tornando o ácido pícrico quase tão forte quanto um ácido mineral."
      }
    },
    {
      id: "QUI_MIL_09",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Diagrama de Fases da Água e Inclinação da Curva Sólido-Líquido",
      tipo: "fechada",
      enunciado: "No diagrama de fases da água pura (P×T), a curva de equilíbrio sólido-líquido (linha de fusão) possui inclinação negativa (dP/dT < 0). Pela equação termodinâmica de Clapeyron [dP/dT = ΔH_fus / (T · ΔV_fus)], essa inclinação peculiar decorre do fato de que:",
      alternativas: [
        { letra: "A", texto: "A água se expande ao congelar, de modo que o volume molar do gelo é maior do que o da água líquida (ΔV_fus < 0)." },
        { letra: "B", texto: "A fusão do gelo é um processo exotérmico no estado padrão." },
        { letra: "C", texto: "A densidade do gelo é superior à densidade da água em qualquer pressão." },
        { letra: "D", texto: "A entalpia de vaporização da água é menor do que a sua entalpia de sublimação." },
        { letra: "E", texto: "O ponto triplo da água ocorre em temperatura superior a 100 °C." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Variação de volume na fusão: ΔV_fus = V_liquido - V_solido < 0 para a água.",
        porque: "Como ΔH_fus > 0 e T > 0, o sinal de dP/dT é determinado exclusivamente pelo sinal de ΔV_fus. Como a água líquida é mais densa que o gelo (menor volume molar), ΔV_fus é negativo, tornando dP/dT < 0. Por isso, um aumento de pressão sobre o gelo provoca sua fusão a temperaturas abaixo de 0 °C."
      }
    },
    {
      id: "QUI_MIL_10",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Reação de Cannizzaro em Aldeídos sem Hidrogênio Alfa",
      tipo: "fechada",
      enunciado: "O benzaldeído (C₆H₅CHO), quando submetido a refluxo em meio fortemente alcalino aquoso com hidróxido de potássio concentrado (KOH 50%), não sofre condensação aldólica, sofrendo a reação de Cannizzaro. Os produtos dessa dismutação (auto-redox) são:",
      alternativas: [
        { letra: "A", texto: "Álcool benzílico e benzoato de potássio." },
        { letra: "B", texto: "Ácido benzoico e benzeno gasoso." },
        { letra: "C", texto: "Tolueno e difenilmetano." },
        { letra: "D", texto: "Benzofenona e água." },
        { letra: "E", texto: "Estilbeno e acetato de potássio." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A reação de Cannizzaro é uma desproporção redox característica de aldeídos que não possuem hidrogênio no carbono alfa.",
        porque: "Uma molécula de benzaldeído é oxidada a ânion carboxilato (benzoato de potássio), enquanto a outra é reduzida a álcool primário (álcool benzílico): 2 C₆H₅CHO + KOH → C₆H₅COOK + C₆H₅CH₂OH."
      }
    },
    {
      id: "QUI_MIL_11",
      origem: "OBQ Fase Nacional",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Isomeria Conformacional do Ciclo-hexano",
      tipo: "fechada",
      enunciado: "Para o cis-1,4-dimetilciclo-hexano e o trans-1,4-dimetilciclo-hexano em sua conformação de cadeira mais estável a 25 °C, as posições dos dois grupos metila (-CH₃) são, respectivamente:",
      alternativas: [
        { letra: "A", texto: "Um axial e um equatorial (a,e) para o cis; ambos equatoriais (e,e) para o trans." },
        { letra: "B", texto: "Ambos equatoriais para o cis; um axial e um equatorial para o trans." },
        { letra: "C", texto: "Ambos axiais para o trans; ambos equatoriais para o cis." },
        { letra: "D", texto: "Ambos axiais para ambos os isômeros." },
        { letra: "E", texto: "Em conformação de barco sem distinção axial-equatorial." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "No anel ciclo-hexânico nas posições 1,4: cis requer uma ligação 'para cima' e outra 'para cima', resultando em (a, e). Trans requer uma 'para cima' e uma 'para baixo', permitindo a conformação (e, e) sem interações 1,3-diaxiais desfavoráveis.",
        porque: "O isômero trans-1,4-dimetilciclo-hexano pode adotar a conformação di-equatorial (e, e), sendo consideravelmente mais estável do que o isômero cis, que obrigatoriamente mantém um dos grupos metila na posição axial (a, e)."
      }
    },
    {
      id: "QUI_MIL_12",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Cromatografia e Fator de Retenção (Rf)",
      tipo: "fechada",
      enunciado: "Em uma cromatografia em camada delgada (CCD) usando sílica-gel (fase estacionária polar) e uma mistura de hexano/acetato de etila (fase móvel apolar), aplica-se uma mistura de três substâncias: I. Antraceno (hidrocarboneto puramente apolar); II. Benzaldeído (moderadamente polar); III. Ácido benzoico (fortemente polar). A ordem crescente dos fatores de retenção (Rf) observados na placa é:",
      alternativas: [
        { letra: "A", texto: "Rf(III) < Rf(II) < Rf(I)" },
        { letra: "B", texto: "Rf(I) < Rf(II) < Rf(III)" },
        { letra: "C", texto: "Rf(II) < Rf(III) < Rf(I)" },
        { letra: "D", texto: "Rf(I) = Rf(II) = Rf(III)" },
        { letra: "E", texto: "Rf(III) < Rf(I) < Rf(II)" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Substâncias polares interagem fortemente com a fase estacionária polar (sílica) e movem-se pouco (menor Rf). Substâncias apolares interagem com a fase móvel e viajam mais longe (maior Rf).",
        porque: "O ácido benzoico (III) faz ligações de hidrogênio com a sílica, ficando retido próximo à origem (menor Rf). O antraceno (I) quase não interage com a sílica, sendo carreado até perto da frente do eluente (maior Rf)."
      }
    },
    {
      id: "QUI_MIL_13",
      origem: "ITA 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Termodinâmica Estatística e Entropia Residual de Cristais",
      tipo: "aberta",
      enunciado: "O Terceiro Princípio da Termodinâmica postula que a entropia de um cristal perfeito no zero absoluto (T = 0 K) é nula (S = 0). No entanto, o monóxido de carbono sólido (CO) apresenta uma entropia residual experimental de aproximadamente S₀ ≈ 5,8 J/(mol·K) no zero absoluto. Explique a origem molecular dessa entropia residual com base na fórmula de Boltzmann S = k_B · ln(W) e calcule o valor teórico previsto para 1 mol de moléculas de CO considerando duas orientações espaciais indistinguíveis de dipolo (CO e OC).",
      resposta: "S₀_teorico = R · ln(2) ≈ 5,76 J/(mol·K)",
      gabarito: {
        letra: "Aberta",
        ancora: "Fórmula de Boltzmann: S = k_B · ln(W). Como cada molécula pode adotar 2 orientações congeladas na rede (C-O ou O-C), para N moléculas o número de microestados é W = 2^N.",
        espera_se: "1. Microestados totais para 1 mol (N_A moléculas): W = 2^(N_A).\n2. Entropia molar: S = k_B · ln(2^(N_A)) = N_A · k_B · ln(2) = R · ln(2).\n3. Valor numérico: S = 8,314 J/(mol·K) · 0,69315 ≈ 5,76 J/(mol·K).\nExplicação: O dipolo elétrico da molécula de CO é extremamente fraco (~0,1 Debye). Ao cristalizar, a diferença de energia entre as orientações C-O e O-C é tão sutil que a rede cristalina aprisiona aleatoriamente ambas as orientações no retículo sólido sem conseguir ordenar perfeitamente os polos, gerando uma desordem de orientação intrínseca e permanente congelada no zero absoluto."
      }
    },
    {
      id: "QUI_MIL_14",
      origem: "IME 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Determinação de Fórmula Estrutural por Espectroscopia de RMN e IV",
      tipo: "aberta",
      enunciado: "Um composto orgânico volátil de fórmula molecular C₃H₆O apresenta no espectro de infravermelho (IV) uma banda intensa e nítida em 1.715 cm⁻¹ e ausência de bandas largas entre 3.200-3.600 cm⁻¹. No espectro de RMN de ¹H, exibe apenas um único sinal singleto intenso em δ = 2,1 ppm (integrando para 6 hidrogênios). (a) Identifique a função orgânica e desenhe a fórmula estrutural do composto. (b) Forneça o nome IUPAC da substância.",
      resposta: "(a) Função Cetona; estrutura CH₃-C(=O)-CH₃; (b) Propanona (acetona).",
      gabarito: {
        letra: "Aberta",
        ancora: "Banda em 1.715 cm⁻¹ indica carbonila (C=O). Ausência de banda em 3.300 cm⁻¹ descarta álcool. Um único singleto de 6H em RMN indica simetria perfeita de dois grupos metila equivalentes.",
        espera_se: "1. Grau de insaturação: IDH = C + 1 - H/2 = 3 + 1 - 6/2 = 1 (uma carbonila).\n2. O pico intenso em 1.715 cm⁻¹ é estiramento característico de carbonila cetônica alifática.\n3. O singleto com 6 prótons quimicamente equivalentes sem acoplamento vicinal (n+1 = 1) demonstra que há dois grupos -CH₃ isolados ligados diretamente à mesma carbonila: CH₃-CO-CH₃.\n4. Nome oficial IUPAC: Propan-2-ona (ou Propanona)."
      }
    },
    {
      id: "QUI_MIL_15",
      origem: "OBQ Fase Final / IChO",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Reação Pericíclica de Diels-Alder e Regra Endo",
      tipo: "aberta",
      enunciado: "A reação entre o ciclopentadieno (dieno conjugado cíclico) e o anidrido maleico (dienófilo ativado) é um exemplo clássico da cicloadição pericíclica [4+2] de Diels-Alder, que ocorre sob controle cinético à temperatura ambiente gerando preferencialmente o aduto endo em vez do aduto exo. (a) Explique a fundamentação teórica segundo os orbitais moleculares de fronteira (FMO) para a formação preferencial do isômero endo. (b) A reação é concertada ou em etapas via radicais livres?",
      resposta: "(a) Interações secundárias de orbitais favoráveis entre a carbonila do dienófilo e o dorso do dieno; (b) É uma reação concertada em etapa única.",
      gabarito: {
        letra: "Aberta",
        ancora: "A regra de Alder (regra endo máxima de acúmulo de insaturações) decorre do overlap secundário no estado de transição.",
        espera_se: "1. A cicloadição de Diels-Alder é um processo concertado estereoespecífico suprafacial-suprafacial que ocorre através de um estado de transição aromático cíclico de 6 elétrons π em etapa única.\n2. No alinhamento endo, os grupos retiradores de elétrons (carbonilas do anidrido maleico) ficam posicionados diretamente sob os carbonos do dieno. Os orbitais π* das carbonilas interagem em fase com os orbitais p dos carbonos 2 e 3 do ciclopentadieno (interação orbitalar secundária atrativa ligante). Essa estabilização extra diminui significativamente a energia de ativação do caminho endo sob controle cinético, conduzindo preferencialmente ao aduto endo."
      }
    }
  ]
};

salvar('Quimica/Anos_Finais_6to9EF/Questoes_Introducao_a_Quimica_e_Materia_6ao9ano.json', quimicaEF);
salvar('Quimica/Geral_e_Inorganica/Questoes_Tabela_Periodica_e_Ligacoes_Quimicas.json', quimicaGeral);
salvar('Quimica/Fisico_Quimica/Questoes_Estequiometria_Termoquimica_e_Eletroquimica.json', quimicaFisicoQuimica);
salvar('Quimica/Militares_e_Olimpiadas/Questoes_Quimica_OBQ_IME_ITA.json', quimicaMilitares);

console.log('--- LOTE 3 (QUÍMICA) CONCLUÍDO COM SUCESSO ---');
