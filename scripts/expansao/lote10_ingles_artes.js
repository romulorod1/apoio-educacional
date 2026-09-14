const fs = require('fs');
const path = require('path');

const BASE_DIR = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';

function salvar(subpath, dados) {
  const p = path.join(BASE_DIR, subpath);
  fs.writeFileSync(p, JSON.stringify(dados, null, 2), 'utf-8');
  console.log(`Atualizado: ${subpath} com ${dados.questoes.length} questões.`);
}

// -------------------------------------------------------------
// 1. LÍNGUA INGLESA - LEITURA E GRAMÁTICA (ENEM, FUVEST, UERJ)
// -------------------------------------------------------------
const ingLeitura = {
  disciplina: "Língua Inglesa",
  assunto: "Reading Comprehension, False Friends and Connectors (ENEM/FUVEST/UERJ)",
  publico_alvo: "Escolas de Alta Performance - Niterói e Rio de Janeiro (6º EF ao 3º EM)",
  modulo: "Reading_Comprehension_Grammar_ENEM_FUVEST",
  subpasta: "Leitura_e_Gramatica",
  arquivo_origem: "Questoes_Reading_Comprehension_Grammar_ENEM_FUVEST.json",
  benchmark_didatico: {
    capitulo: "Unit 1: Textual Interpretation, Cognates, False Cognates and Discourse Markers",
    objetivos_aprendizagem: [
      "Aplicar técnicas de leitura rápida e estratégica em língua inglesa: Skimming (apreensão do sentido global e tipologia textual) e Scanning (localização de dados específicos e palavras-chave).",
      "Identificar e desambiguar falsos cognatos frequentes (*false friends*) em exames vestibulares (ex.: actually, pretend, intend, comprehensive, notice, realize, push, fabric).",
      "Dominar o papel sintático e semântico dos marcadores discursivos e conectivos (concessão, oposição, adição, causa, consequência e condição).",
      "Interpretar gêneros textuais multimodais e contemporâneos recorrentes no ENEM e UERJ: tirinhas satíricas, charges políticas, infográficos estatísticos e resumos acadêmicos (*abstracts*).",
      "Analisar a referência pronominal e a modulação semântica expressa por verbos modais (*can, could, may, might, should, must*)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Reading Strategies: Skimming and Scanning",
          definicao: "No ENEM e vestibulares modernos (FUVEST, UNICAMP, UERJ), os textos em inglês não exigem tradução palavra por palavra, mas interpretação pragmática eficiente. 1) Skimming: leitura rápida e panorâmica do título, subtítulo, primeira e última frases de cada parágrafo e fonte bibliográfica para captar a ideia central (*main idea*), o público-alvo e o tom do autor (crítico, irônico, informativo, persuasivo); 2) Scanning: varredura visual atenta à procura de dados pontuais específicos demandados pelo comando da questão (nomes próprios, números, datas, termos técnicos em itálico ou aspas)."
        },
        {
          termo: "False Cognates (False Friends) Cruciais",
          definicao: "Palavras de origem latina cuja grafia ou pronúncia se assemelha ao português, mas cujo significado semântico difere profundamente. Exemplos essenciais de prova: Actually (na verdade, realmente - não 'atualmente', que é 'currently' ou 'nowadays'); Pretend (fingir - não 'pretender', que é 'intend'); Intend (pretender, ter intenção); Comprehensive (abrangente, minucioso - não 'compreensivo', que é 'understanding'); Realize (perceber, dar-se conta de algo - e também 'realizar'); Notice (notar, perceber, aviso - não 'notícia', que é 'news'); Fabric (tecido - não 'fábrica', que é 'factory'); Push (empurrar - não 'puxar', que é 'pull'); Lecture (palestra, aula expositiva - não 'leitura', que é 'reading'); Novel (romance literário ou algo inovador - não 'novela de TV', que é 'soap opera'); Prejudice (preconceito - não 'prejuízo', que é 'loss' ou 'damage')."
        },
        {
          termo: "Discourse Markers and Linkers (Conectivos)",
          definicao: "Os conectivos orientam a progressão temática do texto: 1) Concessão (apesar de): Although, Even though, Though (+ oração com sujeito e verbo); Despite, In spite of (+ substantivo ou verbo em -ing); 2) Contraste / Oposição: However, Nevertheless, Nonetheless, On the other hand, Whereas, While; 3) Adição: Furthermore, Moreover, In addition, Besides; 4) Causa e Consequência: Therefore, Thus, Hence, Consequently, As a result (consequência); Because of, Due to, Owing to, Since, As (causa); 5) Condição e Hipótese: Unless (a não ser que / a menos que = if not), Provided that, As long as."
        },
        {
          termo: "Modal Verbs and Semantic Nuances",
          definicao: "Verbos auxiliares modais expressam a atitude do enunciador perante a ação: Can/Could (habilidade, permissão informal ou possibilidade); May/Might (probabilidade ou possibilidade remota; may = permissão formal); Should/Ought to (conselho, recomendação moral ou expectativa lógica); Must (obrigação mandatória ou forte dedução lógica afirmativa: 'He must be tired'); Mustn't (proibição categórica); Needn't / Don't have to (ausência de obrigação: 'você não precisa fazer'); Can't (dedução lógica negativa / certeza de impossibilidade: 'It can't be true')."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente no ENEM: confundir 'despite' com 'although'. 'Despite' e 'In spite of' são preposições e NUNCA devem ser seguidas diretamente de uma oração completa com sujeito e verbo conjugado (usam-se seguidas de substantivo ou gerúndio: 'Despite the rain, they played'). Já 'Although', 'Even though' e 'Though' são conjunções subordinativas que exigem oração completa com sujeito e verbo ('Although it rained, they played')."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Desambiguação de Falso Cognato e Conectivo em Questão ENEM",
      enunciado: "Considere o seguinte trecho adaptado de um artigo da BBC: 'Although the new policy actually aimed to reduce urban traffic, many citizens pretended to follow the rules while still driving during restricted hours.' \n\nCom base nas regras semânticas de língua inglesa:\na) Identifique o valor semântico introduzido pela palavra 'Although'.\nb) Traduza adequadamente as expressões 'actually' e 'pretended', explicando a distorção que ocorreria se fossem traduzidas literalmente como cognatos em português.",
      resolucao_passo_a_passo: "1. Valor do conectivo 'Although':\n- 'Although' é uma conjunção subordinativa concessiva (traduzida por 'embora' ou 'ainda que').\n- Estabelece uma quebra de expectativa entre o objetivo da política e a reação real dos motoristas.\n\n2. Desambiguação dos falsos cognatos:\n- 'Actually' traduz-se corretamente por 'na realidade' ou 'de fato'. Se traduzido incorretamente como 'atualmente', distorceria a temporalidade da ação planejada.\n- 'Pretended' é o passado simples do verbo 'pretend', que significa 'fingiram'. Se traduzido erroneamente pelo falso cognato 'pretenderam' (que em inglês seria 'intended'), inverteria totalmente o sentido do texto: de uma simulação fraudulenta de cumprimento passaria a significar uma honesta intenção de seguir a lei."
    }
  },
  questoes: [
    // Bloco 1: Fundamentos (1 a 5)
    {
      id: "ING_LEI_01",
      origem: "ENEM",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "False Friends: Actually e Currently",
      tipo: "fechada",
      enunciado: "Read the sentence: 'She looked very calm during the presentation, but she was actually terrified of public speaking.' \n\nIn this context, the word 'actually' expresses the idea of:",
      alternativas: [
        { letra: "A", texto: "Present time or contemporaneity (at the present moment)." },
        { letra: "B", texto: "In reality, as a matter of fact, or in truth." },
        { letra: "C", texto: "A future plan that will happen soon." },
        { letra: "D", texto: "A continuous physical action performed routinely." },
        { letra: "E", texto: "A deliberate simulation to deceive the audience." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Significado de 'actually'",
        porque: "'Actually' é um clássico falso amigo em inglês. Significa 'na realidade', 'de fato' ou 'realmente' (as a matter of fact), e não 'atualmente' (que seria expressed por 'currently' ou 'nowadays')."
      }
    },
    {
      id: "ING_LEI_02",
      origem: "UERJ",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Discourse Markers: However and Contrast",
      tipo: "fechada",
      enunciado: "Read the excerpt: 'Renewable energy investments have increased significantly worldwide. However, fossil fuels still account for the majority of global power generation.' \n\nThe discourse marker 'However' establishes between the two sentences a relation of:",
      alternativas: [
        { letra: "A", texto: "Chronological sequence of past events." },
        { letra: "B", texto: "Addition of similar arguments." },
        { letra: "C", texto: "Contrast, counter-argument or opposition." },
        { letra: "D", texto: "Final result or mathematical consequence." },
        { letra: "E", texto: "Direct quotation of an authority source." }
      ],
      resposta: "C",
      gabarito: {
        letra: "C",
        ancora: "Papel do conectivo 'However'",
        porque: "'However' (no entanto, porém, todavia) é uma conjunção/advérbio conectivo adversativo que expressa contraste e oposição entre o aumento dos investimentos renováveis e a persistência do petróleo/carvão."
      }
    },
    {
      id: "ING_LEI_03",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Fácil",
      topico: "False Friends: Pretend versus Intend",
      tipo: "fechada",
      enunciado: "In an online post discussing professional careers, a user wrote: 'Many employees pretend to be busy all day, but they actually intend to leave the company as soon as they find a better opportunity.' \n\nThe verbs 'pretend' and 'intend' mean, respectively:",
      alternativas: [
        { letra: "A", texto: "Fingir / Ter a intenção (pretender)." },
        { letra: "B", texto: "Pretender / Compreender." },
        { letra: "C", texto: "Tentar / Desistir." },
        { letra: "D", texto: "Presumir / Adiar." },
        { letra: "E", texto: "Reclamar / Aceitar." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Diferença entre pretend e intend",
        porque: "'Pretend' significa fingir, simular; 'Intend' significa ter o propósito ou a intenção de realizar algo (o que em português chamamos de pretender)."
      }
    },
    {
      id: "ING_LEI_04",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Concession Markers: Although and In Spite Of",
      tipo: "fechada",
      enunciado: "Choose the alternative that correctly completes the blank in the sentence below according to standard English grammar: \n\n'__________ facing severe budgetary restrictions and logistical delays, the scientific expedition successfully discovered three new marine species in the Pacific Ocean.'",
      alternativas: [
        { letra: "A", texto: "Although" },
        { letra: "B", texto: "Despite" },
        { letra: "C", texto: "Even though" },
        { letra: "D", texto: "Unless" },
        { letra: "E", texto: "Whereas" }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Regra sintática de Despite",
        porque: "'Despite' (ou 'In spite of') é uma preposição que aceita como complemento um sintagma nominal ou uma oração gerundial reduzida ('facing severe budgetary restrictions...'). Já 'Although' e 'Even though' exigiriam uma oração com sujeito e verbo flexionado ('Although they faced...')."
      }
    },
    {
      id: "ING_LEI_05",
      origem: "UNICAMP",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Modal Verbs: Deduction with Must and Can't",
      tipo: "fechada",
      enunciado: "A doctor examines a patient's lab results and states: 'The symptoms are identical to dehydration, but his sodium levels are extremely high. This cannot be a simple case of sunstroke; he must be suffering from a metabolic dysfunction.' \n\nIn this diagnostic context, the modals 'cannot' and 'must' indicate, respectively:",
      alternativas: [
        { letra: "A", texto: "Physical incapacity and moral permission." },
        { letra: "B", texto: "Logical impossibility (negative certainty) and strong logical deduction (positive certainty)." },
        { letra: "C", texto: "Past regret and polite request." },
        { letra: "D", texto: "Legal prohibition and optional advice." },
        { letra: "E", texto: "Future prediction and scientific doubt." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Modais de dedução lógica",
        porque: "'Cannot' (ou can't) expressa certeza lógica de que algo é impossível com base nas evidências, enquanto 'must' expressa uma forte conclusão/dedução lógica afirmativa de certeza."
      }
    },

    // Bloco 2: Consolidação (6 a 10)
    {
      id: "ING_LEI_06",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Textual Interpretation: Infographics and Data Analysis",
      tipo: "fechada",
      enunciado: "Read the report excerpt: 'A comprehensive study conducted across 20 European nations found that 45% of adolescents spend over four hours daily on social media. Surprisingly, respondents who reported the highest usage were also twice as likely to experience symptoms of insomnia and feelings of chronic loneliness.' \n\nThe main conclusion highlighted by the text regarding adolescent behavior is that:",
      alternativas: [
        { letra: "A", texto: "Social media completely cures sleep disorders in nearly half of European youths." },
        { letra: "B", texto: "There is a significant positive correlation between excessive social media usage and adverse psychological/physiological outcomes like insomnia and loneliness." },
        { letra: "C", texto: "European governments have officially prohibited teenagers from owning smartphones at night." },
        { letra: "D", texto: "Forty-five percent of doctors recommend four hours of daily internet browsing for insomnia treatment." },
        { letra: "E", texto: "Adolescents who avoid the internet report the highest levels of depression and social isolation." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Interpretação do estudo sobre adolescentes",
        porque: "O texto demonstra claramente a correlação entre tempo excessivo nas redes sociais (mais de quatro horas diárias) e maior vulnerabilidade a sintomas adversos (duas vezes mais probabilidade de sofrer de insônia e solidão crônica)."
      }
    },
    {
      id: "ING_LEI_07",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "False Friends: Comprehensive and Lecture",
      tipo: "fechada",
      enunciado: "Read the announcement: 'Professor Higgins delivered a comprehensive lecture on genomic sequencing that captivated the undergraduate audience from start to finish.' \n\nA faithful Portuguese translation of 'comprehensive lecture' is:",
      alternativas: [
        { letra: "A", texto: "Uma leitura compreensiva e caridosa." },
        { letra: "B", texto: "Uma palestra abrangente e aprofundada." },
        { letra: "C", texto: "Uma lição de moral tolerante." },
        { letra: "D", texto: "Uma conferência redundante e prolixa." },
        { letra: "E", texto: "Uma apostila introdutória simplificada." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Significado de 'comprehensive' e 'lecture'",
        porque: "'Comprehensive' significa amplo, minucioso, detalhado ou abrangente (não compreensivo); 'Lecture' significa conferência, palestra ou aula expositiva universitária (não leitura)."
      }
    },
    {
      id: "ING_LEI_08",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Cause and Consequence: Therefore and Due To",
      tipo: "fechada",
      enunciado: "Consider the argument: 'Urban soil in metropolitan centers is predominantly covered by asphalt and concrete; therefore, rainwater cannot infiltrate properly, leading to severe flash floods.' \n\nThe word 'therefore' could be replaced without altering the logical meaning of the sentence by:",
      alternativas: [
        { letra: "A", texto: "Nevertheless" },
        { letra: "B", texto: "Consequently" },
        { letra: "C", texto: "Whereas" },
        { letra: "D", texto: "Although" },
        { letra: "E", texto: "Unless" }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Conectivos de consequência",
        porque: "'Therefore' (portanto, por conseguinte) expressa uma relação de consequência lógica e conclusão causal, sendo sinônimo perfeito de 'Consequently', 'Thus' ou 'Hence'."
      }
    },
    {
      id: "ING_LEI_09",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Humor and Irony in Cartoons and Strips",
      tipo: "fechada",
      enunciado: "In a newspaper political cartoon, an executive stands in front of a factory discharging black smoke into a river, while pointing to a giant billboard that reads: 'OUR GOAL: 100% ECO-FRIENDLY BY 2099'. The executive tells reporters: 'We are making steady progress.' \n\nThe cartoon utilizes irony and humor primarily to:",
      alternativas: [
        { letra: "A", texto: "Praise industrial conglomerates for their genuine commitment to immediate environmental preservation." },
        { letra: "B", texto: "Critique corporate 'greenwashing', emphasizing the stark hypocrisy between ambitious long-term marketing promises and ongoing environmental degradation." },
        { letra: "C", texto: "Demonstrate that burning fossil fuels has no measurable impact on air or water pollution." },
        { letra: "D", texto: "Advise young engineers to seek employment exclusively in advertising agencies." },
        { letra: "E", texto: "Complain about the high price of bill-printing services in modern urban centers." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Ironia e Greenwashing na charge",
        porque: "A charge ironiza a prática do 'greenwashing' (maquiagem verde): a empresa fixa metas ambientais para um prazo longínquo e absurdo (2099) para fingir responsabilidade ecológica enquanto continua destruindo o meio ambiente na prática presente."
      }
    },
    {
      id: "ING_LEI_10",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Pronoun Reference and Textual Cohesion",
      tipo: "fechada",
      enunciado: "Read the scientific excerpt: 'When honeybees detect a pathogen inside the hive, they immediately isolate the infected larvae or remove them entirely to protect the colony from collapse. This hygienic behavior exhibits how social insects coordinate defensive measures.' \n\nIn the passage, the pronouns 'they', 'them', and the demonstrative 'This' refer, respectively, to:",
      alternativas: [
        { letra: "A", texto: "honeybees / infected larvae / the removal and isolation of larvae (hygienic behavior)." },
        { letra: "B", texto: "pathogens / hives / the collapse of the colony." },
        { letra: "C", texto: "larvae / honeybees / the infection." },
        { letra: "D", texto: "insects / colonies / the detection of bees." },
        { letra: "E", texto: "measures / larvae / the defensive workers." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Referência pronominal e coesão",
        porque: "'They' retoma o sujeito plural 'honeybees'; 'them' retoma o objeto direto 'infected larvae' que são removidas; e 'This' atua como dêitico anafórico resumitivo da ação coordenada de isolar ou remover as larvas infectadas."
      }
    },

    // Bloco 3: Aprofundamento e Excelência (11 a 15)
    {
      id: "ING_LEI_11",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Conditional Clauses: Unless and Provided That",
      tipo: "fechada",
      enunciado: "Analyze the diplomatic clause: 'The international treaty will not come into force __________ all signatory nations officially ratify the anti-proliferation protocol by the end of this fiscal year.' \n\nTo preserve the intended meaning that the treaty's validation depends strictly on full ratification, the blank must be filled by:",
      alternativas: [
        { letra: "A", texto: "unless" },
        { letra: "B", texto: "as long as" },
        { letra: "C", texto: "provided that" },
        { letra: "D", texto: "in case" },
        { letra: "E", texto: "since" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Uso de 'unless' (a menos que)",
        porque: "'Unless' equivale a 'if not' (a não ser que / a menos que): o tratado NÃO entrará em vigor a não ser que (unless) todos os países o ratifiquem."
      }
    },
    {
      id: "ING_LEI_12",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Advanced Modals: Regret in the Past (Should Have)",
      tipo: "fechada",
      enunciado: "Read the editorial comment: 'The municipal government knew that the dam showed alarming structural fissures six months ago. They should have evacuated the vulnerable downstream communities immediately instead of waiting for the catastrophic dam burst.' \n\nThe structure 'should have evacuated' communicates:",
      alternativas: [
        { letra: "A", texto: "A certainty that the evacuation was effectively executed in time." },
        { letra: "B", texto: "A criticism of an unfulfilled moral obligation or sensible action in the past (retrospective regret/reproach)." },
        { letra: "C", texto: "A hypothetical condition for an event that might happen next year." },
        { letra: "D", texto: "An official authorization granting citizens permission to return to their residences." },
        { letra: "E", texto: "A physiological necessity required by medical authorities." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Modal 'should have + participle'",
        porque: "O modal 'should have + particípio passado' expressa uma obrigação, conselho ou ação que era recomendável no passado, mas que infelizmente NÃO foi realizada, denotando crítica, reprovação ou arrependimento retrospectivo."
      }
    },
    {
      id: "ING_LEI_13",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Academic Abstract Interpretation: Peer Review and Science",
      tipo: "fechada",
      enunciado: "Read the academic abstract snippet: 'This paper investigates the reproducibility crisis in psychological science. By examining 100 replication attempts, our findings demonstrate that while cognitive effects showed moderate consistency, social priming experiments exhibited high rates of failure. Consequently, we argue for mandatory pre-registration of study protocols to mitigate publication bias.' \n\nAccording to the authors of the paper, mandatory pre-registration of study protocols is recommended because:",
      alternativas: [
        { letra: "A", texto: "It guarantees that no psychologist will ever publish research results online." },
        { letra: "B", texto: "It serves as a regulatory safeguard to minimize publication bias and address low reproducibility rates in experimental trials." },
        { letra: "C", texto: "It forces cognitive effects to become identical to social priming experiments." },
        { letra: "D", texto: "It completely eliminates the necessity of statistical analysis in humanities." },
        { letra: "E", texto: "It awards cash prizes to researchers whose replication attempts fail systematically." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Interpretação de abstract acadêmico",
        porque: "O abstract argumenta explicitamente que o pré-registro mandatório dos protocolos de estudo visa mitigar o viés de publicação (publication bias), aumentando a confiabilidade e combatendo a crise de replicabilidade em pesquisas científicas."
      }
    },
    {
      id: "ING_LEI_14",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Vocabulary in Context: Polysemy of Novel and Fabric",
      tipo: "fechada",
      enunciado: "In the sentence 'The biotechnology startup proposed a novel approach to synthesize biodegradable polymers, aiming to strengthen the cellular fabric of tissue grafts', the words 'novel' and 'fabric' mean:",
      alternativas: [
        { letra: "A", texto: "fictional romance / textile clothing store." },
        { letra: "B", texto: "innovative/original / structural framework or texture." },
        { letra: "C", texto: "television soap opera / manufacturing factory." },
        { letra: "D", texto: "outdated technique / chemical dye." },
        { letra: "E", texto: "lengthy narrative book / industrial warehouse." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Polissemia de 'novel' e 'fabric'",
        porque: "Como adjetivo, 'novel' significa novo, original ou inovador (não livro de romance); e no sentido biológico/estrutural, 'fabric' refere-se à tessitura, trama ou estrutura básica celular (não tecido têxtil de vestuário nem fábrica)."
      }
    },
    {
      id: "ING_LEI_15",
      origem: "FUVEST / UNICAMP - Discursiva",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Discursive Textual Analysis: Concession, Contrast and Author's Argument",
      tipo: "aberta",
      enunciado: "Read the editorial excerpt from an international journal:\n'Despite the widespread assertion that automated artificial intelligence will inevitably eradicate blue-collar manual employment, empirical employment statistics from the past decade suggest a far more nuanced outcome. In fact, while mundane clerical tasks have indeed experienced sharp reductions, skilled trades requiring spatial adaptability have actually witnessed increased wage premiums.'\n\nBased on the excerpt:\na) Identify the concession marker used in the first sentence and explain the contrasting relationship established between public assertions and empirical data.\nb) Explain what happened to 'mundane clerical tasks' and 'skilled trades', highlighting the meaning of the word 'actually' in the final clause.",
      resposta: "a) O marcador é 'Despite', que contrapõe a crença generalizada de extinção do trabalho manual aos dados reais empíricos mais complexos; b) Tarefas burocráticas rotineiras sofreram forte redução, enquanto ofícios especializados tiveram aumento salarial; 'actually' enfatiza a surpresa e realidade dos fatos contra o senso comum.",
      gabarito: {
        letra: "A",
        ancora: "Análise discursiva em inglês",
        espera_se: "a) O candidato deve identificar o conectivo concessivo 'Despite' (apesar de). Deve explicar que a relação de contraste se dá entre a afirmação amplamente difundida no senso comum de que a IA iria inevitavelmente erradicar o trabalho braçal (*blue-collar*) e os dados estatísticos empíricos da última década, que mostram um cenário muito mais sutil e nuançado (*nuanced*).\nb) O candidato deve esclarecer que as tarefas burocráticas e rotineiras de escritório (*mundane clerical tasks*) sofreram fortes reduções/eliminações, enquanto os ofícios manuais qualificados que exigem adaptabilidade espacial (*skilled trades*) viram, na realidade, um aumento em seus rendimentos/salários (*wage premiums*). Por fim, deve explicar que 'actually' atua como falso cognato enfático significando 'na verdade' / 'de fato', ressaltando a constatação real e contraintuitiva dos dados contra a expectativa prévia do público."
      }
    }
  ]
};

// -------------------------------------------------------------
// 2. LÍNGUA INGLESA - MILITARES E IME / ITA
// -------------------------------------------------------------
const ingMilitares = {
  disciplina: "Língua Inglesa",
  assunto: "Advanced Grammar, Inversion and Subjunctive (Nível IME/ITA e EsPCEx)",
  publico_alvo: "Preparatório Militar (EsPCEx, AFA, Colégio Naval) e Vestibulares IME / ITA",
  modulo: "Advanced_English_IME_ITA_EsPCEx",
  subpasta: "Militares_e_IME_ITA",
  arquivo_origem: "Questoes_Advanced_English_IME_ITA_EsPCEx.json",
  benchmark_didatico: {
    capitulo: "Unit Advanced IME/ITA: Negative Inversion, Mixed Conditionals and Modal Verbs in Speculation",
    objetivos_aprendizagem: [
      "Dominar a inversão sintática enfática com expressões negativas e restritivas (*Negative and Restrictive Inversion*): *Seldom, Hardly... when, No sooner... than, Scarcely, Not only... but also, Under no circumstances*.",
      "Dominar as orações condicionais avançadas: condicionais mistas (*Mixed Conditionals*) e inversão condicional com omissão do conectivo 'if' (*Had I known, Were I you, Should you need*).",
      "Dominar o subjuntivo mandativo (*Mandative Subjunctive*) em orações subordinadas após verbos e adjetivos de exigência, sugestão ou urgência (*demand, recommend, insist, it is essential that he be*).",
      "Analisar e aplicar verbos modais em contextos de dedução e especulação temporal retrospectiva (*must have, can't have, might have, could have, needn't have done versus didn't need to do*).",
      "Diferenciar estruturas de Gerúndio e Infinitivo com mudança substancial de significado (*stop, remember, forget, regret, try, mean*) e regências preposicionadas complexas (*be used to -ing, look forward to -ing*)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Negative and Restrictive Inversion (Inversão Enfática)",
          definicao: "Em provas de alta complexidade (IME, ITA, EsPCEx, AFA), quando uma sentença é iniciada por um advérbio ou locução adverbial de sentido negativo ou restritivo para criar ênfase retórica formal, a ordem do sujeito e do verbo auxiliar DEVE ser invertida (estrutura de pergunta em frase afirmativa: Advérbio Negativo + Auxiliar + Sujeito + Verbo Principal). Principais expressões: 1) Hard temporal correlation: 'No sooner HAD the general ARRIVED THAN the artillery barrage commenced' (No sooner... than); 'Hardly / Scarcely HAD the jet TOUCHED down WHEN the storm broke' (Hardly/Scarcely... when); 2) Frequência restritiva: 'Seldom / Rarely HAVE we WITNESSED such a formidable maneuver'; 3) Proibição e restrição: 'Under no circumstances SHOULD you DISCLOSE the tactical coordinates'; 'On no account MUST the perimeter BE BREACHED'; 4) Adição correlativa: 'Not only DID the squad SURVIVE the ambush, BUT they ALSO completed the mission'; 5) Restrição temporal: 'Only after the commander had given the signal DID the troops ADVANCE'."
        },
        {
          termo: "Advanced Conditionals and Conditional Inversion",
          definicao: "1) Inversão sem 'if': Em registro formal/militar, pode-se omitir 'if' invertendo o verbo auxiliar com o sujeito: a) First Conditional: 'Should you require air support, notify base headquarters' (= If you should require); b) Second Conditional: 'Were the submarine to dive deeper, water pressure would crush its hull' ou 'Were I the captain, I would retreat' (= If I were); c) Third Conditional: 'Had the radar operator noticed the echo, the interception would have succeeded' (= If the radar operator had noticed); 2) Mixed Conditionals (Condicionais Mistas): Cruzamento temporal entre passado e presente: a) Condição no passado gerando efeito no presente (If + Past Perfect -> would + bare infinitive): 'If the engineer HAD CALIBRATED the guidance system yesterday, the rocket WOULD BE on course right now'; b) Situação permanente ou presente gerando consequência no passado (If + Simple Past -> would have + past participle): 'If the lieutenant SPOKE Russian fluently, he WOULD HAVE TRANSLATED that intercepted transmission during the battle'."
        },
        {
          termo: "The Mandative Subjunctive (Subjuntivo Mandativo)",
          definicao: "Empregada em contextos formais após verbos de exigência, sugestão ou ordem (demand, insist, require, recommend, suggest, urge, propose) ou adjetivos que expressam urgência e importância (it is vital, essential, crucial, mandatory, imperative that...). A regra estabelece que o verbo da oração introduzida por 'that' deve permanecer SEMPRE em sua forma básica (bare infinitive) para qualquer pessoa gramatical, sem 's' na terceira pessoa e sem flexão de tempo: 'The admiral demanded that the officer RESIGN immediately' (e não resigns ou resigned); 'It is imperative that every soldier BE present at 0500 hours' (e não is ou was); forma negativa: 'The doctor recommended that he NOT INGEST contaminated water'."
        },
        {
          termo: "Gerund versus Infinitive with Meaning Shift",
          definicao: "Determinados verbos alteram drasticamente seu significado conforme são seguidos de Gerúndio (-ing) ou Infinitivo com 'to': 1) Stop: 'The platoon stopped to check the map' (interromperam a marcha A FIM DE consultar o mapa) versus 'The soldier stopped checking his radio' (cessou o hábito/ação de consultar o rádio); 2) Remember / Forget: 'Remember to lock the armory' (lembre-se do dever futuro de trancar) versus 'I remember locking the armory' (lembro-me da memória passada de ter trancado); 3) Regret: 'I regret to inform you of the casualty' (lamento o dever presente de informar) versus 'He regretted joining that battalion' (arrependeu-se da ação passada); 4) Needn't have done versus Didn't need to do: 'They needn't have brought gas masks' (trouxeram as máscaras, mas foi desnecessário) versus 'They didn't need to bring gas masks' (não era necessário, portanto não as trouxeram)."
        }
      ],
      atencao_ponto_cego: "Ponto cego fatal em provas do ITA e IME: o paralelismo com 'No sooner' e 'Hardly'. 'No sooner' SEMPRE exige a correlação com 'THAN' ('No sooner had... than...'). Já 'Hardly' e 'Scarcely' SEMPRE exigem a correlação com 'WHEN' ('Hardly had... when...'). Misturar essas correlações (ex.: usar 'No sooner... when' ou 'Hardly... than') é um dos erros gramaticais mais penalizados em bancas militares."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Inversão Negativa e Condicional Mista Nível IME/ITA",
      enunciado: "Analise o item gramatical de nível ITA: 'Reescreva a sentença abaixo eliminando o conectivo \"If\" e aplicando inversão condicional. Em seguida, inicie uma nova oração independente com a locução \"Under no circumstances\", inserindo inversão com o modal \"must\": \n\n\"If the flight controller had detected the incoming missile trajectory earlier, our air defense systems would protect the airfield now. Sentry guards must not leave their tactical posts during red alert.\" '",
      resolucao_passo_a_passo: "1. Aplicação da Inversão Condicional (Mixed Conditional sem 'if'):\n- Sentença original: 'If the flight controller had detected the incoming missile trajectory earlier, our air defense systems would protect the airfield now.'\n- Regra: Omitindo-se 'if' no Third/Mixed conditional, o auxiliar 'Had' passa para a frente do sujeito:\n- Rescrita: 'Had the flight controller detected the incoming missile trajectory earlier, our air defense systems would protect the airfield now.'\n\n2. Aplicação da Inversão com 'Under no circumstances':\n- Sentença original: 'Sentry guards must not leave their tactical posts during red alert.'\n- Regra: Ao iniciar com a locução negativa restritiva 'Under no circumstances', o auxiliar modal 'must' inverte de posição com o sujeito 'sentry guards', e o 'not' desaparece (pois a locução já é negativa):\n- Rescrita: 'Under no circumstances must sentry guards leave their tactical posts during red alert.'"
    }
  },
  questoes: [
    // Bloco 1: Fundamentos (1 a 5)
    {
      id: "ING_MIL_01",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Conditional Inversion: Third Conditional",
      tipo: "fechada",
      enunciado: "Choose the grammatically correct option to complete the military sentence: \n\n'__________ the reconnaissance drone transmitted the coordinates on time, the artillery strike would have neutralized the target completely.'",
      alternativas: [
        { letra: "A", texto: "If had" },
        { letra: "B", texto: "Had" },
        { letra: "C", texto: "Should" },
        { letra: "D", texto: "Were" },
        { letra: "E", texto: "Whether" }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Inversão condicional no Third Conditional",
        porque: "Em registros formais, omite-se o conectivo 'if' invertendo o auxiliar 'had' com o sujeito ('Had the reconnaissance drone transmitted...' = 'If the reconnaissance drone had transmitted...')."
      }
    },
    {
      id: "ING_MIL_02",
      origem: "AFA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Negative Inversion: Seldom",
      tipo: "fechada",
      enunciado: "Select the sentence in which negative inversion is applied correctly according to standard English syntax:",
      alternativas: [
        { letra: "A", texto: "Seldom the air force commanders have deployed fighter jets in such inclement weather." },
        { letra: "B", texto: "Seldom have the air force commanders deployed fighter jets in such inclement weather." },
        { letra: "C", texto: "Seldom deployed have the air force commanders fighter jets in such inclement weather." },
        { letra: "D", texto: "Seldom the air force commanders did deploy fighter jets in such inclement weather." },
        { letra: "E", texto: "Seldom were deployed the air force commanders fighter jets in such inclement weather." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Inversão enfática com 'Seldom'",
        porque: "Quando 'Seldom' inicia a oração, a ordem sintática exige obrigatoriamente: Seldom + verbo auxiliar (have) + sujeito (the air force commanders) + verbo principal (deployed)."
      }
    },
    {
      id: "ING_MIL_03",
      origem: "EFOMM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Mandative Subjunctive",
      tipo: "fechada",
      enunciado: "Read the captain's instruction: 'It is essential that every cadet __________ the maritime safety regulations before embarking on the vessel.' \n\nThe grammatically correct form to complete the blank in formal English is:",
      alternativas: [
        { letra: "A", texto: "memorizes" },
        { letra: "B", texto: "memorize" },
        { letra: "C", texto: "memorized" },
        { letra: "D", texto: "must memorize" },
        { letra: "E", texto: "is memorizing" }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Subjuntivo mandativo após 'It is essential that'",
        porque: "O subjuntivo mandativo exige a forma básica do infinitivo sem 'to' (bare infinitive: memorize) para qualquer pessoa gramatical, dispensando o '-s' de terceira pessoa do singular."
      }
    },
    {
      id: "ING_MIL_04",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Negative Inversion: No sooner... than",
      tipo: "fechada",
      enunciado: "Choose the alternative that correctly fills in the blanks: \n\n'No sooner __________ the special forces entered the hostage compound __________ the armed sentries opened fire.'",
      alternativas: [
        { letra: "A", texto: "did / when" },
        { letra: "B", texto: "had / than" },
        { letra: "C", texto: "have / then" },
        { letra: "D", texto: "were / where" },
        { letra: "E", texto: "had / when" }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Estrutura No sooner... than",
        porque: "A estrutura correlativa fixa para ações imediatamente subsequentes no passado é 'No sooner HAD [sujeito] [particípio] THAN...'. A conjunção correlata de 'No sooner' é estritamente 'THAN'."
      }
    },
    {
      id: "ING_MIL_05",
      origem: "Colégio Naval / Epcar",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Gerund versus Infinitive with Meaning Change",
      tipo: "fechada",
      enunciado: "Analyze the two statements regarding navigation: \nI. 'The helmsman stopped to consult the magnetic compass.' \nII. 'The helmsman stopped consulting the magnetic compass.' \n\nRegarding the meaning of the two sentences, it is correct to affirm that:",
      alternativas: [
        { letra: "A", texto: "Both sentences have the exact same grammatical meaning and denote interruption of compass consultation." },
        { letra: "B", texto: "Sentence I means the helmsman halted his movement in order to consult the compass, whereas sentence II means he ceased the action of consulting the compass altogether." },
        { letra: "C", texto: "Sentence I indicates an accidental mistake, while sentence II indicates a direct military order." },
        { letra: "D", texto: "Sentence I is grammatically incorrect because 'stop' can never be followed by an infinitive." },
        { letra: "E", texto: "Sentence II denotes a future obligation that the sailor has not yet fulfilled." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Stop to do versus Stop doing",
        porque: "'Stop to consult' indica interrupção de uma ação prévia com o objetivo de consultar o instrumento (finalidade); 'Stop consulting' significa interromper e cessar a própria prática contínua de consultar o instrumento."
      }
    },

    // Bloco 2: Consolidação (6 a 10)
    {
      id: "ING_MIL_06",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Mixed Conditionals: Past Condition with Present Consequence",
      tipo: "fechada",
      enunciado: "Consider the aerospace failure context: 'The telemetry engineers failed to upgrade the guidance algorithm last night. Consequently, the spacecraft is currently deviating from its projected orbital trajectory.' \n\nThe alternative that accurately converts the two facts into a single Mixed Conditional sentence is:",
      alternativas: [
        { letra: "A", texto: "If the engineers upgraded the algorithm last night, the spacecraft wouldn't deviate now." },
        { letra: "B", texto: "If the engineers had upgraded the algorithm last night, the spacecraft would not be deviating right now." },
        { letra: "C", texto: "Had the engineers upgraded the algorithm last night, the spacecraft would have not deviated right now." },
        { letra: "D", texto: "Provided that the engineers upgrade the algorithm last night, the spacecraft will not deviate now." },
        { letra: "E", texto: "Should the engineers have upgraded the algorithm, the spacecraft would be deviated right now." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Mixed Conditional: Past Perfect + would be doing",
        porque: "A condicional mista combina uma condição irreal no passado (If + Past Perfect: 'had upgraded') com uma consequência contínua no presente (would not be deviating right now)."
      }
    },
    {
      id: "ING_MIL_07",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Advanced Inversion with 'Not only... but also'",
      tipo: "fechada",
      enunciado: "Choose the sentence that correctly exhibits negative inversion with the correlative conjunction 'Not only... but also':",
      alternativas: [
        { letra: "A", texto: "Not only the ballistic missile evaded enemy radar, but it also reached its target with millimeter precision." },
        { letra: "B", texto: "Not only did the ballistic missile evade enemy radar, but it also reached its target with millimeter precision." },
        { letra: "C", texto: "Not only evaded the ballistic missile enemy radar, but also it reached its target." },
        { letra: "D", texto: "Not only had evaded the ballistic missile enemy radar, but did it reach its target." },
        { letra: "E", texto: "Not only the ballistic missile did evade radar, but also reached it target." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Inversão com Not only... but also",
        porque: "Iniciando-se a oração por 'Not only', o operador auxiliar 'did' deve ser anteposto ao sujeito ('did the ballistic missile evade...'), mantendo-se a segunda oração com a ordem sintática padrão."
      }
    },
    {
      id: "ING_MIL_08",
      origem: "AFA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Retrospective Modals: Needn't Have versus Didn't Need To",
      tipo: "fechada",
      enunciado: "The rescue team packed three inflatable rafts for the mission. However, when they reached the island, a transport helicopter had already evacuated all surviving mariners safely. \n\nWhich sentence correctly reflects this situation?",
      alternativas: [
        { letra: "A", texto: "The rescue team didn't need to pack the rafts, so they left them at the military base." },
        { letra: "B", texto: "The rescue team needn't have packed the rafts, as their effort proved unnecessary in retrospect." },
        { letra: "C", texto: "The rescue team must not have packed the rafts during the operation." },
        { letra: "D", texto: "The rescue team should have packed the rafts because helicopters cannot fly." },
        { letra: "E", texto: "The rescue team can't have packed the rafts because it was strictly forbidden." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Needn't have done versus didn't need to",
        porque: "'Needn't have packed' indica que a ação FOI concretizada (eles empacotaram os botes), mas em retrospecto revelou-se inútil ou desnecessária. Já 'didn't need to pack' indicaria que não era necessário e por isso a ação não foi feita."
      }
    },
    {
      id: "ING_MIL_09",
      origem: "EFOMM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Prepositional Regimen: Be Used To + Gerund",
      tipo: "fechada",
      enunciado: "Complete the sentence correctly: \n\n'Seasoned navy divers are used to __________ in freezing and turbulent waters, whereas rookies often struggle to acclimatize.'",
      alternativas: [
        { letra: "A", texto: "submerge" },
        { letra: "B", texto: "submerging" },
        { letra: "C", texto: "be submerged" },
        { letra: "D", texto: "have submerged" },
        { letra: "E", texto: "submerges" }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Regência de 'be used to + -ing'",
        porque: "A estrutura 'be used to' (ou 'get used to') expressa estar acostumado/habituado a algo. Nela, o 'to' é preposição (e não partícula de infinitivo), exigindo verbo na forma de gerúndio terminado em -ing (submerging)."
      }
    },
    {
      id: "ING_MIL_10",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Inversion with 'Hardly... when'",
      tipo: "fechada",
      enunciado: "Select the option that correctly adheres to formal academic and military inversion standards: \n\n'__________ had the submarine reached periscope depth __________ an hostile sonar ping reverberated through the hull.'",
      alternativas: [
        { letra: "A", texto: "No sooner / when" },
        { letra: "B", texto: "Hardly / when" },
        { letra: "C", texto: "Scarcely / than" },
        { letra: "D", texto: "Barely / then" },
        { letra: "E", texto: "Seldom / that" }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Correlação fixa 'Hardly... when'",
        porque: "O advérbio restritivo 'Hardly' (ou 'Scarcely') rege obrigatoriamente a correlação com a conjunção temporal 'WHEN'. A alternativa 'No sooner' exigiria 'THAN'."
      }
    },

    // Bloco 3: Aprofundamento e Excelência (11 a 15)
    {
      id: "ING_MIL_11",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Inversion with 'Only after' and Subordinate Clause Structure",
      tipo: "fechada",
      enunciado: "In complex inversion structures initiated by 'Only after', the auxiliary inversion must take place in the main clause, not in the subordinate clause. Identify the only grammatically flawless option:",
      alternativas: [
        { letra: "A", texto: "Only after did the commander inspect the damage, the crew abandoned the sinking destroyer." },
        { letra: "B", texto: "Only after the commander had inspected the damage did the crew abandon the sinking destroyer." },
        { letra: "C", texto: "Only after the commander had inspected the damage, the crew did abandon the sinking destroyer." },
        { letra: "D", texto: "Only after had inspected the commander the damage, abandoned the crew the sinking destroyer." },
        { letra: "E", texto: "Only after the damage the commander inspected, did abandon the crew the destroyer." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Inversão com 'Only after'",
        porque: "Com 'Only after / Only when / Only if', a oração subordinada mantém a ordem direta ('the commander had inspected the damage'); a inversão sujeito-auxiliar ocorre obrigatoriamente na oração PRINCIPAL que se segue ('did the crew abandon...')."
      }
    },
    {
      id: "ING_MIL_12",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Inverted Subjunctive in First Conditional (Should with Omission of If)",
      tipo: "fechada",
      enunciado: "In official military dispatches, the First Conditional is frequently formulated without 'if' by inverting the auxiliary 'Should'. Which of the following sentences represents this structure correctly?",
      alternativas: [
        { letra: "A", texto: "Should any unrecognized aircraft enters sovereign airspace, launch fighter interceptors immediately." },
        { letra: "B", texto: "Should any unrecognized aircraft enter sovereign airspace, launch fighter interceptors immediately." },
        { letra: "C", texto: "Should entered any unrecognized aircraft into sovereign airspace, launch fighter interceptors." },
        { letra: "D", texto: "Should have any unrecognized aircraft enter sovereign airspace, launching interceptors." },
        { letra: "E", texto: "Should any aircraft will enter sovereign airspace, launch interceptors immediately." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Inversão com 'Should' no First Conditional",
        porque: "A inversão de 'If any unrecognized aircraft enters...' faz-se com 'Should' seguido do sujeito e do verbo principal na sua forma infinitiva nua (bare infinitive: 'enter', sem terminação '-s')."
      }
    },
    {
      id: "ING_MIL_13",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Mandative Subjunctive with Negative and Passive Voice",
      tipo: "fechada",
      enunciado: "Read the diplomatic stipulation: 'The joint defense committee unanimously insisted that classified intelligence __________ to unauthorized foreign attachés.' \n\nChoose the grammatically accurate subjunctive form to complete the statement:",
      alternativas: [
        { letra: "A", texto: "is not disclosed" },
        { letra: "B", texto: "not be disclosed" },
        { letra: "C", texto: "does not be disclosed" },
        { letra: "D", texto: "must not being disclosed" },
        { letra: "E", texto: "would not have disclosed" }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Subjuntivo mandativo na voz passiva negativa",
        porque: "No subjuntivo mandativo, a forma negativa constrói-se antepondo-se 'not' diretamente ao bare infinitive. Como a oração está na voz passiva, emprega-se 'not be disclosed' (sem auxiliares do/does/did)."
      }
    },
    {
      id: "ING_MIL_14",
      origem: "EsPCEx / IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Modal Verbs in Speculation: Can't Have Done",
      tipo: "fechada",
      enunciado: "The encryption key was rotated at midnight and stored in a biometrically locked safe accessible only to the general. An investigator declares: 'The saboteur __________ the data using the new code at 23:00 hours yesterday, because the new algorithm had not even been activated yet.' \n\nThe blank must be filled by:",
      alternativas: [
        { letra: "A", texto: "must have decrypted" },
        { letra: "B", texto: "can't have decrypted" },
        { letra: "C", texto: "might have decrypted" },
        { letra: "D", texto: "should have decrypted" },
        { letra: "E", texto: "needn't have decrypted" }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Dedução lógica negativa no passado",
        porque: "'Can't have decrypted' expressa a certeza lógica de que a ação foi materialmente impossível de ter acontecido no passado com base no fato de o algoritmo sequer ter sido ativado."
      }
    },
    {
      id: "ING_MIL_15",
      origem: "ITA / IME - Discursiva",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Advanced Syntax Transformation: Inversion, Conditionals and Mandative Subjunctive",
      tipo: "aberta",
      enunciado: "Transform each of the following sentences according to the rigorous grammatical instructions provided:\n\n1. 'If the anti-aircraft battery had not jammed during the initial assault, the airbase would not be undefended at this moment.' \n-> Rewrite the sentence by applying conditional inversion (omitting 'if').\n\n2. 'The chief of staff strongly recommended that the senior officer (to surrender) the garrison immediately.' \n-> Rewrite the subordinate clause placing the verb in the correct mandative subjunctive form.\n\n3. 'The intelligence operatives not only compromised the enemy communication satellite, but they also decoded the ciphered transmission.' \n-> Rewrite the sentence beginning strictly with 'Not only'.",
      resposta: "1. Had the anti-aircraft battery not jammed during the initial assault, the airbase would not be undefended at this moment.\n2. ...recommended that the senior officer surrender the garrison immediately.\n3. Not only did the intelligence operatives compromise the enemy communication satellite, but they also decoded the ciphered transmission.",
      gabarito: {
        letra: "A",
        ancora: "Transformações sintáticas avançadas (ITA/IME)",
        espera_se: "1. O candidato deve omitir 'if' e inverter o auxiliar 'Had' com o sujeito, mantendo a partícula negativa após o sujeito: 'Had the anti-aircraft battery not jammed during the initial assault, the airbase would not be undefended at this moment.'\n2. O candidato deve aplicar o subjuntivo mandativo (bare infinitive sem 's'): 'The chief of staff strongly recommended that the senior officer surrender the garrison immediately.' (o uso de 'surrenders' ou 'surrendered' anula o item).\n3. O candidato deve iniciar com 'Not only' e inverter o sujeito com o auxiliar do Simple Past ('did'): 'Not only did the intelligence operatives compromise the enemy communication satellite, but they also decoded the ciphered transmission.'"
      }
    }
  ]
};

// -------------------------------------------------------------
// 3. ARTES - HISTÓRIA DA ARTE, VANGUARDAS E MODERNISMO
// -------------------------------------------------------------
const artHistoria = {
  disciplina: "Artes",
  assunto: "História da Arte, Vanguardas Europeias e Modernismo Brasileiro",
  publico_alvo: "Escolas de Alta Performance - Niterói e Rio de Janeiro (6º EF ao 3º EM)",
  modulo: "Arte_Classica_Vanguardas_e_Brasil",
  subpasta: "Historia_da_Arte_e_Modernismo",
  arquivo_origem: "Questoes_Arte_Classica_Vanguardas_e_Brasil.json",
  benchmark_didatico: {
    capitulo: "Unidade 1: Do Renascimento às Vanguardas Europeias e à Semana de Arte Moderna de 1922",
    objetivos_aprendizagem: [
      "Compreender a evolução das linguagens visuais ocidentais do Renascimento (perspectiva matemática, proporção áurea e humanismo) ao Barroco (chiaroscuro, dinamismo e dramatismo teatral em Caravaggio e Aleijadinho).",
      "Analisar a ruptura da modernidade com o Impressionismo (captação da luz natural efêmera e pinceladas soltas) e o Pós-Impressionismo (Van Gogh, Cézanne e Gauguin).",
      "Dominar as características conceituais e estéticas das Vanguardas Europeias do início do século XX: Cubismo, Futurismo, Expressionismo, Dadaísmo e Surrealismo.",
      "Analisar o impacto da Semana de Arte Moderna de 1922 (São Paulo), suas fases de desdobramento (Manifesto Pau-Brasil, Movimento Antropofágico e Fase Social de 1930) e artistas canônicos (Tarsila do Amaral, Anita Malfatti, Di Cavalcanti, Brecheret e Portinari).",
      "Compreender a Arte Contemporânea brasileira: neoconcretismo, intervenções urbanas e a arte participativa e sensorial (Hélio Oiticica e Lygia Clark)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Do Renascimento ao Barroco",
          definicao: "No Renascimento (séculos XV e XVI), a arte rompe com o teocentrismo medieval e adota o Humanismo, a simetria, o equilíbrio racional e a Perspectiva Linear Matemática (Brunelleschi, Da Vinci, Michelangelo, Rafael), criando a ilusão tridimensional de profundidade geométrica. No Barroco (século XVII), em resposta à Contrarreforma católica, a harmonia estática dá lugar à dramaticidade, teatralidade, movimento curvilíneo e à técnica do chiaroscuro (forte contraste entre luz e sombra, celebrizada por Caravaggio). No Brasil colonial, o Barroco e Rococó mineiro atingem o ápice com Antônio Francisco Lisboa (Aleijadinho: Os Doze Profetas de Congonhas e relevos em pedra-sabão) e Mestre Ataíde (pinturas ilusionistas de tetos de igrejas com figuras de anjos e virgens mestiças)."
        },
        {
          termo: "Impressionismo e a Dissolução da Linha Acadêmica",
          definicao: "Na segunda metade do século XIX em Paris, o Impressionismo (Monet, Renoir, Degas) revoluciona a pintura ao abandonar a pintura acadêmica de ateliê e pintar ao ar livre (*en plein air*). Focando na incidência fugaz da luz solar e na percepção visual da retina humana, utilizam pinceladas soltas e cores puras justapostas, abolindo os contornos lineares nítidos e sombras pretas puras. O Pós-Impressionismo aprofunda novas buscas expressivas: Paul Cézanne geometriza a natureza abrindo caminho para o Cubismo; Vincent van Gogh utiliza pinceladas carregadas e cores emotivas intensas inaugurando o Expressionismo; Paul Gauguin busca o primitivismo simbólico."
        },
        {
          termo: "As Vanguardas Europeias do Século XX",
          definicao: "Movimentos artísticos radicais pré e pós-Primeira Guerra que destruíram o cânone da mimese (cópia figurativa da realidade): 1) Expressionismo (*Die Brücke*, Edvard Munch): distorção da realidade e uso de cores berrantes para expressar a angústia existencial, o medo e a alienação urbana; 2) Cubismo (Pablo Picasso, Georges Braque): desconstrução da perspectiva clássica renascentista, fragmentação geométrica dos objetos e apresentação de múltiplos ângulos de visão simultâneos na tela (*Les Demoiselles d'Avignon*, *Guernica*); 3) Futurismo (Filippo Tommaso Marinetti): exaltação da velocidade, dinamismo, máquinas, eletricidade, guerra e ruptura agressiva com a tradição do passado; 4) Dadaísmo (Marcel Duchamp, Tristan Tzara): antiarte nascida da desilusão da Primeira Guerra Mundial, celebração do absurdo, do acaso, da ironia e criação dos *ready-mades* (objetos industriais cotidianos dessacralizados alçados a obras de arte, como *A Fonte*); 5) Surrealismo (Salvador Dalí, René Magritte, André Breton): exploração do inconsciente, da teoria psicanalítica de Freud, dos sonhos, do automatismo psíquico e da justa-posição ilógica de elementos fantásticos."
        },
        {
          termo: "A Semana de Arte Moderna de 1922 e o Modernismo Brasileiro",
          definicao: "Realizada no Teatro Municipal de São Paulo em fevereiro de 1922, a Semana reuniu artistas plásticos (Anita Malfatti, Di Cavalcanti, Ferrignac, Zina Aita), escultores (Victor Brecheret), músicos (Villa-Lobos) e escritores (Mário de Andrade, Oswald de Andrade, Menotti Del Picchia). O objetivo era romper com o academicismo parnasiano e com a cópia servil de padrões europeus, propondo uma arte genuinamente brasileira conectada à experimentação moderna. Oswald de Andrade lança o Manifesto Pau-Brasil (1924: poesia de exportação, linguagem coloquial) e o Movimento Antropofágico (1928: deglutição crítica da cultura e vanguarda estrangeiras para digeri-las e transformá-las em arte autêntica e original brasileira, simbolizada pela pintura *Abaporu* de Tarsila do Amaral). Na década de 1930, consolida-se a vertente social e engajada com Candido Portinari (*Os Retirantes*, painéis *Guerra e Paz*)."
        },
        {
          termo: "Arte Contemporânea Brasileira: Neoconcretismo e Intervenção",
          definicao: "No final da década de 1950, o Neoconcretismo carioca (Lygia Clark, Hélio Oiticica, Amílcar de Castro, Ferreira Gullar) rompe com o racionalismo geométrico estrito do Concretismo paulista. A obra de arte deixa de ser um objeto contemplativo estático para exigir a participação ativa do espectador: Lygia Clark cria os *Bichos* (esculturas de alumínio articuladas que o público manuseia e reconfigura); Hélio Oiticica cria os *Parangolés* (capas e estandartes de tecido com cores e texturas que só ganham vida quando vestidos pelo corpo de alguém em movimento e dança). Na década de 1970, Cildo Meireles realiza as *Inserções em Circuitos Ideológicos* (cédulas de dinheiro e garrafas de Coca-Cola carimbadas com mensagens políticas contra a ditadura militar)."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico de prova sobre a Semana de 1922: achar que Tarsila do Amaral expôs na Semana de Arte Moderna de 1922 no Teatro Municipal. Tarsila NÃO participou do evento de 1922 porque estava em Paris estudando pintura acadêmica e de vanguarda; ela aderiu ao movimento logo após seu retorno ao Brasil, formando o célebre 'Grupo dos Cinco' (com Anita Malfatti, Oswald de Andrade, Mário de Andrade e Menotti Del Picchia) e criando o quadro-símbolo *Abaporu* em 1928."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Análise Iconográfica do 'Abaporu' e o Conceito de Antropofagia",
      enunciado: "Em 1928, Tarsila do Amaral pintou a tela *Abaporu* para presentear seu marido Oswald de Andrade. Descreva os principais elementos iconográficos da obra (as proporções anatômicas e o cenário) e explique como ela inspirou o Manifesto Antropofágico.",
      resolucao_passo_a_passo: "1. Descrição iconográfica:\n- A tela apresenta uma figura humana solitária e nua sentada sobre uma planície verde, sob um céu azul vibrante e ao lado de um cacto exuberante com um sol amarelo radiante.\n- A anatomia é intencionalmente desproporcional: pés e mãos gigantescos e pesados ancorados na terra, enquanto a cabeça é minúscula e desprovida de traços fisionômicos detalhados.\n\n2. Significado simbólico e inspiração antropofágica:\n- A hipertrofia dos pés e pernas simboliza a ligação enraizada com o solo, a materialidade, a força do trabalho e a terra brasileira, contrastando com a pequenez da cabeça (crítica ao intelectualismo cerebral e abstrato europeu).\n- Impressionado com a força telúrica da imagem, Oswald batizou a tela em tupi-guarani como 'Aba-poru' (aba = homem; poru = que come carne humana: 'o homem que come gente').\n- Essa figura inspirou a metáfora do Manifesto Antropofágico: assim como o ritual canibal tupinambá deglutia o inimigo valente para absorver suas qualidades, a arte modernista brasileira não deveria rejeitar a técnica ocidental europeia nem copiá-la cegamente, mas devorá-la criticamente, degluti-la e refundi-la na rica matriz cultural nacional."
    }
  },
  questoes: [
    // Bloco 1: Fundamentos (1 a 5)
    {
      id: "ART_HIS_01",
      origem: "ENEM",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Renascimento: Perspectiva Linear e Proporção",
      tipo: "fechada",
      enunciado: "O Renascimento cultural europeu dos séculos XV e XVI promoveu uma profunda revolução nas artes visuais. A principal inovação técnica desenvolvida por mestres renascentistas para criar a ilusão de tridimensionalidade e profundidade realista em superfícies planas foi:",
      alternativas: [
        { letra: "A", texto: "A pintura com aerógrafo industrial movido a eletricidade." },
        { letra: "B", texto: "A perspectiva linear geométrica baseada em um ponto de fuga matemático no horizonte." },
        { letra: "C", texto: "A colagem aleatória de pedras preciosas e areia vulcânica sobre placas de aço." },
        { letra: "D", texto: "O desenho chapado e bidimensional sem qualquer variação de escala ou sombreamento." },
        { letra: "E", texto: "A proibição de representar a figura humana viva nas paredes de catedrais e capelas." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Perspectiva linear no Renascimento",
        porque: "A perspectiva matemática linear (formulada por Brunelleschi e Alberti) permitiu aos pintores renascentistas projetar o espaço tridimensional geométrico de forma verossímil sobre o suporte bidimensional da tela ou afresco."
      }
    },
    {
      id: "ART_HIS_02",
      origem: "UERJ",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Barroco: O Chiaroscuro de Caravaggio",
      tipo: "fechada",
      enunciado: "Na pintura barroca do século XVII, o mestre italiano Caravaggio celebrizou-se pelo emprego magistral do *chiaroscuro* (tenebrismo). Essa técnica artística caracteriza-se por:",
      alternativas: [
        { letra: "A", texto: "Desenhar figuras exclusivamente com contornos brancos luminosos sobre fundos cor-de-rosa pastéis." },
        { letra: "B", texto: "Utilizar contrastes violentos e dramáticos entre áreas de escuridão profunda e focos de luz intensa, ressaltando a emoção e o volume teatral das personagens." },
        { letra: "C", texto: "Misturar pós metálicos fosforescentes para que as telas brilhassem na escuridão dos conventos." },
        { letra: "D", texto: "Pintar apenas paisagens bucólicas e desérticas desprovidas de seres humanos e edifícios." },
        { letra: "E", texto: "Eliminar qualquer gradação de sombra, tornando as pinturas uniformemente iluminadas como gravuras egípcias." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Técnica do chiaroscuro barroco",
        porque: "O chiaroscuro de Caravaggio cria atmosfera de altíssimo impacto dramático e teatral, jogando fachos de luz cortantes sobre as figuras centrais em contraste direto com fundos sombrios e enigmáticos."
      }
    },
    {
      id: "ART_HIS_03",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Fácil",
      topico: "Impressionismo: A Luz Efêmera e a Pintura ao Ar Livre",
      tipo: "fechada",
      enunciado: "O Impressionismo, deflagrado em Paris na década de 1870 por artistas como Claude Monet e Pierre-Auguste Renoir, rompeu com as convenções das academias de belas-artes porque:",
      alternativas: [
        { letra: "A", texto: "Priorizou a cópia fidedigna de episódios bélicos da mitologia grega em estúdios fechados com iluminação de velas." },
        { letra: "B", texto: "Passou a pintar ao ar livre (*en plein air*), buscando registrar as variações fugazes da luz solar sobre os objetos por meio de pinceladas soltas e cores justapostas." },
        { letra: "C", texto: "Aboliu completamente as tintas a óleo e passou a produzir unicamente esculturas cinéticas de gesso e arame farpado." },
        { letra: "D", texto: "Defendeu que as obras de arte deveriam ser destruídas imediatamente após sua primeira exibição em galerias." },
        { letra: "E", texto: "Rejeitou a luz do Sol, optando por representar apenas a vida noturna em minas de carvão abandonadas." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Características fundamentais do Impressionismo",
        porque: "Os impressionistas saíram dos ateliês para capturar a luz cambiante e a atmosfera do instante ao ar livre, usando pinceladas rápidas e justaposição óptica de cores puras sem contornos acadêmicos rígidos."
      }
    },
    {
      id: "ART_HIS_04",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Dadaísmo e os Ready-Mades de Marcel Duchamp",
      tipo: "fechada",
      enunciado: "Em 1917, Marcel Duchamp submeteu a um salão de arte em Nova York uma peça intitulada *A Fonte*, que consistia em um mictório comum de porcelana industrial invertido e assinado sob o pseudônimo 'R. Mutt'. O propósito estético e filosófico dessa atitude dadaísta foi:",
      alternativas: [
        { letra: "A", texto: "Comprovar a alta precisão dos encanamentos hidráulicos nas residências da burguesia novaiorquina." },
        { letra: "B", texto: "Questionar o conceito tradicional de arte, demonstrando que o estatuto artístico decorre da escolha conceitual do artista e do deslocamento do objeto para o espaço da galeria, e não de sua feitura manual artesanal." },
        { letra: "C", texto: "Inaugurar uma fábrica comercial de louças sanitárias para obter lucros industriais rápidos." },
        { letra: "D", texto: "Homenagear os deuses romanos das termas aquáticas através de esculturas figurativas clássicas." },
        { letra: "E", texto: "Restaurar os cânones estéticos do Renascimento italiano que haviam sido deturpados pelos cubistas." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Ready-made e o Dadaísmo",
        porque: "Com o ready-made, Duchamp operou uma revolução ontológica: retirou um objeto manufaturado de seu uso prático ordinário, concedendo-lhe novo significado e forçando o público a refletir sobre o que é arte e a autoridade da instituição museológica."
      }
    },
    {
      id: "ART_HIS_05",
      origem: "UNICAMP",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Surrealismo: O Inconsciente e o Onírico",
      tipo: "fechada",
      enunciado: "Influenciado pelas teorias psicanalíticas de Sigmund Freud acerca do inconsciente e dos sonhos, o Surrealismo (liderado por André Breton, Salvador Dalí e René Magritte) propunha que a arte deveria:",
      alternativas: [
        { letra: "A", texto: "Retratar exclusivamente cálculos geométricos e equações algébricas sem elementos figurativos." },
        { letra: "B", texto: "Libertar a imaginação e a psique da tirania da lógica racionalista e dos freios morais burgueses, revelando o mundo dos sonhos, do delírio e do automatismo psíquico." },
        { letra: "C", texto: "Promover a reprodução fotográfica e documental de assembleias de operários em greve nas ferrovias." },
        { letra: "D", texto: "Voltar a pintar murais religiosos nos tetos de basílicas góticas com o uso obrigatório de folhas de ouro." },
        { letra: "E", texto: "Pintar retratos de ministros de Estado segundo os parâmetros acadêmicos do neoclassicismo." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Conceito de Surrealismo",
        porque: "O Surrealismo busca a 'sur-realidade' (acima da realidade cotidiana): explora os recônditos do inconsciente, o universo onírico e associações livres e ilógicas desprovidas de controle consciente ou censura estética e moral."
      }
    },

    // Bloco 2: Consolidação (6 a 10)
    {
      id: "ART_HIS_06",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Cubismo: Geometrização e Multiperspectiva",
      tipo: "fechada",
      enunciado: "Em *Les Demoiselles d'Avignon* (1907) e no painel pacifista *Guernica* (1937), Pablo Picasso adota os postulados revolucionários do Cubismo. A principal ruptura provocada pelo Cubismo na tradição ocidental de pintura consiste em:",
      alternativas: [
        { letra: "A", texto: "Pintar figuras com acabamento hiper-realista idêntico a fotografias de estúdio em preto e branco." },
        { letra: "B", texto: "Fragmentar as formas em planos geométricos e representar simultaneamente múltiplos ângulos de visão de um mesmo objeto na superfície bidimensional da tela." },
        { letra: "C", texto: "Utilizar apenas tintas transparentes à base de água para que a tela não apresentasse cores visíveis." },
        { letra: "D", texto: "Restringir as pinturas à reprodução de animais marinhos e vegetais silvestres da floresta amazônica." },
        { letra: "E", texto: "Excluir qualquer linha reta ou figura geométrica para pintar apenas círculos perfeitos e concêntricos." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Multiperspectiva cubista",
        porque: "O Cubismo rompe com a perspectiva linear renascentista monoculada: fragmenta os corpos e objetos em facetas geométricas, apresentando frente, perfil e topo concomitantes num mesmo plano visual."
      }
    },
    {
      id: "ART_HIS_07",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Futurismo: A Apologia da Velocidade e da Técnica",
      tipo: "fechada",
      enunciado: "O Manifesto Futurista, redigido pelo poeta italiano Filippo Tommaso Marinetti e publicado em 1909 no jornal francês *Le Figaro*, causou escândalo internacional ao declarar que 'um automóvel de corrida é mais belo que a Vitória de Samotrácia'. Esse ideário futurista expressava:",
      alternativas: [
        { letra: "A", texto: "Uma profunda devoção às ruínas do Império Romano e a exigência de preservação de museus e bibliotecas antigas." },
        { letra: "B", texto: "O fascínio cego pela velocidade, dinamismo das máquinas industriais, tecnologia moderna e agressividade bélica, pregando a destruição radical das instituições de guarda do passado." },
        { letra: "C", texto: "A defesa do pacifismo internacional irrestrito e o desarmamento de todas as potências militares europeias." },
        { letra: "D", texto: "O retorno aos ideais pastorais medievais e o abandono de motores a combustão interna." },
        { letra: "E", texto: "A obrigatoriedade de pintar ícones religiosos em conventos franciscanos desprovidos de janelas." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Manifesto Futurista de Marinetti",
        porque: "O Futurismo cultuava a velocidade, as engrenagens, os aviões, a violência e a modernidade tecnológica, propondo a destruição de museus e bibliotecas para libertar a Itália do peso conservador do passado (ideário que mais tarde flertou com o fascismo)."
      }
    },
    {
      id: "ART_HIS_08",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "A Semana de Arte Moderna de 1922: Ruptura com o Passadismo",
      tipo: "fechada",
      enunciado: "A Semana de Arte Moderna, realizada em fevereiro de 1922 no Teatro Municipal de São Paulo, é considerada o marco inaugural do Modernismo brasileiro. O objetivo essencial dos intelectuais e artistas que articularam o evento foi:",
      alternativas: [
        { letra: "A", texto: "Celebrar a vitória eleitoral do café com leite e reforçar a dependência estética aos modelos acadêmicos de Portugal." },
        { letra: "B", texto: "Romper com o passadismo acadêmico parnasiano e o apego servil a modelos europeus obsoletos, propondo uma renovação estética sintonizada com as vanguardas e com a identidade brasileira." },
        { letra: "C", texto: "Expulsar todos os compositores clássicos do país para permitir que apenas marchas militares fossem executadas no teatro." },
        { letra: "D", texto: "Impedir a publicação de poemas que utilizassem linguagem cotidiana ou versos livres." },
        { letra: "E", texto: "Exigir que todos os quadros retratassem exclusivamente paisagens bucólicas da corte monárquica imperial." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Propósito da Semana de 1922",
        porque: "A Semana de 22 buscou o abrasileiramento da arte: libertar a literatura e as artes plásticas das amarras rígidas do academicismo e parnasianismo, absorvendo a liberdade formal das vanguardas para expressar a brasilidade real."
      }
    },
    {
      id: "ART_HIS_09",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Oswald de Andrade e o Movimento Antropofágico",
      tipo: "fechada",
      enunciado: "No *Manifesto Antropófago* (1928), Oswald de Andrade cunhou a célebre divisa: 'Tupi or not tupi: that is the question'. A metáfora do canibalismo antropofágico formulada pelos modernistas propunha que a cultura brasileira deveria:",
      alternativas: [
        { letra: "A", texto: "Isolar-se completamente do resto do mundo, rejeitando qualquer livro, filme ou invenção produzida fora das fronteiras nacionais." },
        { letra: "B", texto: "Devorar criticamente a cultura, ciência e técnicas estrangeiras, assimilando-as e refundindo-as na matriz cultural brasileira para produzir uma arte original e autônoma." },
        { letra: "C", texto: "Adotar o inglês como língua oficial nas escolas públicas para acelerar a submissão aos Estados Unidos." },
        { letra: "D", texto: "Restabelecer rituais de sacrifício humano em praça pública como prática pedagógica obrigatória." },
        { letra: "E", texto: "Copiar fielmente os manuais de gramática lusitana sem permitir gírias ou brasileirismos nos textos literários." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Metáfora da Antropofagia cultural",
        porque: "A antropofagia cultural oswaldiana não é xenofobia nem submissão colonial: é a 'deglutição crítica' do que o estrangeiro tem de inovador, transformando essa matéria-prima através da rica identidade miscigenada e telúrica brasileira."
      }
    },
    {
      id: "ART_HIS_10",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Portinari e o Modernismo Social da Década de 1930",
      tipo: "fechada",
      enunciado: "Na década de 1930 e 1940, o modernismo brasileiro amadureceu uma vertente de engajamento social vigorosa, exemplificada pela obra de Candido Portinari em telas como *Os Retirantes* (1944) e *Criança Morta*. A linguagem plástica utilizada por Portinari nessas obras destaca-se por:",
      alternativas: [
        { letra: "A", texto: "O uso de cores festivas e douradas para celebrar a opulência dos grandes banquetes da oligarquia cafeeira." },
        { letra: "B", texto: "Figuras humanas esquálidas e monumentalizadas com traços expressionistas vigorosos, mãos e pés calosos e paleta terrosa dramática, denunciando o flagelo da seca e a tragédia da miséria humana." },
        { letra: "C", texto: "Colagens futuristas de automóveis velozes que atropelam camponeses no interior da Paraíba." },
        { letra: "D", texto: "Telas abstratas geométricas desprovidas de qualquer figuração de sofrimento ou drama social." },
        { letra: "E", texto: "Pinturas de anjos barrocos barrocos alados em tetos de palácios governamentais do Rio de Janeiro." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Portinari e a denúncia social em Os Retirantes",
        porque: "Portinari combina a solidez construtiva com a carga dramática expressionista: as figuras macilentas dos retirantes nordestinos expressam o martírio da seca e da exclusão social com profunda dignidade monumental."
      }
    },

    // Bloco 3: Aprofundamento e Excelência (11 a 15)
    {
      id: "ART_HIS_11",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Barroco Brasileiro: Aleijadinho e o Ciclo do Ouro em Minas",
      tipo: "fechada",
      enunciado: "O conjunto dos Doze Profetas esculpidos em pedra-sabão no adro do Santuário de Bom Jesus de Matosinhos, em Congonhas (MG), esculpido por Antônio Francisco Lisboa (o Aleijadinho) entre 1800 e 1805, representa o zênite do Barroco colonial brasileiro. A singularidade artística desse conjunto reside no fato de que:",
      alternativas: [
        { letra: "A", texto: "As estátuas são cópias literais moldadas em gesso trazidas prontas em navios da corte de Lisboa." },
        { letra: "B", texto: "As esculturas apresentam gestualidade dramática individualizada, panejamento dinâmico e integração cenográfica com a paisagem das montanhas, manifestando traços físicos e fisionômicos locais que mesclam o sacro barroco à expressividade popular." },
        { letra: "C", texto: "As estátuas foram concebidas para glorificar a vitória do exército colonial português sobre os inconfidentes mineiros." },
        { letra: "D", texto: "O artista utilizou concreto armado pré-fabricado importado da revolução industrial inglesa." },
        { letra: "E", texto: "As figuras foram talhadas em estilo estritamente neoclássico rígido e estático sem qualquer sensação de movimento." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Os Profetas de Congonhas e Aleijadinho",
        porque: "A genialidade de Aleijadinho manifesta-se no arranjo cenográfico e na força expressiva das figuras bíblicas, que dialogam com o relevo montanhoso mineiro com traços mestiços e dinamismo gestual vigoroso."
      }
    },
    {
      id: "ART_HIS_12",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Neoconcretismo: Os Bichos de Lygia Clark",
      tipo: "fechada",
      enunciado: "No final da década de 1950, o movimento Neoconcreto no Rio de Janeiro rompeu com o racionalismo ortogonal estrito dos concretistas paulistas. As célebres esculturas da série *Bichos* (1960), criadas por Lygia Clark, são construídas com placas geométricas de alumínio articuladas por dobradiças. A inovação crucial dessa obra na história da arte contemporânea consiste em:",
      alternativas: [
        { letra: "A", texto: "Exigir que o observador jamais toque no metal para não oxidar a matéria-prima industrial." },
        { letra: "B", texto: "Transformar o antigo espectador passivo em participante ativo ('propositor-participante'), cuja ação física de manipular e dobrar as placas determina a forma efêmera e contínua da escultura." },
        { letra: "C", texto: "Emitir ruídos eletrônicos computadorizados gravados de animais silvestres do cerrado." },
        { letra: "D", texto: "Representar fielmente a anatomia de mamíferos marinhos em tamanho natural." },
        { letra: "E", texto: "Serem vendidas obrigatoriamente desmontadas para servirem como bandejas de cozinha." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Os Bichos de Lygia Clark e a participação do espectador",
        porque: "Lygia Clark desconstrói o pedestal e o objeto de arte intocável. O 'Bicho' não possui forma definitiva única: ele só existe no diálogo cinético e tátil quando o participante o toca e desdobra suas articulações no tempo e no espaço."
      }
    },
    {
      id: "ART_HIS_13",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Hélio Oiticica: Os Parangolés e a Arte Ambiental",
      tipo: "fechada",
      enunciado: "Em meados dos anos 1960, Hélio Oiticica criou os *Parangolés*, que consistiam em capas, estandartes e tendas confeccionados com panos coloridos, tecidos transparentes, cordas e plásticos, concebidos a partir de sua convivência e aprendizado na Escola de Samba Estação Primeira de Mangueira. Para Oiticica, o *Parangolé* só se consuma como obra quando:",
      alternativas: [
        { letra: "A", texto: "Permanece rigidamente esticado e emoldurado sob vidro temperado na parede de um museu suíço." },
        { letra: "B", texto: "É vestido por um corpo humano que se move, dança e cria relações sensoriais de cor, ritmo e espaço no ato performático livre." },
        { letra: "C", texto: "É leiloado nas bolsas financeiras de Londres por cifras milionárias em moedas fortes." },
        { letra: "D", texto: "É incinerado por autoridades sanitárias como medida de controle epidemiológico." },
        { letra: "E", texto: "Serve exclusivamente como uniforme padronizado e obrigatório em desfiles de infantaria armada." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Parangolés de Hélio Oiticica",
        porque: "O Parangolé é uma 'cor em movimento': não é roupa nem quadro tradicional, mas uma estrutura ambiental vivencial que só atinge sua plenitude quando vestida por um corpo que dança e se desdobra livremente no espaço público."
      }
    },
    {
      id: "ART_HIS_14",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Cildo Meireles: Inserções em Circuitos Ideológicos",
      tipo: "fechada",
      enunciado: "Durante os 'anos de chumbo' da Ditadura Militar no Brasil (década de 1970), o artista plástico Cildo Meireles concebeu o projeto *Inserções em Circuitos Ideológicos*. Uma das ações consistia em estampar sobre garrafas retornáveis de Coca-Cola mensagens como 'Yankees go home' ou instruções de preparo de coquetéis Molotov, devolvendo as garrafas para circulação comercial no mercado. O objetivo conceitual dessa proposta artística foi:",
      alternativas: [
        { letra: "A", texto: "Estimular o consumo maciço de refrigerantes industrializados nas escolas públicas." },
        { letra: "B", texto: "Infiltrar discursos críticos contra o imperialismo e o autoritarismo nos circuitos anônimos de consumo de massa, subvertendo a lógica comercial e transformando a própria circulação da mercadoria em veículo de guerrilha cultural e resistência política." },
        { letra: "C", texto: "Patentear um novo rótulo publicitário para multinacionais de bebidas açucaradas." },
        { letra: "D", texto: "Provar que as embalagens de vidro eram ineficientes para o transporte interestadual de líquidos." },
        { letra: "E", texto: "Destruir os armazéns comerciais da cidade para impedir o abastecimento da população urbana." }
      ],
      resposta: "B",
      gabarito: {
        letra: "B",
        ancora: "Inserções em Circuitos Ideológicos de Cildo Meireles",
        porque: "Cildo Meireles usa o próprio circuito institucional e mercantil existente para veicular mensagens libertárias e clandestinas contra a censura da ditadura, descentralizando a arte para além dos muros vigiados do museu."
      }
    },
    {
      id: "ART_HIS_15",
      origem: "FUVEST / UNICAMP - Discursiva",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Exposição de Anita Malfatti em 1917 e o Estopim da Semana de 22",
      tipo: "aberta",
      enunciado: "Em dezembro de 1917, a pintora Anita Malfatti inaugurou em São Paulo a 'Exposição de Pintura Moderna', exibindo telas revolucionárias como *O Homem Amarelo* e *A Boba*, influenciadas pelo Expressionismo e Cubismo que estudara na Alemanha e nos Estados Unidos. Dias depois, o prestigiado escritor Monteiro Lobato publicou no jornal *O Estado de S. Paulo* o violento artigo intitulado 'Paranoia ou Mistificação?', desferindo duras críticas às obras da artista.\n\nCom base nesse célebre episódio histórico da cultura brasileira:\na) Explique por que a estética das telas de Anita Malfatti escandalizou o público conservador e motivou a reação enfurecida de Monteiro Lobato.\nb) Explique de que maneira a repercussão pública desse artigo atuou como elemento catalisador decisivo para a união dos jovens modernistas e para a realização da Semana de Arte Moderna de 1922.",
      resposta: "a) Anita usava cores antinaturais, distorções anatômicas e pinceladas carregadas expressionistas, contrariando a cópia fotográfica acadêmica defendida por Lobato; b) O ataque uniu jovens artistas revoltados (Oswald, Mário, Menotti) em solidariedade a Anita, precipitando a organização conjunta que culminou na Semana de 22.",
      gabarito: {
        letra: "A",
        ancora: "Anita Malfatti e o artigo de Monteiro Lobato",
        espera_se: "a) O candidato deve explicar que as telas de Anita Malfatti apresentavam rupturas radicais com o academicismo figurativo: pinceladas vigorosas, distorção anatômica deliberada e o uso expressionista de cores antinaturais (rostos esverdeados, sombras violetas e fundos febris como em *O Homem Amarelo* e *A Mulher de Cabelos Verdes*). Para Monteiro Lobato, apegado ao realismo mimético e ao nacionalismo caboclo tradicional, tal estética não passava de loucura mórbida ('paranoia') ou picaretagem comercial ('mistificação'), comparando os modernistas a internos de manicômios que deformavam a figura humana.\nb) O candidato deve esclarecer que o violento ataque público de Monteiro Lobato provocou o cancelamento de compras de quadros e o isolamento de Anita, mas gerou imediata revolta e sentimento de solidariedade entre intelectuais e artistas inquietos da época (como Oswald de Andrade, Mário de Andrade, Menotti Del Picchia e Victor Brecheret). Esse grupo cerrou fileiras em defesa de Anita Malfatti e da liberdade da arte moderna contra o conservadorismo parnasiano. Essa união em torno do debate estético amadureceu os laços e projetos coletivos que desaguaram, cinco anos depois, na organização e execução da histórica Semana de Arte Moderna de 1922 no Teatro Municipal de São Paulo."
      }
    }
  ]
};

// -------------------------------------------------------------
// EXECUÇÃO DO LOTE 10
// -------------------------------------------------------------
console.log("Iniciando escrita do Lote 10 (Inglês e Artes)...");
salvar("Ingles/Leitura_e_Gramatica/Questoes_Reading_Comprehension_Grammar_ENEM_FUVEST.json", ingLeitura);
salvar("Ingles/Militares_e_IME_ITA/Questoes_Advanced_English_IME_ITA_EsPCEx.json", ingMilitares);
salvar("Artes/Historia_da_Arte_e_Modernismo/Questoes_Arte_Classica_Vanguardas_e_Brasil.json", artHistoria);
console.log("--- LOTE 10 (INGLÊS E ARTES) CONCLUÍDO COM SUCESSO ---");
