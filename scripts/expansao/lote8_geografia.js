const fs = require('fs');
const path = require('path');

const BASE_DIR = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';

function salvar(subpath, dados) {
  const p = path.join(BASE_DIR, subpath);
  fs.writeFileSync(p, JSON.stringify(dados, null, 2), 'utf-8');
  console.log(`Atualizado: ${subpath} com ${dados.questoes.length} questões.`);
}

// -------------------------------------------------------------
// 1. GEOGRAFIA - ANOS INICIAIS (2º AO 5º ANO EF)
// -------------------------------------------------------------
const geoAnosIniciais = {
  disciplina: "Geografia",
  modulo: "Geografia_Espaco_e_Paisagem_2ao5ano",
  subpasta: "Anos_Iniciais_2to5EF",
  arquivo_origem: "Questoes_Geografia_Espaco_e_Paisagem_2ao5ano.json",
  benchmark_didatico: {
    capitulo: "Espaço, Paisagem, Lugar, Cartografia Básica e Meio Ambiente nos Anos Iniciais",
    objetivos_aprendizagem: [
      "Diferenciar paisagem natural de paisagem modificada (antrópica/cultural) e reconhecer a ação transformadora do ser humano sobre o espaço geográfico.",
      "Compreender a noção de 'lugar' como o espaço vivido de relações afetivas cotidianas (a casa, a escola, a rua, o bairro).",
      "Dominar noções fundamentais de orientação espacial (pontos cardeais pela rosa dos ventos e pela posição do Sol) e de alfabetização cartográfica (escala elementar, símbolos e legendas).",
      "Identificar as relações de interdependência entre o campo (espaço rural) e a cidade (espaço urbano), e promover a consciência sobre preservação dos recursos hídricos e reciclagem do lixo."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Conceitos Fundamentais: Paisagem e Lugar",
          definicao: "Paisagem é tudo aquilo que nossa visão e nossos sentidos conseguem apreender em determinado momento. Divide-se em Paisagem Natural (formada por elementos da natureza sem intervenção humana: montanhas, florestas virgens, rios primitivos) e Paisagem Cultural/Antrópica (modificada pelo trabalho humano: casas, prédios, estradas, pontes e plantações). O Lugar é a dimensão afetiva e subjetiva do espaço onde as pessoas vivem, brincam, estudam e constroem suas memórias e laços de pertencimento comunitário."
        },
        {
          termo: "Orientação e Cartografia Básica",
          definicao: "A orientação baseia-se no movimento aparente do Sol: estendendo o braço direito na direção em que o Sol nasce (Leste/Nascente), o braço esquerdo aponta para o Oeste (Poente), a frente é o Norte e as costas é o Sul. A Rosa dos Ventos reúne os pontos cardeais (N, S, L, O) e os colaterais (NE, SE, NO, SO). Um mapa é uma representação reduzida e plana da superfície terrestre, contendo cinco elementos essenciais: Título, Legenda (significado dos símbolos e cores), Escala (quantas vezes a realidade foi reduzida), Orientação (norte) e Fonte das informações."
        },
        {
          termo: "Campo e Cidade: Relações de Interdependência",
          definicao: "O espaço rural (campo) caracteriza-se pela baixa densidade populacional, predominância de vegetação, lavouras e pecuária, sendo responsável pelo fornecimento de alimentos frescos (hortaliças, grãos, carne, leite) e matérias-primas para as indústrias. O espaço urbano (cidade) concentra comércios, bancos, hospitais, escolas e serviços especializados, fornecendo maquinários agrícolas, fertilizantes, tecnologias e vestuário para o campo. Ambos os espaços são interdependentes e essenciais para a economia."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente nos anos iniciais: achar que uma plantação de soja ou de milho é uma 'paisagem natural' só porque tem plantas. Uma lavoura é uma paisagem antrópica/cultural modificada pelo trabalho humano (a vegetação nativa original foi retirada e o solo foi arado e plantado)."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Orientação pelos Pontos Cardeais pelo Sol",
      enunciado: "Ao acordar às 6 horas da manhã, um estudante abre a janela do seu quarto e vê o Sol nascendo no horizonte. Se ele esticar o braço direito na direção exata daquele Sol nascente, para qual ponto cardeal estará voltado o seu braço esquerdo e para onde estará voltada a sua face?",
      resolucao_passo_a_passo: "1. Regra fundamental da orientação solar pelo movimento aparente da Terra:\n- Braço direito apontado para o Sol nascente aponta para o LESTE (ou Oriente/Nascente).\n2. Posição oposta do braço esquerdo:\n- O braço esquerdo estará apontado diretamente para a direção do Poente, que corresponde ao OESTE (ou Ocidente).\n3. Posição da face:\n- A sua face estará voltada para a frente, indicando o ponto cardeal NORTE (Setentrional).\n4. Posição das costas:\n- As suas costas estarão voltadas para a direção do SUL (Meridional)."
    }
  },
  questoes: [
    {
      id: "GEO_AI_01",
      origem: "SAEB - 5º Ano EF",
      ano_escolar: "3º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Orientação Espacial: Pontos Cardeais pelo Sol",
      tipo: "fechada",
      enunciado: "Ao posicionar-se ao ar livre no início da manhã, uma pessoa aponta seu braço direito para o lado onde o Sol surge no horizonte (o Leste). O braço esquerdo e as suas costas estarão voltados, respectivamente, para:",
      alternativas: [
        { letra: "A", texto: "Oeste e Sul." },
        { letra: "B", texto: "Norte e Oeste." },
        { letra: "C", texto: "Sul e Norte." },
        { letra: "D", texto: "Oeste e Leste." },
        { letra: "E", texto: "Norte e Sul." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Braço direito no Leste (nascente) => braço esquerdo no Oeste (poente), frente para o Norte e costas para o Sul.",
        porque: "Essa regra clássica de orientação astronômica diurna permite localizar qualquer direção no espaço geográfico."
      }
    },
    {
      id: "GEO_AI_02",
      origem: "Prova Paraná - 5º Ano EF",
      ano_escolar: "3º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Diferenciação entre Paisagem Natural e Modificada",
      tipo: "fechada",
      enunciado: "Assinale a alternativa que contém apenas elementos que caracterizam uma paisagem predominantemente cultural (antrópica/modificada):",
      alternativas: [
        { letra: "A", texto: "Avenidas asfaltadas, prédios residenciais, viadutos e pontes." },
        { letra: "B", texto: "Cachoeiras virgens, montanhas rochosas e matas nativas preservadas." },
        { letra: "C", texto: "Rios sem poluição, praias desertas e dunas de areia." },
        { letra: "D", texto: "Geleiras polares, corais marinhos e vulcões em atividade." },
        { letra: "E", texto: "Nuvens de tempestade, vento forte e chuva de granizo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Paisagens culturais ou antrópicas são aquelas transformadas e edificadas pela sociedade humana através do trabalho e da tecnologia.",
        porque: "Avenidas, edifícios, viadutos e pontes são construções artificiais humanas, diferenciando-se dos elementos geofísicos naturais puros."
      }
    },
    {
      id: "GEO_AI_03",
      origem: "SAEB - 5º Ano EF",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Interdependência Econômica Campo e Cidade",
      tipo: "fechada",
      enunciado: "O espaço rural (campo) e o espaço urbano (cidade) estabelecem uma relação contínua de interdependência econômica e social. Um exemplo correto dessa troca de produtos e serviços é:",
      alternativas: [
        { letra: "A", texto: "O campo fornece alimentos frescos e matérias-primas agropecuárias para as indústrias urbanas; a cidade fornece máquinas agrícolas, remédios, fertilizantes e serviços bancários para o campo." },
        { letra: "B", texto: "A cidade não depende de nenhum alimento produzido nas fazendas rurais." },
        { letra: "C", texto: "O campo fabrica todos os automóveis e celulares consumidos nas capitais." },
        { letra: "D", texto: "O campo e a cidade são totalmente isolados e nunca realizam comércio entre si." },
        { letra: "E", texto: "As cidades extraem alimentos unicamente de hortas instaladas nos terraços dos prédios." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A dinâmica espacial moderna conecta visceralmente a produção agrária de matérias-primas e a oferta urbana de tecnologia, manufaturas e serviços.",
        porque: "Sem os produtos do campo as cidades ficariam desabastecidas de comida; sem a tecnologia e insumos da cidade o campo não alcançaria produtividade mecânica."
      }
    },
    {
      id: "GEO_AI_04",
      origem: "Colégio Pedro II",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Elementos Fundamentais de um Mapa Cartográfico",
      tipo: "fechada",
      enunciado: "Ao consultar um mapa geográfico escolar, um estudante precisa saber o significado de cores e linhas desenhadas (como rios azuis e rodovias vermelhas) e descobrir quantas vezes o território real foi reduzido no papel. Ele deve consultar, respectivamente:",
      alternativas: [
        { letra: "A", texto: "A Legenda e a Escala cartográfica." },
        { letra: "B", texto: "O Título e a Rosa dos Ventos." },
        { letra: "C", texto: "A Bússola e o Satélite meteorológico." },
        { letra: "D", texto: "A Moldura e a Margem do papel." },
        { letra: "E", texto: "O Glossário e o Sumário do livro." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A Legenda decodifica os símbolos, hachuras e cores convencionais. A Escala indica a proporção matemática de redução da realidade.",
        porque: "Legenda e Escala são instrumentos obrigatórios da linguagem cartográfica para a leitura rigorosa e proporcional do espaço representado."
      }
    },
    {
      id: "GEO_AI_05",
      origem: "Colégio Militar",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Preservação dos Recursos Hídricos e Mata Ciliar",
      tipo: "fechada",
      enunciado: "A vegetação nativa preservada ao longo das margens de rios, córregos e nascentes de água é chamada de 'mata ciliar'. A importância ecológica vital da mata ciliar consiste em:",
      alternativas: [
        { letra: "A", texto: "Proteger as margens contra a erosão, evitar o assoreamento (acúmulo de terra no leito do rio) e manter a água limpa e límpida para o abastecimento público." },
        { letra: "B", texto: "Acelerar a secagem dos rios para permitir a construção de rodovias de concreto." },
        { letra: "C", texto: "Aumentar a temperatura das águas impedindo a reprodução de peixes." },
        { letra: "D", texto: "Impedir que a água da chuva caia sobre a bacia hidrográfica." },
        { letra: "E", texto: "Substituir a água doce dos rios por água salgada do oceano." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A mata ciliar funciona como os cílios que protegem os olhos humanos: retém sedimentos, agrotóxicos e lixo antes que cheguem à calha fluvial.",
        porque: "Sem mata ciliar, a chuva lava as encostas (enxurrada e lixiviação), soterrando o leito do rio e provocando secas no verão e inundações catastróficas no inverno."
      }
    },
    {
      id: "GEO_AI_06",
      origem: "SAEB - 5º Ano EF",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "O Conceito de 'Lugar' na Geografia",
      tipo: "fechada",
      enunciado: "Para a ciência geográfica, o conceito de 'Lugar' não significa apenas um ponto qualquer em um mapa, definindo-se como:",
      alternativas: [
        { letra: "A", texto: "O espaço vivenciado e experimentado no cotidiano, onde as pessoas constroem laços afetivos, identidade pessoal, memórias e sentimentos de pertencimento (como a nossa casa, a nossa escola e a nossa rua)." },
        { letra: "B", texto: "Um deserto inóspito onde nunca pisou nenhum ser vivo." },
        { letra: "C", texto: "A distância exata em quilômetros entre a Terra e o planeta Marte." },
        { letra: "D", texto: "Uma área delimitada por fronteiras militares em tratados internacionais." },
        { letra: "E", texto: "Um território exclusivamente ocupado por satélites de telecomunicações no espaço." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Na geografia humanista e fenomenológica de Yi-Fu Tuan, o lugar é o espaço dotado de valor afetivo, simbolismo cultural e significado existencial.",
        porque: "Distingue-se do espaço abstrato ou geométrico por carregar a experiência vivida e as relações humanas de afeto."
      }
    },
    {
      id: "GEO_AI_07",
      origem: "Colégio de Aplicação UERJ",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Problemas Ambientais Urbanos: Ilhas de Calor",
      tipo: "fechada",
      enunciado: "Nas grandes metrópoles, a substituição de áreas verdes por imensas extensões de asfalto escuro, edifícios altos de concreto e a poluição veicular causam uma elevação acentuada da temperatura no centro da cidade em comparação com bairros rurais vizinhos. Esse fenômeno climático urbano denomina-se:",
      alternativas: [
        { letra: "A", texto: "Ilha de Calor." },
        { letra: "B", texto: "Inversão térmica polar." },
        { letra: "C", texto: "Tsunami continental." },
        { letra: "D", texto: "Geada subtropical." },
        { letra: "E", texto: "Degelo glacial precoce." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O concreto e o asfalto absorvem calor solar durante o dia e o reemitem lentamente à noite, aquecendo o ar dos centros urbanos.",
        porque: "A escassez de árvores (que resfriariam o ar por evapotranspiração) e o calor de motores e ares-condicionados criam uma 'ilha de calor' com temperaturas até 6 °C superiores às periferias arborizadas."
      }
    },
    {
      id: "GEO_AI_08",
      origem: "Colégio Militar de Belo Horizonte",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Regiões Brasileiras pelo IBGE",
      tipo: "fechada",
      enunciado: "O Instituto Brasileiro de Geografia e Estatística (IBGE) divide o território do Brasil em cinco grandes Macrorregiões geográficas, agrupando os estados por semelhanças físicas, humanas e econômicas. Essas cinco regiões oficiais são:",
      alternativas: [
        { letra: "A", texto: "Norte, Nordeste, Centro-Oeste, Sudeste e Sul." },
        { letra: "B", texto: "Amazônia, Caatinga, Cerrado, Pampa e Pantanal." },
        { letra: "C", texto: "Litoral, Planalto, Serra, Sertão e Floresta." },
        { letra: "D", texto: "Leste, Oeste, Noroeste, Sudeste e Central." },
        { letra: "E", texto: "Centro, Costa Atlântica, Bacia do Prata, Sertão e Ilhas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A divisão regional oficial em 5 macrorregiões obedece aos limites estaduais federativos adotada pelo IBGE desde 1970.",
        porque: "A opção B refere-se aos biomas naturais de domínio morfoclimático, não às regiões político-administrativas estaduais oficiais."
      }
    },
    {
      id: "GEO_AI_09",
      origem: "SAEB - 5º Ano EF",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Os 5 R da Sustentabilidade e Coleta Seletiva",
      tipo: "fechada",
      enunciado: "Para minimizar o grave problema do lixo acumulado nas cidades e o esgotamento dos aterros sanitários, a educação ambiental promove a política dos '5 Rs'. Quais são as ações sustentáveis representadas por esses cinco princípios?",
      alternativas: [
        { letra: "A", texto: "Repensar o consumo, Reduzir a geração de resíduos, Reutilizar objetos, Reciclar materiais e Recusar produtos que agridem o meio ambiente." },
        { letra: "B", texto: "Queimar todo o lixo nas calçadas das residências particulares." },
        { letra: "C", texto: "Comprar novos produtos de plástico descartável diariamente." },
        { letra: "D", texto: "Jogar resíduos eletrônicos e pilhas nas margens dos córregos." },
        { letra: "E", texto: "Substituir a coleta seletiva pelo soterramento em lixões a céu aberto." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A hierarquia de gestão sustentável de resíduos prioriza a não-geração e a redução do consumo antes da reciclagem final.",
        porque: "Repensar e reduzir o consumo supérfluo economiza matérias-primas e energia antes mesmo que o lixo seja gerado."
      }
    },
    {
      id: "GEO_AI_10",
      origem: "Colégio Pedro II",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Formas do Relevo: Planaltos, Planícies e Depressões",
      tipo: "fechada",
      enunciado: "A superfície da Terra apresenta variadas formas de relevo modeladas pelas forças da natureza. Uma superfície rebaixada, predominantemente plana ou suavemente ondulada, situada ao longo do curso de rios ou na orla costeira, formada pelo acúmulo contínuo de sedimentos de areia e argila, classifica-se como:",
      alternativas: [
        { letra: "A", texto: "Planície." },
        { letra: "B", texto: "Planalto rochoso." },
        { letra: "C", texto: "Cordilheira vulcânica." },
        { letra: "D", texto: "Depressão absoluta abaixo do nível do mar." },
        { letra: "E", texto: "Chapada de cume pontiagudo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Planície é a forma de relevo onde os processos de deposição e sedimentação superam os processos de erosão e desgaste.",
        porque: "Planícies fluviais e costeiras são áreas planas de baixas altitudes formadas pelo transporte e depósito de sedimentos trazidos pelas águas dos rios e do mar."
      }
    },
    {
      id: "GEO_AI_11",
      origem: "Olimpíada Brasileira de Geografia - Júnior",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Visão Vertical e a Representação em Planta Baixa",
      tipo: "fechada",
      enunciado: "Para desenhar o mapa de uma sala de aula ou a planta baixa de uma casa, o observador deve imaginar que está visualizando os móveis e cômodos a partir de qual ponto de vista geométrico?",
      alternativas: [
        { letra: "A", texto: "Visão vertical (de cima para baixo perfeitamente perpendicular ao chão)." },
        { letra: "B", texto: "Visão horizontal (de frente no mesmo nível dos olhos)." },
        { letra: "C", texto: "Visão oblíqua (inclinada diagonalmente com sombra projetada)." },
        { letra: "D", texto: "Visão subterrânea invertida a partir do centro da Terra." },
        { letra: "E", texto: "Visão lateral de perfil esquerdo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Mapas e plantas baixas cartográficas utilizam exclusivamente a projeção da visão vertical (zênite para o nadir).",
        porque: "A visão vertical elimina as distorções de perspectiva das paredes e móveis, permitindo desenhar os contornos e distâncias com proporção exata no plano bidimensional."
      }
    },
    {
      id: "GEO_AI_12",
      origem: "Colégio Militar de Porto Alegre",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Fuso Horário e a Rotação da Terra",
      tipo: "fechada",
      enunciado: "A Terra leva cerca de 24 horas para completar uma volta de 360° em torno do seu próprio eixo imaginário (movimento de rotação de oeste para leste). Esse movimento diário é o responsável direto por qual fenômeno geográfico e pela divisão em fusos horários?",
      alternativas: [
        { letra: "A", texto: "Pela sucessão dos dias e das noites, estabelecendo que cada faixa de 15° de longitude na Terra corresponde exatamente a 1 hora de diferença no relógio." },
        { letra: "B", texto: "Pela mudança das quatro estações do ano (primavera, verão, outono e inverno)." },
        { letra: "C", texto: "Pela ocorrência de terremotos e maremotos diários nas praias." },
        { letra: "D", texto: "Pela atração da Lua que faz a gravidade da Terra desaparecer à noite." },
        { letra: "E", texto: "Pelo congelamento instantâneo das águas oceânicas no equador." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Cálculo do fuso: 360° da circunferência terrestre dividido por 24 horas do dia = 15° para cada fuso horário de 1 hora.",
        porque: "Como a Terra gira de oeste para leste, os lugares situados a leste veem o Sol nascer primeiro e têm suas horas adiantadas em relação aos lugares situados a oeste."
      }
    },
    {
      id: "GEO_AI_13",
      origem: "Colégio Pedro II 2ª Fase",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Erosão do Solo e Técnicas de Conservação Agrícola",
      tipo: "aberta",
      enunciado: "Quando as chuvas fortes atingem encostas desmatadas sem vegetação protetora, as águas enxurradas lavam o solo fértil abrindo valas profundas chamadas voçorocas e carregando a terra para o fundo dos rios. Explique: (a) Por que o desmatamento acelera a erosão do solo nas encostas; (b) Cite e explique uma técnica sustentável de plantio (como curvas de nível ou terraceamento) utilizada pelos agricultores para proteger o solo contra as enxurradas.",
      resposta: "(a) As raízes das plantas fixam o solo e a copa das árvores amortece o impacto da chuva; sem elas, a água lava a terra; (b) Plantio em curvas de nível / terraceamento (degraus nas encostas) desacelera a velocidade da enxurrada e retém a umidade.",
      gabarito: {
        letra: "Aberta",
        ancora: "Mecânica da erosão pluvial e práticas conservacionistas agrícolas de contenção de encostas.",
        espera_se: "(a) Impacto do desmatamento: A copa e as folhas das árvores funcionam como um guarda-chuva protetor que quebra a velocidade e o impacto direto das gotas de chuva; as folhas caídas no chão (serapilheira) e a rede densa de raízes no subsolo funcionam como uma esponja que segura e ancora a terra no lugar, facilitando a infiltração lenta de água para o lençol freático. Sem a cobertura florestal, a enxurrada escorre com velocidade destruidora lixiviando e rasgando o solo indefeso.\n(b) Curvas de nível ou terraceamento: O agricultor planta as mudas acompanhando as cotas de mesma altitude da encosta (curvas de nível) ou constrói degraus escalonados (terraços). Esses degraus e linhas horizontais quebram a descida violenta da enxurrada, obrigando a água da chuva a perder força e a infiltrar mansamente na terra, retendo os nutrientes agrícolas e evitando desmoronamentos."
      }
    },
    {
      id: "GEO_AI_14",
      origem: "Olimpíada Brasileira de Geografia",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "O Ciclo da Água na Natureza e as Mudanças de Estado",
      tipo: "aberta",
      enunciado: "O ciclo hidrológico da água é um processo contínuo e vital para a biosfera terrestre movido pela energia do Sol. Descreva em sequência correta as quatro etapas fundamentais do ciclo da água: (1) Evaporação e transpiração vegetal; (2) Condensação nas nuvens; (3) Precipitação em forma de chuva; (4) Infiltração e escoamento superficial em direção aos lençóis freáticos e rios.",
      resposta: "O calor solar evapora a água líquida e as plantas transpiram vapor; o vapor sobe, resfria e condensa em gotículas formando nuvens; as gotas tornam-se pesadas e precipitam como chuva; a água infiltra no solo recarregando os aquíferos e escorre para os rios.",
      gabarito: {
        letra: "Aberta",
        ancora: "Articulação dos conceitos de climatologia física com as mudanças de estado termodinâmico da água na atmosfera.",
        espera_se: "1. Evaporação e Evapotranspiração: O calor do Sol aquece as águas de oceanos, lagos e rios, transformando a água líquida em vapor invisível que sobe para a atmosfera, auxiliado pela transpiração de bilhões de árvores das florestas;\n2. Condensação: Nas camadas mais altas e frias da troposfera, o vapor de água sofre resfriamento e condensa-se em minúsculas gotículas líquidas suspensas em poeira atmosférica, formando as nuvens;\n3. Precipitação: Quando as gotículas no interior da nuvem se chocam e tornam-se densas e pesadas demais para flutuar no ar, caem por gravidade em direção ao solo sob forma de chuva (ou neve/granizo em regiões muito frias);\n4. Infiltração e Escoamento: A água da chuva atinge a superfície: parte escorre pelas encostas alimentando nascentes e rios que deságuam no mar, e parte infiltra profundamente pelo solo poroso alimentando os lençóis freáticos e aquíferos subterrâneos, reiniciando ciclicamente todo o processo."
      }
    },
    {
      id: "GEO_AI_15",
      origem: "Colégio Militar de Brasília",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Cálculo Elementar de Distância em Escala Gráfica",
      tipo: "aberta",
      enunciado: "Em um mapa rodoviário de escala numérica 1 : 5.000.000 (um para cinco milhões), a distância em linha reta medida com uma régua escolar entre duas capitais estaduais brasileiras é de exatamente 6 centímetros. (a) Explique o que significa a escala 1 : 5.000.000; (b) Calcule a distância real aproximada entre essas duas cidades no terreno real em quilômetros.",
      resposta: "(a) Significa que cada 1 centímetro desenhado no mapa equivale a 5.000.000 de centímetros na realidade; (b) A distância real é de 300 quilômetros.",
      gabarito: {
        letra: "Aberta",
        ancora: "Aplicação da fórmula fundamental da escala cartográfica: D = d × E.",
        espera_se: "(a) Significado da escala: A escala numérica 1 : 5.000.000 expressa a razão geométrica de redução cartográfica. Significa que a realidade do território foi reduzida exatamente 5 milhões de vezes para caber no papel do mapa, de modo que cada centímetro medido na folha corresponde a 5.000.000 de centímetros no terreno geográfico real.\n(b) Cálculo matemático:\n1. Distância real em centímetros: D = 6 cm × 5.000.000 = 30.000.000 centímetros;\n2. Conversão de centímetros para metros (divide-se por 100): 30.000.000 cm = 300.000 metros;\n3. Conversão de metros para quilômetros (divide-se por 1.000): 300.000 m = 300 quilômetros (km).\nA distância real entre as duas capitais é de 300 km."
      }
    }
  ]
};

// -------------------------------------------------------------
// 2. GEOGRAFIA - ANOS FINAIS (6º AO 9º ANO EF)
// -------------------------------------------------------------
const geoAnosFinais = {
  disciplina: "Geografia",
  modulo: "Geografia_Fisica_e_Brasil_6ao9ano",
  subpasta: "Anos_Finais_6to9EF",
  arquivo_origem: "Questoes_Geografia_Fisica_e_Brasil_6ao9ano.json",
  benchmark_didatico: {
    capitulo: "Geografia Física, Dinâmica Demográfica, Urbanização e Território Brasileiro nos Anos Finais",
    objetivos_aprendizagem: [
      "Compreender a estrutura interna da Terra, a Tectônica de Placas e a dinâmica dos agentes internos (vulcanismo e abalos sísmicos) e externos (intemperismo e erosão) do relevo.",
      "Analisar as dinâmicas atmosféricas: circulação de massas de ar, fatores climáticos (latitude, altitude, maritimidade) e os tipos climáticos do Brasil.",
      "Examinar o processo de urbanização brasileira (metropolização, conurbação, gentrificação e segregação socioespacial) e a transição demográfica nacional.",
      "Compreender as características e os contrastes socioeconômicos e produtivos dos Complexos Geoeconômicos de Pedro Pinchas Geiger (Amazônia, Nordeste e Centro-Sul)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Tectônica de Placas e Estrutura da Litosfera",
          definicao: "A crosta terrestre está fragmentada em placas tectônicas rígidas que flutuam e se deslocam sobre a astenosfera plástica impulsionadas por correntes de convecção do manto magmático. Limites convergentes (choque de placas) formam cordilheiras de dobramentos modernos (Andes, Himalaia) e fossas oceânicas por subducção. Limites divergentes (afastamento) criam dorsais meso-oceânicas e assoalho oceânico por vulcanismo. Limites transformantes (deslizamento lateral) geram falhas ativas e severos terremotos (Falha de San Andreas). O Brasil situa-se no centro da Placa Sul-Americana, caracterizando-se pela estabilidade sísmica e por relevos antigos aplainados pelo intemperismo e erosão."
        },
        {
          termo: "Climatologia e Massas de Ar no Brasil",
          definicao: "O clima do Brasil é predominantemente tropical devido à localização intertropical de baixas latitudes. Fatores climáticos principais: Latitude, Altitude, Relevo, Maritimidade/Continentalidade e Correntes Marítimas. Massas de ar atuantes: Massa Equatorial Continental (mEc: quente e instável, úmida pelos rios voadores da Amazônia); Massa Tropical Atlântica (mTa: quente e úmida marítima); Massa Tropical Continental (mTc: quente e seca, originária do Chaco); e Massa Polar Atlântica (mPa: fria e úmida, responsável pelas frentes frias, geadas no Sul e pelo fenômeno da friagem na Amazônia ocidental)."
        },
        {
          termo: "Complexos Geoeconômicos de Geiger",
          definicao: "Proposta em 1967 pelo geógrafo Pedro Pinchas Geiger, divide o Brasil em três regiões geoeconômicas sem respeitar as linhas divisórias dos estados federativos: 1. Centro-Sul (o coração econômico, financeiro e industrial do país, com agricultura mecanizada e forte urbanização); 2. Nordeste (marcado por contrastes da Zona da Mata açucareira, Agreste e o Semiárido do Sertão assolado por secas e pela histórica desigualdade fundiária); 3. Amazônia (fronteira de expansão agrícola e mineral com baixa densidade demográfica, rica biodiversidade e conflitos agrários e ambientais de desmatamento)."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente nos anos finais: confundir 'tempo meteorológico' com 'clima'. O tempo meteorológico é o estado momentâneo e instável da atmosfera em um determinado dia e hora (ex.: 'hoje está chovendo e frio'). O clima é o padrão duradouro e habitual das condições atmosféricas de uma região, estabelecido após pelo menos 30 anos consecutivos de observações meteorológicas estatísticas."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: O Fenômeno dos 'Rios Voadores' da Amazônia",
      enunciado: "Explique como funciona o mecanismo climático dos 'Rios Voadores' da Floresta Amazônica e qual a sua importância crucial para as chuvas e a agricultura do Centro-Sul do Brasil.",
      resolucao_passo_a_passo: "1. Mecanismo de geração: A Floresta Amazônica opera como uma gigantesca bomba biológica d'água. Cada árvore de grande porte da mata transfere centenas de litros de água por dia do solo para o ar através da evapotranspiração foliar, gerando massas colossais de vapor úmido que sobem para a atmosfera equatorial.\n2. Dinâmica de transporte: Esses fluxos aéreos de vapor d'água (os 'rios voadores') são empurrados pelos ventos alísios para o oeste em direção à Cordilheira dos Andes. Ao colidirem com o paredão montanhoso andino de 4.000 metros de altitude, as nuvens são desviadas para o sul, avançando pelo interior do continente sobre a bacia do Paraguai e atingindo as regiões Centro-Oeste e Sudeste do Brasil.\n3. Impacto vital: Esses rios voadores são responsáveis diretos pela regulação do regime chuvoso e pela umidade que abastece os reservatórios hidrelétricos e garante a irrigação das safras de grãos no Centro-Oeste e Sudeste. O desmatamento da Amazônia compromete essa circulação, provocando secas severas e crises hídricas nas metrópoles do Centro-Sul."
    }
  },
  questoes: [
    {
      id: "GEO_AF_01",
      origem: "SAEB - 9º Ano EF",
      ano_escolar: "6º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Tectônica de Placas e a Ausência de Grandes Terremotos no Brasil",
      tipo: "fechada",
      enunciado: "O território brasileiro não costuma registrar terremotos de grande magnitude nem possui vulcões ativos em seu relevo. Essa estabilidade geológica comparada aos países vizinhos da costa do Pacífico (como Chile e Peru) explica-se pelo fato de o Brasil:",
      alternativas: [
        { letra: "A", texto: "Estar localizado no centro estável da Placa Tectônica Sul-Americana, distante das bordas de choque entre placas tectônicas ativas." },
        { letra: "B", texto: "Possuir solo arenoso espesso que absorve qualquer tremor magmático." },
        { letra: "C", texto: "Ficar protegido pela barreira natural da Floresta Amazônica que dissipa ondas sísmicas." },
        { letra: "D", texto: "Estar situado em uma placa tectônica desprovida de magma líquido no manto." },
        { letra: "E", texto: "Apresentar gravidade nula nas camadas subterrâneas de petróleo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Grandes abalos sísmicos e vulcanismo ocorrem nas bordas convergentes ou transcorrentes de placas tectônicas (como o Círculo de Fogo do Pacífico).",
        porque: "O Brasil assenta-se sobre o cráton e bacias sedimentares do interior da Placa Sul-Americana, cuja borda ocidental colide com a Placa de Nazca na Cordilheira dos Andes (onde ocorrem terremotos violentos no Chile)."
      }
    },
    {
      id: "GEO_AF_02",
      origem: "Colégio Pedro II",
      ano_escolar: "7º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Urbanização Brasileira: Conurbação e Metrópole",
      tipo: "fechada",
      enunciado: "Com o acelerado crescimento urbano a partir da segunda metade do século XX no Brasil, cidades vizinhas expandiram-se horizontalmente até unificarem suas manchas urbanas contínuas em uma só malha espacial, separadas apenas por uma rua ou avenida imaginária. Esse fenômeno geográfico de integração física entre municípios contíguos denomina-se:",
      alternativas: [
        { letra: "A", texto: "Conurbação." },
        { letra: "B", texto: "Macrocefalia rural." },
        { letra: "C", texto: "Desmetropolização estática." },
        { letra: "D", texto: "Êxodo urbano reverso." },
        { letra: "E", texto: "Segregação climática regional." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Conurbação é o processo de junção espacial física de dois ou mais municípios em decorrência do crescimento de suas áreas periféricas.",
        porque: "A conurbação é a base física e demográfica para a formação das Regiões Metropolitanas oficiais, exigindo gestão compartilhada de transporte público, saneamento e coleta de lixo."
      }
    },
    {
      id: "GEO_AF_03",
      origem: "Colégio Militar",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Transição Demográfica e Envelhecimento Populacional",
      tipo: "fechada",
      enunciado: "Nas últimas décadas, a pirâmide etária da população brasileira sofreu transformações profundas: a base da pirâmide (crianças e jovens) estreitou-se visivelmente e o topo (idosos) alargou-se de forma consistente. Esse fenômeno demográfico decorre diretamente da:",
      alternativas: [
        { letra: "A", texto: "Queda expressiva da taxa de fecundidade feminina (planejamento familiar, urbanização e inserção da mulher no mercado de trabalho) associada ao aumento da expectativa de vida média ao nascer (avanços médico-sanitários)." },
        { letra: "B", texto: "Chegada de milhões de imigrantes aposentados da Europa Ocidental." },
        { letra: "C", texto: "Proibição governamental de novos nascimentos em todo o território nacional." },
        { letra: "D", texto: "Diminuição das taxas de sobrevivência de bebês nascidos em hospitais." },
        { letra: "E", texto: "Redução do número de pessoas com mais de sessenta anos no país." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A transição demográfica brasileira completou a fase de redução drástica de mortalidade e queda acentuada da natalidade (de mais de 6 filhos por mulher na década de 1960 para menos de 1,6 na atualidade).",
        porque: "O rápido envelhecimento populacional desafia as políticas públicas de previdência social, saúde geriátrica e cuidados crônicos para as próximas décadas."
      }
    },
    {
      id: "GEO_AF_04",
      origem: "IFs Técnicos",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "A Massa Polar Atlântica (mPa) e o Fenômeno da Friagem",
      tipo: "fechada",
      enunciado: "Durante os meses de inverno no hemisfério sul, uma frente fria de grande intensidade originária da Massa Polar Atlântica (mPa) desloca-se pelo interior da bacia do Prata, penetra pelo Pantanal e atinge os vales dos rios de Rondônia, Acre e sul do Amazonas, despencando abruptamente a temperatura ambiente local de mais de 30 °C para cerca de 12 °C. Esse fenômeno climático amazônico é conhecido regionalmente como:",
      alternativas: [
        { letra: "A", texto: "Friagem." },
        { letra: "B", texto: "El Niño costeiro." },
        { letra: "C", texto: "Inversão térmica de superfície." },
        { letra: "D", texto: "Tornado equatorial." },
        { letra: "E", texto: "Ciclone extratropical seco." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A friagem ocorre quando o relevo plano da planície pantaneira e da bacia do Madeira funciona como um corredor para a incursão continental da mPa fria e densa até o sudoeste da Amazônia.",
        porque: "A queda súbita e atípica de temperatura provoca calafrios na população habituada ao calor úmido constante de floresta equatorial."
      }
    },
    {
      id: "GEO_AF_05",
      origem: "SAEB - 9º Ano EF",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Os Complexos Geoeconômicos de Pedro Pinchas Geiger",
      tipo: "fechada",
      enunciado: "A divisão do Brasil em três Complexos Geoeconômicos ou Regiões Geoeconômicas (Amazônia, Nordeste e Centro-Sul), formulada pelo geógrafo Pedro Pinchas Geiger em 1967, diferencia-se da divisão tradicional do IBGE porque:",
      alternativas: [
        { letra: "A", texto: "Não obedece às fronteiras políticas estaduais rígidas, agrupando os espaços pelas suas características históricas de formação territorial, relações de produção e dinamismo econômico integrado." },
        { letra: "B", texto: "Exclui a Região Sul do território brasileiro integrando-a ao Uruguai." },
        { letra: "C", texto: "Divide o país em cinquenta estados federados com moeda própria." },
        { letra: "D", texto: "Baseia-se unicamente nas alturas dos picos montanhosos do relevo." },
        { letra: "E", texto: "Agrupa os estados exclusivamente pela cor dos uniformes dos times de futebol." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A regionalização geoeconômica corta estados (como o norte de Minas que é integrado ao Nordeste e o sul do Tocantins integrado ao Centro-Sul).",
        porque: "Reflete a realidade socioeconômica viva do país: o Centro-Sul dinâmico e industrializado, o Nordeste com problemas históricos agrários e a Amazônia como fronteira de expansão e conservação florestal."
      }
    },
    {
      id: "GEO_AF_06",
      origem: "Colégio Pedro II",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Problemas Urbanos: A Gentrificação e a Segregação Socioespacial",
      tipo: "fechada",
      enunciado: "O termo 'Gentrificação' tem sido amplamente utilizado na geografia urbana contemporânea para descrever o processo em que:",
      alternativas: [
        { letra: "A", texto: "Bairros centrais históricos ou industriais degradados sofrem reformas urbanísticas e imobiliárias que elevam vertiginosamente o custo de vida e os aluguéis, expulsando a população moradora original de menor poder aquisitivo para periferias distantes." },
        { letra: "B", texto: "Áreas residenciais ricas são invadidas por plantações de milho e hortaliças." },
        { letra: "C", texto: "O poder público constrói metrô gratuito para todas as favelas da metrópole." },
        { letra: "D", texto: "Ocorre a demolição voluntária de todos os shopping centers das capitais." },
        { letra: "E", texto: "A população rural recusa-se a vender alimentos para os supermercados urbanos." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A gentrificação (do inglês gentry, pequena nobreza) converte espaços populares em polos 'nobres' gourmetizados de consumo e turismo.",
        porque: "Embora revitalize a estética física do bairro, agrava a segregação socioespacial ao empurrar as famílias de baixa renda e os pequenos comércios tradicionais para periferias desprovidas de saneamento e transporte."
      }
    },
    {
      id: "GEO_AF_07",
      origem: "Colégio Militar",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Clima Semiárido e o Polígono das Secas no Nordeste",
      tipo: "fechada",
      enunciado: "O Sertão nordestino brasileiro caracteriza-se pelo clima semiárido, com chuvas escassas e irregularmente distribuídas ao longo do ano. O fator geográfico físico e atmosférico que contribui para essa semi-aridez no interior da região é:",
      alternativas: [
        { letra: "A", texto: "A atuação predominante de massas de ar com correntes descendentes secas estáveis e o efeito de barlavento/sotavento do Planalto da Borborema que bloqueia a umidade marítima vinda do oceano Atlântico." },
        { letra: "B", texto: "A presença de uma cordilheira vulcânica ativa de seis mil metros de altitude." },
        { letra: "C", texto: "A proximidade imediata com as geleiras da Antártica no inverno." },
        { letra: "D", texto: "A ausência de Sol durante dez meses seguidos por ano." },
        { letra: "E", texto: "A absorção de todas as nuvens de chuva pela Floresta Amazônica." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "As massas úmidas atlânticas sobem a encosta da Borborema (barlavento), condensam e chovem no litoral; ao descerem para o interior (sotavento), chegam secas e aquecidas (efeito orográfico/chuva de relevo).",
        porque: "Aliado ao balanço de radiação elevado que gera altíssimas taxas de evapotranspiração potencial superiores à precipitação média anual, consolidam-se as condições de semi-aridez e a vegetação xerófila da Caatinga."
      }
    },
    {
      id: "GEO_AF_08",
      origem: "Colégio Naval",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Matriz Energética Brasileira e Fontes Renováveis",
      tipo: "fechada",
      enunciado: "Comparada à média da matriz energética mundial (amplamente dependente de combustíveis fósseis como carvão mineral, petróleo e gás natural), a matriz elétrica brasileira destaca-se internacionalmente por sua sustentabilidade relativa, caracterizada pela predominância de:",
      alternativas: [
        { letra: "A", texto: "Energia hidrelétrica (mais de 60% da geração elétrica), acompanhada pelo crescimento vertiginoso das fontes eólica (notadamente no litoral nordestino) e solar fotovoltaica." },
        { letra: "B", texto: "Energia termonuclear com mais de cinquenta reatores atômicos em operação na costa." },
        { letra: "C", texto: "Queima contínua de carvão mineral de alta pureza importado da Sibéria." },
        { letra: "D", texto: "Usinas a carvão vegetal que consomem unicamente madeira nativa de jacarandá." },
        { letra: "E", texto: "Usinas maremotrizes em todos os lagos artificiais do interior paulista." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A abundância de rios de planalto com elevado potencial hidráulico estruturou a matriz elétrica renovável do país.",
        porque: "Nas últimas duas décadas, os parques eólicos do Nordeste (favorecidos pelos ventos alísios constantes) e a geração solar distribuída transformaram o Brasil em uma das maiores potências mundiais em eletricidade limpa."
      }
    },
    {
      id: "GEO_AF_09",
      origem: "OBG (Olimpíada Brasileira de Geografia)",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Estrutura Fundiária e o Avanço do Agronegócio no MATOPIBA",
      tipo: "fechada",
      enunciado: "O acrônimo 'MATOPIBA' designa uma importante fronteira agrícola contemporânea do agronegócio global no Brasil, caracterizada pela expansão de monoculturas mecanizadas de soja e algodão sobre áreas de chapadões do Cerrado. Essa região compreende porções territoriais de quais estados da federação?",
      alternativas: [
        { letra: "A", texto: "Maranhão, Tocantins, Piauí e Bahia." },
        { letra: "B", texto: "Mato Grosso, Paraná, Paraíba e Acre." },
        { letra: "C", texto: "Minas Gerais, Amapá, Tocantins e Rondônia." },
        { letra: "D", texto: "Maranhão, Amazonas, Pará e Bahia." },
        { letra: "E", texto: "Mato Grosso do Sul, Alagoas, Piauí e Roraima." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "MATOPIBA = MA (Maranhão), TO (Tocantins), PI (Piauí) e BA (Bahia).",
        porque: "A região combina relevo plano propício à mecanização colheitadeira pesada, solos profundos corrigidos com calagem e preço de terras inicialmente mais acessível do que no Sul e Sudeste, atraindo capitais globais do agronegócio e gerando fortes pressões sobre os remanescentes de vegetação nativa do Cerrado."
      }
    },
    {
      id: "GEO_AF_10",
      origem: "Colégio Pedro II",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Bacia Hidrográfica do Rio São Francisco e a Transposição",
      tipo: "fechada",
      enunciado: "O Rio São Francisco (o 'Velho Chico'), que nasce na Serra da Canastra em Minas Gerais e deságua no oceano Atlântico entre Sergipe e Alagoas, é chamado historicamente de 'Rio da Integração Nacional'. O megaprojeto de Engenharia de Transposição de suas águas, concluído recentemente, teve como finalidade:",
      alternativas: [
        { letra: "A", texto: "Canalizar parte da vazão de água do rio através de eixos (Norte e Leste) com canais e estações de bombeamento para perenizar rios temporários e abastecer reservatórios e cidades do semiárido setentrional (Ceará, Paraíba, Pernambuco e Rio Grande do Norte)." },
        { letra: "B", texto: "Desviar o rio inteiro para inundar o Pantanal mato-grossense." },
        { letra: "C", texto: "Transformar a bacia em um lago de água salgada para criação de salmão chileno." },
        { letra: "D", texto: "Esvaziar as barragens de Sobradinho para construir pistas de pouso de aviões." },
        { letra: "E", texto: "Vender água doce engarrafada exclusivamente para os países da Europa." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A transposição do São Francisco é a maior obra de infraestrutura hídrica do país, dividida no Eixo Norte e Eixo Leste.",
        porque: "O projeto visa garantir segurança hídrica contra a seca para mais de doze milhões de habitantes de bacias hidrográficas receptoras do semiárido nordestino, embora suscite debates ecológicos sobre a revitalização da bacia doadora."
      }
    },
    {
      id: "GEO_AF_11",
      origem: "Colégio Militar de Curitiba",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Relevo Brasileiro segundo Jurandyr Ross",
      tipo: "fechada",
      enunciado: "A classificação moderna do relevo brasileiro proposta pelo geógrafo e geomorfólogo Jurandyr Ross em 1989, baseada nos dados do Projeto Radambrasil (radar aéreo e sensoriamento remoto), categorizou o relevo nacional em 28 unidades morfoestruturais divididas em três macroformas:",
      alternativas: [
        { letra: "A", texto: "Planaltos, Planícies e Depressões (com destaque para a inclusão inédita das depressões relativas e marginais como formas predominantes modeladas por erosão)." },
        { letra: "B", texto: "Montanhas alpinas, Vulcões ativos e Geleiras glaciares." },
        { letra: "C", texto: "Chapadas diamantinas, Cavernas calcárias e Falhas abissais." },
        { letra: "D", texto: "Cordilheiras andinas, Dunas litorâneas e Vales em V." },
        { letra: "E", texto: "Serras de neve, Platôs de basalto e Fossas oceânicas continentais." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A classificação de Ross superou as clássicas divisões de Aroldo de Azevedo (1949) e Aziz Ab'Sáber (1958) ao introduzir o conceito geológico de 'Depressão'.",
        porque: "No Brasil não existem montanhas dobradas modernas; os planaltos sofrem erosão contínua, as planícies acumulam sedimentos e as depressões (periféricas e interplanálticas) testemunham o desgaste secular do relevo antigo."
      }
    },
    {
      id: "GEO_AF_12",
      origem: "OBG Fase Nacional",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "O Fenômeno do El Niño e seus Efeitos Climáticos no Brasil",
      tipo: "fechada",
      enunciado: "O fenômeno do El Niño (Oscilação Sul - ENOS) é caracterizado pelo aquecimento anômalo das águas superficiais do oceano Pacífico Equatorial e pelo enfraquecimento dos ventos alísios. No território brasileiro, a ocorrência de um evento de El Niño de forte intensidade provoca tipicamente:",
      alternativas: [
        { letra: "A", texto: "Secas severas e redução drástica das chuvas no semiárido nordestino e na Amazônia oriental; e precipitações volumosas e inundações torrenciais na Região Sul." },
        { letra: "B", texto: "Neve contínua no litoral de Salvador e secas no interior do Rio Grande do Sul." },
        { letra: "C", texto: "Congelamento de todo o Rio Amazonas durante o verão." },
        { letra: "D", texto: "Inundações gigantescas no sertão do Ceará e secas extremas em Curitiba e Porto Alegre." },
        { letra: "E", texto: "Clima ameno e padronizado em todas as regiões brasileiras sem oscilações." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O El Niño altera a circulação atmosférica das células de Walker e de Hadley em escala planetária.",
        porque: "No Brasil, ele bloqueia as frentes frias no Sul (gerando chuvas torrenciais catastróficas em SC e RS) e desce ar seco sobre o Norte e Nordeste, inibindo a convecção e potencializando estiagens e queimadas florestais na Amazônia."
      }
    },
    {
      id: "GEO_AF_13",
      origem: "Colégio Pedro II 2ª Fase",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Macrocefalia Urbana e Segregação Periférica",
      tipo: "aberta",
      enunciado: "A urbanização desordenada no Brasil a partir da década de 1950 produziu o fenômeno da 'Macrocefalia Urbana' e a proliferação das periferias e favelas metropolitanas. Explique: (a) Qual a relação entre o êxodo rural massivo (expulsão do camponês do campo) e o inchaço acelerado das grandes metrópoles; (b) Aponte dois graves problemas de infraestrutura urbana enfrentados diariamente pelos moradores das favelas e bairros periféricos brasileiros.",
      resposta: "(a) A mecanização da agricultura e concentração latifundiária expulsaram milhões de trabalhadores para as capitais sem que houvesse empregos fabris ou moradias suficientes; (b) Ausência de saneamento básico com esgoto a céu aberto e precariedade do transporte público coletivo.",
      gabarito: {
        letra: "Aberta",
        ancora: "Crítica socioespacial da modernização conservadora do campo e da urbanização periférica segregada no Brasil.",
        espera_se: "(a) Êxodo rural e macrocefalia: A partir de 1960, a modernização conservadora da agricultura (adubos químicos, tratores pesados, expansão das monoculturas latifundiárias de exportação) expulsou dezenas de milhões de pequenos posseiros, meeiros e colonos do campo. Esse contingente massivo migrou para as grandes capitais (São Paulo, Rio de Janeiro, Belo Horizonte, Recife) num ritmo muito mais rápido do que a capacidade dessas metrópoles em gerar empregos formais na indústria ou prover habitações populares planejadas, gerando o inchaço hipertrofiado das cidades (macrocefalia urbana) e a proliferação de ocupações informais em áreas de risco.\n(b) Problemas cotidianos da periferia: 1. Falta crônica de saneamento básico universal (ausência de rede coletora de esgoto tratado, escoamento de dejetos a céu aberto e interrupções frequentes no fornecimento de água encanada potável); 2. Ineficiência e colapso do transporte público coletivo de massa (ônibus e trens suburbanos superlotados, tarifas caras e horas extenuantes de deslocamento pendular diário entre a casa e o trabalho)."
      }
    },
    {
      id: "GEO_AF_14",
      origem: "OBG 2ª Fase",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Desertificação e Degradação dos Solos no Semiárido",
      tipo: "aberta",
      enunciado: "Em vários núcleos do semiárido nordestino (como em Gilbués no Piauí, Seridó no Rio Grande do Norte e Cabrobó em Pernambuco), áreas frágeis estão enfrentando o avanço do processo de 'Desertificação'. (a) Diferencie o clima semiárido natural do processo antropogênico de desertificação; (b) Cite duas atividades humanas predatórias que aceleram a destruição do solo e transformam terras produtivas em desertos estéreis no sertão.",
      resposta: "(a) Semiárido é um clima natural com caatinga adaptada; Desertificação é a degradação ambiental irreversível do solo causada pela ação humana; (b) Desmatamento para lenha de olarias/siderurgia e sobrepastoreio excessivo de caprinos/ovinos.",
      gabarito: {
        letra: "Aberta",
        ancora: "Convenção da ONU de Combate à Desertificação (UNCCD) e geomorfologia dos solos frágeis do semiárido.",
        espera_se: "(a) Distinção conceitual: O Semiárido é um bioma/clima natural resiliente, onde a vegetação da Caatinga e os animais desenvolveram extraordinárias adaptações fisiológicas para tolerar a escassez sazonal de chuvas sem perda de fertilidade biológica. A Desertificação, por outro lado, é um processo de degradação ambiental profunda e quase irreversível provocado por intervenções humanas desastrosas em terras áridas e semiáridas, no qual o solo perde completamente a matéria orgânica, a estrutura pedológica e a capacidade biológica de produzir alimentos ou sustentar vegetação.\n(b) Atividades predatórias aceleradoras:\n1. Desmatamento raso e corte indiscriminado da Caatinga para obtenção de lenha e carvão vegetal destinados ao abastecimento de fornos industriais de olarias, cerâmicas e gesseiras locais;\n2. Sobrepastoreio (pastoreio excessivo): Criação intensiva de rebanhos de caprinos e ovinos em densidade superior à capacidade de suporte da terra, onde o pisoteio constante do gado compacta o solo, impede a infiltração de água e a brotação de novas mudas, deixando o terreno exposto ao ressecamento solar e à erosão eólica e pluvial severa."
      }
    },
    {
      id: "GEO_AF_15",
      origem: "Colégio Naval / EPCAR",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A 'Amazônia Azul' e os Recursos da Zona Econômica Exclusiva (ZEE)",
      tipo: "aberta",
      enunciado: "A Marinha do Brasil cunhou o conceito geopolítico e estratégico de 'Amazônia Azul' para designar as águas jurisdicionais brasileiras sobre o oceano Atlântico, abrangendo mais de 3,5 milhões de quilômetros quadrados da Zona Econômica Exclusiva (ZEE) e da plataforma continental estendida. Analise: (a) Qual a imensa importância econômica e energética dessa área marítima para o Brasil contemporâneo; (b) Por que o Estado brasileiro pleiteia perante a Comissão de Limites da Plataforma Continental da ONU (CLPC) a extensão de seus direitos de exploração soberana para além das 200 milhas náuticas.",
      resposta: "(a) Concentra mais de 95% do petróleo e gás natural (incluindo o Pré-Sal), rotas do comércio exterior e pesca; (b) Garante direitos exclusivos de exploração dos recursos minerais do subsolo marinho (terras raras e nódulos polimetálicos) na Elevação do Rio Grande.",
      gabarito: {
        letra: "Aberta",
        ancora: "Convenção das Nações Unidas sobre o Direito do Mar (CNUDM / Jamaica 1982) e a defesa estratégica do patrimônio marítimo nacional.",
        espera_se: "(a) Importância econômica e estratégica:\n1. Segurança energética: Mais de 95% das reservas provadas de petróleo e gás natural do Brasil estão situadas em bacias offshore no subsolo da Amazônia Azul (com destaque para os campos gigantes da camada Pré-Sal nas bacias de Santos e Campos);\n2. Comércio exterior e soberania: Mais de 95% de todas as exportações e importações da balança comercial brasileira navegam obrigatoriamente pelas rotas marítimas do Atlântico Sul, além de sustentar farta atividade pesqueira e biotecnológica marinha.\n(b) Extensão da Plataforma Continental estendida: De acordo com o Artigo 76 da Convenção da ONU sobre o Direito do Mar (CNUDM), um país costeiro que comprovar cientificamente que a sua margem continental geológica submersa se prolonga naturalmente além das 200 milhas náuticas da ZEE pode reivindicar a extensão de seus direitos exclusivos de exploração do leito e do subsolo marinho até o limite de 350 milhas náuticas. O Brasil realiza levantamentos batimétricos detalhados (como no caso da Elevação do Rio Grande) para assegurar a soberania nacional sobre depósitos submarinos estratégicos bilionários de cobalto, níquel, manganês e terras raras cruciais para a tecnologia do futuro."
      }
    }
  ]
};

// -------------------------------------------------------------
// 3. GEOGRAFIA - FÍSICA E AMBIENTAL (GEOMORFOLOGIA, CLIMA E BIOMAS)
// -------------------------------------------------------------
const geoFisicaAmbiental = {
  disciplina: "Geografia",
  modulo: "Geomorfologia_Clima_e_Biomas",
  subpasta: "Fisica_e_Ambiental",
  arquivo_origem: "Questoes_Geomorfologia_Clima_e_Biomas.json",
  benchmark_didatico: {
    capitulo: "Geografia Física Avançada: Geomorfologia Estrutural, Climatologia Dinâmica e Domínios Morfoclimáticos",
    objetivos_aprendizagem: [
      "Compreender a geomorfologia estrutural: bacias sedimentares, escudos cristalinos antigos e dobramentos modernos, e o papel do intemperismo químico e físico no modelado do relevo.",
      "Analisar as dinâmicas da circulação geral da atmosfera: Células de Hadley, Ferrel e Polar, a Zona de Convergência Intertropical (ZCIT) e a Zona de Convergência do Atlântico Sul (ZCAS).",
      "Caracterizar com rigor os Domínios Morfoclimáticos do Brasil (Aziz Ab'Sáber): Amazônico, Cerrado, Mares de Morros, Caatinga, Araucárias, Pradarias e faixas de transição.",
      "Investigar impactos ambientais globais e locais: arenização, salinização do solo, acidificação dos oceanos, inversão térmica e o antropoceno."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Geomorfologia Estrutural e Modelado do Relevo",
          definicao: "A estrutura geológica constitui o arcabouço sustentador do relevo terrestre: Escudos Cristalinos ou Crátons (rochas ígneas e metamórficas pré-cambrianas antigas, estáveis e ricas em minérios metálicos como ferro, bauxita e manganês); Bacias Sedimentares (depressões preenchidas por estratos sedimentares ao longo de eras geológicas, abrigando combustíveis fósseis como carvão, petróleo e gás natural); e Dobramentos Modernos (cordilheiras terciárias de grande altitude e instabilidade tectônica formadas por choque de placas, ausentes no Brasil). O modelado decorre do intemperismo (físico/mecânico em climas secos; químico/hidrólise em climas úmidos) e dos agentes erosivos (pluvial, fluvial, eólico, glacial e marinho)."
        },
        {
          termo: "Circulação Geral da Atmosfera e Zonas de Convergência",
          definicao: "A desigualdade na recepção da radiação solar impulsiona a máquina térmica da atmosfera através de três células convectivas meridionais em cada hemisfério: Célula de Hadley (ar quente ascende no Equador formando centros de baixa pressão equatorial e subsidia resfriado a ~30° de latitude, gerando os cinturões de alta pressão subtropicais e os grandes desertos mundiais). A Zona de Convergência Intertropical (ZCIT) é a faixa de convergência dos ventos alísios de nordeste e sudeste, provocando chuvas torrenciais convectivas. A Zona de Convergência do Atlântico Sul (ZCAS) é uma banda persistente de nebulosidade e chuvas orientada do sul da Amazônia ao Sudeste brasileiro, decisiva para as chuvas de verão no Sudeste."
        },
        {
          termo: "Domínios Morfoclimáticos Brasileiros (Aziz Ab'Sáber)",
          definicao: "Ab'Sáber sintetizou o espaço brasileiro em seis domínios paisagísticos homogêneos articulando relevo, clima, hidrografia, solos e vegetação: 1. Amazônico (terras baixas florestadas equatoriais, mata latifoliada perenifólia e igapó/várzea/terra firme); 2. Cerrado (chapadões centrais com savana, solos ácidos e lixiviados sob clima tropical semiúmido com estação seca bem definida); 3. Mares de Morros (relevo mamelonar e morros em meia-laranja no planalto atlântico, floresta tropical pluvial úmida sobre solos escorregadios); 4. Caatinga (depressões interplanálticas semiáridas com vegetação xerófita adaptada e solos pedregosos rasos); 5. Araucárias (planaltos subtropicais do Sul com floresta ombrófila mista dominada por Pinheiro-do-paraná); 6. Pradarias (coxilhas suavemente onduladas do pampa gaúcho sob clima subtropical)."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico em concursos e olimpíadas: confundir arenização com desertificação. A desertificação ocorre em climas áridos e semiáridos onde o balanço hídrico é deficitário. A arenização (que ocorre no sudoeste do Rio Grande do Sul - Pampa) dá-se em clima subtropical úmido com chuvas abundantes (> 1.400 mm/ano), decorrente do pisoteio do gado e agricultura sobre solos arenosos frágeis de arenitos pré-cambrianos (arenito Botucatu), onde a chuva desagrega os grãos de areia formando bancos estéreis de areia móvel ('areais')."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: A Zona de Convergência do Atlântico Sul (ZCAS)",
      enunciado: "O que é a ZCAS (Zona de Convergência do Atlântico Sul) e de que maneira a sua configuração durante os meses de verão é responsável tanto por enchentes catastróficas no Sudeste quanto por períodos de veranico prolongado caso não se forme?",
      resolucao_passo_a_passo: "1. Definição meteorológica: A ZCAS é um corredor persistente de nebulosidade convectiva e chuvas intensas que se estende por milhares de quilômetros na direção Noroeste-Sudeste, conectando a umidade amazônica (bacia do Madeira e Amazonas) ao oceano Atlântico através das regiões Centro-Oeste e Sudeste (notadamente Minas Gerais, Rio de Janeiro e São Paulo).\n2. Mecanismo de atuação: Permanece estacionária por no mínimo 4 a 7 dias consecutivos, canalizando o vapor de água dos rios voadores amazônicos empurrado por cavados atmosféricos de alta troposfera.\n3. Impacto das chuvas e enchentes: Quando a ZCAS se estabelece sobre o Sudeste no ápice do verão (dezembro a fevereiro), os acumulados de precipitação superam facilmente 300 a 400 mm em poucos dias, saturando os solos das encostas da Serra do Mar e da Mantiqueira e provocando deslizamentos de terra catastróficos, inundações de vales e mortes em áreas urbanas serranas.\n4. Efeito reverso (bloqueio atmosférico/veranico): Nos anos em que a ZCAS é impedida de se formar devido a um centro de alta pressão atmosférica anômalo estacionário bloqueando a umidade no oceano, o Sudeste enfrenta estiagens atípicas e severas em pleno verão ('veranico'), levando a graves crises de abastecimento hídrico nos reservatórios do Sistema Cantareira e das hidrelétricas."
    }
  },
  questoes: [
    {
      id: "GEO_FIS_01",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Domínio dos Mares de Morros e Processos Morfogenéticos",
      tipo: "fechada",
      enunciado: "No Domínio dos Mares de Morros (Aziz Ab'Sáber), característico do relevo acidentado do Planalto Atlântico do Sudeste brasileiro, a paisagem é dominada por colinas mamelonares arredondadas ('meias-laranjas') revestidas originalmente pela Mata Atlântica. Em áreas desmatadas nas encostas íngremes durante as chuvas torrenciais de verão, o processo geomorfológico de maior risco geológico é o:",
      alternativas: [
        { letra: "A", texto: "Deslizamento de terra em massa (escorregamento de manto de alteração e tálus), favorecido pela saturação hídrica do solo profundo e pela gravidade." },
        { letra: "B", texto: "Vulcanismo piroclástico com emissão de cinzas basálticas." },
        { letra: "C", texto: "Formação de geleiras continentais permanentes." },
        { letra: "D", texto: "Avanço de dunas barcanas móveis de deserto arenoso." },
        { letra: "E", texto: "Salinização osmótica extrema por carência absoluta de precipitação." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O clima tropical úmido de altitude promove intenso intemperismo químico, gerando regolitos e solos profundos (latossolos e cambissolos).",
        porque: "Sem as raízes da floresta nativa para ancorar o solo, o excesso de água acumulada atua como lubrificante na interface entre o regolito e a rocha matriz, provocando escorregamentos catastróficos de encostas na Serra do Mar."
      }
    },
    {
      id: "GEO_FIS_02",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "A Circulação Geral da Atmosfera e a Célula de Hadley",
      tipo: "fechada",
      enunciado: "A Célula de Hadley é um dos principais motores do sistema de circulação geral atmosférica global. O ar quente e úmido ascende na região equatorial e, após resfriar-se e perder umidade na forma de chuvas convectivas, subsidia (desce) em torno das latitudes de 30° Norte e 30° Sul. Essa subsidência de massas de ar frias e secas sob alta pressão permanente explica a localização geográfica planetária de:",
      alternativas: [
        { letra: "A", texto: "Grandes desertos subtropicais globais, como o Saara na África, o deserto da Arábia e o Grande Deserto Australiano." },
        { letra: "B", texto: "Florestas pluviais equatoriais densas e úmidas." },
        { letra: "C", texto: "Geleiras polares eternas do manto ártico." },
        { letra: "D", texto: "Usinas geotérmicas submarinas em dorsais oceânicas." },
        { letra: "E", texto: "Tufões marinhos permanentes que nunca tocam a terra." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A subsidência do ar na zona de alta pressão subtropical inibe a convecção, a formação de nuvens e a precipitação pluviométrica regular.",
        porque: "O ar descendente aquece adiabaticamente e seca, tornando os cinturões dos paralelos 30° N e S as zonas mais hiperáridas do planeta Terra."
      }
    },
    {
      id: "GEO_FIS_03",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Arenização no Pampa Gaúcho vs Desertificação",
      tipo: "fechada",
      enunciado: "No sudoeste do estado do Rio Grande do Sul (Bioma Pampa), extensas faixas de areia esbranquiçada e estéril avançam sobre os campos nativos, fenômeno que a ciência geográfica classifica como 'Arenização'. Esse processo diferencia-se fundamentalmente da 'Desertificação' porque:",
      alternativas: [
        { letra: "A", texto: "Ocorre sob clima subtropical úmido com chuvas abundantes (pluviosidade anual superior a 1.400 mm), decorrente do retrabalhamento e lavagem de solos areníticos extremamente frágeis e inconsolidados por enxurradas e sobrepastoreio." },
        { letra: "B", texto: "Ocorre exclusivamente em climas hiperáridos com total ausência de chuvas há mais de cinco séculos." },
        { letra: "C", texto: "É um fenômeno gerado exclusivamente pela poluição química de resíduos nucleares." },
        { letra: "D", texto: "Resulta da invasão de areia transportada por tsunamis vindos da bacia do Prata." },
        { letra: "E", texto: "É uma técnica agrícola sustentável recomendada para aumentar a fertilidade da soja." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O geógrafo Dirce Suertegaray demonstrou que a arenização do Pampa decorre de fragilidade geológica natural (arenitos de origem eólica da Formação Botucatu) potencializada pelo desmatamento do estrato herbáceo e pisoteio de gado.",
        porque: "A abundância de água pluvial no Rio Grande do Sul não freia a arenização; ao contrário, a enxurrada torrencial lava a matriz fina do solo e concentra os grãos soltos de quartzo em areais."
      }
    },
    {
      id: "GEO_FIS_04",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Inversão Térmica e Poluição Urbana no Inverno",
      tipo: "fechada",
      enunciado: "Durante as noites e madrugadas frias e calmas de inverno em metrópoles como São Paulo, a rápida perda de calor do solo por irradiação resfria a camada de ar imediatamente em contato com o chão. O ar frio e denso fica aprisionado abaixo de uma camada de ar mais quente, impedindo a convecção e aprisionando poluentes próximo às ruas. Esse fenômeno atmosférico é denominado:",
      alternativas: [
        { letra: "A", texto: "Inversão Térmica." },
        { letra: "B", texto: "Efeito Coriolis reverso." },
        { letra: "C", texto: "Chuva ácida estática." },
        { letra: "D", texto: "Célula convectiva polar de superfície." },
        { letra: "E", texto: "Furacão extratropical de vale." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Em condições normais, o ar quente sobe (por ser menos denso) e dispersa os poluentes na alta atmosfera. Na inversão térmica, o ar frio superficial não sobe, atuando como uma 'tampa' atmosférica.",
        porque: "Monóxido de carbono, óxidos de nitrogênio e material particulado ficam aprisionados na altura da respiração humana, provocando epidemias de asma, bronquite e problemas cardiorrespiratórios nos meses de inverno."
      }
    },
    {
      id: "GEO_FIS_05",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Zona de Convergência Intertropical (ZCIT) e o Semiárido",
      tipo: "fechada",
      enunciado: "O regime de chuvas do norte do Nordeste brasileiro (especialmente nos estados do Ceará, Piauí e Rio Grande do Norte durante os meses de fevereiro a maio) é determinado fundamentalmente pelo posicionamento latitudinal mais ao sul da:",
      alternativas: [
        { letra: "A", texto: "Zona de Convergência Intertropical (ZCIT), cuja descida sazonal para o hemisfério sul transporta umidade oceânica e deflagra a estação chuvosa na região." },
        { letra: "B", texto: "Massa Polar Atlântica que se transforma em furacão tropical." },
        { letra: "C", texto: "Corrente Marítima fria de Humboldt vinda do litoral chileno." },
        { letra: "D", texto: "Zona de Divergência Polar Antártica de alta altitude." },
        { letra: "E", texto: "Massa Tropical Continental vinda dos Andes peruanos." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A ZCIT oscila sazonalmente acompanhando as águas mais quentes do Atlântico Tropical (dipolo do Atlântico).",
        porque: "Se o Atlântico Norte estiver mais quente que o Atlântico Sul, a ZCIT é retida no hemisfério norte e não desce até a costa cearense, provocando as secas periódicas devastadoras no Sertão."
      }
    },
    {
      id: "GEO_FIS_06",
      origem: "UNESP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Pedogênese e Solos Tropicais: Latossolos e a Laterização",
      tipo: "fechada",
      enunciado: "Nos planaltos tropicais do Brasil central (Cerrado), a ação contínua do intemperismo químico profundo sob clima quente com alternância entre estação seca e chuvosa produz solos espessos, avermelhados e lixiviados conhecidos como Latossolos. A concentração de óxidos de ferro e alumínio na superfície desses solos pode formar uma crosta endurecida e estéril denominada:",
      alternativas: [
        { letra: "A", texto: "Laterita (ou canga laterítica), decorrente do processo de laterização." },
        { letra: "B", texto: "Permafrost congelado polar." },
        { letra: "C", texto: "Húmus puro de alta fertilidade orgânica natural." },
        { letra: "D", texto: "Argila expansiva massapê de manguezal." },
        { letra: "E", texto: "Basalto vítreo recém-derramado." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A lixiviação intensa da sílica e bases solúveis deixa para trás os compostos insolúveis de ferro e alumínio (laterita).",
        porque: "Ao dessecar sob insolação e desmatamento, a laterita endurece formando uma carapaça rígida que impede o enraizamento e a infiltração de água."
      }
    },
    {
      id: "GEO_FIS_07",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Estruturas Geológicas do Brasil e Recursos Minerais",
      tipo: "fechada",
      enunciado: "O Quadrilátero Ferrífero, em Minas Gerais, e a Província Mineral de Carajás, no Pará, abrigam algumas das maiores jazidas de minério de ferro e manganês de alto teor do planeta. Em relação à geologia estrutural, essas imensas reservas minerais metálicas encontram-se alojadas em terrenos de:",
      alternativas: [
        { letra: "A", texto: "Escudos Cristalinos (crátons) de rochas metamórficas e magmáticas da era Pré-Cambriana." },
        { letra: "B", texto: "Bacias sedimentares fanerozoicas formadas na era Cenozoica recente." },
        { letra: "C", texto: "Dobramentos modernos da era Mesozoica resultantes de choque de placas." },
        { letra: "D", texto: "Planícies aluviais inconsolidadas de fundo de lagoas quaternárias." },
        { letra: "E", texto: "Recifes de corais calcários da plataforma continental atlântica." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Minérios metálicos (ferro, manganês, ouro, cobre) originam-se em processos magmáticos e metamórficos profundos do Pré-Cambriano.",
        porque: "Carajás e o Quadrilátero Ferrífero são formações ferríferas bandadas (itabiritos) do Arqueano/Proterozoico incrustadas em escudos cristalinos antigos de mais de dois bilhões de anos."
      }
    },
    {
      id: "GEO_FIS_08",
      origem: "AFA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Perfil Geomorfológico das Cuestas e Chapadas",
      tipo: "fechada",
      enunciado: "Na geomorfologia brasileira, as 'Cuestas' (como a Cuesta de Botucatu em São Paulo) e as 'Chapadas' (como a Chapada Diamantina e a dos Guimarães) são formas de relevo estrutural resultantes da erosão diferencial sobre camadas sedimentares e magmáticas. A característica morfológica definidora de uma Cuesta é apresentar:",
      alternativas: [
        { letra: "A", texto: "Perfil assimétrico e dissimétrico, com uma vertente de declive suave (reverso) e uma vertente abrupta e escarpada (front ou frente de cuesta)." },
        { letra: "B", texto: "Topo perfeitamente arredondado em forma de meia-laranja sem nenhuma escarpa." },
        { letra: "C", texto: "Paredões perfeitamente simétricos em forma de pirâmide egípcia." },
        { letra: "D", texto: "Fundo de vale marinho submerso a mais de três mil metros de profundidade." },
        { letra: "E", texto: "Estrutura constituída exclusivamente por cinzas vulcânicas não consolidadas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Cuestas ocorrem no contato entre bacias sedimentares suavemente inclinadas (dip) e escudos cristalinos, onde uma camada de rocha mais resistente (como basalto ou arenito silicificado) protege o reverso.",
        porque: "A frente de cuesta (front) despenca em paredão abrupto voltado para a depressão periférica, enquanto o dorso (reverso) desce suavemente na direção de inclinação das camadas geológicas."
      }
    },
    {
      id: "GEO_FIS_09",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Acidificação dos Oceanos e o Ciclo do Carbono",
      tipo: "fechada",
      enunciado: "O aumento acelerado da concentração de dióxido de carbono (CO₂) na atmosfera provocado pela queima de combustíveis fósseis afeta severamente os ecossistemas marinhos globais através da acidificação dos oceanos. Esse fenômeno geoquímico decorre do fato de que:",
      alternativas: [
        { letra: "A", texto: "O CO₂ dissolvido na água do mar forma ácido carbônico (H₂CO₃), liberando íons H⁺ que reagem com íons carbonato (CO₃²⁻), reduzindo a saturação de carbonato de cálcio (CaCO₃) e impedindo a calcificação de corais, moluscos e fitoplâncton calcário." },
        { letra: "B", texto: "O gás carbônico transforma a água do mar em ácido clorídrico concentrado corrosivo." },
        { letra: "C", texto: "O oxigênio marinho evapora integralmente para o espaço sideral." },
        { letra: "D", texto: "A temperatura dos oceanos despenca para valores negativos em todo o planeta." },
        { letra: "E", texto: "A água do mar perde toda a sua salinidade tornando-se potável." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "CO₂ + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻. O excesso de H⁺ consome o íon carbonato livre (H⁺ + CO₃²⁻ ⇌ HCO₃⁻).",
        porque: "Com menos íons carbonato disponíveis, recifes de corais sofrem branqueamento e esqueletos calcários de organismos na base da cadeia trófica marinha dissolvem-se literalmente na água ácida."
      }
    },
    {
      id: "GEO_FIS_10",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Efeito Coriolis e o Desvio dos Ventos Planetários",
      tipo: "fechada",
      enunciado: "A Força de Coriolis (uma aceleração inercial aparente gerada pela rotação da Terra observada em referenciais não-inerciais) atua sobre grandes massas de fluidos em movimento (ventos e correntes marítimas). De acordo com a física e a climatologia dinâmica, a Força de Coriolis desvia as trajetórias dos ventos para a:",
      alternativas: [
        { letra: "A", texto: "Direita de seu movimento no Hemisfério Norte e para a esquerda de seu movimento no Hemisfério Sul, sendo nula sobre a Linha do Equador e máxima nos Polos." },
        { letra: "B", texto: "Esquerda no Hemisfério Norte e para a direita no Hemisfério Sul." },
        { letra: "C", texto: "Direita em ambos os hemisférios de forma simétrica e constante." },
        { letra: "D", texto: "Linha do Equador exclusivamente, onde atinge seu valor máximo." },
        { letra: "E", texto: "Direção oposta ao movimento dos ponteiros do relógio em todos os oceanos." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Aceleração de Coriolis: a_c = -2·(ω × v). O desvio é proporcional ao seno da latitude (sen 0° = 0 no Equador; sen 90° = 1 nos polos).",
        porque: "Esse desvio para a direita no Norte e para a esquerda no Sul determina a circulação ciclônica horária no Hemisfério Sul e anti-horária no Hemisfério Norte em sistemas de baixa pressão atmosférica."
      }
    },
    {
      id: "GEO_FIS_11",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Relevo Cárstico e Processos de Dissolução em Rochas Carbonáticas",
      tipo: "fechada",
      enunciado: "O relevo cárstico (como o encontrado em Lagoa Santa em Minas Gerais e no Vale do Ribeira em São Paulo) caracteriza-se por cavernas majestosas, estalactites, estalagmites, dolinas e rios subterrâneos sumidouros. Esse modelado geomorfológico forma-se pela:",
      alternativas: [
        { letra: "A", texto: "Dissolução química contínua de rochas carbonáticas solúveis (como calcários e dolomitos) pela água da chuva acidificada por dióxido de carbono dissolvido: CaCO₃ + H₂O + CO₂ ⇌ Ca(HCO₃)₂." },
        { letra: "B", texto: "Ação abrasiva de geleiras do período quaternário sobre rochas vulcânicas de basalto." },
        { letra: "C", texto: "Fraturação mecânica de granitos provocada por terremotos submarinos profundos." },
        { letra: "D", texto: "Acumulação de dunas de areia eólica que endureceram ao sol." },
        { letra: "E", texto: "Detonação intencional de explosivos industriais em minas desativadas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O bicarbonato de cálcio solúvel é carreado pela água subterrânea que esculpe galerias e salões subterrâneos.",
        porque: "Ao gotejar do teto das cavernas, a perda de CO₂ reverte a reação química, precipitando o carbonato de cálcio sólido e formando as estalactites (que descem do teto) e as estalagmites (que sobem do chão)."
      }
    },
    {
      id: "GEO_FIS_12",
      origem: "OBG Fase Nacional",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Domínio das Araucárias e o Impacto do Desmatamento Histórico",
      tipo: "fechada",
      enunciado: "O Domínio Morfoclimático das Araucárias (Floresta Ombrófila Mista) ocupava originalmente grandes extensões dos planaltos do Paraná, Santa Catarina e norte do Rio Grande do Sul sob clima subtropical com geadas de inverno. Hoje, restam menos de 3% de sua cobertura florestal primitiva original devido à:",
      alternativas: [
        { letra: "A", texto: "Exploração madeireira predatória histórica para a indústria de celulose e construção civil no século XX, associada à expansão acelerada de monoculturas agrícolas de soja, trigo e milho." },
        { letra: "B", texto: "Queima natural de cinzas vulcânicas durante a formação da Cordilheira dos Andes." },
        { letra: "C", texto: "Extinção natural da espécie provocada pela falta de polinizadores biológicos." },
        { letra: "D", texto: "Invasão das matas por geleiras permanentes que cobriram os planaltos do Sul." },
        { letra: "E", texto: "Substituição voluntária das araucárias por coqueirais tropicais litorâneos." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A madeira nobre da Araucaria angustifolia foi dizimada durante o ciclo da madeira que sustentou ferrovias e exportações no século XX.",
        porque: "Hoje a espécie está criticamente ameaçada de extinção na lista vermelha da IUCN, tornando imperiosa a preservação em parques nacionais e unidades de conservação."
      }
    },
    {
      id: "GEO_FIS_13",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Assoreamento Fluvial e Impermeabilização do Solo Urbano",
      tipo: "aberta",
      enunciado: "Nas grandes capitais brasileiras, as cheias e inundações catastróficas dos rios urbanos (como o Rio Tietê e Pinheiros em São Paulo, e o Rio Maracanã no Rio de Janeiro) ocorrem com frequência no verão. Explique com base na hidrologia urbana: (a) Como a impermeabilização maciça do solo (asfalto e concreto) altera o hidrograma de vazão e o tempo de pico das cheias dos rios; (b) Por que a retificação mecânica e a canalização de cursos d'água em calhas de concreto, em vez de solucionar o problema, tendem a agravar as inundações nos trechos de jusante.",
      resposta: "(a) Reduz a infiltração a quase zero e acelera o escoamento superficial direto, reduzindo o tempo de pico e multiplicando o volume da enchente; (b) A calha lisa acelera a velocidade da água para frente, represando e inundando os bairros mais baixos rio abaixo (jusante).",
      gabarito: {
        letra: "Aberta",
        ancora: "Hidrologia de bacias hidrográficas antropizadas e o colapso dos modelos tradicionais higienistas de canalização de rios.",
        espera_se: "(a) Alteração no hidrograma de vazão: Em uma bacia natural com solo permeável e vegetação, grande parte da água de chuva infiltra no subsolo, e o escoamento superficial é lento; o pico de vazão do rio é suave e demora horas ou dias para acontecer. Na cidade pavimentada por asfalto e concreto impermeável, a taxa de infiltração cai para quase zero: toda a chuva converte-se instantaneamente em enxurrada superficial violenta canalizada por bueiros para a calha do rio. Isso encurta drasticamente o tempo de concentração (tempo de pico) e eleva a vazão máxima instantânea a volumes estratosféricos que superam a capacidade do rio, deflagrando transbordamentos repentinos.\n(b) Falácia da retificação e canalização: Retificar as curvas naturais (meandros) e concretar o leito elimina a área de amortecimento das planícies de inundação (várzeas) e reduz a rugosidade do leito. A água corre em velocidade torrencial artificialmente acelerada, transferindo a energia e o volume gigantesco da enchente para os bairros situados rio abaixo (a jusante). Ao chegar em pontos onde o rio encontra pontes estreitas ou perde declividade, a água represa e transborda com violência redobrada, provando a insustentabilidade da engenharia cinzenta tradicional frente à renaturalização de rios e parques lineares de retenção."
      }
    },
    {
      id: "GEO_FIS_14",
      origem: "UNICAMP 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Salinização dos Solos em Perímetros Irrigados do Semiárido",
      tipo: "aberta",
      enunciado: "Em diversos perímetros irrigados de fruticultura no semiárido do Vale do São Francisco, solos anteriormente produtivos estão tornando-se estéreis devido ao fenômeno da 'Salinização do Solo'. (a) Explique o mecanismo geoquímico e climático da salinização provocado pela irrigação inadequada sob clima semiárido; (b) Aponte uma técnica sustentável de drenagem ou manejo agronômico para recuperar ou mitigar a salinidade dessas terras agricultáveis.",
      resposta: "(a) A evapotranspiração extrema evapora a água da irrigação e atrai sais minerais do subsolo por capilaridade, cristalizando crostas salinas na superfície; (b) Instalação de drenos subterrâneos para lavagem e drenagem dos sais (lixiviação forçada).",
      gabarito: {
        letra: "Aberta",
        ancora: "Geoquímica e pedologia da salinização antrópica em zonas áridas e semiáridas.",
        espera_se: "(a) Mecanismo da salinização: No semiárido, a taxa de evapotranspiração potencial é imensamente superior à precipitação pluvial. Ao aplicar irrigação excessiva ou com água contendo teores moderados de sais minerais sem um sistema adequado de drenagem subterrânea, o nível do lençol freático salino sobe próximo à superfície. A intensa radiação solar evapora rapidamente a água doce na superfície do solo, provocando a ascensão capilar dos sais minerais dissolvidos (cloretos e sulfatos de sódio, cálcio e magnésio), que precipitam e cristalizam no horizonte superficial. A crosta salina impermeabiliza o solo e impede a absorção osmótica de água pelas raízes das plantas (seca fisiológica osmótica), esterilizando a lavoura.\n(b) Técnicas de recuperação e manejo: 1. Implantação de uma rede eficiente de drenagem agrícola subterrânea (tubos perfurados enterrados) associada à aplicação controlada de lâminas de água de lavagem (lixiviação artificial com água doce para dissolver os sais e escoá-los para fora da bacia radicular); 2. Aplicação de gesso agrícola (sulfato de cálcio) para substituir o sódio trocável na argila por cálcio e melhorar a estrutura física do solo, além do cultivo de espécies halófitas fitorremediadoras que absorvem sais da terra."
      }
    },
    {
      id: "GEO_FIS_15",
      origem: "ITA / IME 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Circulação Termoalina Global e o Risco de Colapso da AMOC",
      tipo: "aberta",
      enunciado: "A Circulação de Revolvimento Meridional do Atlântico (AMOC, da qual faz parte a Corrente do Golfo) é uma das engrenagens mestras da circulação termoalina oceânica global que transporta calor das águas tropicais para o Atlântico Norte, mantendo o clima da Europa Ocidental consideravelmente mais ameno do que outras regiões de mesma latitude. Estudos oceanográficos recentes alertam para o risco de enfraquecimento ou colapso da AMOC decorrente do aquecimento global. Explique: (a) Como a densidade da água (controlada pela temperatura e salinidade) comanda o mergulho das correntes marinhas profundas no Atlântico Norte; (b) Por que o degelo acelerado da calota de gelo da Groenlândia ameaça travar o motor físico dessa circulação termoalina.",
      resposta: "(a) Água fria e salgada é mais densa e afunda para o leito oceânico profundo gerando a corrente de retorno; (b) O degelo injeta bilhões de toneladas de água doce e fria (menos densa), impedindo o afundamento da água e colapsando o transporte global de calor.",
      gabarito: {
        letra: "Aberta",
        ancora: "Oceanografia física, termodinâmica dos fluidos marinhos e pontos de não-retorno (tipping points) do sistema climático planetário.",
        espera_se: "(a) O motor termoalino da densidade: A água do mar desloca-se tridimensionalmente com base em gradientes de densidade física regidos pela temperatura e pela salinidade. As águas quentes e salgadas da Corrente do Golfo sobem do Caribe para o Atlântico Norte perdendo calor para a atmosfera e resfriando-se. Como a água fria é mais densa que a quente, e a água salgada é mais densa que a doce, a combinação de baixas temperaturas com alta salinidade torna a massa de água do Atlântico Norte extraordinariamente pesada e densa, fazendo-a mergulhar (afundar) para as profundezas oceânicas abissais na região dos mares da Noruega e Groenlândia, empurrando as correntes marinhas profundas de retorno em direção ao sul em uma gigantesca esteira transportadora de calor planetário.\n(b) O impacto do derretimento da Groenlândia: O acelerado aquecimento global está derretendo montanhas de gelo glacial de água doce na Groenlândia e no manto ártico, injetando anualmente centenas de bilhões de toneladas de água doce e pura diretamente no Atlântico Norte. A água doce possui salinidade nula, diluindo brutalmente a concentração de sais do mar e reduzindo drasticamente a densidade das águas superficiais. Por ser menos densa, essa água não consegue mais afundar para as profundezas oceânicas, desligando ou desacelerando criticamente o pistão gravitacional que puxa a Corrente do Golfo. Um colapso da AMOC provocaria resfriamento dramático na Europa Ocidental, tempestades extremas no Atlântico Norte, subida perigosa do nível do mar na costa leste dos EUA e deslocamento desastroso das chuvas de monções nos trópicos do hemisfério sul."
      }
    }
  ]
};

// -------------------------------------------------------------
// 4. GEOGRAFIA - MILITARES E OLIMPÍADAS (OBG, ESPCEX, IME, ITA)
// -------------------------------------------------------------
const geoMilitares = {
  disciplina: "Geografia",
  modulo: "Questoes_Geografia_OBG_EsPCEx_IME_ITA",
  subpasta: "Militares_e_Olimpiadas",
  arquivo_origem: "Questoes_Geografia_OBG_EsPCEx_IME_ITA.json",
  benchmark_didatico: {
    capitulo: "Geopolítica Mundial e do Brasil em Nível Avançado: Território, Estratégia, Conflitos Contemporâneos e Fronteiras",
    objetivos_aprendizagem: [
      "Compreender as teorias geopolíticas clássicas (Heartland de Mackinder, Rimland de Spykman e o Poder Marítimo de Mahan) e suas aplicações na rivalidade hegemônica contemporânea.",
      "Analisar a geopolítica dos recursos estratégicos (petróleo, gás natural, terras raras, semicondutores e água potável) e os conflitos no Oriente Médio, Mar do Sul da China e Leste Europeu.",
      "Examinar as fronteiras terrestres e marítimas do Brasil, o Sistema de Proteção da Amazônia (SIPAM/SIVAM) e o Sistema Integrado de Monitoramento de Fronteiras (SISFRON).",
      "Investigar o processo de desindustrialização, inserção nas cadeias globais de valor e a reconfiguração da ordem multipolar (BRICS+, G7, OCDE)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Teorias Geopolíticas Clássicas: Mackinder vs Spykman vs Mahan",
          definicao: "Alfred Thayer Mahan postulou que a supremacia global decorre do controle militar e mercantil das rotas oceânicas (Poder Marítimo / Sea Power). Halford Mackinder formulou a Teoria do Heartland ('Coração da Terra', 1904): o controle das planícies da Eurásia central (Rússia/Europa Oriental), inacessíveis ao poder naval, é a chave para o domínio da Ilha-Mundo e de todo o planeta ('Quem governa a Europa Oriental comanda o Heartland; quem governa o Heartland comanda a Ilha-Mundo; quem governa a Ilha-Mundo comanda o Mundo'). Nicholas Spykman contrapôs a Teoria do Rimland (1944): a faixa litorânea e marginal euroasiática (Europa Ocidental, Oriente Médio e Ásia de Monções) é a verdadeira zona de amortecimento e equilíbrio geopolítico vital."
        },
        {
          termo: "Geopolítica das Fronteiras Brasileiras e Defesa Nacional",
          definicao: "O Brasil possui mais de 16.800 km de fronteira terrestre ladeando 10 países sul-americanos (exceto Chile e Equador). A Doutrina Militar Brasileira fundamenta-se no trinômio Presença, Dissuasão e Cooperação. A Amazônia é a prioridade estratégica de defesa da soberania territorial (Calha Norte, pelotões de fronteira do Exército, radares do SIPAM e satélites do CENSIPAM). O SISFRON (Sistema Integrado de Monitoramento de Fronteiras) atua nas fronteiras ocidentais contra crimes transnacionais (narcotráfico, contrabando, biopirataria). No mar, o PROSUB (Programa de Desenvolvimento de Submarinos) e a Amazônia Azul protegem a ZEE e os depósitos do Pré-Sal."
        },
        {
          termo: "Nova Rota da Seda e Rivalidade Sino-Americana",
          definicao: "A Iniciativa Cinturão e Rota (Belt and Road Initiative - BRI) da China investe trilhões de dólares em ferrovias, portos, oleodutos e cabos submarinos para conectar a Eurásia e a África, recriando as rotas da seda terrestres e marítimas. O Mar do Sul da China é um ponto de atrito de primeira ordem devido à construção de ilhas artificiais militarizadas por Pequim sobre a Linha dos Nove Traços, disputada com Filipinas, Vietnã e Taiwan e desafiada pela presença aeronaval norte-americana para garantir a liberdade de navegação no Estreito de Malaca (chokepoint por onde passa mais de 80% do petróleo importado pela China)."
        }
      ],
      atencao_ponto_cego: "Ponto cego militar crítico: pensar que fronteira e limite são sinônimos. Limite é a linha divisória jurídica demarcada no mapa entre dois Estados soberanos (uma linha linear precisa). Fronteira é a zona viva territorial e dinâmica de contato, integração e cooperação que circunda essa linha (a faixa de fronteira brasileira tem 150 km de largura para o interior)."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: O Estreito de Ormuz como Chokepoint Geopolítico Estratégico",
      enunciado: "O Estreito de Ormuz, que conecta o Golfo Pérsico ao Golfo de Omã e ao Mar da Arábia, é considerado o chokepoint petrolífero mais sensível do planeta. Explique a relevância geoestratégica desse estreito marítimo e o risco que seu bloqueio imporia à economia mundial.",
      resolucao_passo_a_passo: "1. Localização geográfica e dimensões: Estreito marítimo estreito (apenas 39 km de largura em seu ponto mais estreito) situado entre o Irã (ao norte) e Omã e Emirados Árabes Unidos (ao sul).\n2. Fluxo de tráfego de petróleo: Pelo Estreito de Ormuz transita diariamente cerca de 21 milhões de barris de petróleo bruto e derivados, o que representa aproximadamente 20% de todo o consumo mundial de petróleo líquido e um terço de todo o petróleo comercializado por via marítima no planeta (escoamento da Arábia Saudita, Iraque, Kuwait, Emirados Árabes Unidos e Irã), além de grandes cargas de GNL do Catar.\n3. Risco geopolítico e militar: Como não existem oleodutos alternativos terrestres suficientes para desviar essa colossal produção, qualquer fechamento forçado ou bloqueio do estreito em caso de guerra aberta no Oriente Médio provocaria a interrupção imediata de um quinto do fornecimento global de combustíveis, disparando os preços do barril para patamares superiores a 150-200 dólares, paralisando a navegação comercial e deflagrando uma recessão e crise inflacionária planetária instantânea."
    }
  },
  questoes: [
    {
      id: "GEO_MIL_01",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Faixa de Fronteira no Brasil e a Segurança Nacional",
      tipo: "fechada",
      enunciado: "De acordo com a legislação federal brasileira e a Constituição de 1988, a Faixa de Fronteira é uma área interna contígua à linha divisória do território nacional considerada indispensável à Segurança Nacional, compreendendo uma largura de:",
      alternativas: [
        { letra: "A", texto: "150 quilômetros para o interior do país, onde a ocupação do solo, a concessão de terras públicas a estrangeiros e a instalação de indústrias bélicas e de mineração estão submetidas a autorizações prévias do Conselho de Defesa Nacional." },
        { letra: "B", texto: "12 milhas náuticas a partir da linha de maré baixa." },
        { letra: "C", texto: "50 metros em torno de cada marco de fronteira demarcado." },
        { letra: "D", texto: "500 quilômetros exclusivamente na bacia do rio Amazonas." },
        { letra: "E", texto: "Toda a extensão do território dos estados que fazem divisa com o mar." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A Lei nº 6.634/1979 e o Artigo 20 da Constituição de 1988 regulamentam a Faixa de Fronteira de 150 km de largura.",
        porque: "Essa área engloba centenas de municípios ao longo de quase 17 mil km de fronteiras terrestres, onde vigoram restrições especiais para garantir a soberania nacional e a repressão a ilícitos transfronteiriços."
      }
    },
    {
      id: "GEO_MIL_02",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Teoria do Heartland de Mackinder e o Conflito na Eurásia",
      tipo: "fechada",
      enunciado: "A célebre teoria do Heartland formulada pelo geógrafo britânico Sir Halford Mackinder em 1904 ('O Pivô Geográfico da História') postulava que o núcleo continental da Eurásia possuía uma posição geográfica estratégica inexpugnável ao poder naval. A máxima geopolítica de Mackinder estabelece que:",
      alternativas: [
        { letra: "A", texto: "'Quem governa a Europa Oriental comanda o Heartland; quem governa o Heartland comanda a Ilha-Mundo; quem governa a Ilha-Mundo comanda o Mundo.'" },
        { letra: "B", texto: "'O poder marítimo sobre os oceanos supera em qualquer circunstância a massa terrestre continental.'" },
        { letra: "C", texto: "'A África Subsaariana é a chave mestra para o controle de todas as rotas aeroespaciais.'" },
        { letra: "D", texto: "'O desarmamento militar universal é a condição prévia para a prosperidade da Europa.'" },
        { letra: "E", texto: "'A supremacia mundial pertence exclusivamente ao país que dominar as florestas tropicais sul-americanas.'" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A tese de Mackinder inspirou a estratégia britânica e norte-americana de contenção da Rússia e da União Soviética na Guerra Fria.",
        porque: "O Heartland corresponde às imensas planícies da Rússia e Ásia Central, ricas em minérios, combustíveis e espaço agrícola, cujo controle e aliança com potências industriais europeias (como a Alemanha) era o maior temor geoestratégico das potências anglo-saxônicas talassocráticas."
      }
    },
    {
      id: "GEO_MIL_03",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "O Mar do Sul da China e a Geopolítica dos Chokepoints",
      tipo: "fechada",
      enunciado: "O Estreito de Malaca, que separa a Península Malaia da ilha indonésia de Sumatra, é um dos estrangulamentos marítimos (chokepoints) mais vitais do comércio internacional contemporâneo. O 'Dilema de Malaca', formulado pela liderança de Pequim, refere-se à vulnerabilidade estratégica da China decorrente do fato de:",
      alternativas: [
        { letra: "A", texto: "Mais de 80% de todo o petróleo importado pela China do Oriente Médio e da África navegar obrigatoriamente por essa via marítima estreita, sujeita a um eventual bloqueio aeronaval por parte dos Estados Unidos ou de seus aliados em caso de guerra." },
        { letra: "B", texto: "A Marinha indonésia cobrar pedágio exorbitante em moedas de ouro de todos os navios chineses." },
        { letra: "C", texto: "A profundidade do estreito ser insuficiente para a passagem de qualquer navio de contêineres." },
        { letra: "D", texto: "O estreito estar congelado durante seis meses por ano devido às correntes polares." },
        { letra: "E", texto: "O governo da Malásia pertencer integralmente à aliança militar do Pacto de Varsóvia." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O 'Dilema de Malaca' (cunhado pelo presidente Hu Jintao) impulsionou a China a construir a Nova Rota da Seda e a base naval de Djibuti.",
        porque: "Para contornar o risco de asfixia energética em Malaca, Pequim constrói oleodutos terrestres diretos através de Mianmar, Paquistão (Porto de Gwadar) e Ásia Central russa."
      }
    },
    {
      id: "GEO_MIL_04",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "O Programa Calha Norte e a Presença Militar na Amazônia",
      tipo: "fechada",
      enunciado: "Criado pelo governo brasileiro em 1985, o Programa Calha Norte (PCN) é um projeto estratégico estatal gerido pelo Ministério da Defesa que atua em uma extensa faixa ao norte da calha dos rios Solimões e Amazonas. A finalidade primordial desse programa militar e de desenvolvimento regional é:",
      alternativas: [
        { letra: "A", texto: "Garantir a presença do Estado brasileiro nas fronteiras mais remotas e desabitadas com países vizinhos (Colômbia, Venezuela, Guianas e Suriname), fortalecendo a soberania nacional, construindo infraestrutura básica (pistas de pouso, postos de saúde, escolas) e prestando assistência a comunidades indígenas e ribeirinhas." },
        { letra: "B", texto: "Desmatar integralmente a bacia do rio Negro para implantar indústrias pesadas de aço." },
        { letra: "C", texto: "Vender todas as terras devolutas da fronteira para fundos de investimento norte-americanos." },
        { letra: "D", texto: "Substituir as tropas do Exército Brasileiro por mercenários estrangeiros contratados." },
        { letra: "E", texto: "Fechar todas as fronteiras fluviais do Norte proibindo o comércio entre estados brasileiros." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O lema dos Pelotões Especiais de Fronteira (PEF) na Amazônia é: 'Vida, combate e trabalho / Tudo pela Amazônia / Selva!'.",
        porque: "O Calha Norte integra a defesa das fronteiras à integração cidadã das populações locais, impedindo vazios geopolíticos e combatendo a biopirataria e a narcoguerrilha internacional."
      }
    },
    {
      id: "GEO_MIL_05",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Geopolítica dos Semicondutores e a Ilha de Taiwan",
      tipo: "fechada",
      enunciado: "Na atual disputa tecnológica e hegemônica global entre Estados Unidos e China, a ilha de Taiwan ocupa uma posição geoestratégica de centralidade absoluta. Além de sua localização na primeira cadeia de ilhas do Pacífico, a relevância crítica inegociável de Taiwan para a economia planetária reside no fato de:",
      alternativas: [
        { letra: "A", texto: "Concentrar a empresa TSMC (Taiwan Semiconductor Manufacturing Company), responsável por mais de 90% da produção mundial dos microchips e semicondutores de ponta mais avançados do planeta (abaixo de 5 nanômetros), indispensáveis para inteligência artificial, supercomputadores, celulares e mísseis guiados." },
        { letra: "B", texto: "Ser a maior exportadora de petróleo cru e carvão mineral de toda a Ásia Oriental." },
        { letra: "C", texto: "Possuir as maiores jazidas de urânio enriquecido da crosta terrestre." },
        { letra: "D", texto: "Fabricar todos os medicamentos antibióticos consumidos na Europa." },
        { letra: "E", texto: "Comandar o sistema de pagamentos de todos os bancos do FMI." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O chamado 'Escudo de Silício' de Taiwan: a liderança industrial quase monopolista da TSMC na fabricação de semicondutores de última geração.",
        porque: "Uma eventual invasão militar chinesa de Taiwan ou a destruição das fábricas da TSMC colapsaria instantaneamente a indústria tecnológica global do Ocidente e do Oriente."
      }
    },
    {
      id: "GEO_MIL_06",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Questão da Crimeia (2014) e o Mar Negro",
      tipo: "fechada",
      enunciado: "Em 2014, a Federação Russa anexou militarmente a Península da Crimeia, território pertencente à Ucrânia. Do ponto de vista geoestratégico e naval russo, a posse da Crimeia é considerada de valor existencial absoluto porque abriga:",
      alternativas: [
        { letra: "A", texto: "A base naval histórica de Sebastopol, que garante à Frota do Mar Negro russa o controle sobre o tráfego naval da região e o acesso permanente a águas quentes navegáveis durante todo o ano em direção ao Mediterrâneo através dos estreitos de Bósforo e Dardanelos." },
        { letra: "B", texto: "O maior centro de lançamento de foguetes espaciais tripulados da Terra." },
        { letra: "C", texto: "As únicas minas de carvão vegetal da Europa Oriental." },
        { letra: "D", texto: "A sede diplomática central de todas as agências da OTAN." },
        { letra: "E", texto: "Um extenso canal fluvial navegável que liga o Mar Negro diretamente a Paris." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A obsessão histórica secular da geopolítica russa (desde os czares Pedro o Grande e Catarina a Grande) é o acesso a mares quentes que não congelem no inverno.",
        porque: "A base de Sebastopol projeta o poder militar russo sobre o Mar Negro, o Cáucaso e o Oriente Médio (como na intervenção russa na Síria a partir da base de Tartus)."
      }
    },
    {
      id: "GEO_MIL_07",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Geopolítica da Água e a Grande Represa do Renascimento Etíope (GERD)",
      tipo: "fechada",
      enunciado: "A construção pela Etiópia da monumental Grande Represa do Renascimento Etíope (GERD) no Rio Nilo Azul gerou gravíssimas tensões geopolíticas com o Egito e o Sudão. O motivo central do temor egípcio perante a operação da represa etíope é:",
      alternativas: [
        { letra: "A", texto: "O fato de o Nilo Azul fornecer mais de 85% de toda a água doce do Rio Nilo que sustenta a agricultura, a geração elétrica e a sobrevivência de mais de 100 milhões de egípcios em um país inteiramente desértico, temendo que o enchimento da represa reduza drasticamente a vazão a jusante." },
        { letra: "B", texto: "A intenção da Etiópia de desviar o curso do Rio Nilo para desaguar no Oceano Índico." },
        { letra: "C", texto: "O transbordamento da represa inundando as pirâmides de Gizé no Cairo." },
        { letra: "D", texto: "A contaminação da água com resíduos radioativos produzidos em Adis Abeba." },
        { letra: "E", texto: "A proibição de turistas estrangeiros navegarem pelo Canal de Suez." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Heródoto dizia: 'O Egito é uma dádiva do Nilo'. Sem a água do Nilo, o Egito torna-se deserto inabitável.",
        porque: "O controle da torneira do Nilo pela Etiópia desloca o equilíbrio de poder histórico da bacia, gerando o risco de um conflito interestatal armado pela posse e vazão de recursos hídricos compartilhados (guerra da água)."
      }
    },
    {
      id: "GEO_MIL_08",
      origem: "ONHB Fase Final",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Expansão dos BRICS e a Desdolarização do Comércio",
      tipo: "fechada",
      enunciado: "Na Cúpula de Joanesburgo (2023), o bloco dos BRICS (Brasil, Rússia, Índia, China e África do Sul) anunciou a sua histórica expansão formal convidando novos membros (como Arábia Saudita, Irã, Emirados Árabes Unidos, Egito e Etiópia), passando a ser denominado informalmente como BRICS+. A agenda geopolítica e geoeconômica prioritária impulsionada pelo grupo ampliado no cenário internacional é:",
      alternativas: [
        { letra: "A", texto: "O fortalecimento do multilateralismo, a maior representatividade do Sul Global em organismos internacionais e a redução gradual da dependência do dólar norte-americano nas transações comerciais bilaterais através do uso de moedas locais e de novos mecanismos financeiros (como o Novo Banco de Desenvolvimento - NBD)." },
        { letra: "B", texto: "A criação de uma aliança militar nuclear ofensiva para invadir os países do G7." },
        { letra: "C", texto: "A extinção definitiva de todas as fronteiras nacionais e passaportes dos países-membros." },
        { letra: "D", texto: "A obrigatoriedade de adoção do rublo russo como moeda oficial única em todos os continentes." },
        { letra: "E", texto: "O rompimento imediato de qualquer relação diplomática com as Nações Unidas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O BRICS+ representa hoje mais de 45% da população mundial e mais de 35% do PIB global em paridade de poder de compra (PPC).",
        porque: "A inclusão de gigantes produtores de petróleo (Arábia Saudita, EAU e Irã) reforça a busca por alternativas ao sistema SWIFT e à hegemonia monetária do dólar como instrumento de sanções unilaterais."
      }
    },
    {
      id: "GEO_MIL_09",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Geopolítica dos Minerais Críticos e as Terras Raras",
      tipo: "fechada",
      enunciado: "Os elementos químicos do grupo das Terras Raras (como neodímio, disprósio e lantânio) são indispensáveis para a fabricação de motores de veículos elétricos, turbinas eólicas, lasers militares, sistemas de radar e baterias de alta performance na transição energética global. A posição dominante da China nessa cadeia de suprimento global fundamenta-se no fato de:",
      alternativas: [
        { letra: "A", texto: "Controlar quase 70% da extração e mais de 85% a 90% de todo o refino químico e processamento industrial metalúrgico de separação de terras raras do mundo, tornando as indústrias de defesa e de tecnologia dos EUA e da Europa altamente dependentes de suas exportações." },
        { letra: "B", texto: "Ser o único país do planeta onde esses elementos químicos existem na crosta terrestre." },
        { letra: "C", texto: "Proibir a exportação de minérios para qualquer país da Ásia." },
        { letra: "D", texto: "Comprar todas as refinarias de minérios da Austrália e do Canadá." },
        { letra: "E", texto: "Ter inventado as terras raras em laboratórios farmacêuticos em 2010." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Terras Raras não são escassas na crosta, mas sua separação química e refino são processos altamente complexos e poluentes.",
        porque: "A China investiu pesadamente nessa cadeia industrial por décadas enquanto o Ocidente fechou minas devido a normas ambientais, conferindo a Pequim uma extraordinária alavanca geopolítica de chantagem mineral na guerra comercial contemporânea."
      }
    },
    {
      id: "GEO_MIL_10",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "O Sistema Integrado de Monitoramento de Fronteiras (SISFRON)",
      tipo: "fechada",
      enunciado: "Implementado pelo Exército Brasileiro ao longo da fronteira terrestre ocidental, o Sistema Integrado de Monitoramento de Fronteiras (SISFRON) emprega tecnologia de ponta desenvolvida pela Base Industrial de Defesa (BID) nacional. Os meios tecnológicos articulados pelo SISFRON para garantir a vigilância contínua da fronteira compreendem:",
      alternativas: [
        { letra: "A", texto: "Uma rede integrada de radares terrestres de longo alcance, sensores óticos e térmicos, aeronaves remotamente pilotadas (drones), satélites de imageamento e sistemas de telecomunicações táticas criptografadas para subsidiar operações de combate a crimes transfronteiriços." },
        { letra: "B", texto: "Um muro de concreto armado de dez metros de altura em toda a fronteira com a Bolívia e o Paraguai." },
        { letra: "C", texto: "O enterramento de minas terrestres antipessoal ao longo de toda a extensão da fronteira." },
        { letra: "D", texto: "A expulsão obrigatória de todos os cidadãos civis que morem na faixa de fronteira." },
        { letra: "E", texto: "A terceirização do monitoramento das fronteiras para satélites da Guarda Costeira russa." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O SISFRON é o maior sistema de monitoramento de fronteiras terrestres do mundo em extensão contínua.",
        porque: "O sistema integra o Exército, a Polícia Federal e órgãos ambientais (IBAMA) para fechar rotas clandestinas do narcotráfico, tráfico de armas, contrabando e extração ilegal de minérios preciosos."
      }
    },
    {
      id: "GEO_MIL_11",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "O Ártico e as Novas Rotas Marítimas do Degelo Polar",
      tipo: "fechada",
      enunciado: "O acelerado recuo do gelo marinho no Oceano Glacial Ártico provocado pelas mudanças climáticas está abrindo a Rota Marítima do Norte (Northern Sea Route) ao longo da costa setentrional da Rússia. Essa rota polar adquire extraordinária importância geopolítica global porque:",
      alternativas: [
        { letra: "A", texto: "Reduz em até 30% a 40% o tempo e a distância de navegação marítima entre os portos da Ásia Oriental (China, Japão, Coreia) e os da Europa Ocidental em comparação com a rota tradicional que atravessa o Canal de Suez e o Estreito de Malaca, além de viabilizar a exploração de gigantescas reservas de gás e petróleo offshore no leito ártico." },
        { letra: "B", texto: "Permite a navegação comercial apenas para veleiros turísticos sem carga comercial." },
        { letra: "C", texto: "Transforma o Polo Norte em um mar de águas quentes tropicais navegável sem navios quebra-gelo." },
        { letra: "D", texto: "Pertence exclusivamente à marinha de guerra do Canadá segundo o Tratado da Antártica." },
        { letra: "E", texto: "Elimina a necessidade de qualquer porto marítimo em todo o continente europeu." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A Rota do Norte transforma a geopolítica do comércio marítimo euroasiático sob a liderança de Moscou, dona da maior frota de quebra-gelos atômicos do mundo.",
        porque: "A rota encurta milhares de quilômetros e evita os chokepoints vigiados pelos EUA (Suez e Malaca), acelerando a corrida militar entre Rússia, EUA e China pelo controle soberano dos recursos polares."
      }
    },
    {
      id: "GEO_MIL_12",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Crise da Água e os Aquíferos Transfronteiriços: O Aquífero Guarani",
      tipo: "fechada",
      enunciado: "O Sistema Aquífero Guarani (SAG) é um dos maiores mananciais subterrâneos de água doce transfronteiriços do planeta, estendendo-se por mais de 1,2 milhão de quilômetros quadrados sob os territórios do Brasil, Argentina, Paraguai e Uruguai. Em 2010, os quatro países assinaram o Acordo sobre o Aquífero Guarani, cujo princípio jurídico inovador consagra:",
      alternativas: [
        { letra: "A", texto: "A soberania territorial inalienável e exclusiva de cada Estado sobre a porção do aquífero situada em seu respectivo subsolo, combinada com o dever de cooperação compartilhada, troca de dados hidrológicos e uso equitativo e sustentável para evitar a contaminação ou esgotamento do recurso hídrico comum." },
        { letra: "B", texto: "A privatização e venda total das águas subterrâneas para corporações multinacionais de bebidas." },
        { letra: "C", texto: "A obrigação do Brasil de fornecer toda a sua água gratuitamente aos vizinhos do Prata." },
        { letra: "D", texto: "A entrega da administração do manancial ao Conselho de Segurança da OTAN." },
        { letra: "E", texto: "A proibição do uso das águas do aquífero para o consumo das cidades brasileiras." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O Acordo do Aquífero Guarani é pioneiro no direito internacional de águas subterrâneas transfronteiriças.",
        porque: "Equilibra a soberania nacional de cada país (combatendo teorias conspiratórias de 'internacionalização' forçada) com o compromisso ecológico mútuo de preservação dos pontos de recarga para as futuras gerações."
      }
    },
    {
      id: "GEO_MIL_13",
      origem: "EsPCEx / ITA 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "O PROSUB e o Submarino de Propulsão Nuclear Brasileiro (Álvaro Alberto)",
      tipo: "aberta",
      enunciado: "Em 2008, o Brasil firmou uma parceria estratégica de cooperação militar e transferência de tecnologia com a França para o desenvolvimento do Programa de Desenvolvimento de Submarinos (PROSUB), que já construiu quatro submarinos convencionais de propulsão diesel-elétrica (Classe Riachuelo) e está construindo o primeiro Submarino Convencionalmente Armado com Propulsão Nuclear (o 'Álvaro Alberto', SN-BR) no Complexo Naval de Itaguaí (RJ). (a) Explique a enorme superioridade militar tática e estratégica de um submarino de propulsão nuclear em relação ao submarino convencional de baterias diesel-elétricas; (b) Por que o domínio autônomo do ciclo do enriquecimento de urânio e da tecnologia do reator nuclear naval é indispensável para a defesa da 'Amazônia Azul'?",
      resposta: "(a) Autonomia submersa praticamente ilimitada (meses sem emergir), maior velocidade contínua e discrição acústica sem precisar aspirar ar na superfície; (b) Garante capacidade de dissuasão estratégica real contra potências globais para proteger os campos de petróleo do Pré-Sal e a ZEE.",
      gabarito: {
        letra: "Aberta",
        ancora: "Estratégia Nacional de Defesa (END) e o salto tecnológico da dissuasão nuclear naval brasileira.",
        espera_se: "(a) Superioridade tática do submarino nuclear:\n1. Autonomia submersa: O submarino convencional diesel-elétrico precisa subir periodicamente à superfície ou a cota de periscópio para acionar seus motores a combustão interna e recarregar suas baterias (operação de snorkel), momento em que fica extremamente vulnerável à detecção por radares aeronavais e satélites inimigos. O submarino de propulsão nuclear gera oxigênio e dessaliniza água internamente e seu reator nuclear não consome ar atmosférico: sua permanência submersa é limitada unicamente pela resistência psicológica e pelo estoque de comida da tripulação (podendo operar por meses a fio completamente indetectável);\n2. Velocidade sustentada e alcance: Submarinos nucleares sustentam altas velocidades de deslocamento submerso (acima de 25-30 nós) por tempo indefinido, permitindo patrulhar áreas oceânicas colossais com imensa rapidez tática.\n(b) Dissuasão na Amazônia Azul: As reservas provadas de petróleo e gás do Pré-Sal e os minerais da plataforma continental situam-se em mar aberto a centenas de quilômetros da costa ao longo de uma extensão de milhões de km². O Brasil não ambiciona possuir ogivas nucleares (respeitando o TNP e a Constituição de 1988), mas ter o submarino de propulsão nuclear convencional dotado de torpedos e mísseis confere um poder de dissuasão supremo: nenhuma potência militar estrangeira ousará violar as águas jurisdicionais brasileiras sabendo que o país possui uma arma invisível capaz de emboscar qualquer frota inimiga a qualquer momento."
      }
    },
    {
      id: "GEO_MIL_14",
      origem: "ONHB Fase Final / OBG",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Geopolítica da Fome e a Dependência Externa de Fertilizantes NPK",
      tipo: "aberta",
      enunciado: "O Brasil é consagrado mundialmente como uma das maiores superpotências agrícolas do planeta, liderando as exportações globais de soja, carne bovina, café, açúcar e suco de laranja. Contudo, analistas de segurança nacional apontam que o agronegócio brasileiro possui um 'calcanhar de Aquiles' geoeconômico de extrema gravidade: a dependência de mais de 85% de importações de fertilizantes químicos (NPK: Nitrogênio, Fósforo e Potássio), grande parte vinda de países como Rússia, Bielorrússia, China e Canadá. (a) De que maneira a eclosão da Guerra entre Rússia e Ucrânia em 2022 escancarou essa vulnerabilidade estratégica nacional?; (b) Aponte duas medidas prioritárias necessárias para aumentar a autossuficiência e a segurança alimentar brasileira na produção de fertilizantes.",
      resposta: "(a) As sanções ocidentais e o bloqueio naval no Mar Negro ameaçaram interromper o envio de potássio e nitratos russos para as lavouras brasileiras; (b) Reabertura e ampliação de fábricas nacionais de fertilizantes nitrogenados (Fafen) e exploração sustentável de jazidas de potássio e fosfatos.",
      gabarito: {
        letra: "Aberta",
        ancora: "Segurança nacional, geopolítica das cadeias globais de suprimento agrícola e o Plano Nacional de Fertilizantes (PNF 2050).",
        espera_se: "(a) Vulnerabilidade revelada pela guerra em 2022: O Brasil importa cerca de 95% do potássio (K), 80% do nitrogênio (N) e 55% do fósforo (P) utilizados nas lavouras mecanizadas. A Rússia e a Bielorrússia são os maiores fornecedores mundiais de potássio e nitratos para o Brasil. Com a invasão da Ucrânia, a imposição de sanções bancárias do sistema SWIFT contra Moscou e o risco de bloqueio das rotas no Mar Negro, o Brasil enfrentou a ameaça real de escassez de adubos e disparada colossal nos custos de insumos, o que colocaria em xeque o plantio da safra nacional e provocaria inflação de alimentos no mercado interno e risco de desabastecimento global.\n(b) Medidas para autossuficiência estratégica:\n1. Reativação e expansão de fábricas nacionais de fertilizantes nitrogenados (como as FAFENs e unidades de ureia e amônia integradas com o gás natural nacional da Petrobras e do Pré-Sal);\n2. Incentivo à pesquisa e exploração sustentável de depósitos geológicos de potássio e fosfatos no território nacional (como as jazidas de silvinita e o uso de pós de rocha/rochagem de silicatos regionais);\n3. Fomento à transição para biofertilizantes orgânicos, adubação verde e microbioma fixador de nitrogênio do solo, diminuindo o uso de químicos sintéticos importados."
      }
    },
    {
      id: "GEO_MIL_15",
      origem: "IME / ITA 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "O Corredor Bioceânico e a Integração Logística Sul-Americana",
      tipo: "aberta",
      enunciado: "O projeto do Corredor Rodoviário Bioceânico (que parte do Centro-Oeste brasileiro, atravessa o Chaco paraguaio, o norte da Argentina e transpõe a Cordilheira dos Andes em direção aos portos chilenos de Antofagasta, Iquique e Mejillones no oceano Pacífico) é uma das obras mais ambiciosas de integração física da América do Sul. Analise: (a) Qual a imensa vantagem econômica e de redução de tempo e frete marítimo que o Corredor Bioceânico proporcionará às exportações agroindustriais do Centro-Oeste brasileiro com destino à China e aos mercados do Leste Asiático em comparação com a rota tradicional via Canal do Panamá ou Cabo da Boa Esperança; (b) Aponte dois desafios diplomáticos, alfandegários ou de infraestrutura física montanhosa que ainda precisam ser superados para a operação plena do corredor.",
      resposta: "(a) Redução de até 15 a 20 dias no tempo de viagem marítima e grande economia de custos de frete evitando o Canal do Panamá; (b) Superação do Passo de Jama nos Andes (mais de 4.000 m de altitude com gelo e neve) e unificação das barreiras aduaneiras e sanitárias.",
      gabarito: {
        letra: "Aberta",
        ancora: "Geoeconomia dos transportes da IIRSA/COSIPLAN, conexão interoceânica e reposicionamento logístico do Brasil na Bacia do Pacífico.",
        espera_se: "(a) Vantagem logística para os mercados asiáticos: Atualmente, as safras de grãos e carnes do Centro-Oeste (Mato Grosso do Sul, Mato Grosso e Goiás) são transportadas por milhares de quilômetros de rodovias saturadas até os portos do Atlântico (Santos e Paranaguá), onde os navios graneleiros precisam circum-navegar o continente contornando o Cabo da Boa Esperança ou enfrentar as longas filas e pedágios caros do congestionado Canal do Panamá para alcançar a Ásia. Pelo Corredor Bioceânico rodoviário (passando por Porto Murtinho no MS até o norte do Chile), as cargas saem diretamente nos portos do Pacífico em direção à China, reduzindo a viagem marítima em mais de 10 mil quilômetros e economizando entre 12 a 20 dias de trânsito, o que barateia consideravelmente o frete e aumenta a competitividade do produto brasileiro.\n(b) Desafios de infraestrutura e governança:\n1. Desafios geográficos e de engenharia: A travessia da Cordilheira dos Andes (pelo Passo de Jama a mais de 4.200 metros de altitude) exige veículos adaptados para a rarefação de oxigênio do ar e enfrenta interrupções periódicas de tráfego provocadas por tempestades de neve congelante e nevascas durante os meses de inverno rigoroso;\n2. Desafios alfandegários e regulatórios: É imprescindível harmonizar e desburocratizar os procedimentos aduaneiros, fitossanitários e fiscais entre quatro legislações nacionais distintas (Brasil, Paraguai, Argentina e Chile) através de postos aduaneiros integrados de 'janela única', evitando que as carretas de carga fiquem paralisadas por dias em filas fronteiriças burocráticas."
      }
    }
  ]
};

salvar('Geografia/Anos_Iniciais_2to5EF/Questoes_Geografia_Espaco_e_Paisagem_2ao5ano.json', geoAnosIniciais);
salvar('Geografia/Anos_Finais_6to9EF/Questoes_Geografia_Fisica_e_Brasil_6ao9ano.json', geoAnosFinais);
salvar('Geografia/Fisica_e_Ambiental/Questoes_Geomorfologia_Clima_e_Biomas.json', geoFisicaAmbiental);
salvar('Geografia/Militares_e_Olimpiadas/Questoes_Geografia_OBG_EsPCEx_IME_ITA.json', geoMilitares);

console.log('--- LOTE 8 (GEOGRAFIA) CONCLUÍDO COM SUCESSO ---');
