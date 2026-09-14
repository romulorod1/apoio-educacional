const fs = require('fs');
const path = require('path');

const BASE_DIR = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';

function salvar(subpath, dados) {
  const p = path.join(BASE_DIR, subpath);
  fs.writeFileSync(p, JSON.stringify(dados, null, 2), 'utf-8');
  console.log(`Atualizado: ${subpath} com ${dados.questoes.length} questões.`);
}

// -------------------------------------------------------------
// 1. FILOSOFIA - ANTIGA E MEDIEVAL
// -------------------------------------------------------------
const filAntiga = {
  disciplina: "Filosofia",
  assunto: "Filosofia Antiga - Sócrates, Platão e Aristóteles",
  publico_alvo: "Escolas de Alta Performance - Niterói e Rio de Janeiro (1º ao 3º ano EM)",
  modulo: "Grecia_Platao_Aristoteles",
  subpasta: "Antiga_e_Medieval",
  arquivo_origem: "Questoes_Grecia_Platao_Aristoteles.json",
  benchmark_didatico: {
    capitulo: "Unidade 1: Do Mito ao Logos, a Dialética Socrática e a Metafísica Clássica",
    objetivos_aprendizagem: [
      "Compreender a passagem do pensamento mítico-cosmogônico para a racionalidade filosófica pré-socrática (busca da arché e ordem cosmológica).",
      "Analisar o giro antropológico operado pelos sofistas e por Sócrates (método socrático: ironia e maiêutica; 'conhece-te a ti mesmo').",
      "Dominar o dualismo ontológico e a epistemologia platônica (Mundo Sensível x Mundo Inteligível; Alegoria da Caverna; teoria da reminiscência).",
      "Dominar a física, metafísica e ética aristotélicas (hilemorfismo, teoria das quatro causas, ato e potência, eudaimonia e ética do justo meio).",
      "Articular o helenismo (estoicismo e epicurismo) e a transição para a filosofia medieval (patrística agostiniana: fé e razão, iluminação divina)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Giro Cosmológico aos Pré-Socráticos e Giro Antropológico Socrático",
          definicao: "A Filosofia nasce na Grécia Antiga (século VI a.C.) na passagem do Mito (narrativas poéticas de deuses e teogonias) para o Logos (explicação discursiva, causal, argumentativa e racional). Os primeiros filósofos (milésios, pitagóricos, eleatas e pluralistas) investigavam a physis (natureza) em busca do princípio primordial de todas as coisas (arché: água para Tales, ápeiron para Anaximandro, ar para Anaxímenes, fogo/devir para Heráclito, ser uno e imutável para Parmênides). No século V a.C., em Atenas, dá-se o Giro Antropológico: o foco desloca-se da natureza para o homem, a ética e a pólis. Enquanto os Sofistas (Protágoras, Górgias) defendiam o relativismo epistemológico e moral ('o homem é a medida de todas as coisas') e ensinavam a retórica persuasiva, Sócrates contrapunha-se a eles buscando a verdade universal e o autoconhecimento ('Só sei que nada sei; conhece-te a ti mesmo')."
        },
        {
          termo: "O Método Socrático: Ironia e Maiêutica",
          definicao: "Sócrates operava pelo diálogo dialético em duas etapas cruciais: 1) A Ironia (do grego eironeia, dissimulação): Sócrates interrogava interlocutores convictos de saberem o que era a justiça, a coragem ou a virtude, conduzindo-os a contradições lógicas até confessarem a própria ignorância (aporia), desconstruindo a falsa sabedoria (doxa); 2) A Maiêutica (parto de ideias, alusão à profissão de sua mãe, a parteira Fenarete): por meio de novas perguntas orientadoras, Sócrates ajudava a alma do interlocutor a 'dar à luz' conceitos verdadeiros (episteme) e definições universais essenciais."
        },
        {
          termo: "Platão: Teoria das Ideias, Reminiscência e Alegoria da Caverna",
          definicao: "Discípulo de Sócrates, Platão funda uma ontologia dualista: 1) Mundo Sensível: acessível pelos cinco sentidos, mutável, imperfeito, ilusório e efêmero, onde reina a opinião (doxa); 2) Mundo Inteligível (Mundo das Ideias/Formas): eterno, imutável, perfeito e acessível apenas pelo intelecto racional (nous/episteme), cujo ápice é a Ideia do Bem. As coisas sensíveis são cópias imperfeitas (mimesis) das Ideias perfeitas. Na epistemologia platônica, conhecer é recordar (anamnese/reminiscência): a alma imortal contemplou as Ideias perfeitas antes de encarnar em um corpo que a aprisionou. Na Alegoria da Caverna (Livro VII de A República), os prisioneiros acorrentados representam os homens presos às sombras e aparências sensoriais; a libertação e subida íngreme ao exterior simbolizam o doloroso caminho da educação filosófica (paideia), onde o Sol representa o Bem supremo e a verdade ontológica."
        },
        {
          termo: "Aristóteles: Hilemorfismo, Quatro Causas e Ética a Nicômaco",
          definicao: "Aristóteles rompe com o dualismo de dois mundos platônicos, defendendo que a essência das coisas está nelas mesmas (realismo imanente). Formula o Hilemorfismo: toda substância é composta indissociavelmente de Matéria (hyle: substrato passivo que recebe forma) e Forma (morphe: o que faz a coisa ser o que é). Para explicar a mudança e a passagem do tempo, formula o par Ato (a realidade presente e atual) e Potência (a capacidade intrínseca de vir a ser). Desenvolve a Teoria das Quatro Causas: 1) Material (do que é feita); 2) Formal (qual é sua forma/essência); 3) Eficiente (quem a produziu); 4) Final (telos, para qual finalidade ela existe). Em Ética a Nicômaco, defende a Eudaimonia (felicidade plena / realização da essência racional humana) como fim último (teleologia). A Virtude Ética (arete) é o Justo Meio (mesotes), isto é, o equilíbrio equilibrado entre a falta e o excesso (ex.: coragem é o justo meio entre a covardia e a temeridade imprudente)."
        },
        {
          termo: "Helenismo e a Filosofia Medieval Cristã (Agostinho)",
          definicao: "Após a crise das pólis gregas pelo Império Macedônico, o Helenismo foca na paz interior e serenidade individual (ataraxia). Destacam-se o Estoicismo (Zenão, Sêneca, Marco Aurélio: aceitação do logos cósmico universal, dever moral e apatheia perante o infortúnio) e o Epicurismo (Epicuro: busca do prazer moderado e afastamento das dores e perturbações da alma). Na Idade Média, Santo Agostinho (Patrística) cristianiza o platonismo: harmoniza Fé e Razão ('creio para entender, entendo para crer') e desenvolve a Teoria da Iluminação Divina (a mente humana finita necessita da graça luminosa de Deus para alcançar as verdades imutáveis e eternas)."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente no vestibular: confundir a atitude sofista com a socrática. Sofistas cobravam pelas aulas e ensinavam retórica para vencer debates políticos na assembleia ateniense com base no relativismo da persuasão; Sócrates recusava pagamento, rejeitava o relativismo e defendia que o objetivo da dialética não é vencer a discussão, mas encontrar a verdade objetiva e a virtude da alma."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Teoria das Causas e Ética Aristotélica",
      enunciado: "Em uma prova do vestibular UERJ/FUVEST, pergunta-se: 'Considere a escultura de mármore do pensador David esculpida por Michelangelo. Segundo a teoria das quatro causas de Aristóteles, quais são a causa material, a causa formal, a causa eficiente e a causa final dessa obra? Como a causalidade final se relaciona com o conceito de eudaimonia na vida humana?'",
      resolucao_passo_a_passo: "1. Aplicação das Quatro Causas aristotélicas à estátua:\n- Causa Material: o bloco bruto de mármore (a matéria sobre a qual opera a ação).\n- Causa Formal: a figura, proporções anatômicas e representação do corpo humano do herói David (a ideia e a estrutura que dão identidade à matéria).\n- Causa Eficiente (ou motriz): Michelangelo e o manuseio dos seus instrumentos (cinzel, martelo) que esculpiram a pedra.\n- Causa Final: a contemplação estética, admiração pública e celebração do ideal de perfeição cívica e artística (o propósito/telos da criação).\n\n2. Relação com a Eudaimonia:\n- Para Aristóteles, toda ação e criação humana orienta-se teleologicamente para um fim (telos). O fim último de todas as ações humanas é a Eudaimonia (felicidade como florescimento pleno da alma racional).\n- Assim como a escultura atinge sua excelência ao expressar com perfeição sua causa formal e final, o ser humano atinge a eudaimonia ao exercer sua racionalidade moral através da virtude do justo meio."
    }
  },
  questoes: [
    // Bloco 1: Fundamentos (1 a 5)
    {
      id: "FIL_ANT_01",
      origem: "ENEM - Adaptada",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Do Mito ao Logos: O Nascimento da Filosofia",
      tipo: "fechada",
      enunciado: "O nascimento da Filosofia na Grécia Antiga (século VI a.C.) é tradicionalmente caracterizado pela passagem do 'mito ao logos'. Essa transição representou:",
      alternativas: [
        { letra: "A", texto: "A eliminação abrupta e total de todas as crenças religiosas do povo grego pela imposição de leis estatais." },
        { letra: "B", texto: "A superação de explicações antropomórficas e sobrenaturais em favor de investigações racionais baseadas no princípio causal e na physis." },
        { letra: "C", texto: "A substituição da escrita alfabética pela transmissão exclusivamente oral dos poetas rapsodos como Homero e Hesíodo." },
        { letra: "D", texto: "A adoção do método experimental de laboratório para comprovar empiricamente a composição atômica da matéria." },
        { letra: "E", texto: "O abandono de discussões políticas e éticas para estudar unicamente os movimentos milagrosos dos deuses do Olimpo." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Passagem do mito ao logos",
        porque: "A Filosofia surge na Jônia buscando explicações cosmológicas baseadas na razão discursiva (logos) e nas forças naturais observáveis (physis e arché), rompendo com as narrativas míticas baseadas nos caprichos e vontades antropomórficas dos deuses."
      }
    },
    {
      id: "FIL_ANT_02",
      origem: "Vestibulares Regionais",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Filósofos Pré-Socráticos: Arché e Physis",
      tipo: "fechada",
      enunciado: "Os filósofos pré-socráticos ocuparam-se fundamentalmente com a cosmologia. Para eles, a palavra grega 'arché' significava:",
      alternativas: [
        { letra: "A", texto: "O governo oligárquico comandado pelos cidadãos mais ricos da pólis." },
        { letra: "B", texto: "A ilusão completa dos sentidos que nos impede de qualquer aprendizado." },
        { letra: "C", texto: "O princípio primordial, originário e constitutivo de todas as coisas que compõem o cosmos." },
        { letra: "D", texto: "O castigo exemplar aplicado pelos deuses aos humanos que cometeram hýbris." },
        { letra: "E", texto: "A técnica retórica de convencimento em debates forenses na ágora ateniense." }
      ],
      resposta: "C",
      gabarito: {
        letra: "C",
        ancora: "Conceito de Arché",
        porque: "Para os filósofos da natureza (pré-socráticos), a arché era a substância ou princípio fundamental ordenador e gerador do qual todas as coisas brotam, subsistem e para onde retornam."
      }
    },
    {
      id: "FIL_ANT_03",
      origem: "UFRGS",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Fácil",
      topico: "Sócrates: Ironia e Conhece-te a Ti Mesmo",
      tipo: "fechada",
      enunciado: "Ao afirmar 'Só sei que nada sei' e adotar o aforismo délfico 'Conhece-te a ti mesmo', Sócrates inaugurou uma nova postura filosófica cujo objetivo inicial consistia em:",
      alternativas: [
        { letra: "A", texto: "Demonstrar que o conhecimento seguro é impossível e incentivar o cinismo absoluto perante a moral." },
        { letra: "B", texto: "Reconhecer a própria ignorância para libertar-se das falsas certezas e iniciar a autêntica busca pela virtude e pela verdade." },
        { letra: "C", texto: "Cobrar altos honorários pelas suas palestras para provar que a sabedoria tem um valor mercantil elevado." },
        { letra: "D", texto: "Defender as opiniões tradicionais dos legisladores atenienses sem permitir qualquer tipo de questionamento crítico." },
        { letra: "E", texto: "Convencer o tribunal ateniense de que os oráculos divinos eram fraudes engendradas pela oligarquia espartana." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Autoconsciência da ignorância em Sócrates",
        porque: "O ponto de partida do pensamento socrático é o reconhecimento consciente da própria ignorância (desconstrução da doxa/opinião aparente) para que, desprovido do falso saber, o indivíduo possa buscar o verdadeiro conhecimento ético e racional."
      }
    },
    {
      id: "FIL_ANT_04",
      origem: "UNESP",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "O Método Socrático: Maiêutica",
      tipo: "fechada",
      enunciado: "Sócrates comparava frequentemente sua atividade filosófica com o ofício de sua mãe, a parteira Fenarete. Essa analogia fundamenta a segunda parte de seu método, denominada maiêutica, cujo papel principal é:",
      alternativas: [
        { letra: "A", texto: "Ensinar discursos prontos e convincentes para triunfar em disputas eleitorais na democracia ateniense." },
        { letra: "B", texto: "Fornecer respostas dogmáticas que os discípulos deveriam memorizar e repetir fielmente sem reflexão." },
        { letra: "C", texto: "Ajudar os interlocutores, por meio do diálogo racional orientado, a dar à luz as ideias e definições universais que já habitavam suas mentes." },
        { letra: "D", texto: "Interpretar os sonhos premonitórios dos jovens guerreiros antes de partirem para combates em Esparta." },
        { letra: "E", texto: "Realizar experimentos anatômicos para identificar em que órgão do corpo físico a razão se alojava." }
      ],
      resposta: "C",
      gabarito: {
        letra: "C",
        ancora: "A Maiêutica socrática",
        porque: "A maiêutica significa literalmente 'arte do parto'. Sócrates não depositava conhecimentos prontos na mente alheia; ele fazia perguntas para que a própria mente do interlocutor gerasse o conceito universal verdadeiro (a episteme)."
      }
    },
    {
      id: "FIL_ANT_05",
      origem: "UEL",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Sócrates versus os Sofistas",
      tipo: "fechada",
      enunciado: "Na Atenas clássica do século V a.C., Sócrates e os sofistas protagonizaram debates intensos sobre a educação e a verdade. Uma distinção essencial entre a postura socrática e a dos sofistas era que:",
      alternativas: [
        { letra: "A", texto: "Os sofistas acreditavam em uma verdade moral única e imutável, enquanto Sócrates sustentava que a verdade variava conforme a cultura de cada cidade." },
        { letra: "B", texto: "Os sofistas defendiam o uso da força militar como único critério de justiça, ao passo que Sócrates apoiava a tirania teocrática." },
        { letra: "C", texto: "Os sofistas cobravam para ensinar a oratória persuasiva e adotavam o relativismo moral, enquanto Sócrates buscava conceitos universais e valorizava o aprimoramento moral da alma sem exigir remuneração." },
        { letra: "D", texto: "Sócrates defendia o voto secreto de escravos e estrangeiros na assembleia, enquanto os sofistas restringiam o debate à casta dos sacerdotes délficos." },
        { letra: "E", texto: "Os sofistas dedicavam-se exclusivamente à matemática abstrata, enquanto Sócrates interessava-se apenas pela física atômica." }
      ],
      resposta: "C",
      gabarito: {
        letra: "C",
        ancora: "Diferença entre Sócrates e os Sofistas",
        porque: "Os sofistas eram mestres itinerantes de retórica focados no sucesso persuasivo da oratória política (relativismo); Sócrates recusava a mercantilização do saber e buscava definições universais da justiça, coragem e virtude em benefício da alma."
      }
    },

    // Bloco 2: Consolidação (6 a 10)
    {
      id: "FIL_ANT_06",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Platão: Dualismo Ontológico e Alegoria da Caverna",
      tipo: "fechada",
      enunciado: "Na obra *A República* (Livro VII), Platão apresenta a célebre Alegoria da Caverna. No contexto da teoria platônica do conhecimento, o interior da caverna e a luz solar do exterior representam, respectivamente:",
      alternativas: [
        { letra: "A", texto: "A sabedoria científica do empirismo moderno e as superstições pagãs da Antiguidade oriental." },
        { letra: "B", texto: "O Mundo Sensível, dominado pelas ilusões e aparências passageiras da opinião (doxa), e o Mundo Inteligível, iluminado pela Ideia Suprema do Bem (episteme)." },
        { letra: "C", texto: "O modelo econômico das pólis guerreiras e a utopia anarquista onde inexiste hierarquia estatal." },
        { letra: "D", texto: "A decadência da tirania espartana e o triunfo exclusivo da poesia lírica dos rapsodos homéricos." },
        { letra: "E", texto: "A punição eterna das almas no Hades e o nascimento dos filósofos pré-socráticos na região da Jônia." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Dualismo platônico e a Caverna",
        porque: "O interior da caverna simboliza a realidade empírica/sensível onde os homens confundem sombras com coisas reais (doxa); o exterior representa o Mundo das Ideias/Formas puras e inteligíveis, governado pela luz do Bem supremo."
      }
    },
    {
      id: "FIL_ANT_07",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Platão: Teoria da Reminiscência (Anamnese)",
      tipo: "fechada",
      enunciado: "No diálogo *Mênon*, Platão demonstra que um jovem escravo, que jamais havia estudado geometria, é capaz de demonstrar o teorema sobre a duplicação do quadrado apenas ao ser orientado por perguntas adequadas de Sócrates. Essa passagem serve a Platão como prova de que:",
      alternativas: [
        { letra: "A", texto: "Todo o conhecimento advém unicamente dos sentidos através da experiência tátil repetida exaustivamente." },
        { letra: "B", texto: "Conhecer é recordar (anamnese), pois a alma imortal já contemplou as Formas puras e perfeitas no Mundo Inteligível antes de encarnar." },
        { letra: "C", texto: "A matemática é uma convenção meramente linguística sem qualquer correspondência com a estrutura da realidade ontológica." },
        { letra: "D", texto: "O cérebro humano nasce como uma tábula rasa desprovida de qualquer predisposição ou princípio inato." },
        { letra: "E", texto: "Apenas os governantes com ascendência nobre possuem acesso inato às leis lógicas e geométricas do universo." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Teoria da reminiscência em Platão",
        porque: "Para Platão, o conhecimento verdadeiro é inato na alma (teoria da reminiscência/anamnese). O processo pedagógico e dialético socrático não cria o saber na mente, mas desperta as memórias das Ideias contempladas antes do nascimento."
      }
    },
    {
      id: "FIL_ANT_08",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Aristóteles: Hilemorfismo, Matéria e Forma",
      tipo: "fechada",
      enunciado: "Ao contrário de seu mestre Platão, Aristóteles sustentou que as essências não habitam um mundo transcendental separado. Sua doutrina hilemórfica afirma que todo ser físico individual (substância primeira) é composto indissociavelmente de:",
      alternativas: [
        { letra: "A", texto: "Vácuo cósmico e partículas indivisíveis que colidem de maneira estritamente caótica no espaço infinito." },
        { letra: "B", texto: "Ideias transcendentais e reflexos enganadores aprisionados nas profundezas do mundo das sombras." },
        { letra: "C", texto: "Matéria (hyle), que constitui o substrato passivo indeterminado, e Forma (morphe), que confere determinação, identidade e essência ao ser." },
        { letra: "D", texto: "Dois espíritos opostos em perpétua batalha cósmica entre o princípio da luz divina e o princípio da escuridão maligna." },
        { letra: "E", texto: "Elementos químicos puramente aleatórios que adquirem significado apenas quando expressos pela linguagem poética." }
      ],
      resposta: "C",
      gabarito: {
        letra: "C",
        ancora: "Doutrina do Hilemorfismo",
        porque: "O hilemorfismo (hyle = matéria; morphe = forma) explica que nenhum ser sensível existe sem matéria (o substrato físico) e forma (a configuração essencial que determina a identidade da substância)."
      }
    },
    {
      id: "FIL_ANT_09",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Aristóteles: Teoria do Ato e Potência",
      tipo: "fechada",
      enunciado: "Para resolver a contradição entre o imobilismo de Parmênides (o ser é imutável) e o mobilismo de Heráclito (tudo flui), Aristóteles formulou a distinção ontológica entre Ato e Potência. De acordo com essa teoria:",
      alternativas: [
        { letra: "A", texto: "O movimento e a transformação da natureza são puras ilusões dos sentidos humanos sem realidade física concreta." },
        { letra: "B", texto: "O movimento é a atualização da potência; a semente é árvore em potência e semente em ato, realizando seu telos ao germinar." },
        { letra: "C", texto: "Tudo o que existe no universo já está plenamente acabado em ato, sendo impossível qualquer novidade ontológica." },
        { letra: "D", texto: "A potência é superior ao ato, de modo que os seres preferem permanecer incompletos para preservar sua infinitude." },
        { letra: "E", texto: "O ato representa a corrupção degenerativa da matéria e a potência representa a elevação espiritual pós-morte." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Ato e Potência em Aristóteles",
        porque: "O movimento para Aristóteles é a passagem da potência (capacidade intrínseca de vir a ser) para o ato (a forma atualizada e realizada no presente)."
      }
    },
    {
      id: "FIL_ANT_10",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Ética Aristotélica: Eudaimonia e Justo Meio",
      tipo: "fechada",
      enunciado: "Em *Ética a Nicômaco*, Aristóteles sustenta que a virtude ética não é uma dádiva divina nem uma pulsão descontrolada, mas um hábito deliberado orientado pela razão que busca a mediania (justo meio). Isso significa que a virtude:",
      alternativas: [
        { letra: "A", texto: "Consiste na renúncia ascética absoluta a todos os prazeres do corpo e na busca deliberada pelo martírio." },
        { letra: "B", texto: "Consiste no ponto de equilíbrio racional entre dois extremos viciosos: um vício por excesso e outro por carência ou falta." },
        { letra: "C", texto: "Pode ser flexibilizada a qualquer momento para garantir a vitória do orador mais eloquente na vida pública." },
        { letra: "D", texto: "Identifica-se com a busca ilimitada de bens materiais, poder político e honrarias concedidas pelo Estado." },
        { letra: "E", texto: "Opõe-se à felicidade, visto que o dever moral exige sofrimento constante e infelicidade terrena." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Justo meio (mesotes) aristotélico",
        porque: "A teoria do justo meio (mesotes) afirma que a virtude moral situa-se no equilíbrio perfeito entre dois extremos viciosos. Por exemplo, a coragem é o meio-termo entre a covardia (falta) e a temeridade imprudente (excesso)."
      }
    },

    // Bloco 3: Aprofundamento e Excelência (11 a 15)
    {
      id: "FIL_ANT_11",
      origem: "FUVEST / UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Aristóteles: O Homem como Animal Político (Zoon Politikon)",
      tipo: "fechada",
      enunciado: "Em sua obra *A Política*, Aristóteles declara que 'o homem é por natureza um animal político (*zoon politikon*)'. O fundamento teleológico dessa tese aristotélica reside no fato de que:",
      alternativas: [
        { letra: "A", texto: "O ser humano só consegue sobreviver isolado na floresta se desenvolver técnicas avançadas de caça e armamento bélico." },
        { letra: "B", texto: "A pólis é uma convenção artificial criada unicamente para que os mais fortes explorem o trabalho compulsório dos escravos." },
        { letra: "C", texto: "Dotado de logos (linguagem discursiva capaz de discernir o justo do injusto), o homem só alcança a autossuficiência moral e a vida boa na comunidade da pólis." },
        { letra: "D", texto: "O destino inexorável da humanidade é guerrear permanentemente até a extinção dos Estados rivais." },
        { letra: "E", texto: "A política é uma atividade exclusiva dos deuses, cabendo aos seres humanos apenas obedecer cegamente aos decretos sacerdotais." }
      ],
      resposta: "C",
      gabarito: {
        letra: "C",
        ancora: "Homem como Zoon Politikon",
        porque: "Para Aristóteles, a pólis precede ontologicamente o indivíduo isolado: a razão e a linguagem humana (logos) existem para deliberar sobre o bem comum e a justiça. Quem vive fora da comunidade política ou é inferior (uma besta) ou é superior (um deus)."
      }
    },
    {
      id: "FIL_ANT_12",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Helenismo: Estoicismo e Ataraxia",
      tipo: "fechada",
      enunciado: "O filósofo estoico Epiteto escreveu: 'Não são as coisas que perturbam os seres humanos, mas o julgamento que eles fazem a respeito das coisas'. No contexto da filosofia helenística, a busca pela ataraxia pelos estoicos baseava-se em:",
      alternativas: [
        { letra: "A", texto: "Revoltar-se violentamente contra a ordem natural e transformar as estruturas políticas do império pelas armas." },
        { letra: "B", texto: "Diferenciar rigorosamente o que depende de nós (pensamentos, julgamentos, desejos) do que não depende de nós (fama, riqueza, infortúnios externos), aceitando a ordem do cosmos com serenidade." },
        { letra: "C", texto: "Entregar-se a prazeres sensoriais desmedidos como forma de anestesiar a angústia da mortalidade humana." },
        { letra: "D", texto: "Duvidar da existência material do mundo exterior e negar a validade de qualquer raciocínio lógico formal." },
        { letra: "E", texto: "Buscar o isolamento absoluto em cavernas desérticas para evitar qualquer contato com a civilização urbana." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Ética estoica e o controle das paixões",
        porque: "O estoicismo ensina que a paz de espírito (ataraxia/apatheia) surge quando o indivíduo assume pleno controle do que está sob seu poder de deliberação moral (julgamentos interiores) e aprende a aceitar com resignação ativa as circunstâncias exteriores inevitáveis regidas pelo Logos cósmico."
      }
    },
    {
      id: "FIL_ANT_13",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Helenismo: Epicurismo e a Concepção de Prazer",
      tipo: "fechada",
      enunciado: "Na *Carta sobre a Felicidade (a Meneceu)*, Epicuro expõe sua ética materialista e atomista. Diferente do hedonismo vulgar que busca prazeres imediatos e desregrados, o prazer epicurista autêntico consiste em:",
      alternativas: [
        { letra: "A", texto: "Aponia (ausência de dores no corpo) e ataraxia (imperturbabilidade da alma), alcançadas pela moderação de desejos e eliminação do medo da morte e dos deuses." },
        { letra: "B", texto: "Acumulação insaciável de honras cívicas, cargos políticos e banquetes suntuosos oferecidos à elite da pólis." },
        { letra: "C", texto: "Imolação do corpo em sacrifícios religiosos para aplacar a cólera dos deuses olímpicos." },
        { letra: "D", texto: "Desenvolvimento de habilidades retóricas refinadas para enganar concorrentes no comércio marítimo do Mediterrâneo." },
        { letra: "E", texto: "Consumo compulsivo de novidades mercantis como único remédio viável contra o tédio existencial." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Hedonismo racional de Epicuro",
        porque: "O prazer epicurista é prudente e comedido. Consiste essencialmente no estado negativo da ausência de sofrimento físico (aponia) e tranquilidade mental (ataraxia), libertando o ser humano do medo infundado da morte e de punições divinas."
      }
    },
    {
      id: "FIL_ANT_14",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Filosofia Medieval: Santo Agostinho e a Iluminação Divina",
      tipo: "fechada",
      enunciado: "Ao absorver postulados do neoplatonismo para a teologia cristã da Patrística, Santo Agostinho de Hipona formulou a Teoria da Iluminação Divina. Segundo essa concepção:",
      alternativas: [
        { letra: "A", texto: "A razão humana natural é autossuficiente e consegue descobrir todas as verdades científicas sem necessitar de Deus." },
        { letra: "B", texto: "Assim como os olhos físicos precisam da luz do Sol para enxergar os objetos visíveis, a inteligência humana finita necessita da luz divina interior para apreender as verdades eternas e imutáveis." },
        { letra: "C", texto: "O conhecimento é impossível para o ser humano na Terra, restando apenas obedecer às leis clericais por medo do inferno." },
        { letra: "D", texto: "O mundo material sensível foi criado pelo demônio e as almas virtuosas devem destruir o próprio corpo para purificar-se." },
        { letra: "E", texto: "A fé e a razão são antagônicas e inconciliáveis, devendo o fiel repudiar qualquer uso do pensamento lógico dedutivo." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Teoria da Iluminação Divina em Agostinho",
        porque: "Agostinho adapta a metáfora platônica do Sol: a mente humana (mutável e finita) só consegue contemplar as verdades eternas e imutáveis da matemática, da moral e de Deus porque é iluminada internamente pela graça divina (o Mestre Interior)."
      }
    },
    {
      id: "FIL_ANT_15",
      origem: "FUVEST / UNICAMP - Discursiva",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Platão versus Aristóteles: Ontologia e Teoria do Conhecimento",
      tipo: "aberta",
      enunciado: "Na célebre pintura 'A Escola de Atenas' (1509), de Rafael Sanzio, Platão é representado apontando o dedo indicador para o céu, enquanto Aristóteles, ao seu lado, mantém a palma da mão direita voltada horizontalmente para a terra. \n\nA partir dessa clássica representação iconográfica:\na) Explique como a postura corporal de Platão sintetiza sua ontologia e sua concepção acerca da origem do conhecimento verdadeiro.\nb) Explique como o gesto de Aristóteles expressa sua crítica ao dualismo platônico através de sua visão sobre o mundo sensível e a produção da ciência.",
      resposta: "a) O dedo apontado para cima simboliza o Mundo Inteligível das Ideias perfeitas, imutáveis e transcendentais, onde habita a verdade ontológica; b) A mão estendida para baixo simboliza o realismo empírico aristotélico, para quem a essência está imanente nas próprias coisas sensíveis e o conhecimento começa na experiência.",
      gabarito: {
        letra: "A",
        ancora: "Diferença ontológica Platão e Aristóteles",
        espera_se: "a) O candidato deve explicar que o gesto de Platão voltado para o alto representa o Mundo das Ideias (Formas inteligíveis, perfeitas e eternas). Para Platão, a verdadeira realidade é transcendente e o conhecimento verdadeiro (episteme) advém da alma racional recordando as Ideias contempladas antes de cair no corpo (reminiscência), e não dos sentidos materiais efêmeros.\nb) O candidato deve apontar que a mão de Aristóteles voltada para a terra expressa seu realismo imanente: ele rejeita a duplicação platônica da realidade em dois mundos separados. Para Aristóteles, as essências (formas) habitam as próprias substâncias materiais do mundo sensível (hilemorfismo). A produção do conhecimento inicia-se na observação sensorial e na experiência empírica, a partir das quais a mente humana abstrai os conceitos universais."
      }
    }
  ]
};

// -------------------------------------------------------------
// 2. FILOSOFIA - MODERNA E POLÍTICA
// -------------------------------------------------------------
const filModerna = {
  disciplina: "Filosofia",
  assunto: "Filosofia Política Moderna, Contratualismo e Ética Kantiana",
  publico_alvo: "Escolas de Alta Performance - Niterói e Rio de Janeiro (1º ao 3º ano EM)",
  modulo: "Contratualismo_Iluminismo_e_Etica",
  subpasta: "Moderna_e_Politica",
  arquivo_origem: "Questoes_Contratualismo_Iluminismo_e_Etica.json",
  benchmark_didatico: {
    capitulo: "Unidade Avançada Filosofia 2: O Estado de Natureza, o Pacto Social e a Razão Iluminista",
    objetivos_aprendizagem: [
      "Compreender a ruptura renascentista de Maquiavel: autonomia da política em relação à moral teológica medieval (virtù, fortuna e verdade efetiva das coisas).",
      "Analisar a revolução epistemológica moderna: a dúvida hiperbólica e o cogito de René Descartes contraposto ao empirismo de Francis Bacon e John Locke.",
      "Dominar o paradigma contratualista clássico comparando Estado de Natureza, motivação do pacto social e modelo de soberania em Hobbes, Locke e Rousseau.",
      "Dominar a ética deontológica de Immanuel Kant (crítica da razão pura, imperativo categórico versus hipotético e a autonomia da vontade humana).",
      "Analisar o pensamento político contemporâneo: teoria da ação comunicativa de Jürgen Habermas e a microfísica do poder/biopolítica de Michel Foucault."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Maquiavel e a Autonomia da Esfera Política",
          definicao: "Nicolau Maquiavel (*O Príncipe*, 1513) inaugura a Ciência Política Moderna ao romper com a visão teleológica e moralizante greco-medieval (que subordinava o governante à virtude cristã ou à justiça ideal de Platão). Maquiavel propõe investigar a 'verdade efetiva das coisas' (*verità effettuale*) como os seres humanos realmente agem e não como deveriam agir. A política possui lógica própria baseada na conquista e manutenção do poder estatal (*mantenere lo stato*). Formula a interação dinâmica entre Virtù (capacidade deliberativa, astúcia, firmeza e discernimento estratégico do líder para agir no momento oportuno) e Fortuna (a imprevisibilidade dos eventos históricos, o acaso e as circunstâncias externas que o líder sábio deve antecipar e canalizar)."
        },
        {
          termo: "Racionalismo Cartesiano versus Empirismo Britânico",
          definicao: "No século XVII, a epistemologia moderna bifurca-se: 1) Racionalismo (René Descartes): aplicação da dúvida metódica e hiperbólica (rejeição de certezas sensoriais, enganos e hipótese do gênio maligno) até encontrar a primeira certeza indubitável e autoevidente: 'Penso, logo existo' (*Cogito, ergo sum*). A razão possui ideias inatas postas por Deus; 2) Empirismo (Bacon, Locke, Hume): Francis Bacon propõe o método indutivo experimental contra os ídolos da mente. John Locke afirma que a mente humana ao nascer é uma *tábula rasa* (folha em branco), desprovida de ideias inatas, preenchida unicamente pela experiência sensorial (sensação externa e reflexão interna)."
        },
        {
          termo: "O Contratualismo Moderno: Hobbes, Locke e Rousseau",
          definicao: "O contratualismo explica a legitimidade do Estado civil a partir de um pacto deliberado que põe fim ao hipotético Estado de Natureza: 1) Thomas Hobbes (*Leviatã*): no estado de natureza, os homens são iguais em capacidade mas dominados pelo medo da morte violenta e pelo desejo de poder, resultando na 'guerra de todos contra todos' (*homo homini lupus*). Para preservar a vida e a paz, cedem irrestritamente sua liberdade individual a um Soberano Absoluto; 2) John Locke (*Segundo Tratado sobre o Governo Civil*): no estado de natureza, os homens possuem Direitos Naturais inalienáveis (vida, liberdade e propriedade privada fruto do trabalho). O pacto institui um Estado Liberal com separação de poderes para atuar como juiz imparcial na proteção da propriedade, cabendo aos cidadãos o Direito de Resistência se o governante violar o pacto; 3) Jean-Jacques Rousseau (*Do Contrato Social*): no estado de natureza, o homem é o 'bom selvagem' livre, igual e guiado pela piedade natural. A introdução da propriedade privada corrompe a sociedade e cria a desigualdade social. O contrato social legítimo deve restabelecer a liberdade cívica pela submissão à Vontade Geral (*volonté générale*), instituindo uma República democrática participativa inalienável."
        },
        {
          termo: "A Ética Deontológica e o Iluminismo de Immanuel Kant",
          definicao: "Em resposta à questão *O que é o Esclarecimento?* (*Aufklärung*), Kant define o Iluminismo como a saída do ser humano de sua menoridade culpada, ousando pensar por si mesmo (*Sapere Aude!*). Na moral (*Crítica da Razão Prática*), Kant propõe uma ética Deontológica (do dever pelo dever), universalista, autônoma e a priori, livre de inclinações empíricas ou busca de recompensas. Formula o Imperativo Categórico: 'Age apenas segundo uma máxima tal que possas ao mesmo tempo querer que ela se torne lei universal'. Distingue-o do Imperativo Hipotético (que impõe condições: 'se queres X, faz Y'). Na segunda formulação do imperativo categórico, estabelece que os seres humanos nunca devem ser tratados meramente como meios para alcançar fins alheios, mas sempre como fins em si mesmos dotados de dignidade intrínseca."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico de prova: resumir Maquiavel à frase apócrifa 'os fins justificam os meios'. Maquiavel jamais escreveu isso textualmente; ele sustentava que as exigências da sobrevivência do Estado e do bem coletivo exigem que o governante saiba adaptar seus métodos à realidade das contingências, podendo agir contrariamente à benevolência comum se for indispensável para evitar o caos e a anarquia geral."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Comparação dos Modelos de Estado em Hobbes e Locke",
      enunciado: "Analise a seguinte questão discursiva: 'Explique a divergência central entre Thomas Hobbes e John Locke no que tange ao direito de rebelião ou resistência dos súditos contra o governante que abusa do poder'.",
      resolucao_passo_a_passo: "1. Perspectiva de Thomas Hobbes:\n- Para Hobbes, o contrato social transfere a soberania integralmente ao soberano (o Leviatã) em troca da garantia da segurança e preservação da vida.\n- Como o governante não é signatário do contrato (o pacto foi firmado entre os indivíduos reciprocamente), sua soberania é absoluta e indivisível.\n- Portanto, Hobbes nega o direito de rebelião ou revolta contra leis injustas; revoltar-se seria retornar ao pior de todos os cenários possíveis: a anarquia e a guerra de todos contra todos do estado de natureza.\n\n2. Perspectiva de John Locke:\n- Para Locke, o governo civil é constituído sob uma relação de confiança (fiduciary trust) com o propósito específico de proteger os direitos naturais inalienáveis (vida, liberdade e bens/propriedade).\n- Se o governante extrapola suas funções, torna-se um tirano e ataca a propriedade ou a vida dos cidadãos, ele quebra o pacto e coloca-se em estado de guerra contra o povo.\n- Consequentemente, Locke legitima expressamente o Direito de Resistência e Insurreição: a sociedade civil tem o direito de destituir o governante tirano e instituir um novo poder legislativo legítimo."
    }
  },
  questoes: [
    // Bloco 1: Fundamentos (1 a 5)
    {
      id: "FIL_MOD_01",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Maquiavel: Virtù e Fortuna",
      tipo: "fechada",
      enunciado: "Em *O Príncipe*, Maquiavel introduz dois conceitos determinantes para a análise da ação política: *virtù* e *fortuna*. Na visão do pensador florentino, um governante bem-sucedido deve:",
      alternativas: [
        { letra: "A", texto: "Confiar cegamente na providência divina e abster-se de tomar decisões bélicas preventivas." },
        { letra: "B", texto: "Aliar a astúcia, coragem e discernimento estratégico (virtù) para dominar e canalizar os imprevistos da história e do acaso (fortuna)." },
        { letra: "C", texto: "Seguir rigorosamente todos os preceitos do ascetismo monástico medieval para alcançar a santidade pessoal." },
        { letra: "D", texto: "Distribuir todos os recursos financeiros do tesouro público ao povo para garantir aprovação unânime e pacífica." },
        { letra: "E", texto: "Governar sob consulta mandatória dos generais inimigos a fim de demonstrar desapego pelo território." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Virtù e Fortuna em Maquiavel",
        porque: "Para Maquiavel, a fortuna é como um rio revolto que causa destruição; o líder prudente provido de virtù constrói canais e diques preventivos para direcionar as forças do acaso e manter a estabilidade do Estado."
      }
    },
    {
      id: "FIL_MOD_02",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Descartes: A Dúvida Metódica e o Cogito",
      tipo: "fechada",
      enunciado: "Ao iniciar suas *Meditações Metafísicas*, René Descartes decide duvidar de tudo o que até então aprendera por meio dos sentidos. A finalidade dessa dúvida radical é:",
      alternativas: [
        { letra: "A", texto: "Afirmar o ceticismo permanente e demonstrar que qualquer tipo de ciência é uma fantasia impossível." },
        { letra: "B", texto: "Encontrar um ponto de apoio firme e indubitável (uma primeira certeza absoluta) a partir do qual reconstruir todo o edifício do saber." },
        { letra: "C", texto: "Provar que as teorias cosmológicas da Igreja medieval eram totalmente exatas e imunes a críticas." },
        { letra: "D", texto: "Substituir a dedução racional pelo conhecimento baseado unicamente no misticismo astrológico." },
        { letra: "E", texto: "Proclamar a superioridade dos sentimentos românticos em detrimento da razão matemática." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Dúvida metódica cartesiana",
        porque: "A dúvida cartesiana é metódica e instrumental, não cética: Descartes duvida deliberadamente de tudo para eliminar o erro e encontrar um fundamento inabalável para a ciência, que é o 'penso, logo existo' (Cogito, ergo sum)."
      }
    },
    {
      id: "FIL_MOD_03",
      origem: "UNESP",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Fácil",
      topico: "Empirismo: Francis Bacon e os Ídolos da Mente",
      tipo: "fechada",
      enunciado: "Em sua obra *Novum Organum*, Francis Bacon sustenta que o verdadeiro método da ciência moderna exige a indução experimental e a libertação dos 'ídolos' que obscurecem o intelecto humano. Entre eles, os 'ídolos da caverna' correspondem:",
      alternativas: [
        { letra: "A", texto: "Aos erros decorrentes da própria natureza biológica imperfeita da espécie humana universal." },
        { letra: "B", texto: "Aos preconceitos e ilusões particulares de cada indivíduo forjados pela sua educação, hábitos e ambiente pessoal." },
        { letra: "C", texto: "Às ambiguidades e imprecisões nascidas da linguagem e das palavras usadas no comércio social." },
        { letra: "D", texto: "Às falsas teorias e dogmas filosóficos transmitidos acriticamente pela autoridade acadêmica tradicional." },
        { letra: "E", texto: "Às assombrações míticas criadas pelo pavor das noites sem iluminação artificial nas cidades." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Teoria dos Ídolos de Bacon",
        porque: "Os ídolos da caverna referem-se às limitações e vícios cognitivos próprios de cada indivíduo singular, gerados pelo temperamento individual, educação recebida e leituras particulares que distorcem a realidade."
      }
    },
    {
      id: "FIL_MOD_04",
      origem: "UERJ",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Locke: A Mente como Tábula Rasa",
      tipo: "fechada",
      enunciado: "Em *Ensaio acerca do Entendimento Humano*, John Locke recusa a tese cartesiana das ideias inatas, propondo a metáfora da mente como uma folha em branco (*tábula rasa*). Segundo Locke, a origem de todas as nossas ideias repousa na:",
      alternativas: [
        { letra: "A", texto: "Revelação mística concedida diretamente pelas autoridades eclesiásticas aos fiéis batizados." },
        { letra: "B", texto: "Experiência empírica, subdividida na sensação dos objetos externos e na reflexão interna das operações da mente." },
        { letra: "C", texto: "Herança genética inalterável transmitida pelos ancestrais desde a aurora dos tempos primordiais." },
        { letra: "D", texto: "Memória subconsciente das almas imortais que contemplaram as Formas perfeitas no além." },
        { letra: "E", texto: "Vontade divina que infunde princípios geométricos automáticos no cérebro do recém-nascido." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Empirismo e Tábula Rasa em Locke",
        porque: "Para Locke, 'nada está no intelecto que não tenha passado antes pelos sentidos'. Todo o conhecimento brota da experiência, que fornece ideias simples através da sensação exterior e da reflexão mental interior."
      }
    },
    {
      id: "FIL_MOD_05",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Hobbes: O Estado de Natureza e o Medo da Morte Violenta",
      tipo: "fechada",
      enunciado: "Para Thomas Hobbes, autor de *Leviatã*, a condição humana no Estado de Natureza é caracterizada pela guerra permanente de todos contra todos. O motivo determinante que conduz os homens a firmarem o pacto social é:",
      alternativas: [
        { letra: "A", texto: "A busca da santidade cristã e a esperança na salvação da alma após a morte terrena." },
        { letra: "B", texto: "O anseio por riqueza imobiliária obtida na exploração de colônias transatlânticas." },
        { letra: "C", texto: "O medo constante da morte violenta e a necessidade racional de preservar a própria vida e a paz civil." },
        { letra: "D", texto: "O desejo altruísta de dividir todos os alimentos cultivados fraternalmente com as tribos vizinhas." },
        { letra: "E", texto: "A pressão popular exercida por partidos sindicais legalmente estruturados na época." }
      ],
      resposta: "C",
      gabarito: {
        letra: "C",
        ancora: "Motivação do pacto em Hobbes",
        porque: "Hobbes diagnostica que no estado de natureza a vida humana é 'solitária, pobre, sórdida, embrutecida e curta'. A paixão que inclina os indivíduos à paz é o medo supremo da morte violenta, levando a razão a sugerir o pacto de transferência de poder ao Leviatã."
      }
    },

    // Bloco 2: Consolidação (6 a 10)
    {
      id: "FIL_MOD_06",
      origem: "UNICAMP",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Locke: Direitos Naturais e Propriedade Privada",
      tipo: "fechada",
      enunciado: "No *Segundo Tratado sobre o Governo Civil*, John Locke defende que a propriedade privada é um direito natural que precede a constituição do Estado civil. Para Locke, a legitimidade originária da posse de um bem natural repousa no:",
      alternativas: [
        { letra: "A", texto: "Decreto real outorgado pelo monarca absolutista por graça e desígnio de Deus." },
        { letra: "B", texto: "Trabalho empreendido pelo indivíduo, que mistura sua força humana aos recursos da natureza." },
        { letra: "C", texto: "Poder bélico do guerreiro mais forte que conquista violentamente o solo alheio." },
        { letra: "D", texto: "Acordo secreto entre os sacerdotes dos templos e os chefes das corporações mercantis." },
        { letra: "E", texto: "Sorteio anual realizado pelas assembleias populares de camponeses da região." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Teoria da propriedade em Locke",
        porque: "Para Locke, cada homem tem a propriedade de sua própria pessoa; portanto, quando ele agrega o trabalho de seu corpo e a obra de suas mãos à terra ou matéria natural comum, torna aquele bem sua propriedade privada legítima."
      }
    },
    {
      id: "FIL_MOD_07",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Rousseau: O Bom Selvagem e a Origem da Desigualdade",
      tipo: "fechada",
      enunciado: "Em seu *Discurso sobre a Origem e os Fundamentos da Desigualdade entre os Homens*, Jean-Jacques Rousseau afirma que o primeiro que, tendo cercado um terreno, lembrou-se de dizer 'isto é meu' e encontrou pessoas bastante simples para acreditar nele, foi o verdadeiro fundador da sociedade civil. Nessa obra, Rousseau argumenta que:",
      alternativas: [
        { letra: "A", texto: "A sociedade civil e a tecnologia aperfeiçoaram a pureza moral do ser humano em comparação com a barbárie primitiva." },
        { letra: "B", texto: "A instituição da propriedade privada corrompeu a liberdade e igualdade naturais do homem primitivo, inaugurando a opressão e as rivalidades sociais." },
        { letra: "C", texto: "O homem nasce perverso por natureza e somente o chicote do monarca absolutista é capaz de conter seus impulsos criminosos." },
        { letra: "D", texto: "A propriedade coletiva dos meios de produção era desconhecida na história e deve ser criminalizada pelas leis do direito divino." },
        { letra: "E", texto: "O desenvolvimento das artes e das ciências no século XVIII libertou completamente o proletariado da servidão física." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Rousseau e a desigualdade",
        porque: "Rousseau sustenta que o homem nasce bom e livre no estado de natureza, mas a sociedade baseada na posse privada de terras e riquezas introduz a cobiça, a escravidão, o orgulho artificial e a desigualdade moral e política."
      }
    },
    {
      id: "FIL_MOD_08",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Rousseau: Contrato Social e a Vontade Geral",
      tipo: "fechada",
      enunciado: "Em *Do Contrato Social*, Rousseau propõe como solução política para a restauração da liberdade a instituição da 'Vontade Geral' (*volonté générale*). Esse conceito rousseauísta define-se como:",
      alternativas: [
        { letra: "A", texto: "A mera soma aritmética dos interesses corporativos e egoístas de todos os indivíduos particulares da comunidade." },
        { letra: "B", texto: "O interesse comum e soberano voltado para o bem público da coletividade, ao qual todo cidadão deve aderir como parte indivisível do corpo político." },
        { letra: "C", texto: "A imposição autoritária da vontade do líder militar mais prestigiado pela corte palaciana." },
        { letra: "D", texto: "A decisão unânime dos magistrados de delegar a soberania nacional a companhias financeiras estrangeiras." },
        { letra: "E", texto: "O respeito absoluto às concessões hereditárias de títulos nobiliárquicos concedidos pela coroa monárquica." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Vontade Geral em Rousseau",
        porque: "Rousseau distingue a 'Vontade de Todos' (soma dos interesses egoístas privados) da 'Vontade Geral', que visa unicamente ao interesse comum, à justiça coletiva e à soberania popular inalienável da República."
      }
    },
    {
      id: "FIL_MOD_09",
      origem: "UEL / UNESP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Iluminismo: Montesquieu e a Separação de Poderes",
      tipo: "fechada",
      enunciado: "Em *O Espírito das Leis* (1748), Montesquieu formula a doutrina da separação e equilíbrio dos poderes do Estado. Sua preocupação filosófica central consistia em:",
      alternativas: [
        { letra: "A", texto: "Concentrar todas as decisões civis e jurídicas nas mãos de um tirano esclarecido para agilizar reformas econômicas." },
        { letra: "B", texto: "Garantir que 'o poder freie o poder' (sistema de freios e contrapesos), evitando que a concentração de mando nas mãos de um único indivíduo ou grupo destrua a liberdade política." },
        { letra: "C", texto: "Subordinar o poder executivo nacional aos mandatos eclesiásticos emitidos pelo colégio de cardeais do Vaticano." },
        { letra: "D", texto: "Extinguir os tribunais judiciais para permitir que o povo exerça justiça sumária através de linchamentos públicos." },
        { letra: "E", texto: "Restringir o acesso ao voto apenas para guerreiros de infantaria pesada da cavalaria real." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Tripartição dos Poderes em Montesquieu",
        porque: "Montesquieu postulou que quem detém poder é tentado a abusar dele até onde encontrar limites. Dividir as funções estatais em Executivo, Legislativo e Judiciário independentes e harmônicos cria o equilíbrio essencial para proteger a liberdade civil."
      }
    },
    {
      id: "FIL_MOD_10",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Kant: Esclarecimento e Maioridade Intelectual",
      tipo: "fechada",
      enunciado: "Em sua famosa resposta à pergunta *O que é o Esclarecimento?* (*Aufklärung*), Immanuel Kant convoca os indivíduos a romperem com o comodismo e adotarem o lema *Sapere Aude!* ('Ousa saber!'). Para Kant, a menoridade humana deve-se fundamentalmente à:",
      alternativas: [
        { letra: "A", texto: "Falta congênita de inteligência da classe trabalhadora que a impede de compreender teorias científicas." },
        { letra: "B", texto: "Ausência de coragem e firmeza de ânimo para servir-se do próprio entendimento sem a tutela e direção de outrem." },
        { letra: "C", texto: "Proibição expressa das universidades que impediam os nobres de lerem romances literários em língua vernácula." },
        { letra: "D", texto: "Escassez de papel e tinta que impedia a reprodução de enciclopédias na Europa moderna." },
        { letra: "E", texto: "Predeterminação biológica dos seres humanos para a servidão eterna perante líderes messiânicos." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Menoridade e Sapere Aude em Kant",
        porque: "Kant afirma que a menoridade é a incapacidade do ser humano de servir-se do próprio entendimento sem a guia de outrem, e a causa dela não é a falta de intelecto, mas a falta de decisão e coragem moral para pensar autonomamente."
      }
    },

    // Bloco 3: Aprofundamento e Excelência (11 a 15)
    {
      id: "FIL_MOD_11",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Kant: Imperativo Categórico versus Imperativo Hipotético",
      tipo: "fechada",
      enunciado: "Na *Fundamentação da Metafísica dos Costumes*, Immanuel Kant estabelece a distinção entre imperativos hipotéticos e o imperativo categórico. Um exemplo prático que expressa genuinamente uma ação moral pautada no Imperativo Categórico é:",
      alternativas: [
        { letra: "A", texto: "'Devo falar a verdade para que meus clientes confiem em mim e comprem mais mercadorias em minha loja'." },
        { letra: "B", texto: "'Devo ajudar os necessitados para garantir um lugar de honra no paraíso após o julgamento final'." },
        { letra: "C", texto: "'Devo agir honestamente porque a honestidade é um dever moral universal incondicional, válido para todo ser racional, independentemente das vantagens ou consequências particulares'." },
        { letra: "D", texto: "'Devo pagar meus tributos rigorosamente para não ser multado e encarcerado pela fiscalização fazendária'." },
        { letra: "E", texto: "'Devo cumprimentar os vizinhos para que eles cuidem da minha casa durante minhas viagens de férias'." }
      ],
      resposta: "C",
      gabarito: {
        letra: "C",
        ancora: "Imperativo Categórico Kantiano",
        porque: "O imperativo categórico impõe o dever moral de forma incondicional e a priori (agir por dever e pelo dever), desvinculado de qualquer interesse secundário, cálculo utilitário ou recompensa ulterior presente nas outras alternativas (que são hipotéticas)."
      }
    },
    {
      id: "FIL_MOD_12",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Kant: A Segunda Formulação do Imperativo Categórico e a Dignidade Humana",
      tipo: "fechada",
      enunciado: "Kant formulou o imperativo prático nos seguintes termos: 'Age de tal maneira que uses a humanidade, tanto na tua pessoa como na pessoa de qualquer outro, sempre e simultaneamente como fim e nunca simplesmente como meio'. Essa fórmula kantiana constitui o fundamento filosófico moderno para:",
      alternativas: [
        { letra: "A", texto: "A doutrina mercantilista da exploração máxima da mão de obra para aumentar o superávit comercial da coroa." },
        { letra: "B", texto: "O conceito intransponível de dignidade humana e a defesa dos Direitos Humanos universais, vedando a instrumentalização de indivíduos." },
        { letra: "C", texto: "A legalização irrestrita da escravidão em países que enfrentam grave crise econômica e produtiva." },
        { letra: "D", texto: "A submissão voluntária dos trabalhadores assalariados a condições insalubres em nome do progresso fabril." },
        { letra: "E", texto: "A hierarquização das etnias humanas com base na morfologia craniana defendida no século XIX." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Dignidade humana como fim em si mesmo",
        porque: "Para Kant, as coisas têm preço, mas as pessoas humanas possuem dignidade intrínseca. Tratar o outro sempre como 'fim em si mesmo' impede que seres humanos sejam degradados a meras ferramentas, instrumentos ou mercadorias de interesses alheios."
      }
    },
    {
      id: "FIL_MOD_13",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Habermas: Razão Comunicativa e Esfera Pública",
      tipo: "fechada",
      enunciado: "O filósofo contemporâneo Jürgen Habermas contrapõe a 'razão instrumental' (voltada para o controle técnico e a dominação utilitária da natureza e dos indivíduos) à 'razão comunicativa'. A ação comunicativa habermasiana tem como objetivo central:",
      alternativas: [
        { letra: "A", texto: "A imposição de discursos hegemônicos através da censura estatal nos meios de comunicação de massa." },
        { letra: "B", texto: "O entendimento mútuo e a construção de consenso racional intersubjetivo livre de coação através do debate argumentativo na esfera pública." },
        { letra: "C", texto: "O desenvolvimento de algoritmos de inteligência artificial para substituir os votos dos cidadãos nas urnas eleitorais." },
        { letra: "D", texto: "A conversão forçada de comunidades indígenas a religiões teocêntricas ocidentais." },
        { letra: "E", texto: "A vitória retórica em fóruns partidários pelo uso de falácias deliberadas e intimidação psicológica." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Ação Comunicativa em Habermas",
        porque: "Para Habermas, a razão comunicativa busca o consenso dialógico intersubjetivo não coagido (a melhor força do melhor argumento), constituindo a base emancipatória da democracia deliberativa e dos direitos fundamentais."
      }
    },
    {
      id: "FIL_MOD_14",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Foucault: Micropoder, Disciplina e Biopolítica",
      tipo: "fechada",
      enunciado: "Em *Vigiar e Punir* e na *História da Sexualidade*, Michel Foucault rompe com a visão tradicional do poder centrado unicamente no aparelho repressivo do Estado jurídico. Sua teoria do micropoder e da biopolítica demonstra que:",
      alternativas: [
        { letra: "A", texto: "O poder é uma propriedade substancial possuída unicamente pelo presidente da república ou monarca." },
        { letra: "B", texto: "O poder é difuso, capilarizado e exercido em redes disciplinares que moldam corpos e controlam populações (escolas, fábricas, prisões, hospitais)." },
        { letra: "C", texto: "A disciplina corporal desapareceu completamente na modernidade com a abolição dos pelourinhos públicos." },
        { letra: "D", texto: "O Estado moderno não tem qualquer interesse estatístico na saúde, higiene ou natalidade dos povos." },
        { letra: "E", texto: "As prisões contemporâneas funcionam exclusivamente como centros de meditação filosófica voluntária." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Microfísica do Poder e Biopolítica em Foucault",
        porque: "Foucault demonstra que o poder moderno opera de maneira capilar e dispersa em micropoderes institucionais (ortopedia dos corpos) e em biopolítica (gestão estatística da vida, longevidade e natalidade das populações)."
      }
    },
    {
      id: "FIL_MOD_15",
      origem: "FUVEST / UNICAMP - Discursiva",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Contratualismo Comparado: Hobbes e Rousseau na Concepção da Natureza Humana",
      tipo: "aberta",
      enunciado: "Considere as famosas passagens:\nI. 'O homem é o lobo do homem (*homo homini lupus*).' (Thomas Hobbes)\nII. 'O homem nasce livre, e por toda parte encontra-se a ferros. (...) O homem é naturalmente bom, mas a sociedade o corrompe.' (Jean-Jacques Rousseau)\n\nCom base nas premissas desses dois teóricos do pacto social:\na) Explique por que a antropologia hobbesiana justifica a instituição de uma soberania absolutista e indivisível.\nb) Explique como a visão de Rousseau sobre o surgimento da sociedade civil fundamenta sua defesa de uma soberania democrática baseada na Vontade Geral.",
      resposta: "a) Para Hobbes, o homem no estado de natureza é egoísta, dominado pelo medo e pela competição feroz, o que exige um soberano absolutista com monopólio da força para conter a anarquia violenta; b) Para Rousseau, o homem é naturalmente bom e a propriedade privada introduz a corrupção e servidão; logo, apenas o pacto social participativo fundado na Vontade Geral resgata a liberdade cívica.",
      gabarito: {
        letra: "A",
        ancora: "Antropologia contratualista comparada",
        espera_se: "a) O candidato deve apontar que, para Hobbes, a natureza humana é governada pelo instinto de autoconservação, paixões egoístas e desconfiança mútua no estado de natureza, conduzindo à guerra de todos contra todos. Para evitar esse caos destrutivo e o medo constante da morte violenta, os indivíduos alienam voluntariamente sua liberdade em favor de um governante soberano com poder absoluto e indivisível (o Leviatã), dotado de força irresistível para manter a ordem e a paz civil.\nb) O candidato deve explicar que, para Rousseau, o homem no estado de natureza original é livre, pacífico e compassivo (o 'bom selvagem'). A degeneração moral e a opressão política surgiram historicamente com a introdução da propriedade privada e das desigualdades artificiais da sociedade civil. Para superar essa opressão sem retornar à vida silvestre, Rousseau defende um contrato social legítimo onde todos se doam integralmente à comunidade política soberana, obedecendo à 'Vontade Geral'. Dessa forma, obedecendo às leis que eles mesmos criaram democraticamente como cidadãos, os homens mantêm-se livres como antes."
      }
    }
  ]
};

// -------------------------------------------------------------
// 3. SOCIOLOGIA - CLÁSSICOS E TEORIA
// -------------------------------------------------------------
const socClassicos = {
  disciplina: "Sociologia",
  assunto: "Clássicos da Sociologia - Durkheim, Weber e Marx",
  publico_alvo: "Escolas de Alta Performance - Niterói e Rio de Janeiro (1º ao 3º ano EM)",
  modulo: "Durkheim_Weber_Marx",
  subpasta: "Classicos_e_Teoria",
  arquivo_origem: "Questoes_Durkheim_Weber_Marx.json",
  benchmark_didatico: {
    capitulo: "Unidade 1: Os Fundadores da Sociologia e a Análise da Sociedade Moderna",
    objetivos_aprendizagem: [
      "Compreender o contexto histórico-social de emergência da Sociologia no século XIX (Revolução Industrial, Revolução Francesa e o Positivismo de Auguste Comte).",
      "Dominar o método funcionalista de Émile Durkheim: regras do método sociológico, fato social (coercitividade, exterioridade e generalidade), solidariedade mecânica versus orgânica e o conceito de anomia.",
      "Dominar a sociologia compreensiva de Max Weber: ação social e seus quatro tipos, método do tipo ideal, a ética protestante e o espírito do capitalismo, tipos de dominação legítima e burocracia racional-legal.",
      "Dominar o materialismo histórico e dialético de Karl Marx: infraestrutura e superestrutura, luta de classes, alienação do trabalho, mais-valia absoluta e relativa e fetichismo da mercadoria.",
      "Comparar criticamente os três pensadores em termos de objeto de estudo, método analítico e visão da relação entre indivíduo e estrutura social."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Contexto de Nascimento e Positivismo (Comte)",
          definicao: "A Sociologia consolida-se no século XIX como resposta científica às profundas rupturas estruturais causadas pela dupla revolução: a Revolução Industrial (urbanização caótica, formação do proletariado, jornadas desumanas) e a Revolução Francesa (queda do Antigo Regime, fragmentação da ordem tradicional). Auguste Comte cunha o termo Sociologia e formula o Positivismo: a sociedade deve ser estudada com o mesmo rigor neutro e objetivo das ciências naturais (física social). Formula a 'Lei dos Três Estados' da evolução do espírito humano: Teológico (explicações por deuses/forças sobrenaturais), Metafísico (explicações por forças abstratas e essências) e Positivo (explicações por leis científicas empíricas invariáveis de causa e efeito). Seu lema fundamental era 'Ordem e Progresso'."
        },
        {
          termo: "Émile Durkheim: Fato Social e Coesão Social",
          definicao: "Durkheim estabelece a Sociologia como disciplina acadêmica autônoma com objeto e método próprios (*As Regras do Método Sociológico*, 1895). O objeto é o Fato Social, que possui três características fundamentais: 1) Coercitividade (impõe-se aos indivíduos sob forma de sanções morais ou legais); 2) Exterioridade (existe antes e fora da consciência individual); 3) Generalidade (é comum aos membros da sociedade ou de determinado grupo). Regra fundamental: 'os fatos sociais devem ser tratados como coisas'. Em *Da Divisão do Trabalho Social*, investiga a coesão social distinguindo: Solidariedade Mecânica (sociedades pré-modernas simples, forte consciência coletiva, pouca divisão do trabalho, direito punitivo/repressivo) e Solidariedade Orgânica (sociedades modernas industriais, alta especialização de funções, interdependência funcional e direito restitutivo). Introduz o conceito de Anomia: estado patológico de enfraquecimento ou quebra das regras morais que desorienta os indivíduos (analisado em sua obra clássica *O Suicídio*, onde tipifica o suicídio egoísta, altruísta, anômico e fatalista)."
        },
        {
          termo: "Max Weber: Sociologia Compreensiva e Tipos de Ação Social",
          definicao: "Weber rejeita o naturalismo determinista e concebe a Sociologia como ciência compreensiva e interpretativa do sentido subjetivo que os atores atribuem à sua conduta (*Economia e Sociedade*). O objeto da sociologia é a Ação Social (conduta orientada reciprocamente pelas ações de outros). Utiliza o recurso metodológico do Tipo Ideal (construção conceitual abstrata e pura que acentua traços da realidade para servir de régua comparativa). Classifica a Ação Social em quatro tipos: 1) Racional com relação a fins (cálculo instrumental de meios para atingir objetivos); 2) Racional com relação a valores (fidelidade a convicções éticas, religiosas ou estéticas, independentemente das consequências); 3) Afetiva (movida por emoções e paixões imediatas); 4) Tradicional (orientada por costumes e hábitos arraigados). Em *A Ética Protestante e o Espírito do Capitalismo*, demonstra como a ascese intramundana do calvinismo (vocação e doutrina da predestinação comprovada pelo sucesso laborioso) afinou-se com a racionalidade contábil do capitalismo. Classifica a Dominação Legítima em: Tradicional (baseada no sagrado e costume antigo: patriarcalismo), Carismática (baseada na devoção ao heroísmo ou santidade do líder extraordinário) e Racional-Legal (baseada na obediência a estatutos e leis impessoais: a burocracia moderna)."
        },
        {
          termo: "Karl Marx: Materialismo Histórico e Luta de Classes",
          definicao: "Marx e Friedrich Engels formulam o Materialismo Histórico e Dialético: as condições materiais de produção e reprodução da vida real determinam a organização social e a consciência humana ('Não é a consciência que determina o ser, mas o ser social que determina a consciência'). A sociedade estrutura-se em: Infraestrutura (a base econômica material: forças produtivas e relações de produção) que condiciona a Superestrutura (as instituições jurídicas, políticas, religiosas e ideológicas que legitimam o poder dominante). A história de todas as sociedades é a história da luta de classes (senhores x escravos, nobres x servos, burgueses x proletários). No capitalismo (*O Capital*), a burguesia detém os meios de produção e o proletariado vende sua força de trabalho como mercadoria. A Mais-Valia é o valor excedente produzido pelo trabalhador e não remunerado pelo salário, apropriado pelo capitalista (Mais-Valia Absoluta pelo aumento da jornada de trabalho; Mais-Valia Relativa pelo ganho de produtividade com máquinas). Desenvolve a Alienação (o operário não se reconhece no produto de seu labor nem no processo produtivo) e o Fetichismo da Mercadoria (as relações sociais entre trabalhadores assumem a forma fantasmagórica de relações de troca de valor entre coisas)."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente no vestibular: a relação entre indivíduo e sociedade. Para Durkheim, a sociedade molda e coage o indivíduo de fora para dentro (primazia do social); para Weber, a sociedade é o resultado interativo das ações sociais individuais dotadas de sentido de dentro para fora (individualismo metodológico); para Marx, os indivíduos constroem a história, mas sob circunstâncias materiais preexistentes e antagonismos de classe que não foram escolhidos por eles."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Comparação Metodológica entre Durkheim, Weber e Marx",
      enunciado: "Considere a questão: 'Explique como a divisão do trabalho na sociedade moderna é interpretada de maneira diametralmente oposta por Émile Durkheim e por Karl Marx'.",
      resolucao_passo_a_passo: "1. Visão de Émile Durkheim:\n- Para Durkheim, a divisão do trabalho social é um fenômeno primordialmente integrador e moral.\n- Nas sociedades modernas, a hiperespecialização de funções gera a 'solidariedade orgânica': como cada órgão ou indivíduo cumpre um papel complementar específico, todos se tornam interdependentes uns dos outros, garantindo a coesão e o equilíbrio funcional da sociedade.\n- Problemas só ocorrem em situações patológicas passageiras de desregramento moral (anomia).\n\n2. Visão de Karl Marx:\n- Para Marx, a divisão social e técnica do trabalho no modo de produção capitalista é fonte intrínseca de alienação, exploração e cisão de classes.\n- Ela separa o trabalho intelectual da execução manual, desumaniza o operário ao transformá-lo em mera engrenagem acessória da máquina e concentra o produto e a mais-valia nas mãos dos proprietários privados do capital, alimentando a contradição e a luta de classes."
    }
  },
  questoes: [
    // Bloco 1: Fundamentos (1 a 5)
    {
      id: "SOC_CLA_01",
      origem: "ENEM",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Surgimento da Sociologia e Positivismo",
      tipo: "fechada",
      enunciado: "A Sociologia desponta no século XIX associada às grandes transformações econômicas, políticas e urbanas da Europa. O filósofo Auguste Comte formulou o positivismo, propondo que a nova ciência da sociedade deveria:",
      alternativas: [
        { letra: "A", texto: "Incentivar revoluções anarquistas permanentes para destruir qualquer forma de autoridade estatal." },
        { letra: "B", texto: "Aplicar os métodos rigorosos de observação e experimentação das ciências naturais para descobrir as leis invariáveis que governam a ordem e o progresso social." },
        { letra: "C", texto: "Restabelecer a teocracia medieval subordinando os governantes aos decretos dos bispos católicos." },
        { letra: "D", texto: "Abolir as indústrias fabris e promover o retorno generalizado da população ao nomadismo extrativista." },
        { letra: "E", texto: "Interpretar os fenômenos históricos com base exclusivamente na astrologia e nos presságios místicos." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Positivismo de Auguste Comte",
        porque: "O positivismo comteano propunha a física social (sociologia) para descobrir leis naturais e empíricas da sociedade, valorizando a harmonia, a neutralidade científica e a consolidação da ordem burguesa industrial."
      }
    },
    {
      id: "SOC_CLA_02",
      origem: "UEL",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Durkheim: O Conceito de Fato Social",
      tipo: "fechada",
      enunciado: "Segundo Émile Durkheim, o objeto exclusivo de investigação da Sociologia é o fato social. Para que um fenômeno seja considerado um fato social, ele deve apresentar necessariamente as características de:",
      alternativas: [
        { letra: "A", texto: "Espontaneidade, individualidade e efemeridade momentânea." },
        { letra: "B", texto: "Coercitividade, exterioridade e generalidade." },
        { letra: "C", texto: "Subjetividade, irracionalidade e caráter hereditário biológico." },
        { letra: "D", texto: "Obrigatoriedade estatal expressa unicamente por escrito no código civil penal." },
        { letra: "E", texto: "Voluntariedade pura e desvinculação absoluta de normas morais prévias." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Características do fato social",
        porque: "O fato social durkheimiano é coercitivo (impõe-se pela força das sanções morais/legais), exterior (existe fora e antes do indivíduo) e geral (manifesta-se na média da coletividade)."
      }
    },
    {
      id: "SOC_CLA_03",
      origem: "UNESP",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Fácil",
      topico: "Weber: Ação Social e a Sociologia Compreensiva",
      tipo: "fechada",
      enunciado: "Diferente de Durkheim, Max Weber fundamenta sua análise sociológica na compreensão do indivíduo e de sua conduta. Para Weber, a Ação Social define-se como toda conduta humana:",
      alternativas: [
        { letra: "A", texto: "Praticada de maneira puramente reflexa e inconsciente, como o ato de espirrar." },
        { letra: "B", texto: "Cujo sentido subjetivo formulado pelo ator orienta-se e leva em consideração o comportamento de outros indivíduos." },
        { letra: "C", texto: "Regulada exclusivamente por ordens formais emitidas por tribunais militares em períodos de guerra." },
        { letra: "D", texto: "Executada de forma isolada em um quarto fechado sem qualquer referência à cultura ou à sociedade." },
        { letra: "E", texto: "Ditada unicamente pelos genes e hormônios orgânicos do organismo humano." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Conceito de Ação Social em Weber",
        porque: "Para Max Weber, a ação social é aquela cujo sentido subjetivo visado pelo sujeito agente é orientado pelas ações e expectativas de outros indivíduos."
      }
    },
    {
      id: "SOC_CLA_04",
      origem: "UERJ",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Marx: Classes Sociais e Meios de Produção",
      tipo: "fechada",
      enunciado: "No *Manifesto Comunista* (1848), Karl Marx e Friedrich Engels afirmam: 'A história de todas as sociedades até hoje existentes é a história da luta de classes'. Na sociedade capitalista industrial moderna, as duas classes fundamentais antagonistas são:",
      alternativas: [
        { letra: "A", texto: "Os artesãos de guildas medievais e os sacerdotes do clero secular." },
        { letra: "B", texto: "A burguesia, que detém a propriedade privada dos meios de produção, e o proletariado, que vende sua força de trabalho para subsistir." },
        { letra: "C", texto: "Os guerreiros espartanos e os hilotas servos da lavoura comunitária." },
        { letra: "D", texto: "Os senhores feudais encastelados e os escravos aprisionados nas guerras púnicas." },
        { letra: "E", texto: "Os cientistas de laboratório e os burocratas fiscais do império napoleônico." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Classes fundamentais no capitalismo",
        porque: "No modo de produção capitalista marxista, o antagonismo central opõe os proprietários dos meios materiais de produção (burguesia) àqueles desprovidos desses meios, que precisam vender seu tempo e capacidade de trabalho (proletariado)."
      }
    },
    {
      id: "SOC_CLA_05",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Durkheim: Solidariedade Mecânica versus Orgânica",
      tipo: "fechada",
      enunciado: "Em *Da Divisão do Trabalho Social*, Émile Durkheim distingue dois modelos fundamentais de integração social: a solidariedade mecânica e a solidariedade orgânica. A Solidariedade Orgânica é típica de:",
      alternativas: [
        { letra: "A", texto: "Sociedades tradicionais com pouca diferenciação profissional e forte predomínio da consciência coletiva sobre o indivíduo." },
        { letra: "B", texto: "Sociedades complexas e industrializadas, marcadas pela intensa divisão social do trabalho e pela interdependência mútua de funções especializadas." },
        { letra: "C", texto: "Comunidades nômades pré-históricas desprovidas de agricultura sistemática." },
        { letra: "D", texto: "Monarquias teocráticas onde o imperador é venerado como encarnação viva de uma divindade solar." },
        { letra: "E", texto: "Guetos medievais regidos pela autossuficiência agrária sem comércio regional." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Solidariedade Orgânica em Durkheim",
        porque: "A solidariedade orgânica é análoga aos órgãos de um corpo vivo: na sociedade moderna complexa, a divisão do trabalho especializa os indivíduos, tornando-os organicamente interdependentes para a sobrevivência coletiva."
      }
    },

    // Bloco 2: Consolidação (6 a 10)
    {
      id: "SOC_CLA_06",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Durkheim: O Conceito de Anomia Social",
      tipo: "fechada",
      enunciado: "Émile Durkheim utiliza o conceito de 'anomia' para descrever um dos principais males das sociedades modernas em rápida transição econômica. A anomia caracteriza-se por:",
      alternativas: [
        { letra: "A", texto: "Um excesso de controle policial que asfixia totalmente a criatividade artística individual." },
        { letra: "B", texto: "Uma situação patológica de ausência, enfraquecimento ou desajuste das regras morais que deixam de orientar e conter os apetites dos indivíduos." },
        { letra: "C", texto: "O restabelecimento da harmonia comunitária através da fundação de novas religiões primitivas." },
        { letra: "D", texto: "A abolição formal das moedas nacionais em favor do escambo de alimentos perecíveis." },
        { letra: "E", texto: "A eliminação de qualquer tipo de hierarquia funcional nos postos da administração pública." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Conceito de anomia durkheimiana",
        porque: "Para Durkheim, anomia (a-nomos: sem norma) ocorre quando o desenvolvimento econômico desenfreado não é acompanhado pela regulação moral correspondente, gerando desorientação e vulnerabilidade psíquica nas pessoas."
      }
    },
    {
      id: "SOC_CLA_07",
      origem: "UNICAMP",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Weber: Tipologia da Ação Social",
      tipo: "fechada",
      enunciado: "Um militar que prefere afundar junto com seu navio de guerra em honra ao pavilhão de sua pátria e ao juramento sagrado que prestou à corporação, recusando salvar-se no bote salva-vidas, exemplifica, segundo a tipologia de Max Weber, uma:",
      alternativas: [
        { letra: "A", texto: "Ação tradicional puramente habitual." },
        { letra: "B", texto: "Ação racional com relação a fins utilitários." },
        { letra: "C", texto: "Ação racional com relação a valores." },
        { letra: "D", texto: "Ação afetiva desprovida de qualquer reflexão prévia." },
        { letra: "E", texto: "Ação anômica orientada pela busca de vantagens comerciais privadas." }
      ],
      resposta: "C",
      gabarito: {
        letra: "C",
        ancora: "Ação racional com relação a valores",
        porque: "A ação racional referente a valores é movida pela convicção inegociável em um dever moral, honra ou valor ético/religioso, onde o indivíduo não mede as consequências práticas adversas (como perder a própria vida) em nome de sua integridade axiológica."
      }
    },
    {
      id: "SOC_CLA_08",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Weber: A Ética Protestante e o Espírito do Capitalismo",
      tipo: "fechada",
      enunciado: "Em *A Ética Protestante e o Espírito do Capitalismo*, Max Weber investiga as origens culturais da racionalização ocidental. Sua tese principal sustenta que:",
      alternativas: [
        { letra: "A", texto: "A expansão capitalista na Europa foi um produto puramente acidental decorrente de chuvas favoráveis no campo." },
        { letra: "B", texto: "Houve uma afinidade eletiva entre a ascese intramundana do calvinismo (valorização do trabalho árduo, disciplina metódica e reprovação do luxo esbanjador) e o espírito acumulador e reinvestidor da economia moderna." },
        { letra: "C", texto: "O protestantismo defendia o voto de pobreza absoluta dos monges como modelo universal para a indústria." },
        { letra: "D", texto: "A teologia luterana proibia expressamente o comércio marítimo entre nações católicas e não católicas." },
        { letra: "E", texto: "A economia determina mecanicamente a religião, inexistindo qualquer impacto dos valores espirituais sobre as finanças." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Afinidade eletiva em Weber",
        porque: "Weber demonstra que a doutrina calvinista da predestinação gerava angústia existencial nos fiéis, levando-os a buscar no sucesso metódico e no enriquecimento sóbrio e reinvestido (sem ostentação) o sinal da graça divina, alimentando o ethos capitalista."
      }
    },
    {
      id: "SOC_CLA_09",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Marx: Teoria da Mais-Valia Absoluta e Relativa",
      tipo: "fechada",
      enunciado: "Em *O Capital*, Karl Marx demonstra como o capitalista extrai o lucro através da exploração da mais-valia. A distinção conceitual entre Mais-Valia Absoluta e Mais-Valia Relativa consiste no fato de que:",
      alternativas: [
        { letra: "A", texto: "A absoluta baseia-se na caridade de investidores e a relativa é descontada dos tributos alfandegários." },
        { letra: "B", texto: "A absoluta decorre do prolongamento físico da jornada diária de trabalho, enquanto a relativa resulta do aumento da produtividade pelo progresso tecnológico e mecanização, diminuindo o tempo de trabalho necessário." },
        { letra: "C", texto: "A absoluta aplica-se unicamente ao setor financeiro bancário e a relativa ao comércio informal ambulante." },
        { letra: "D", texto: "A absoluta é proibida pela Organização Internacional do Trabalho e a relativa é distribuída igualmente entre os operários." },
        { letra: "E", texto: "A absoluta remunera as horas extras acima da tabela legal e a relativa financia planos de previdência." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Mais-valia absoluta versus relativa",
        porque: "A mais-valia absoluta extrai-se estendendo a duração da jornada sem alterar a tecnologia; a relativa extrai-se revolucionando a técnica e a organização produtiva (máquinas), barateando o custo das mercadorias de subsistência e reduzindo o tempo de trabalho necessário."
      }
    },
    {
      id: "SOC_CLA_10",
      origem: "UEL",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Marx: O Fetichismo da Mercadoria e a Alienação",
      tipo: "fechada",
      enunciado: "Para Karl Marx, o conceito de 'fetichismo da mercadoria' descreve um dos mecanismos ideológicos centrais do capitalismo. Esse fenômeno ocorre quando:",
      alternativas: [
        { letra: "A", texto: "Os consumidores optam conscientemente por boicotar empresas poluidoras em defesa da sustentabilidade." },
        { letra: "B", texto: "As relações sociais de produção entre seres humanos trabalhadores são mascaradas, aparentando ser relações materiais mágicas de valor e troca entre as próprias coisas no mercado." },
        { letra: "C", texto: "Os líderes sindicais consagram estátuas pagãs nos pátios das metalúrgicas para obter aumentos salariais." },
        { letra: "D", texto: "A moeda em papel é banida e as transações passam a ser mediadas unicamente por barras de ouro maciço." },
        { letra: "E", texto: "A propaganda comercial deixa de influenciar o público consumidor após a alfabetização universal." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Fetichismo da mercadoria",
        porque: "O fetichismo da mercadoria aliena a percepção social: os produtos do trabalho humano parecem ter vida e valor intrínseco autônomo, ocultando as relações sociais e históricas reais de exploração humana que os criaram."
      }
    },

    // Bloco 3: Aprofundamento e Excelência (11 a 15)
    {
      id: "SOC_CLA_11",
      origem: "FUVEST / UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Weber: Tipos de Dominação Legítima e a Burocracia",
      tipo: "fechada",
      enunciado: "Em sua sociologia política, Max Weber formula a tríade dos tipos puros de dominação legítima: tradicional, carismática e racional-legal. A Dominação Racional-Legal destaca-se na era contemporânea por fundamentar-se:",
      alternativas: [
        { letra: "A", texto: "Na fidelidade cega ao sangue nobre e nos privilégios hereditários dos monarcas dinásticos." },
        { letra: "B", texto: "Na devoção extraordinária e messiânica aos poderes quase mágicos de um profeta ou caudilho heróico." },
        { letra: "C", texto: "Na crença na legalidade de normas instituídas racionalmente e no direito impessoal de quem foi investido de autoridade formal (o aparato burocrático)." },
        { letra: "D", texto: "Na pura opressão armada sem qualquer necessidade de consenso ou legitimação moral por parte dos dominados." },
        { letra: "E", texto: "No sorteio público aleatório de cidadãos analfabetos para presidir os tribunais supremos." }
      ],
      resposta: "C",
      gabarito: {
        letra: "C",
        ancora: "Dominação Racional-Legal e Burocracia",
        porque: "A dominação racional-legal moderna não se submete à pessoa física do governante, mas à impessoalidade da lei e das regras jurídicas e estatutárias formais, tendo como veículo administrativo a burocracia profissional especializada."
      }
    },
    {
      id: "SOC_CLA_12",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Marx: Infraestrutura, Superestrutura e Ideologia",
      tipo: "fechada",
      enunciado: "Em *A Ideologia Alemã*, Marx e Engels afirmam: 'As ideias da classe dominante são, em cada época, as ideias dominantes'. Na perspectiva do materialismo histórico, a relação entre infraestrutura e superestrutura evidencia que:",
      alternativas: [
        { letra: "A", texto: "As leis, a moral e as religiões surgem do nada por inspiração poética desprovida de bases econômicas." },
        { letra: "B", texto: "A base econômica material (relações de produção e forças produtivas) condiciona o desenvolvimento das instituições jurídicas, políticas e das formas de consciência social." },
        { letra: "C", texto: "O parlamento burguês é uma instituição totalmente neutra que atende preferencialmente aos interesses do proletariado faminto." },
        { letra: "D", texto: "A superestrutura é uma ilusão psíquica individual sem qualquer eficácia prática para a reprodução da ordem social." },
        { letra: "E", texto: "A filosofia escolástica medieval comandava com precisão a produtividade das primeiras indústrias têxteis inglesas." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Relação infraestrutura e superestrutura",
        porque: "No materialismo histórico marxiano, a infraestrutura (as relações materiais de produção) constitui a base real sobre a qual se ergue a superestrutura jurídica, política e ideológica que legitima e perpetua a hegemonia da classe proprietária."
      }
    },
    {
      id: "SOC_CLA_13",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Durkheim: O Método e o Tratamento dos Fatos Sociais como Coisas",
      tipo: "fechada",
      enunciado: "Ao propor a célebre máxima metodológica de que 'os fatos sociais devem ser tratados como coisas', Émile Durkheim postulava que o sociólogo rigoroso deve:",
      alternativas: [
        { letra: "A", texto: "Descartar sistematicamente suas pré-noções, preconceitos subjetivos e ideologias particulares, observando os fenômenos sociais de forma objetiva e empírica a partir de seus dados exteriores." },
        { letra: "B", texto: "Equiparar os seres humanos a objetos inanimados de pedra para justificar a escravização compulsória dos mais vulneráveis." },
        { letra: "C", texto: "Substituir a pesquisa documental pela intuição mística de líderes espirituais venerados." },
        { letra: "D", texto: "Interromper pesquisas de campo sempre que os dados empíricos contradisserem as expectativas do partido governista." },
        { letra: "E", texto: "Reduzir toda a vida cultural a equações matemáticas simples de soma e subtração financeira." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Fatos sociais tratados como coisas",
        porque: "Tratar os fatos sociais como 'coisas' significa que o pesquisador deve ter postura de neutralidade científica: romper com as pré-noções do senso comum e analisar os fenômenos com rigor observacional independente de suas inclinações subjetivas."
      }
    },
    {
      id: "SOC_CLA_14",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Weber: O Desencantamento do Mundo e a Racionalização",
      tipo: "fechada",
      enunciado: "Em sua conferência *A Ciência como Vocação*, Max Weber formula o diagnóstico sombrio do 'desencantamento do mundo' (*Entzauberung der Welt*) associado ao avanço inexorável da racionalização ocidental. Esse processo expressa-se por:",
      alternativas: [
        { letra: "A", texto: "A proliferação desenfreada de seitas mágicas que assumem o controle governamental de nações ocidentais." },
        { letra: "B", texto: "A eliminação progressiva dos meios mágicos e místicos de salvação e a crença de que tudo na realidade pode ser conhecido e dominado pelo cálculo técnico e pela previsão racional, gerando uma 'jaula de ferro'." },
        { letra: "C", texto: "O desmonte das academias de ciências em benefício exclusivo de espetáculos teatrais infantis." },
        { letra: "D", texto: "A restauração triunfante do paganismo politeísta grego nas grandes metrópoles contemporâneas." },
        { letra: "E", texto: "A perda irreparável da habilidade de calcular juros bancários nas agências comerciais da Europa." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Desencantamento do mundo em Weber",
        porque: "O desencantamento do mundo weberiano descreve a secularização e racionalização intelectual moderna: os mistérios e sagrados perdem espaço para o domínio da técnica, da burocracia e do cálculo utilitário (a jaula de ferro da racionalidade moderna)."
      }
    },
    {
      id: "SOC_CLA_15",
      origem: "FUVEST / UNICAMP - Discursiva",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Análise Comparada da Modernidade: Durkheim, Weber e Marx",
      tipo: "aberta",
      enunciado: "A modernidade capitalista e industrial foi diagnosticada sob lentes conceituais contrastantes pelos três fundadores clássicos da Sociologia:\n- Para Émile Durkheim, o principal risco social reside na anomia.\n- Para Karl Marx, a contradição incontornável é a alienação do trabalho e a luta de classes.\n- Para Max Weber, o perigo moderno manifesta-se no desencantamento do mundo e na 'jaula de ferro' da burocracia racional.\n\nCom base nessas três perspectivas:\na) Diferencie a 'anomia' durkheimiana da 'alienação' marxiana no que diz respeito à causa estrutural que afeta o trabalhador.\nb) Explique por que Max Weber utiliza a metáfora da 'jaula de ferro' para caracterizar o avanço da racionalização burocrática no Ocidente.",
      resposta: "a) Para Durkheim, a anomia decorre da falta de regulação moral sobre a economia rápida; para Marx, a alienação decorre da própria lógica do capital que expropria os meios de produção e desumaniza o trabalhador; b) A 'jaula de ferro' simboliza a perda de liberdade e sentido sob um sistema impessoal e hiper-racionalizado de regras burocráticas.",
      gabarito: {
        letra: "A",
        ancora: "Comparação clássica entre os três fundadores",
        espera_se: "a) O candidato deve apontar que, para Durkheim, a anomia é uma patologia temporária causada pela insuficiência de normas morais integradoras capazes de disciplinar a rápida expansão do mercado industrial (crise de coesão moral). Já para Marx, a alienação não é uma patologia passageira corrigível por reformas morais, mas um elemento estrutural, intrínseco e incontornável do modo de produção capitalista: o trabalhador perde o controle sobre o produto, o processo e a si mesmo porque os meios de produção e o excedente (mais-valia) são apropriados privadamente pela burguesia.\nb) O candidato deve explicar que Weber utiliza a metáfora da 'jaula de ferro' (ou carcaça de aço) para denunciar o aprisionamento da vida humana por um sistema inflexível, impessoal e desumanizador de regras burocráticas e cálculo utilitário. O homem moderno construiu uma gigantesca máquina de eficiência técnica que, ao eliminar o encantamento, a espontaneidade e os valores últimos, passa a comandar a vida de todos os indivíduos com força coercitiva irresistível."
      }
    }
  ]
};

// -------------------------------------------------------------
// 4. SOCIOLOGIA - BRASIL E CIDADANIA
// -------------------------------------------------------------
const socBrasil = {
  disciplina: "Sociologia",
  assunto: "Sociologia Brasileira, Direitos Humanos e Mundo do Trabalho",
  publico_alvo: "Escolas de Alta Performance - Niterói e Rio de Janeiro (1º ao 3º ano EM)",
  modulo: "Sociologia_Brasileira_Trabalho_e_Direitos",
  subpasta: "Brasil_e_Cidadania",
  arquivo_origem: "Questoes_Sociologia_Brasileira_Trabalho_e_Direitos.json",
  benchmark_didatico: {
    capitulo: "Unidade 2: Formação da Sociedade Brasileira, Cidadania e Transformações no Trabalho",
    objetivos_aprendizagem: [
      "Compreender a evolução histórica do conceito de cidadania (a tríade de T. H. Marshall: direitos civis, políticos e sociais) e os percalços de sua consolidação no Brasil ('cidadania regulada' e 'estadania').",
      "Analisar o pensamento social brasileiro e seus intérpretes clássicos: Gilberto Freyre (miscigenação e mito da democracia racial), Sérgio Buarque de Holanda (o 'homem cordial' e patrimonialismo) e Caio Prado Júnior (o sentido da colonização voltado para o mercado externo).",
      "Dominar a sociologia crítica de Florestan Fernandes: a integração imperfeita do negro na sociedade de classes e a manutenção arcaica das estruturas oligárquicas.",
      "Analisar as transformações contemporâneas no mundo do trabalho: transição do Taylorismo/Fordismo para o Toyotismo, acumulação flexível e precarização/uberização laboral.",
      "Compreender as dinâmicas de estratificação social, desigualdades étnico-raciais e de gênero, e os movimentos sociais na construção da Constituição Cidadã de 1988."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Cidadania e a Tríade de T. H. Marshall no Contexto Brasileiro",
          definicao: "O sociólogo britânico T. H. Marshall (*Cidadania, Classe Social e Status*, 1950) periodizou a conquista da cidadania moderna na Inglaterra ao longo de três séculos: 1) Direitos Civis (século XVIII: liberdade de expressão, locomoção, julgamento justo e propriedade); 2) Direitos Políticos (século XIX: sufrágio eleitoral universal, direito de votar e ser votado); 3) Direitos Sociais (século XX: saúde, educação pública, previdência e bem-estar). No Brasil, o historiador José Murilo de Carvalho (*Cidadania no Brasil: O Longo Caminho*) demonstra que a trajetória foi invertida: os Direitos Sociais foram concedidos primeiro de forma tutelada pelo Estado getulista na Era Vargas (década de 1930) vinculados à posse de carteira de trabalho ('cidadania regulada', conceito de Wanderley Guilherme dos Santos), enquanto os direitos políticos e civis sofreram repressões sistemáticas e golpes autoritários, gerando a 'estadania' (o cidadão que depende das concessões do Estado em vez de cobrar seus direitos soberanamente)."
        },
        {
          termo: "Os Intérpretes do Brasil: Freyre, Buarque de Holanda e Caio Prado Jr.",
          definicao: "Na década de 1930, consolida-se a interpretação sociológica da brasilidade: 1) Gilberto Freyre (*Casa-Grande & Senzala*, 1933): resgata positivamente a miscigenação (portugueses, indígenas e africanos) como elemento singular da cultura nacional, mas sua ênfase na plasticidade das relações domésticas coloniais acabou alimentando a ideologia do 'mito da democracia racial' (ilusão de convivência harmônica sem conflito racial); 2) Sérgio Buarque de Holanda (*Raízes do Brasil*, 1936): formula o conceito de 'Homem Cordial' (do latim *cordis*, coração): o brasileiro que age movido pela emotividade, afetividade e laços familiares, tendo enorme aversão à impessoalidade burocrática e às regras formais da lei moderna. Isso alimenta o Patrimonialismo (confusão crônica entre a esfera pública do Estado e o interesse privado individual); 3) Caio Prado Júnior (*Formação do Brasil Contemporâneo*, 1942): analisa o país pelo materialismo histórico, desvendando o 'sentido da colonização': o Brasil foi estruturado como colônia de exploração mercantilista (plantation: latifúndio, monocultura e trabalho escravo) voltada exclusivamente para atender às demandas de matérias-primas e acumulação das metrópoles europeias."
        },
        {
          termo: "Florestan Fernandes e a Sociologia Paulista Crítica",
          definicao: "Fundador da 'Escola Sociológica Paulista' da USP, Florestan Fernandes (*A Integração do Negro na Sociedade de Classes*, 1964) desconstrói de forma contundente o mito da democracia racial. Demonstra que a abolição da escravidão em 1888 foi um ato jurídico puramente formal que descarregou a população negra nas ruas sem terras, educação, emprego assalariado ou indenização, reservando as melhores posições do trabalho livre urbano para os imigrantes europeus subvencionados pelo Estado. O preconceito e o racismo estrutural operam no Brasil como mecanismos funcionais de manutenção da hierarquia social e da hegemonia das elites brancas dominantes."
        },
        {
          termo: "Mundo do Trabalho: Fordismo, Toyotismo e Uberização",
          definicao: "Ao longo do século XX e XXI, o trabalho assalariado sofreu mutações profundas: 1) Taylorismo/Fordismo: produção em massa homogênea, esteira mecânica, fragmentação minuciosa de tarefas repetitivas, rígida separação entre concepção e execução, estoques volumosos e garantia de empregos estáveis regulados por convenções sindicais e bem-estar keynesiano; 2) Toyotismo (Acumulação Flexível): nascido no Japão pós-Segunda Guerra, baseia-se na produção sob demanda (*just-in-time*), estoques mínimos, eliminação de desperdícios, trabalho em equipe multifuncional e informatização da produção; 3) Reestruturação Produtiva e Uberização (Trabalho por Plataformas Digitais): no século XXI, a automação e as plataformas digitais introduzem o 'precariado': trabalhadores atomizados, convertidos ideologicamente em 'microempreendedores de si mesmos', desprovidos de direitos trabalhistas (férias, 13º salário, seguro-desemprego, limite de jornada), submetidos ao gerenciamento algorítmico e à instabilidade remuneratória."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico de prova: o termo 'homem cordial' de Sérgio Buarque de Holanda. No senso comum, 'cordial' soa como pessoa gentil, simpática e amável. Na acepção sociológica de Buarque de Holanda, significa agir com o coração (*cordis*), isto é, colocar a emoção, o favoritismo pessoal, o compadrio e os laços afetivos acima do dever cívico impessoal, gerando corrupção, jeitinho e privatização da máquina pública."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: O Homem Cordial e o Mito da Democracia Racial no ENEM",
      enunciado: "Analise a questão: 'Explique por que o conceito de Homem Cordial de Sérgio Buarque de Holanda e a tese de Gilberto Freyre sobre a miscigenação representam desafios complexos para a consolidação de uma cidadania republicana plena e igualitária no Brasil'.",
      resolucao_passo_a_passo: "1. O obstáculo do 'Homem Cordial' (Sérgio Buarque de Holanda):\n- A república exige um Estado de Direito baseado na impessoalidade jurídica, onde a lei é igual para todos independentemente de parentescos ou amizades.\n- O 'homem cordial' busca o acolhimento afetivo e privatiza a esfera pública (nepotismo, favorecimento a conhecidos e o 'jeitinho'), corroendo a ética burocrática legal e a isonomia republicana.\n\n2. O obstáculo do 'Mito da Democracia Racial' (associado às leituras de Gilberto Freyre):\n- Ao celebrar a mestiçagem como prova de suposta harmonia e ausência de preconceito no Brasil colonial e moderno, mascara-se a violência sistemática sofrida pelas populações negras e indígenas.\n- Esse mito operou historicamente como barreira ideológica que silenciou o debate sobre o racismo estrutural e atrasou a implementação de políticas públicas afirmativas de reparação e combate às desigualdades."
    }
  },
  questoes: [
    // Bloco 1: Fundamentos (1 a 5)
    {
      id: "SOC_BRA_01",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Conceito de Cidadania e a Tríade de Marshall",
      tipo: "fechada",
      enunciado: "O sociólogo T. H. Marshall formulou uma teoria clássica sobre o desenvolvimento histórico da cidadania na Inglaterra, dividindo-a em três dimensões de direitos: civis, políticos e sociais. Um exemplo legítimo de exercício de um Direito Político é:",
      alternativas: [
        { letra: "A", texto: "Comprar um terreno urbano e registrar a escritura em cartório de notas." },
        { letra: "B", texto: "Votar nas eleições gerais e candidatar-se a um cargo no parlamento legislativo." },
        { letra: "C", texto: "Ter acesso gratuito a exames clínicos e leitos hospitalares no sistema público de saúde." },
        { letra: "D", texto: "Matricular seus filhos em uma escola básica de tempo integral mantida pela prefeitura." },
        { letra: "E", texto: "Exigir sigilo telefônico perante a correspondência epistolar privada." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Direitos Políticos na tríade de Marshall",
        porque: "Os direitos políticos referem-se à prerrogativa do cidadão de participar do exercício do poder soberano, como eleitor (votar) ou como governante/legislador eleito (ser votado) e pertencer a partidos."
      }
    },
    {
      id: "SOC_BRA_02",
      origem: "UERJ",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Cidadania no Brasil: A Inversão Histórica de Marshall",
      tipo: "fechada",
      enunciado: "Ao analisar a evolução da cidadania no Brasil republicano, o historiador José Murilo de Carvalho destaca que o país seguiu uma trajetória inversa ao modelo clássico inglês de T. H. Marshall. No caso brasileiro, essa inversão ocorreu porque:",
      alternativas: [
        { letra: "A", texto: "Os direitos civis foram garantidos desde a era colonial e os direitos sociais foram totalmente abolidos pela Constituição de 1988." },
        { letra: "B", texto: "Os direitos sociais foram implantados de maneira expressiva pelo Estado autoritário na década de 1930 (Era Vargas), antes da plena consolidação e garantia efetiva dos direitos políticos e civis." },
        { letra: "C", texto: "A população conquistou o direito de voto eletrônico universal antes mesmo de os portugueses colonizarem a costa litorânea." },
        { letra: "D", texto: "A Constituição imperial de 1824 instituiu a igualdade salarial obrigatória entre homens e mulheres operárias." },
        { letra: "E", texto: "O poder judiciário brasileiro sempre garantiu julgamento célere e imparcial para a totalidade dos camponeses pobres." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Inversão da cidadania no Brasil",
        porque: "No Brasil de Getúlio Vargas (anos 1930), a legislação trabalhista e a previdência (direitos sociais) foram concedidas de cima para baixo sob tutela corporativa, enquanto liberdades civis e direitos políticos sofriam severas restrições ditatoriais (Estado Novo)."
      }
    },
    {
      id: "SOC_BRA_03",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Fácil",
      topico: "Sérgio Buarque de Holanda: O Homem Cordial",
      tipo: "fechada",
      enunciado: "Em *Raízes do Brasil* (1936), Sérgio Buarque de Holanda define o brasileiro típico como o 'homem cordial'. Sob a perspectiva sociológica dessa obra, a cordialidade significa que o indivíduo:",
      alternativas: [
        { letra: "A", texto: "É permanentemente dócil, refinado e incapaz de praticar qualquer ato de violência ou preconceito." },
        { letra: "B", texto: "Age movido primordialmente pelo coração (*cordis*), priorizando a afetividade e as relações pessoais em prejuízo da impessoalidade e das regras formais do espaço público." },
        { letra: "C", texto: "Possui uma admiração incondicional pelo modelo puritano britânico de pontualidade no trabalho fabril." },
        { letra: "D", texto: "Recusa categoricamente os convites para festas populares a fim de cumprir rigorosamente o isolamento social." },
        { letra: "E", texto: "Desconhece os laços de parentesco e trata os membros de sua família com distanciamento corporativo frio." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Conceito de Homem Cordial",
        porque: "O homem cordial buarquiano age guiado pelas paixões e afetos, repudiando as formalidades e a distância impessoal exigidas pela ordem burocrática legal, o que facilita o compadrio e a confusão entre o público e o privado."
      }
    },
    {
      id: "SOC_BRA_04",
      origem: "UNESP",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Caio Prado Júnior: O Sentido da Colonização",
      tipo: "fechada",
      enunciado: "Em *Formação do Brasil Contemporâneo* (1942), Caio Prado Júnior desvenda o que denominou de 'sentido da colonização' brasileira. De acordo com sua tese materialista e histórica, o território brasileiro foi colonizado para:",
      alternativas: [
        { letra: "A", texto: "Constituir uma sociedade autossuficiente focada no bem-estar comunitário dos povos originários e camponeses." },
        { letra: "B", texto: "Funcionar como uma empresa comercial agroexportadora subordinada às demandas e lucros das potências mercantis europeias (latifúndio, monocultura e escravidão)." },
        { letra: "C", texto: "Promover a preservação ambiental perpétua da Mata Atlântica e do ecossistema do Pantanal." },
        { letra: "D", texto: "Implantar uma república federativa socialista inspirada nas comunas fabris do leste europeu." },
        { letra: "E", texto: "Criar um refúgio exclusivo para filósofos iluministas perseguidos pela inquisição espanhola." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "O sentido da colonização em Caio Prado Júnior",
        porque: "Caio Prado Jr. demonstrou que o Brasil nasceu como colônia de exploração: uma vasta empresa mercantil voltada para o exterior baseada no tripé plantation (latifúndio, monocultura de exportação e mão de obra escrava), gerando graves distorções internas duradouras."
      }
    },
    {
      id: "SOC_BRA_05",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Taylorismo e Fordismo no Século XX",
      tipo: "fechada",
      enunciado: "O modelo de organização da produção fabril conhecido como Fordismo, amplamente disseminado a partir das primeiras décadas do século XX, caracterizou-se por:",
      alternativas: [
        { letra: "A", texto: "Produção artesanal personalizada sob encomenda e estoques nulos em armazéns fabris." },
        { letra: "B", texto: "Linha de montagem automatizada com esteira mecânica, padronização seriada em larga escala e especialização extrema de tarefas simples dos operários." },
        { letra: "C", texto: "Autonomia total dos operários para decidirem os horários de início e término das atividades nas oficinas." },
        { letra: "D", texto: "Contratação exclusiva de profissionais com diplomas universitários de doutorado para operar ferramentas simples." },
        { letra: "E", texto: "Pagamento de salários exclusivamente através de ações societárias negociadas na bolsa de valores." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Características do Fordismo",
        porque: "O fordismo uniu a fragmentação científica de movimentos de Taylor à esteira rolante mecanizada, criando a produção em massa estandardizada de bens de consumo duráveis e aprisionando o operário a movimentos repetitivos e disciplinados."
      }
    },

    // Bloco 2: Consolidação (6 a 10)
    {
      id: "SOC_BRA_06",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Gilberto Freyre e o Debate sobre a Democracia Racial",
      tipo: "fechada",
      enunciado: "Em *Casa-Grande & Senzala* (1933), Gilberto Freyre destacou a importância fundamental das heranças africana e indígena na formação dos hábitos, culinária e vocabulário da sociedade brasileira. Contudo, a crítica sociológica contemporânea adverte que a narrativa freyriana:",
      alternativas: [
        { letra: "A", texto: "Defendeu expressamente a expulsão de todos os imigrantes portugueses do continente americano." },
        { letra: "B", texto: "Romantizou a convivência doméstica entre senhores e escravizados, alimentando o mito da 'democracia racial' que ocultou o caráter brutal e a violência intrínseca da escravidão." },
        { letra: "C", texto: "Comprovou que o racismo nunca existiu em nenhum momento da história econômica do Brasil colônia." },
        { letra: "D", texto: "Proibiu que a capoeira e as religiões de matriz africana fossem praticadas nas cidades litorâneas." },
        { letra: "E", texto: "Negou a existência de mestiçagem biológica e cultural entre os habitantes da colônia." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Mito da democracia racial e Gilberto Freyre",
        porque: "Embora Freyre tenha valorizado positivamente a cultura negra contra o racismo científico eugênico da época, sua ênfase na proximidade e intimidade patriarcal criou a ilusão complacente de uma sociedade sem barreiras ou conflitos raciais reais."
      }
    },
    {
      id: "SOC_BRA_07",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Florestan Fernandes: O Negro na Sociedade de Classes",
      tipo: "fechada",
      enunciado: "Em seus estudos sobre a sociedade brasileira, o sociólogo Florestan Fernandes demonstrou que a abolição da escravidão em 1888 não representou a verdadeira emancipação social e econômica da população negra. Para o autor, isso decorreu do fato de que:",
      alternativas: [
        { letra: "A", texto: "A totalidade dos escravizados recusou-se voluntariamente a receber pagamentos monetários de fazendeiros." },
        { letra: "B", texto: "A abolição formal ocorreu sem a redistribuição de terras, sem acesso a escolas e sem garantias trabalhistas, enquanto o Estado subsidiava a vinda do imigrante europeu branco, relegando os negros à marginalidade e ao subproletariado." },
        { letra: "C", texto: "Os ex-cativos fundaram imediatamente companhias transatlânticas e assumiram o controle das ferrovias cafeeiras paulistas." },
        { letra: "D", texto: "A constituição de 1891 criou um fundo monetário vitalício compulsório para todos os descendentes de africanos escravizados." },
        { letra: "E", texto: "O sistema republicano baniu completamente o café e dedicou-se exclusivamente à mineração artesanal de carvão." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Florestan Fernandes e a marginalização do negro",
        porque: "Florestan Fernandes desmistifica a abolição: tratou-se de uma manumissão formal que desresponsabilizou os senhores e o Estado, abandonando o negro à própria sorte e preferindo o braço imigrante branco nos setores modernos da economia."
      }
    },
    {
      id: "SOC_BRA_08",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Toyotismo e a Acumulação Flexível",
      tipo: "fechada",
      enunciado: "Nas últimas décadas do século XX, o modelo toyotista de produção difundiu-se internacionalmente, substituindo o rígido padrão fordista. Uma característica marcante do Toyotismo é:",
      alternativas: [
        { letra: "A", texto: "A formação de gigantescos estoques preventivos de mercadorias paradas em depósitos subterrâneos." },
        { letra: "B", texto: "A produção flexível adaptada sob demanda (*just-in-time*), a multifuncionalidade dos operários em equipes integradas e o controle rigoroso da qualidade total." },
        { letra: "C", texto: "A proibição de quaisquer dispositivos microeletrônicos ou robóticos nas linhas de produção industriais." },
        { letra: "D", texto: "A garantia legal irrevogável de estabilidade no emprego até a aposentadoria para todo e qualquer operário contratado." },
        { letra: "E", texto: "A produção de um único tipo de mercadoria monocromática sem opções de customização para o consumidor." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Características do Toyotismo",
        porque: "O toyotismo opera na flexibilidade: produz apenas o que já está vendido (just-in-time), combate o desperdício de estoque, exige operários polivalentes (multifuncionais) e incorpora automação computadorizada de ponta."
      }
    },
    {
      id: "SOC_BRA_09",
      origem: "UEL",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Reestruturação Produtiva e Uberização do Trabalho",
      tipo: "fechada",
      enunciado: "A proliferação de plataformas digitais e aplicativos de entrega e transporte nas últimas décadas reconfigurou o mercado de trabalho, fenômeno denominado por sociólogos contemporâneos como 'uberização'. Essa modalidade laboral caracteriza-se por:",
      alternativas: [
        { letra: "A", texto: "Concessão automática de direitos plenos da CLT, tais como férias remuneradas, décimo terceiro salário e auxílio-acidente." },
        { letra: "B", texto: "Transformação ideológica do trabalhador em suposto 'empreendedor autônomo de si mesmo', combinada com ausência de seguridade social, subordinação a algoritmos e jornadas exaustivas e imprevisíveis." },
        { letra: "C", texto: "Fortalecimento maciço dos sindicatos operários tradicionais que assumem a gestão direta dos aplicativos móveis." },
        { letra: "D", texto: "Controle estatal rígido que fixa um teto máximo de cinco horas de trabalho semanal para os entregadores ciclistas." },
        { letra: "E", texto: "Extinção da tecnologia de geolocalização e retorno do pagamento exclusivamente em moedas metálicas de prata." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Uberização do trabalho e precariado",
        porque: "A uberização transfere os riscos e custos operacionais ao trabalhador atomizado, vendendo a narrativa ilusória de liberdade e autonomia empreendedora enquanto oculta a precarização dos vínculos e o controle algorítmico do tempo."
      }
    },
    {
      id: "SOC_BRA_10",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Patrimonialismo e a Esfera Pública no Brasil",
      tipo: "fechada",
      enunciado: "O sociólogo Raymundo Faoro, em *Os Donos do Poder* (1958), analisa as raízes históricas do 'estamento burocrático' e do patrimonialismo herdados da corte portuguesa. O traço fundamental dessa estrutura patrimonialista consiste em:",
      alternativas: [
        { letra: "A", texto: "A separação cristalina e republicana entre as finanças estatais e as contas privadas dos governantes eleitos." },
        { letra: "B", texto: "A apropriação privada do aparato do Estado por uma elite burocrática que governa em benefício próprio, tratando a coisa pública (*res publica*) como se fora seu patrimônio particular." },
        { letra: "C", texto: "A entrega do comando dos ministérios exclusivamente a líderes de movimentos camponeses e operários." },
        { letra: "D", texto: "A realização de plebiscitos semanais para aprovar qualquer reajuste de tarifas de transporte público." },
        { letra: "E", texto: "A cobrança compulsória de impostos exclusivamente sobre os lucros bancários das grandes corretoras." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Patrimonialismo e Os Donos do Poder",
        porque: "No patrimonialismo faoriano, o estamento burocrático sobrepõe-se à sociedade civil, usando o Estado como instrumento de autopreservação de privilégios e esmaecendo a fronteira fundamental entre o público e o privado."
      }
    },

    // Bloco 3: Aprofundamento e Excelência (11 a 15)
    {
      id: "SOC_BRA_11",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Constituição de 1988 e os Novos Movimentos Sociais",
      tipo: "fechada",
      enunciado: "A promulgação da Constituição de 1988, apelidada por Ulysses Guimarães de 'Constituição Cidadã', representou um marco histórico na redemocratização brasileira. Esse caráter emancipatório decorreu especialmente:",
      alternativas: [
        { letra: "A", texto: "Da extinção de todos os partidos políticos de esquerda para evitar atritos ideológicos na câmara dos deputados." },
        { letra: "B", texto: "Da ampla participação da sociedade civil e dos movimentos sociais (indígenas, negros, mulheres, trabalhadores rurais e urbanos) na consolidação de um catálogo robusto de direitos humanos e fundamentais." },
        { letra: "C", texto: "Do restabelecimento da censura prévia de jornais, emissoras de rádio e espetáculos culturais de teatro." },
        { letra: "D", texto: "Da proibição formal da greve em todas as categorias de trabalhadores da iniciativa privada." },
        { letra: "E", texto: "Do fechamento perpétuo das fronteiras nacionais para qualquer tipo de intercâmbio científico e educacional." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Constituição Cidadã de 1988",
        porque: "A Carta Magna de 1988 incorporou intensas demandas populares e emendas populares de iniciativa dos novos movimentos sociais, institucionalizando a proteção às terras indígenas, o combate ao racismo como crime inafiançável e a igualdade de gênero."
      }
    },
    {
      id: "SOC_BRA_12",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Desigualdades Estruturais: Renda, Raça e Gênero no Brasil",
      tipo: "fechada",
      enunciado: "Dados demográficos do Instituto Brasileiro de Geografia e Estatística (IBGE) revelam sistematicamente que, no mercado de trabalho brasileiro, mulheres negras recebem, em média, as menores remunerações e ocupam as posições de maior vulnerabilidade e informalidade. O conceito sociológico que analisa essa sobreposição concomitante de diferentes opressões sociais denomina-se:",
      alternativas: [
        { letra: "A", texto: "Positivismo metodológico estrito." },
        { letra: "B", texto: "Interseccionalidade." },
        { letra: "C", texto: "Funcionalismo biológico puro." },
        { letra: "D", texto: "Contratualismo absolutista." },
        { letra: "E", texto: "Etnocentrismo universalista." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Conceito de Interseccionalidade",
        porque: "O conceito de interseccionalidade (formulado originariamente por Kimberlé Crenshaw e desenvolvido no Brasil por autoras como Lélia Gonzalez e Sueli Carneiro) analisa como os marcadores sociais de raça, classe e gênero cruzam-se e reforçam desigualdades estruturais simultâneas."
      }
    },
    {
      id: "SOC_BRA_13",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Darcy Ribeiro e a Formação do Povo Brasileiro",
      tipo: "fechada",
      enunciado: "Em *O Povo Brasileiro* (1995), Darcy Ribeiro afirma que os brasileiros surgem como uma 'nova Roma deslavada', fruto do processo violento de deculturação e miscigenação entre matrizes indígenas, africanas e ibéricas. Para Darcy Ribeiro, a singularidade desse processo formou uma identidade caracterizada pela condição de:",
      alternativas: [
        { letra: "A", texto: "Povo-transplantado idêntico às colônias anglo-saxônicas do hemisfério norte." },
        { letra: "B", texto: "Povo-novo, cujos indivíduos deixaram de ser puramente índios, negros ou europeus para forjar uma etnia nacional inédita, ainda marcada por contradições e dores do processo colonial." },
        { letra: "C", texto: "Povo-testemunha que preservou intactas as civilizações pré-colombianas sem contato com a modernidade." },
        { letra: "D", texto: "Comunidade monástica estritamente celibatária desprovida de manifestações de arte carnavalesca." },
        { letra: "E", texto: "Castas aristocráticas herméticas que proibiam o casamento fora das linhagens reais europeias." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Povo-Novo em Darcy Ribeiro",
        porque: "Darcy Ribeiro categoriza o Brasil como 'Povo-Novo': nascido do caldeamento e da violência etnocida e escravocrata que desfez identidades originais prévias para gestar uma nova entidade sociocultural rica e desafiadora."
      }
    },
    {
      id: "SOC_BRA_14",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Wanderley Guilherme dos Santos: Cidadania Regulada",
      tipo: "fechada",
      enunciado: "O cientista político Wanderley Guilherme dos Santos cunhou a expressão 'cidadania regulada' para conceituar o padrão de inclusão social instituído na Era Vargas (1930–1945). Nesse modelo, a cidadania e o acesso aos direitos sociais:",
      alternativas: [
        { letra: "A", texto: "Eram concedidos indistintamente a todos os seres humanos residentes no solo nacional independentemente de sua profissão." },
        { letra: "B", texto: "Estavam condicionados à inserção formal do trabalhador no sistema de ocupações reconhecidas pelo Estado e à posse da carteira profissional de trabalho assinada." },
        { letra: "C", texto: "Dependiam unicamente de teste escrito de latim clássico aplicado pelo Ministério das Relações Exteriores." },
        { letra: "D", texto: "Eram restritos exclusivamente aos proprietários de mais de cem hectares de cafezais no interior paulista." },
        { letra: "E", texto: "Foram concedidos prioritariamente aos imigrantes ilegais que não sabiam expressar-se na língua portuguesa." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Cidadania Regulada na Era Vargas",
        porque: "A 'cidadania regulada' vinculava o gozo dos direitos de proteção social (aposentadoria, previdência, jornada, férias) não à condição universal de ser humano ou cidadão político, mas ao pertencimento a uma categoria profissional formalmente reconhecida em lei pelo Ministério do Trabalho."
      }
    },
    {
      id: "SOC_BRA_15",
      origem: "FUVEST / UNICAMP - Discursiva",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Abolição Formal versus Emancipação Real na Sociologia Brasileira",
      tipo: "aberta",
      enunciado: "Em 13 de maio de 1888 foi assinada a Lei Áurea, extinguindo a escravidão no Brasil. No entanto, mais de um século depois, dados de distribuição de renda, homicídios juvenis e ocupação de cargos de liderança evidenciam profundos abismos entre a população branca e a população negra.\n\nA partir da análise sociológica de Florestan Fernandes:\na) Explique por que o autor caracteriza a passagem da escravidão para o trabalho livre no Brasil como uma transição que deixou o negro 'desprovido de condições para competir' no mercado moderno.\nb) Aponte e justifique a importância das políticas públicas de ações afirmativas (como o sistema de cotas étnico-raciais nas universidades) à luz do combate ao racismo estrutural desvendado pela sociologia brasileira.",
      resposta: "a) A abolição foi puramente formal, sem reforma agrária, educação ou auxílio, marginalizando o negro e privilegiando a mão de obra imigrante branca; b) As cotas compensam o passivo histórico e rompem o ciclo de exclusão institucionalizado, garantindo igualdade material de oportunidades.",
      gabarito: {
        letra: "A",
        ancora: "Abolição formal e ações afirmativas",
        espera_se: "a) O candidato deve explicar que, na visão de Florestan Fernandes, a abolição foi uma emancipação puramente jurídica e unilateral. O liberto não recebeu terras para cultivo, moradia, indenização nem educação elementar, sendo lançado na anomia de um mercado competitivo para o qual não fora preparado socialmente. Ademais, o Estado e os cafeicultores incentivaram ativamente a imigração europeia branca subvencionada, relegando os trabalhadores negros à marginalidade ocupacional, ao subemprego informal e à criminalização pela polícia.\nb) O candidato deve justificar que o racismo no Brasil não é mero preconceito moral individual, mas um fenômeno estrutural e institucional que perpetua desigualdades históricas acumuladas. As ações afirmativas (cotas universitárias e em concursos) atuam como instrumentos legítimos de justiça distributiva e equidade social, corrigindo distorções históricas, acelerando a mobilidade social e democratizando o acesso a espaços de prestígio, poder e conhecimento científico historicamente monopolizados pela elite branca."
      }
    }
  ]
};

// -------------------------------------------------------------
// EXECUÇÃO DO LOTE 9
// -------------------------------------------------------------
console.log("Iniciando escrita do Lote 9 (Filosofia e Sociologia)...");
salvar("Filosofia/Antiga_e_Medieval/Questoes_Grecia_Platao_Aristoteles.json", filAntiga);
salvar("Filosofia/Moderna_e_Politica/Questoes_Contratualismo_Iluminismo_e_Etica.json", filModerna);
salvar("Sociologia/Classicos_e_Teoria/Questoes_Durkheim_Weber_Marx.json", socClassicos);
salvar("Sociologia/Brasil_e_Cidadania/Questoes_Sociologia_Brasileira_Trabalho_e_Direitos.json", socBrasil);
console.log("--- LOTE 9 CONCLUÍDO COM SUCESSO ---");
