const fs = require('fs');
const path = require('path');

const BASE_DIR = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';

function salvar(subpath, dados) {
  const p = path.join(BASE_DIR, subpath);
  fs.writeFileSync(p, JSON.stringify(dados, null, 2), 'utf-8');
  console.log(`Atualizado: ${subpath} com ${dados.questoes.length} questões.`);
}

// -------------------------------------------------------------
// 1. LÍNGUA PORTUGUESA - ANOS INICIAIS (2º AO 5º ANO EF)
// -------------------------------------------------------------
const lpAnosIniciais = {
  disciplina: "Lingua Portuguesa",
  modulo: "Leitura_e_Alfabetizacao_2ao5ano",
  subpasta: "Anos_Iniciais_2to5EF",
  arquivo_origem: "Questoes_Leitura_e_Alfabetizacao_2ao5ano.json",
  benchmark_didatico: {
    capitulo: "Alfabetização, Consciência Fonológica, Ortografia e Compreensão Leitora Inicial",
    objetivos_aprendizagem: [
      "Desenvolver a consciência fonêmica e a correspondência grafema-fonema em palavras de estruturas silábicas canônicas e não canônicas.",
      "Identificar e empregar corretamente regras ortográficas contextuais e arbitrárias (M antes de P e B, R/RR, S/SS, Ç, ÇA/ÇO/ÇU, C/QU, G/GU).",
      "Reconhecer classes de palavras elementares: substantivos (próprios e comuns), adjetivos (qualificadores), artigos e verbos de ação.",
      "Localizar informações explícitas e inferir sentidos em gêneros textuais infantis (fábulas, cantigas, tirinhas, bilhetes, receitas e poemas visuais)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Consciência Fonológica e Relações Fonema-Grafema",
          definicao: "A alfabetização plena consolida o princípio alfabético: as letras representam sons da fala (fonemas). A consciência fonológica abrange rimas, aliterações, contagem e manipulação de sílabas. Na ortografia da língua portuguesa, existem relações biunívocas regulares (como P, B, T, D, F, V) e relações contextuais regradas (usa-se 'M' antes de 'P' e 'B', e 'N' antes das demais consoantes; usa-se 'RR' e 'SS' entre vogais para representar sons fortes /R/ e /S/). Não se inicia palavra na língua portuguesa com 'RR' nem com 'SS' nem com 'Ç'."
        },
        {
          termo: "Classes Gramaticais Básicas e Concordância",
          definicao: "Substantivo: nomeia seres, objetos, sentimentos, lugares (comum: menino, cidade; próprio: Pedro, Curitiba - com inicial maiúscula). Adjetivo: expressa qualidade, estado ou característica do substantivo (menino inteligente, flor perfumada). Artigo: antecede o substantivo definindo-o (o, a, os, as) ou indefindo-o (um, uma, uns, umas). Verbo: expressa ação, estado ou fenômeno da natureza situado no tempo (passado, presente, futuro). A concordância nominal elementar exige harmonia de gênero (masculino/feminino) e número (singular/plural): 'A menina estudiosa' / 'As meninas estudiosas'."
        },
        {
          termo: "Gêneros Textuais Iniciais e Pontuação Expressiva",
          definicao: "Os textos organizam-se em gêneros com finalidades comunicativas claras: Bilhete (mensagem curta de aviso ou afeto); Receita culinária (instrucional: título, ingredientes e modo de preparo); Fábula (narrativa com animais personificados e moral explícita); Poema (estruturado em versos e estrofes, com ritmo e rimas). A pontuação orienta a expressividade e a entonação: ponto final (.) encerra afirmações; ponto de interrogação (?) sinaliza perguntas diretas; ponto de exclamação (!) expressa surpresa, entusiasmo ou ordem; travessão (-) introduz a fala direta das personagens."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente nos anos iniciais: usar 'M' no final de sílaba antes de consoantes diversas de P e B (ex.: escrever 'canto' com M em vez de N). Outro ponto crítico é confundir a terminação verbal '-am' (passado/pretérito: 'eles comeram ontem') com a terminação tônica '-ão' (futuro: 'eles comerão amanhã')."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Regra de M e N e Ortografia Contextual",
      enunciado: "Complete as lacunas das seguintes palavras com M ou N e justifique a regra ortográfica aplicada: ca___po, ci___to, ta___bor, ve___to.",
      resolucao_passo_a_passo: "1. Análise da consoante que sucede a lacuna:\n- ca[M]po: a letra seguinte é 'P'. Pela regra ortográfica, antes de 'P' e 'B' usa-se exclusivamente a letra 'M'.\n- ci[N]to: a letra seguinte é 'T'. Não sendo 'P' nem 'B', usa-se a letra 'N'.\n- ta[M]bor: a letra seguinte é 'B'. Pela regra ortográfica, antes de 'P' e 'B' usa-se exclusivamente a letra 'M'.\n- ve[N]to: a letra seguinte é 'T'. Não sendo 'P' nem 'B', usa-se a letra 'N'.\n2. Palavras grafadas: campo, cinto, tambor, vento."
    }
  },
  questoes: [
    {
      id: "LP_AI_01",
      origem: "SAEB / Prova Brasil - 5º Ano EF",
      ano_escolar: "3º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Ortografia Regular: M antes de P e B",
      tipo: "fechada",
      enunciado: "Assinale a alternativa em que todas as palavras estão grafadas corretamente de acordo com a regra do uso de M antes de P e B:",
      alternativas: [
        { letra: "A", texto: "Lâmpada, bombom, tambor, tempestade." },
        { letra: "B", texto: "Lânpada, bonbom, tambor, tempestade." },
        { letra: "C", texto: "Lâmpada, bombon, tanbor, tempestade." },
        { letra: "D", texto: "Lâmpada, bombom, tambor, tenpestade." },
        { letra: "E", texto: "Lânpada, bonbom, tanbor, tenpestade." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Antes das letras P e B deve-se empregar rigorosamente a consoante M; antes das demais consoantes (como T, D, C, etc.), emprega-se a letra N.",
        porque: "Em 'lâmpada' (M antes de P), 'bombom' (M antes de B e M final), 'tambor' (M antes de B) e 'tempestade' (M antes de P). Todas atendem estritamente à norma."
      }
    },
    {
      id: "LP_AI_02",
      origem: "Avaliação Municipal de Aprendizagem",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Classes de Palavras: Substantivo Próprio e Comum",
      tipo: "fechada",
      enunciado: "Leia a frase: 'Mariana viajou para Curitiba nas férias com seu cachorro Pipoca.' As palavras destacadas 'Mariana', 'Curitiba' e 'Pipoca' pertencem a qual classe gramatical?",
      alternativas: [
        { letra: "A", texto: "Substantivos próprios, pois nomeiam pessoa, cidade e animal específico, sendo grafados com letra inicial maiúscula." },
        { letra: "B", texto: "Adjetivos, pois indicam características dos animais." },
        { letra: "C", texto: "Verbos, pois indicam ações no passado." },
        { letra: "D", texto: "Substantivos comuns no gênero feminino." },
        { letra: "E", texto: "Pronomes de tratamento cerimonioso." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Substantivos próprios individualizam seres particulares de uma espécie (nomes de pessoas, lugares geográficos e animais de estimação).",
        porque: "Mariana (nome próprio de pessoa), Curitiba (nome próprio de município) e Pipoca (nome próprio individual atribuído ao cachorro)."
      }
    },
    {
      id: "LP_AI_03",
      origem: "SAEB - 5º Ano EF",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Localização de Informação Explícita e Sentido Global",
      tipo: "fechada",
      enunciado: "Leia a fábula 'A Cigarra e a Formiga': 'A cigarra passou todo o verão cantando, enquanto a formiga juntava seus grãos no formigueiro. Quando o inverno chegou, a cigarra, faminta e tremendo de frio, bateu à porta da formiga pedindo abrigo e comida. A formiga então lhe perguntou: — E o que você fez durante todo o calor? — Eu cantei! — respondeu a cigarra. — Pois agora dance! — retrucou a formiga fechando a porta.' O ensinamento moral dessa fábula evidencia que:",
      alternativas: [
        { letra: "A", texto: "É necessário trabalhar com previdência e planejar o futuro para não passar necessidades nos momentos difíceis." },
        { letra: "B", texto: "Cantar é a atividade mais produtiva para a sobrevivência animal." },
        { letra: "C", texto: "A formiga deveria ter abandonado seu abrigo para acompanhar a cantoria." },
        { letra: "D", texto: "O inverno nunca chega para quem é preguiçoso." },
        { letra: "E", texto: "As cigarras acumulam mais comida do que os formigueiros." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A moral clássica da fábula esópica valoriza a diligência, o esforço previdente e o trabalho antecipado frente à futilidade desatenta.",
        porque: "O texto contrapõe a atitude previdente da formiga ao comportamento inconsequente da cigarra, ensinando a importância da dedicação ao trabalho para a segurança futura."
      }
    },
    {
      id: "LP_AI_04",
      origem: "Olimpíada de Língua Portuguesa - Fase Escolar",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Pontuação Expressiva: Travessão, Exclamação e Aspas",
      tipo: "fechada",
      enunciado: "No trecho narrativo: 'O menino olhou para a árvore centenária e exclamou: — Que ninho maravilhoso!', o uso do travessão (—) e do ponto de exclamação (!) indicam, respectivamente:",
      alternativas: [
        { letra: "A", texto: "O início da fala direta da personagem e uma entonação de admiração e entusiasmo." },
        { letra: "B", texto: "A explicação do narrador e uma dúvida sem resposta." },
        { letra: "C", texto: "Uma citação estrangeira e o encerramento neutro da narrativa." },
        { letra: "D", texto: "A fala em voz baixa e a interrupção súbita do pensamento." },
        { letra: "E", texto: "Uma enumeração de objetos e uma negação enfática." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O travessão introduz o discurso direto das personagens em diálogos narrativos. O ponto de exclamação demarca emoções intensas como encanto, admiração ou espanto.",
        porque: "Os dois-pontos anunciam a fala e o travessão abre a fala do menino; a exclamação final materializa seu deslumbramento com a beleza do ninho."
      }
    },
    {
      id: "LP_AI_05",
      origem: "SAEB - 5º Ano EF",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Flexão Verbal de Tempo: Pretérito (-am) vs Futuro (-ão)",
      tipo: "fechada",
      enunciado: "Considere as frases:\nI. Ontem, os alunos ______________ (chegar) cedo para a feira de ciências.\nII. Amanhã, os professores ______________ (entregar) as medalhas aos vencedores.\nAs formas verbais que preenchem corretamente as lacunas, de acordo com o tempo dos acontecimentos, são:",
      alternativas: [
        { letra: "A", texto: "chegaram / entregarão" },
        { letra: "B", texto: "chegarão / entregaram" },
        { letra: "C", texto: "chegaram / entregaram" },
        { letra: "D", texto: "chegarão / entregarão" },
        { letra: "E", texto: "chegavam / entregarim" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Verbos na 3ª pessoa do plural: pretérito perfeito termina em '-am' (paroxítona); futuro do presente termina em '-ão' (oxítona tônica nasal).",
        porque: "'Ontem' refere-se ao passado perfeito concluído ('chegaram'); 'amanhã' refere-se a evento futuro ('entregarão')."
      }
    },
    {
      id: "LP_AI_06",
      origem: "Colégio Militar - 6º Ano EF",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Acentuação Gráfica: Monossílabos Tônicos e Oxítonas",
      tipo: "fechada",
      enunciado: "Assinale o grupo em que todas as palavras são acentuadas graficamente pela mesma regra das palavras 'café' e 'sofá':",
      alternativas: [
        { letra: "A", texto: "Jacaré, cipó, maracujá, vatapá." },
        { letra: "B", texto: "Pé, pá, nó, três." },
        { letra: "C", texto: "Lâmpada, médico, árvore, pêssego." },
        { letra: "D", texto: "Vírus, táxi, lápis, júri." },
        { letra: "E", texto: "Fácil, útil, amável, fóssil." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Regra das oxítonas: acentuam-se as palavras oxítonas terminadas em -a(s), -e(s), -o(s), -em, -ens.",
        porque: "Jacaré (-e), cipó (-o), maracujá (-a) e vatapá (-a) são todas oxítonas terminadas em vogais abertas/fechadas tônicas, idêntico a 'café' e 'sofá'. (A opção B traz monossílabos tônicos; C traz proparoxítonas; D e E trazem paroxítonas)."
      }
    },
    {
      id: "LP_AI_07",
      origem: "SAEB - 5º Ano EF",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Sinônimos, Antônimos e Coesão Textual",
      tipo: "fechada",
      enunciado: "No trecho: 'Aquele velho casarão parecia deserto e sombrio; no entanto, o jardim que o cercava era radiante e acolhedor.' Os termos destacados 'deserto e sombrio' e 'radiante e acolhedor' estabelecem no texto uma relação de:",
      alternativas: [
        { letra: "A", texto: "Antítese / oposição de sentidos (antônimos contextuais), reforçada pelo conectivo 'no entanto'." },
        { letra: "B", texto: "Sinonímia perfeita e repetição enfática de ideias." },
        { letra: "C", texto: "Causa e efeito imediato." },
        { letra: "D", texto: "Comparação de igualdade de características." },
        { letra: "E", texto: "Conclusão cronológica de ações narrativas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A conjunção adversativa 'no entanto' introduz contraste entre a escuridão abandonada da casa e a luminosidade convidativa do jardim.",
        porque: "Os pares de adjetivos expressam sensações antagônicas e contrastantes intencionalmente articuladas pelo narrador."
      }
    },
    {
      id: "LP_AI_08",
      origem: "Colégio Pedro II",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Divisão Silábica e Encontros Vocálicos: Ditongo vs Hiato",
      tipo: "fechada",
      enunciado: "Na língua portuguesa, as palavras 'peixe', 'saúde' e 'uruguai' contêm, respectivamente, os seguintes encontros vocálicos:",
      alternativas: [
        { letra: "A", texto: "Ditongo decrescente oral, hiato e tritongo." },
        { letra: "B", texto: "Hiato, ditongo crescente e ditongo decrescente." },
        { letra: "C", texto: "Tritongo, hiato e ditongo." },
        { letra: "D", texto: "Ditongo crescente, dígrafo e hiato." },
        { letra: "E", texto: "Hiato em todas as três palavras." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Divisão silábica: pei-xe (vogal + semivogal na mesma sílaba = ditongo decrescente); sa-ú-de (duas vogais em sílabas vizinhas separadas = hiato); u-ru-guai (semivogal + vogal + semivogal na mesma sílaba = tritongo).",
        porque: "Em 'pei-xe', o encontro 'ei' não se separa; em 'sa-ú-de', o 'u' tônico fica isolado formando sílaba própria; em 'u-ru-guai', o encontro 'uai' permanece unido na última sílaba."
      }
    },
    {
      id: "LP_AI_09",
      origem: "Prova Paraná - 5º Ano EF",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Linguagem Figurada: Sentido Próprio e Figurado",
      tipo: "fechada",
      enunciado: "Em qual das alternativas a palavra 'ouro' está empregada em sentido figurado (conotativo)?",
      alternativas: [
        { letra: "A", texto: "O conselho sincero daquele professor valia ouro para o menino." },
        { letra: "B", texto: "A aliança de casamento foi confeccionada em ouro dezoito quilates." },
        { letra: "C", texto: "A mineradora encontrou uma pepita de ouro maciço no riacho." },
        { letra: "D", texto: "O dente foi restaurado com uma pequena liga de ouro e prata." },
        { letra: "E", texto: "O cofre continha várias barras de ouro guardadas pelo banco." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Sentido figurado (conotação) atribui significado expressivo, metafórico e não literal às palavras.",
        porque: "Na opção A, 'valia ouro' significa que o conselho era de extremo valor moral e sabedoria, e não que era composto pelo metal precioso mineral."
      }
    },
    {
      id: "LP_AI_10",
      origem: "SAEB - 5º Ano EF",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Pronomes Pessoais e Mecanismos de Coesão Referencial",
      tipo: "fechada",
      enunciado: "Leia o trecho: 'Lucas comprou uma bicicleta nova para ir à escola. Ele cuidava muito bem dela, limpando suas rodas todos os fins de semana.' No texto, os pronomes 'Ele' e 'dela' substituem, respectivamente, quais substantivos anteriormente citados?",
      alternativas: [
        { letra: "A", texto: "Lucas e bicicleta." },
        { letra: "B", texto: "Escola e rodas." },
        { letra: "C", texto: "Bicicleta e Lucas." },
        { letra: "D", texto: "Lucas e escola." },
        { letra: "E", texto: "Professor e turma." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Pronomes anafóricos retomam termos anteriores na cadeia textual para evitar repetições vocabulares desnecessárias.",
        porque: "'Ele' retoma o sujeito masculino 'Lucas'; 'dela' (de + ela) retoma o objeto feminino 'bicicleta'."
      }
    },
    {
      id: "LP_AI_11",
      origem: "Colégio Militar de Brasília",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Dígrafos vs Encontros Consonantais",
      tipo: "fechada",
      enunciado: "Dígrafo ocorre quando duas letras representam um único fonema acústico. Assinale a opção na qual todas as palavras contêm dígrafo:",
      alternativas: [
        { letra: "A", texto: "Chuva, palhaço, ninho, pássaro, carro." },
        { letra: "B", texto: "Prato, pedra, flor, bloco, trem." },
        { letra: "C", texto: "Gato, pato, rato, bicho, sapo." },
        { letra: "D", texto: "Escola, caderno, estojo, régua, lápis." },
        { letra: "E", texto: "Sol, mar, céu, lua, estrela." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Dígrafos consonantais clássicos: ch, lh, nh, ss, rr, sc, sç, xc, gu/qu (antes de e/i sem emitir o u).",
        porque: "Chuva (ch), palhaço (lh), ninho (nh), pássaro (ss), carro (rr). Na opção B todos são encontros consonantais (duas letras e dois sons articulados distintamente)."
      }
    },
    {
      id: "LP_AI_12",
      origem: "Colégio de Aplicação UFRJ",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Graus do Substantivo: Aumentativo e Diminutivo Irregulares",
      tipo: "fechada",
      enunciado: "Assinale a alternativa que apresenta corretamente o diminutivo erudito de 'casa' e o aumentativo sintético erudito de 'muro':",
      alternativas: [
        { letra: "A", texto: "Casébria (ou casebre) e muralha." },
        { letra: "B", texto: "Casinha e murão." },
        { letra: "C", texto: "Casita e murote." },
        { letra: "D", texto: "Casinhola e murzão." },
        { letra: "E", texto: "Casona e mureta." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Formas sintéticas eruditas consagradas na gramática normativa da língua portuguesa.",
        porque: "Casebre é forma diminutiva (frequentemente depreciativa); muralha é o aumentativo sintético erudito de muro."
      }
    },
    {
      id: "LP_AI_13",
      origem: "Olimpíada de Língua Portuguesa",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Gênero Poético e Rimas Ricas e Pobres",
      tipo: "aberta",
      enunciado: "Leia a estrofe poética:\n'No meio da floresta escura e bela,\nA coruja vigiava da janela,\nEnquanto a lua cheia prateada\nIluminava toda a passarada.'\n(a) Identifique os dois pares de palavras que rimam nessa estrofe. (b) Explique por que a rima entre 'bela' e 'janela' é classificada pela teoria literária como uma rima rica.",
      resposta: "(a) bela/janela e prateada/passarada; (b) É rima rica porque rima palavras pertencentes a classes gramaticais diferentes (adjetivo e substantivo).",
      gabarito: {
        letra: "Aberta",
        ancora: "Rima pobre ocorre entre palavras da mesma classe gramatical; rima rica ocorre entre classes gramaticais distintas.",
        espera_se: "(a) Pares de rimas: 'bela' rima com 'janela' (rimas emparelhadas AABB); 'prateada' rima com 'passarada'.\n(b) Classificação: 'Bela' é um adjetivo (qualificador) e 'janela' é um substantivo comum concreto. Quando duas palavras que rimam pertencem a classes morfológicas distintas, o poeta atinge um efeito estético mais elaborado e criativo, denominado formalmente de rima rica."
      }
    },
    {
      id: "LP_AI_14",
      origem: "Avaliação Formativa - Apoio Escolar",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Ortografia: Mal com L vs Mau com U",
      tipo: "aberta",
      enunciado: "Reescreva as duas frases abaixo substituindo as lacunas por 'mal' ou 'mau', aplicando a regra prática de substituição pelos antônimos 'bem' ou 'bom':\nFrase 1: 'O lobo __________ da história foi surpreendido pelos caçadores.'\nFrase 2: 'O menino dormiu __________ durante a tempestade e acordou cansado.'",
      resposta: "Frase 1: mau (antônimo de bom); Frase 2: mal (antônimo de bem).",
      gabarito: {
        letra: "Aberta",
        ancora: "Regra mnemônica universal: Mau é o oposto de Bom (adjetivo); Mal é o oposto de Bem (advérbio ou substantivo).",
        espera_se: "Frase 1: 'O lobo mau da história...' Justificativa: opõe-se a 'lobo bom' (mau qualifica o substantivo lobo, sendo um adjetivo com U).\nFrase 2: 'O menino dormiu mal...' Justificativa: opõe-se a 'dormiu bem' (mal modifica o verbo dormir indicando o modo como a ação foi desempenhada, sendo um advérbio de modo com L)."
      }
    },
    {
      id: "LP_AI_15",
      origem: "Colégio Militar - 6º Ano EF",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Interpretação e Inferência de Humor e Ironia",
      tipo: "aberta",
      enunciado: "Em uma tirinha infantil, uma personagem olha para o boletim escolar cheio de notas baixas e diz para o pai: 'Pai, o professor disse que sou um aluno muito consistente!' O pai responde surpreso: 'Consistente em quê, filho?' O menino conclui: 'Consistente em nunca acertar nenhuma questão!' Explique o recurso linguístico que gera o humor e a quebra de expectativa na resposta final da personagem.",
      resposta: "Quebra da expectativa positiva do termo 'consistente' pelo sentido irônico de consistência no fracasso contínuo.",
      gabarito: {
        letra: "Aberta",
        ancora: "O humor decorre da polissemia e da quebra de expectativa pragmática entre o elogio aparente e a revelação cômica.",
        espera_se: "No contexto pedagógico, o adjetivo 'consistente' geralmente denota elogio, indicando regularidade, firmeza e bom desempenho sustentado. O pai cria a expectativa de que o filho recebeu um elogio acadêmico. O efeito cômico de humor decorre da súbita quebra dessa expectativa no último quadrinho, quando o menino revela com inocência e autoironia que a sua 'consistência' reside exatamente na regularidade infalível de tirar notas baixas e errar tudo, subvertendo o sentido elogioso original."
      }
    }
  ]
};

// -------------------------------------------------------------
// 2. LÍNGUA PORTUGUESA - ANOS FINAIS (6º AO 9º ANO EF)
// -------------------------------------------------------------
const lpAnosFinais = {
  disciplina: "Lingua Portuguesa",
  modulo: "Compreensao_e_Gramatica_6ao9ano",
  subpasta: "Anos_Finais_6to9EF",
  arquivo_origem: "Questoes_Compreensao_e_Gramatica_6ao9ano.json",
  benchmark_didatico: {
    capitulo: "Morfossintaxe Fundamental, Estrutura da Oração e Leitura Crítica nos Anos Finais",
    objetivos_aprendizagem: [
      "Identificar os termos essenciais da oração (sujeito e predicado) e classificar os tipos de sujeito (simples, composto, oculto/desinencial, indeterminado e oração sem sujeito).",
      "Diferenciar os termos integrantes (objeto direto, objeto indireto, complemento nominal e agente da passiva) e acessórios (adjunto adnominal, adjunto adverbial e aposto/vocativo).",
      "Analisar o período composto por coordenação (sindéticas aditivas, adversativas, alternativas, conclusivas e explicativas) e subordinação substantiva e adverbial básica.",
      "Compreender a regência verbal e nominal padrão e dominar as regras fundamentais de crase."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Termos Essenciais da Oração e Predicação Verbal",
          definicao: "O Sujeito é o termo sobre o qual se faz uma declaração e com o qual o verbo concorda em número e pessoa. Classifica-se em: Simples (um só núcleo), Composto (dois ou mais núcleos), Oculto/Desinencial/Elíptico (identificável pela terminação verbal), Indeterminado (verbo na 3ª p. plural sem referente contextual anterior, ou verbo transitivo indireto/intransitivo + partícula 'se' índice de indeterminação do sujeito) e Inexistente/Oração sem sujeito (verbos impessoais: haver no sentido de existir/ocorrer, fazer indicando tempo decorrido e verbos de fenômenos meteorológicos, todos conjugados obrigatoriamente na 3ª p. singular). O Predicado pode ser Verbal (núcleo é verbo significativo), Nominal (verbo de ligação + predicativo do sujeito) ou Verbo-Nominal (verbo de ação + predicativo)."
        },
        {
          termo: "Termos Integrantes e Acessórios da Oração",
          definicao: "Transitividade verbal: Verbo Transitivo Direto (VTD) exige Objeto Direto (sem preposição obrigatória); Verbo Transitivo Indireto (VTI) exige Objeto Indireto (regido por preposição obrigatória). Complemento Nominal: completa o sentido de substantivos abstratos, adjetivos ou advérbios, sendo sempre preposicionado. Diferença crucial entre Adjunto Adnominal e Complemento Nominal: o adjunto adnominal pratica a ação (sentido ativo) ou indica posse/qualidade de substantivos concretos ou abstratos; o complemento nominal sofre a ação (sentido passivo) sobre substantivos abstratos transitivos."
        },
        {
          termo: "Crase e Regência na Norma-Padrão",
          definicao: "A crase (assinalada pelo acento grave `) é a fusão/contração da preposição 'a' exigida por um regente com o artigo feminino 'a(s)' ou pronomes demonstrativos (aquele, aquela, aquilo). Regras práticas fundamentais: (1) Substitui-se a palavra feminina seguinte por um termo masculino equivalente; se surgir 'ao', há crase (ex.: 'Fui à feira' → 'Fui ao mercado'); (2) Diante de verbos, pronomes pessoais e palavras masculinas, NUNCA ocorre crase; (3) Casos facultativos: diante de pronomes possessivos femininos singulares ('à minha mãe' ou 'a minha mãe'), nomes próprios femininos familiares e após a preposição 'até'."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico nos anos finais: pluralizar o verbo 'haver' quando empregado no sentido de existir. É gramaticalmente errôneo escrever 'Houveram muitos problemas'; a norma culta impõe estritamente 'Houve muitos problemas', pois o verbo é impessoal e a oração é sem sujeito (o termo 'muitos problemas' atua como objeto direto)."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Oração sem Sujeito com Verbo Haver e Fazer",
      enunciado: "Reescreva a frase corrigindo a concordância verbal de acordo com a norma-padrão culta da língua portuguesa: 'Fazem três anos que haviam várias vagas abertas naquela empresa.' Justifique a correção.",
      resolucao_passo_a_passo: "1. Análise do verbo 'fazer': O verbo 'fazer' indicando transcurso de tempo cronológico é impessoal, não possuindo sujeito. Portanto, não admite flexão de plural, devendo permanecer na 3ª pessoa do singular: 'Faz três anos'.\n2. Análise do verbo 'haver': O verbo 'haver' no sentido semântico de 'existir' é igualmente impessoal. Ele não concorda com o substantivo que o sucede (que é seu objeto direto), devendo permanecer rigorosamente na 3ª pessoa do singular: 'havia várias vagas'.\n3. Frase corrigida: 'Faz três anos que havia várias vagas abertas naquela empresa.'\n4. Fundamentação gramatical: Verbos impessoais não possuem sujeito sintático e transmitem sua impessoalidade até mesmo para locuções verbais auxiliares."
    }
  },
  questoes: [
    {
      id: "LP_AF_01",
      origem: "SAEB - 9º Ano EF",
      ano_escolar: "7º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Tipos de Sujeito: Sujeito Indeterminado vs Inexistente",
      tipo: "fechada",
      enunciado: "Assinale a alternativa que contém uma Oração Sem Sujeito (sujeito inexistente):",
      alternativas: [
        { letra: "A", texto: "Havia centenas de pessoas protestando em frente à prefeitura." },
        { letra: "B", texto: "Bateram à porta durante a madrugada chuvosa." },
        { letra: "C", texto: "Vive-se muito bem no interior do estado." },
        { letra: "D", texto: "Compraram-se livros raros naquele sebo." },
        { letra: "E", texto: "Caminhamos pela orla ao entardecer." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O verbo 'haver' no sentido de existir ou ocorrer é impessoal, formando orações sem sujeito.",
        porque: "Em B e C os sujeitos são indeterminados (verbo na 3ª plural sem referente e verbo intransitivo + índice 'se'). Em D a oração é passiva sintética com sujeito paciente ('livros raros'). Em E o sujeito é oculto/desinencial ('nós'). Apenas A é oração sem sujeito."
      }
    },
    {
      id: "LP_AF_02",
      origem: "Colégio Pedro II",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Transitividade Verbal e Complementos (OD e OI)",
      tipo: "fechada",
      enunciado: "Na oração: 'O voluntário entregou os donativos às famílias atingidas pela enchente', os termos destacados 'os donativos' e 'às famílias atingidas' funcionam sintaticamente, respectivamente, como:",
      alternativas: [
        { letra: "A", texto: "Objeto direto e objeto indireto." },
        { letra: "B", texto: "Objeto indireto e objeto direto." },
        { letra: "C", texto: "Sujeito paciente e agente da passiva." },
        { letra: "D", texto: "Adjunto adnominal e complemento nominal." },
        { letra: "E", texto: "Ambos são objetos diretos preposicionados." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O verbo 'entregar' é transitivo direto e indireto (VTDI: quem entrega, entrega algo a alguém).",
        porque: "'Os donativos' completa o sentido do verbo sem preposição (objeto direto); 'às famílias' completa com a preposição obrigatória 'a' contraída com o artigo 'as' (objeto indireto)."
      }
    },
    {
      id: "LP_AF_03",
      origem: "Colégio Militar",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Uso da Crase na Norma Culta",
      tipo: "fechada",
      enunciado: "Assinale a frase em que o acento indicativo de crase foi empregado com estrita correção gramatical:",
      alternativas: [
        { letra: "A", texto: "O cientista dedicou sua vida à pesquisa sobre a cura de doenças raras." },
        { letra: "B", texto: "Os ciclistas começaram à pedalar assim que a chuva cessou." },
        { letra: "C", texto: "O diretor entregou o relatório à um funcionário recém-admitido." },
        { letra: "D", texto: "Eles viajaram à pé pela trilha da serra." },
        { letra: "E", texto: "Ela expressou simpatia à todos os presentes no plenário." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Dedicar algo 'a' (preposição) + 'a' pesquisa (artigo feminino) = à pesquisa. (Substituindo por termo masculino: 'dedicou sua vida ao estudo').",
        porque: "Nas outras alternativas a crase é proibida: antes de verbo ('pedalar' em B), antes de artigo indefinido ('um' em C), antes de palavra masculina ('pé' em D) e antes de pronome indefinido ('todos' em E)."
      }
    },
    {
      id: "LP_AF_04",
      origem: "IFSP / IFs Técnicos",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Vozes Verbais: Ativa, Passiva Analítica e Sintética",
      tipo: "fechada",
      enunciado: "Ao transpor a oração de voz ativa 'O vento forte destruiu as barracas do acampamento' para a voz passiva analítica, a forma verbal e a estrutura resultante correta é:",
      alternativas: [
        { letra: "A", texto: "'As barracas do acampamento foram destruídas pelo vento forte.'" },
        { letra: "B", texto: "'As barracas do acampamento serão destruídas pelo vento forte.'" },
        { letra: "C", texto: "'Destruíram-se as barracas do acampamento ontem.'" },
        { letra: "D", texto: "'O vento forte foi destruindo as barracas do acampamento.'" },
        { letra: "E", texto: "'Houve a destruição das barracas pelo vento forte.'" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Regra de conversão para a voz passiva: o objeto direto torna-se sujeito paciente; o verbo principal vai para o particípio acompanhado do verbo auxiliar 'ser' no mesmo tempo do verbo original (pretérito perfeito do indicativo: 'foram destruídas'); o sujeito ativo torna-se agente da passiva.",
        porque: "'Destruiu' está no pretérito perfeito do indicativo; logo, o auxiliar 'ser' deve ficar no pretérito perfeito concordando no plural com 'as barracas': 'foram destruídas pelo vento forte'."
      }
    },
    {
      id: "LP_AF_05",
      origem: "SAEB - 9º Ano EF",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Orações Coordenadas Sindéticas: Relações Lógico-Discursivas",
      tipo: "fechada",
      enunciado: "No período composto: 'O atleta treinou exaustivamente durante todo o ano, contudo não obteve a pontuação mínima para a classificação olímpica', a oração introduzida pelo conectivo destacado expressa ideia de:",
      alternativas: [
        { letra: "A", texto: "Adversidade / oposição / contraste em relação à oração anterior." },
        { letra: "B", texto: "Conclusão lógica irrevogável." },
        { letra: "C", texto: "Causa determinante do resultado." },
        { letra: "D", texto: "Condição indispensável para a vitória." },
        { letra: "E", texto: "Alternância ou exclusão de opções." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A conjunção 'contudo' (assim como porém, todavia, entretanto, no entanto) é coordenativa adversativa.",
        porque: "Estabelece um choque de expectativa entre o empenho hercúleo do treino e a ausência decepcionante da vaga olímpica."
      }
    },
    {
      id: "LP_AF_06",
      origem: "Colégio Naval",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Diferença entre Complemento Nominal e Adjunto Adnominal",
      tipo: "fechada",
      enunciado: "Considere os termos preposicionados destacados nas duas orações:\nI. 'A crítica do jornalista irritou o elenco da peça teatral.'\nII. 'A crítica ao jornalista foi publicada no editorial de domingo.'\nSintaticamente, os termos 'do jornalista' e 'ao jornalista' desempenham, respectivamente, as funções de:",
      alternativas: [
        { letra: "A", texto: "Adjunto adnominal (sentido ativo: o jornalista fez a crítica) e Complemento nominal (sentido passivo: o jornalista recebeu a crítica)." },
        { letra: "B", texto: "Ambos são complementos nominais de substantivos abstratos." },
        { letra: "C", texto: "Ambos são adjuntos adnominais restritivos." },
        { letra: "D", texto: "Complemento nominal e adjunto adnominal inversamente." },
        { letra: "E", texto: "Objeto indireto e complemento nominal." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Quando o termo preposicionado ligado a substantivo abstrato possui valor de agente ativo da ação expressa pelo nome, é Adjunto Adnominal. Quando possui valor paciente/alvo da ação, é Complemento Nominal.",
        porque: "Em I, o jornalista pratica a crítica (agente ativo = adjunto adnominal). Em II, o jornalista é o alvo/paciente criticado por terceiros (paciente passivo = complemento nominal)."
      }
    },
    {
      id: "LP_AF_07",
      origem: "IFs Técnicos",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Figuras de Linguagem: Metáfora, Metonímia, Pleonasmo e Antítese",
      tipo: "fechada",
      enunciado: "Associe as frases às respectivas figuras de linguagem:\n(1) 'Ele devorou Machado de Assis durante as férias escolares.'\n(2) 'Seus olhos eram dois faróis iluminando a escuridão da noite.'\n(3) 'O dia amanheceu triste e choroso com a tempestade de verão.'\n(4) 'O silêncio ensurdecedor tomou conta da plateia boquiaberta.'",
      alternativas: [
        { letra: "A", texto: "1-Metonímia, 2-Metáfora, 3-Prosopopeia/Personificação, 4-Oxímoro/Paradoxo." },
        { letra: "B", texto: "1-Metáfora, 2-Metonímia, 3-Hipérbole, 4-Eufemismo." },
        { letra: "C", texto: "1-Sinestesia, 2-Comparação, 3-Ironia, 4-Antítese." },
        { letra: "D", texto: "1-Metonímia, 2-Metonímia, 3-Metáfora, 4-Pleonasmo." },
        { letra: "E", texto: "1-Pleonasmo, 2-Catacrese, 3-Antítese, 4-Anáfora." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "(1) Autor pela obra (metonímia); (2) Comparação implícita sem conectivo (metáfora); (3) Atribuição de sentimentos humanos a seres inanimados (prosopopeia); (4) Fusão de ideias mutuamente excludentes (paradoxo/oxímoro).",
        porque: "A classificação contempla as figuras de pensamento, tropos e estilo fundamentais na interpretação de textos."
      }
    },
    {
      id: "LP_AF_08",
      origem: "Colégio Militar",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Regência Verbal: Assistir, Visar, Aspirar e Esquecer",
      tipo: "fechada",
      enunciado: "De acordo com a norma-padrão da língua portuguesa, assinale a opção inteiramente correta quanto à regência verbal:",
      alternativas: [
        { letra: "A", texto: "O jovem aspirava a um cargo público de prestígio e visava ao aprimoramento da carreira." },
        { letra: "B", texto: "Nós assistimos o filme clássico no cinema restaurado do centro." },
        { letra: "C", texto: "O candidato aspira o cargo mais alto da administração federal." },
        { letra: "D", texto: "Esqueci do livro de literatura na biblioteca da escola." },
        { letra: "E", texto: "Ele obedeceu o regulamento interno sem reclamar." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Aspirar (no sentido de desejar/almejar) e Visar (no sentido de ter por objetivo) são transitivos indiretos e regem a preposição 'a'.",
        porque: "Em B, 'assistir' no sentido de ver exige 'ao filme'; em C, 'aspirar' no sentido de almejar exige 'ao cargo'; em D, 'esquecer' sem pronome não admite preposição ('Esqueci o livro' ou 'Esqueci-me do livro'); em E, 'obedecer' exige 'ao regulamento'."
      }
    },
    {
      id: "LP_AF_09",
      origem: "EPCAR / Colégio Naval",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Funções da Partícula 'SE': Apassivadora vs Índice de Indeterminação",
      tipo: "fechada",
      enunciado: "Classifique sintaticamente a partícula 'se' nas duas orações:\nI. 'Alugam-se apartamentos mobiliados na praia.'\nII. 'Precisa-se de técnicos especializados em informática.'",
      alternativas: [
        { letra: "A", texto: "Partícula apassivadora (ou pronome apassivador) em I; e índice de indeterminação do sujeito em II." },
        { letra: "B", texto: "Ambas funcionam como partículas apassivadoras de verbos transitivos." },
        { letra: "C", texto: "Ambas funcionam como índices de indeterminação do sujeito." },
        { letra: "D", texto: "Pronome reflexivo em I e conjunção condicional em II." },
        { letra: "E", texto: "Parte integrante do verbo em I e partícula de realce em II." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "VTD + se = voz passiva sintética (o termo sem preposição é o sujeito paciente que flexiona o verbo no plural: 'Apartamentos são alugados'). VTI + se = sujeito indeterminado (verbo obrigatoriamente na 3ª p. singular acompanhado de preposição).",
        porque: "Em I, 'apartamentos mobiliados' é o sujeito paciente. Em II, 'de técnicos especializados' é objeto indireto preposicionado, tornando o sujeito formalmente indeterminado."
      }
    },
    {
      id: "LP_AF_10",
      origem: "SAEB - 9º Ano EF",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Colocação Pronominal: Próclise, Ênclise e Mesóclise",
      tipo: "fechada",
      enunciado: "Assinale a alternativa que desrespeita as normas de colocação pronominal culta vigentes na língua portuguesa escrita formal:",
      alternativas: [
        { letra: "A", texto: "Me entregaram a encomenda de livros com bastante atraso." },
        { letra: "B", texto: "Não se esqueça de revisar os exercícios antes da prova final." },
        { letra: "C", texto: "Dir-se-ia que todas as esperanças haviam desvanecido." },
        { letra: "D", texto: "Em se tratando de regras gramaticais, o aluno era brilhante." },
        { letra: "E", texto: "Entregaram-me os documentos assinados pela diretoria." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Na norma-padrão escrita, é proibido iniciar orações com pronomes oblíquos átonos (próclise proibida no início absoluto de período).",
        porque: "A forma culta exigida em A é a ênclise: 'Entregaram-me a encomenda...'. Em B há próclise obrigatória atraída pela palavra negativa 'não'; em C há mesóclise com futuro do pretérito no início de oração; em D há próclise obrigatória na locução 'em se tratando'."
      }
    },
    {
      id: "LP_AF_11",
      origem: "Colégio Militar do Rio de Janeiro",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Orações Subordinadas Substantivas e Função Sintática do 'QUE'",
      tipo: "fechada",
      enunciado: "No período: 'É fundamental que todos os alunos compreendam as diretrizes de segurança', a oração introduzida pela conjunção integrante 'que' exerce em relação à oração principal a função sintática de:",
      alternativas: [
        { letra: "A", texto: "Sujeito (Oração Subordinada Substantiva Subjetiva)." },
        { letra: "B", texto: "Objeto direto da oração principal." },
        { letra: "C", texto: "Predicativo do sujeito." },
        { letra: "D", texto: "Complemento nominal do adjetivo fundamental." },
        { letra: "E", texto: "Aposto explicativo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Estrutura clássica: Verbo de ligação + Predicativo + Oração Subjetiva: 'Isto é fundamental' (onde 'Isto' é o sujeito).",
        porque: "A oração principal 'É fundamental' não possui sujeito próprio em seu interior; o que 'é fundamental' é justamente a oração inteira subordinada ('que todos os alunos compreendam as diretrizes'), que desempenha a função de sujeito oracional."
      }
    },
    {
      id: "LP_AF_12",
      origem: "Colégio Naval",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Concordância Verbal Especial com Expressões Partitivas e Porcentagem",
      tipo: "fechada",
      enunciado: "Assinale a alternativa que apresenta erro de concordância verbal de acordo com os preceitos gramaticais normativos:",
      alternativas: [
        { letra: "A", texto: "Mais de um manifestante agrediram-se mutuamente na praça central." },
        { letra: "B", texto: "A maioria dos cidadãos votaram com consciência cívica." },
        { letra: "C", texto: "Cerca de vinte candidatos faltou à prova eliminatória do concurso." },
        { letra: "D", texto: "Fui eu quem redigiu o relatório final da comissão." },
        { letra: "E", texto: "Fomos nós que assumimos a responsabilidade do projeto." }
      ],
      resposta: "C",
      gabarito: {
        letra: "C",
        ancora: "Com a locução aproximativa 'cerca de / mais de / menos de', o verbo concorda obrigatoriamente com o numeral que a sucede.",
        porque: "Como o numeral é 'vinte' (plural), o verbo deve ficar obrigatoriamente no plural: 'Cerca de vinte candidatos faltaram...'. (Na opção A, 'mais de um' com reciprocidade verbal vai legitimamente para o plural; em B, expressões partitivas aceitam dupla concordância; D e E com 'quem' e 'que' estão perfeitas)."
      }
    },
    {
      id: "LP_AF_13",
      origem: "Olimpíada de Língua Portuguesa",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Ambiguidade Sintática e Pontuação",
      tipo: "aberta",
      enunciado: "A frase 'O delegado prendeu o suspeito em sua casa' apresenta ambiguidade estrutural clássica. (a) Aponte os dois sentidos interpretativos possíveis gerados pelo pronome possessivo 'sua'. (b) Reescreva a frase de duas maneiras distintas eliminando qualquer margem de ambiguidade em cada um dos sentidos identificados.",
      resposta: "(a) A casa pode pertencer ao delegado ou ao suspeito; (b) Reescrever usando 'na casa deste' ou 'na própria residência do delegado'.",
      gabarito: {
        letra: "Aberta",
        ancora: "A ambiguidade decorre do duplo referente anafórico potencial do pronome possessivo de 3ª pessoa 'sua'.",
        espera_se: "(a) Duplo sentido: O leitor não pode determinar com certeza se a prisão foi efetuada na residência do próprio delegado ou na residência do suspeito detido.\n(b) Reescrever sem ambiguidade:\n- Sentido 1 (casa do suspeito): 'O delegado prendeu o suspeito na casa deste.' (ou '...na residência do acusado').\n- Sentido 2 (casa do delegado): 'O delegado, em sua própria casa, prendeu o suspeito.' (ou 'Em sua própria residência, o delegado efetuou a prisão do suspeito')."
      }
    },
    {
      id: "LP_AF_14",
      origem: "Colégio de Aplicação UFRJ",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Valores Semânticos do 'COMO' (Conformativo, Causal e Comparativo)",
      tipo: "aberta",
      enunciado: "Identifique o valor semântico e classifique a oração subordinada introduzida pela palavra 'COMO' em cada um dos períodos:\nI. 'Como estivesse com febre alta, o jovem não compareceu à cerimônia.'\nII. 'Ele agiu exatamente como seu mestre havia recomendado.'\nIII. 'Aquele garoto nadava rápido como um golfinho no oceano.'",
      resposta: "I. Causal (porque/já que); II. Conformativa (conforme/segundo); III. Comparativa (tal qual).",
      gabarito: {
        letra: "Aberta",
        ancora: "A conjunção 'como' é polissêmica e assume papéis causais, conformativos ou comparativos conforme o contexto oracional.",
        espera_se: "I. Oração subordinada adverbial causal (expressa a causa/motivo pelo qual faltou à cerimônia; equivale a 'Já que estava com febre...').\nII. Oração subordinada adverbial conformativa (expressa conformidade/acordo com o modelo estabelecido; equivale a '...conforme seu mestre havia recomendado').\nIII. Oração subordinada adverbial comparativa (estabelece uma comparação analógica de velocidade entre o nadador e o golfinho; equivale a '...do mesmo modo que um golfinho nada')."
      }
    },
    {
      id: "LP_AF_15",
      origem: "Colégio Naval / EPCAR",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Pronome Relativo e Regência com Preposição",
      tipo: "aberta",
      enunciado: "Considere as orações independentes:\n(1) 'Aquele é o médico renomado.'\n(2) 'Eu sempre confiei nos diagnósticos daquele médico.'\nJunte as duas orações em um único período composto fluente utilizando adequadamente o pronome relativo 'cujo' (ou suas flexões) devidamente regido por preposição exigida pelo verbo 'confiar', respeitando as exigências da norma culta formal.",
      resposta: "'Aquele é o médico renomado em cujos diagnósticos eu sempre confiei.'",
      gabarito: {
        letra: "Aberta",
        ancora: "O verbo 'confiar' é transitivo indireto e rege a preposição 'em'. O pronome relativo possessivo 'cujo' concorda em gênero e número com a coisa possuída ('diagnósticos', masculino plural), rejeitando qualquer artigo posterior (*em cujos os).",
        espera_se: "Construção culta irretocável: 'Aquele é o médico renomado em cujos diagnósticos eu sempre confiei.' (A preposição 'em' exigida pelo verbo confiar é obrigatoriamente anteposta ao pronome relativo cujo)."
      }
    }
  ]
};

// -------------------------------------------------------------
// 3. LÍNGUA PORTUGUESA - GRAMÁTICA E SINTAXE (MORFOSSINTAXE ENSINO MÉDIO)
// -------------------------------------------------------------
const lpGramaticaSintaxe = {
  disciplina: "Lingua Portuguesa",
  modulo: "Gramatica_e_Sintaxe",
  subpasta: "Sintaxe_e_Morfologia",
  arquivo_origem: "Questoes_Gramatica_e_Sintaxe.json",
  benchmark_didatico: {
    capitulo: "Morfossintaxe Superior: Sintaxe do Período Composto, Concordância Avançada, Regência e Pontuação",
    objetivos_aprendizagem: [
      "Classificar orações coordenadas sindéticas e assindéticas e dominar o repertório completo de orações subordinadas substantivas, adjetivas (restritivas e explicativas) e adverbiais.",
      "Analisar e aplicar as regras avançadas de concordância verbal e nominal (sujeitos compostos antepostos e pospostos, expressões partitivas, porcentagens, verbo ser e haver).",
      "Dominar os princípios estritos de regência verbal e nominal na norma culta e o emprego exaustivo do acento indicativo de crase em casos gerais, proibidos e facultativos.",
      "Compreender a pontuação normativa e estilística (vírgula separando termos deslocados, vírgula antes do 'e', ponto e vírgula e travessões explicativos)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Sintaxe do Período Composto por Subordinação",
          definicao: "Orações Substantivas exercem funções de termos da oração principal e são introduzidas por conjunções integrantes (que, se): Subjetiva, Objetiva Direta, Objetiva Indireta, Completiva Nominal, Predicativa e Apositiva. Orações Adjetivas desempenham papel de adjunto adnominal, introduzidas por pronomes relativos (que, quem, cujo, onde, o qual): Explicativas (isoladas por vírgulas, atribuem propriedade a todo o conjunto) e Restritivas (sem vírgulas, limitam o universo do substantivo antecedente). Orações Adverbiais exercem função de adjunto adverbial da oração principal, dividindo-se em 9 tipos circunstanciais: causais, consecutivas, comparativas, conformativas, concessivas, condicionais, proporcionais, temporais e finais."
        },
        {
          termo: "Concordância Verbal e Nominal Avançada",
          definicao: "Concordância Verbal: Com sujeito composto posposto ao verbo, admite-se a concordância gramatical com todos os núcleos no plural ou a concordância atrativa com o núcleo mais próximo. Com 'um e outro', o verbo vai preferencialmente para o plural; com 'nem um nem outro', para o singular. O verbo 'ser' em orações impessoais concorda com o predicativo (horas, datas e distâncias: 'São duas horas', 'Hoje são vinte de outubro' ou 'Hoje é dia vinte'). Concordância Nominal: 'Anexo', 'incluso', 'quite', 'obrigado', 'mesmo' e 'próprio' concordam em gênero e número com o substantivo a que se referem; 'em anexo' e 'a olhos vistos' são locuções invariáveis. 'Meio' como adjetivo flexiona-se ('meia maçã'), mas como advérbio é invariável ('ela estava meio tonta')."
        },
        {
          termo: "Emprego da Vírgula na Norma Padrão",
          definicao: "É terminantemente proibido usar vírgula entre o sujeito e o verbo da oração, e entre o verbo e seus complementos diretos/indiretos imediatos. A vírgula é obrigatória para: (1) Isolar adjuntos adverbiais deslocados para o início ou meio da oração (se de curta extensão, a vírgula é facultativa); (2) Isolar apostos explicativos e vocativos; (3) Separar orações subordinadas adverbiais antepostas à oração principal; (4) Separar orações coordenadas sindéticas (exceto as aditivas com 'e' de mesmo sujeito); (5) A vírgula antes do 'e' é permitida ou obrigatória quando as orações aditivas possuem sujeitos sintáticos diferentes, ou quando o 'e' possui valor adversativo ('tentou muito, e não conseguiu')."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico no Ensino Médio: colocar vírgula antes de oração adjetiva restritiva. A presença da vírgula transforma radicalmente o sentido da frase de restritivo para explicativo generalizante: 'Os alunos, que estudaram, passaram no vestibular' (todos os alunos estudaram e todos passaram); 'Os alunos que estudaram passaram no vestibular' (apenas a parcela dos alunos que estudou obteve aprovação)."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Mudança Semântica por Presença de Vírgula em Oração Adjetiva",
      enunciado: "Explique a diferença semântica crucial provocada pelo emprego das vírgulas entre as duas sentenças:\nSentença A: 'Os funcionários do hospital que foram vacinados retornaram ao plantão presencial.'\nSentença B: 'Os funcionários do hospital, que foram vacinados, retornaram ao plantão presencial.'",
      resolucao_passo_a_passo: "1. Análise da Sentença A (Sem vírgulas): A oração 'que foram vacinados' é subordinada adjetiva restritiva. Ela restringe e delimita o sujeito: indica que apenas uma fração dos funcionários do hospital tomou a vacina, e exclusivamente essa parcela imunizada retornou ao plantão (os funcionários não vacinados permaneceram afastados).\n2. Análise da Sentença B (Com vírgulas): A oração ', que foram vacinados,' é subordinada adjetiva explicativa. As vírgulas generalizam a característica para a totalidade dos indivíduos do conjunto: significa que a totalidade dos funcionários do hospital foi integralmente vacinada, e portanto todos retornaram ao trabalho presencial.\n3. Conclusão: A vírgula altera profundamente o alcance lógico e numérico do enunciado de uma restrição parcial para uma generalização totalizadora."
    }
  },
  questoes: [
    {
      id: "LP_SIN_01",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Orações Subordinadas Adverbiais: Concessiva vs Causal",
      tipo: "fechada",
      enunciado: "No período: 'Conquanto a crise econômica mundial tenha afetado profundamente as exportações de commodities, as empresas de tecnologia registraram faturamento recorde no último trimestre', o conectivo destacado introduz uma oração subordinada adverbial:",
      alternativas: [
        { letra: "A", texto: "Concessiva, estabelecendo uma relação de quebra de expectativa ou contraste que não impede a realização do fato principal." },
        { letra: "B", texto: "Causal, indicando a razão direta da elevação do faturamento." },
        { letra: "C", texto: "Condicional, impondo um requisito para o sucesso das empresas." },
        { letra: "D", texto: "Conformativa, expressando acordo com as diretrizes do mercado." },
        { letra: "E", texto: "Consecutiva, expressando a consequência extrema da crise." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O conectivo 'conquanto' (sinônimo erudito de 'embora', 'ainda que', 'posto que', 'se bem que') é uma conjunção subordinativa concessiva.",
        porque: "A oração concessiva admite um obstáculo factual real (a crise econômica global) que, contudo, mostra-se incapaz de inviabilizar o desfecho vitorioso da oração principal (faturamento recorde)."
      }
    },
    {
      id: "LP_SIN_02",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Coesão Referencial e Emprego dos Demonstrativos",
      tipo: "fechada",
      enunciado: "No texto argumentativo: 'A preservação da Amazônia e o avanço da agropecuária moderna são dois temas estratégicos para o desenvolvimento sustentável do país. Enquanto ______________ garante a segurança alimentar e o superávit comercial, ______________ assegura a estabilidade climática global e o equilíbrio hídrico continental.' As lacunas são preenchidas com rigor de coesão referencial por:",
      alternativas: [
        { letra: "A", texto: "esta / aquela" },
        { letra: "B", texto: "aquela / esta" },
        { letra: "C", texto: "essa / aquela" },
        { letra: "D", texto: "esta / essa" },
        { letra: "E", texto: "isso / aquilo" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Para retomar dois termos já citados no texto: 'este(a)' retoma o termo citado por último (mais próximo no texto); 'aquele(a)' retoma o termo citado em primeiro lugar (mais distante no texto).",
        porque: "Como 'avanço da agropecuária' foi citado em segundo lugar (mais próximo), retoma-se por 'esta' (que garante superávit). Como 'preservação da Amazônia' foi citada primeiro (mais distante), retoma-se por 'aquela' (que assegura estabilidade climática)."
      }
    },
    {
      id: "LP_SIN_03",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Pontuação Normativa: Vírgula entre Oração Principal e Subordinada",
      tipo: "fechada",
      enunciado: "Assinale a alternativa em que o emprego ou a omissão da vírgula está em pleno acordo com a norma-padrão da língua escrita:",
      alternativas: [
        { letra: "A", texto: "Ainda que as evidências científicas fossem irrefutáveis, muitos indivíduos relutaram em adotar o isolamento preventivo." },
        { letra: "B", texto: "Muitos indivíduos relutaram em adotar, o isolamento preventivo, ainda que as evidências fossem irrefutáveis." },
        { letra: "C", texto: "Os médicos afirmaram veementemente, que a vacina era totalmente segura." },
        { letra: "D", texto: "A pesquisa revelou, índices alarmantes de evasão escolar no ensino médio." },
        { letra: "E", texto: "O diretor da faculdade, convocou uma assembleia geral de professores." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Quando a oração subordinada adverbial (concessiva, no caso) é anteposta à oração principal, o uso da vírgula separando as duas orações é rigorosamente obrigatório.",
        porque: "Nas demais alternativas há vírgulas proibidas: em B separa verbo e objeto; em C separa o verbo da sua oração subordinada substantiva objetiva direta; em D separa verbo de objeto direto; em E separa o sujeito do predicado."
      }
    },
    {
      id: "LP_SIN_04",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Concordância com 'SE' Apassivador e Verbo Transitivo Direto e Indireto",
      tipo: "fechada",
      enunciado: "Assinale a opção em que a concordância verbal foi realizada com estrita obediência à norma culta formal:",
      alternativas: [
        { letra: "A", texto: "Atribuíram-se aos cientistas do instituto importantes descobertas sobre a genética molecular." },
        { letra: "B", texto: "Atribuiu-se aos cientistas do instituto importantes descobertas sobre a genética molecular." },
        { letra: "C", texto: "Houveram sérias divergências entre os membros da comissão julgadora." },
        { letra: "D", texto: "Devem fazer cerca de dez meses que não visito minha terra natal." },
        { letra: "E", texto: "Tratam-se de questões de extrema complexidade jurídica e social." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Na voz passiva sintética com VTD/VTDI acompanhado do pronome apassivador 'se', o termo paciente é o sujeito sintático e comanda a flexão do verbo.",
        porque: "O sujeito paciente é 'importantes descobertas' (termo no plural sem preposição). Portanto, o verbo deve concordar obrigatoriamente no plural: 'Atribuíram-se [...] importantes descobertas' (= Importantes descobertas foram atribuídas aos cientistas). Em C, 'houveram' é erro crasso; em D, o auxiliar do verbo fazer temporal deve ficar no singular ('Deve fazer'); em E, VTI com 'se' fica no singular ('Trata-se de')."
      }
    },
    {
      id: "LP_SIN_05",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Valores Morfossintáticos da Palavra 'QUE'",
      tipo: "fechada",
      enunciado: "Considere as quatro ocorrências da palavra 'QUE' nos excertos a seguir:\n1. 'Diga-me que horas são.'\n2. 'O livro que comprei esgotou rapidamente.'\n3. 'Ela comeu tanto que passou mal.'\n4. 'Temos que trabalhar arduamente.'\nA classificação morfológica e sintática exata da palavra 'que' em cada frase é, respectivamente:",
      alternativas: [
        { letra: "A", texto: "Pronome interrogativo / Pronome relativo / Conjunção subordinativa consecutiva / Preposição acidental." },
        { letra: "B", texto: "Conjunção integrante / Pronome demonstrativo / Conjunção explicativa / Partícula de realce." },
        { letra: "C", texto: "Pronome relativo / Conjunção integrante / Conjunção causal / Advérbio de intensidade." },
        { letra: "D", texto: "Conjunção integrante / Pronome relativo / Conjunção comparativa / Preposição essencial." },
        { letra: "E", texto: "Advérbio / Pronome indefinido / Conjunção final / Interjeição." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Morfologia exaustiva da palavra 'que': pronome adjetivo interrogativo em pergunta indireta; pronome relativo que retoma antecedente; conjunção consecutiva correlacionada ao intensificador 'tanto'; preposição acidental equivalente a 'de' em locução de obrigação ('temos de/que trabalhar').",
        porque: "A correspondência funcional nas quatro frases reflete as multifunções da palavra na morfossintaxe do português."
      }
    },
    {
      id: "LP_SIN_06",
      origem: "UNESP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Concordância Nominal com Adjetivos Pospostos a Múltiplos Substantivos",
      tipo: "fechada",
      enunciado: "De acordo com as regras normativas de concordância nominal, na oração 'O governador visitou o hospital e a creche ______________', a lacuna pode ser preenchida pelas formas:",
      alternativas: [
        { letra: "A", texto: "reformados (concordância gramatical com ambos os substantivos no masculino plural) ou reformada (concordância atrativa com o substantivo feminino mais próximo)." },
        { letra: "B", texto: "reformadas apenas, no feminino plural." },
        { letra: "C", texto: "reformado apenas, no masculino singular." },
        { letra: "D", texto: "em reforma obrigatoriamente sem flexão." },
        { letra: "E", texto: "reformando-se na forma de gerúndio invariável." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Adjetivo posposto a substantivos de gêneros diferentes admite duas concordâncias legítimas: com a totalidade no masculino plural (hospital + creche = reformados) ou por atração com o termo mais próximo (creche = reformada).",
        porque: "Ambas as opções são plenamente abonadas pela tradição gramatical normativa de Cunha & Cintra e Bechara."
      }
    },
    {
      id: "LP_SIN_07",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Classificação Sintática do 'COMO' e Correlação",
      tipo: "fechada",
      enunciado: "Assinale a opção em que a oração destacada possui valor sintático de Oração Subordinada Substantiva Apositiva:",
      alternativas: [
        { letra: "A", texto: "Apenas resta-nos esta esperança: que a humanidade encontre a paz definitiva." },
        { letra: "B", texto: "O general exigiu que os soldados avançassem sob a chuva torrencial." },
        { letra: "C", texto: "A certeza de que venceríamos confortava o pelotão." },
        { letra: "D", texto: "O fato foi que ninguém compareceu à reunião solene." },
        { letra: "E", texto: "Não sei se eles compreenderam a gravidade da situação." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A oração subordinada substantiva apositiva exerce o papel de aposto de um termo antecedente, geralmente precedida por dois-pontos ou travessão.",
        porque: "Em A, a oração 'que a humanidade encontre a paz definitiva' explica e especifica o pronome/substantivo 'esta esperança'. (Em B é objetiva direta; em C é completiva nominal; em D é predicativa; em E é objetiva direta)."
      }
    },
    {
      id: "LP_SIN_08",
      origem: "AFA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Pronome Oblíquo como Sujeito Acusativo de Infinitivo",
      tipo: "fechada",
      enunciado: "Nos verbos causativos (fazer, mandar, deixar) e sensitivos (ver, ouvir, sentir) seguidos de infinitivo, o pronome oblíquo átono pode exercer uma função sintática atípica na língua portuguesa. Na oração 'O comandante mandou-os recuar até a base', o pronome oblíquo 'os' funciona sintaticamente como:",
      alternativas: [
        { letra: "A", texto: "Sujeito acusativo da oração subordinada reduzida de infinitivo ('recuar')." },
        { letra: "B", texto: "Objeto direto do verbo principal 'mandou' exclusivamente." },
        { letra: "C", texto: "Objeto indireto pleonástico de valor reflexivo." },
        { letra: "D", texto: "Adjunto adnominal do substantivo base." },
        { letra: "E", texto: "Predicativo do objeto direto do verbo mandar." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Na tradição filológica e gramatical de Said Ali e Rocha Lima, pronomes oblíquos átonos que precedem infinitivos dependentes de verbos causativos ou sensitivos atuam como sujeitos do infinitivo (sujeito acusativo).",
        porque: "A estrutura equivale a: 'O comandante mandou que eles recuassem'. O pronome 'os' é o sujeito do verbo 'recuar', embora apresente forma morfológica acusativa."
      }
    },
    {
      id: "LP_SIN_09",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Predicativo do Objeto e Verbos Transitivos",
      tipo: "fechada",
      enunciado: "Na oração 'Os jurados consideraram o réu culpado das acusações', o termo 'culpado' classifica-se sintaticamente como:",
      alternativas: [
        { letra: "A", texto: "Predicativo do objeto direto." },
        { letra: "B", texto: "Adjunto adnominal do substantivo réu." },
        { letra: "C", texto: "Predicativo do sujeito." },
        { letra: "D", texto: "Complemento nominal do verbo considerar." },
        { letra: "E", texto: "Objeto direto preposicionado oculto." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Predicativo do objeto é o termo que atribui uma característica, estado ou julgamento transitório ao objeto direto através do verbo de predicação.",
        porque: "'O réu' é o objeto direto; 'culpado' expressa o juízo/atribuição emitido pelos jurados sobre esse objeto no predicado verbo-nominal."
      }
    },
    {
      id: "LP_SIN_10",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Paralelismo Sintático em Textos Dissertativos",
      tipo: "fechada",
      enunciado: "O paralelismo sintático é um princípio de clareza textual que exige simetria na coordenação de estruturas gramaticais idênticas. Assinale a frase que preserva com perfeição o paralelismo sintático:",
      alternativas: [
        { letra: "A", texto: "O projeto de lei visa à redução dos impostos e ao incentivo da produção industrial nacional." },
        { letra: "B", texto: "O projeto de lei visa reduzir os impostos e ao incentivo da produção industrial nacional." },
        { letra: "C", texto: "O diretor exigia pontualidade dos funcionários e que todos usassem crachá." },
        { letra: "D", texto: "Gosto de cinema, leitura e viajar pelo mundo nas férias." },
        { letra: "E", texto: "Ela optou pelo silêncio em vez de responder à pergunta grosseiramente." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Paralelismo sintático simétrico: ambos os complementos regidos pelo verbo visar estão coordenados com idêntica estrutura (preposição 'a' + substantivo: 'à redução...' e 'ao incentivo...').",
        porque: "Nas outras opções há ruptura de paralelismo: em B mistura oração reduzida de infinitivo com substantivo preposicionado; em C mistura substantivo com oração desenvolvida; em D mistura substantivos com verbo no infinitivo."
      }
    },
    {
      id: "LP_SIN_11",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Sintaxe de Concordância com Pronome Relativo 'QUEM' e 'QUE'",
      tipo: "fechada",
      enunciado: "Considere as seguintes construções de concordância verbal com pronomes relativos:\nI. 'Fomos nós quem comprou as passagens aéreas.'\nII. 'Fomos nós quem compramos as passagens aéreas.'\nIII. 'Fomos nós que comprou as passagens aéreas.'\nIV. 'Fomos nós que compramos as passagens aéreas.'\nDe acordo com a norma gramatical padrão estrita, são admitidas como corretas:",
      alternativas: [
        { letra: "A", texto: "I, II e IV apenas." },
        { letra: "B", texto: "I e IV apenas." },
        { letra: "C", texto: "II e IV apenas." },
        { letra: "D", texto: "III e IV apenas." },
        { letra: "E", texto: "Todas as quatro frases." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Com o pronome 'quem': o verbo pode concordar na 3ª pessoa do singular (concordância gramatical com quem: I) ou concordar com o antecedente pessoal (concordância ideológica/atrativa: II). Com o pronome 'que': o verbo concorda OBRIGATORIAMENTE com o antecedente pessoal (IV).",
        porque: "A frase III é inaceitável na norma culta, pois o pronome relativo 'que' transfere obrigatoriamente a pessoa gramatical do antecedente ('nós') para o verbo subordinado ('compramos')."
      }
    },
    {
      id: "LP_SIN_12",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Análise Sintática de Orações Reduzidas com Duplo Sentido",
      tipo: "fechada",
      enunciado: "Na oração 'Ao entrar na sala de reuniões, o presidente cumprimentou cordialmente os diretores presentes', a oração reduzida de infinitivo 'Ao entrar na sala de reuniões' expressa valor circunstancial e classifica-se sintaticamente como:",
      alternativas: [
        { letra: "A", texto: "Oração subordinada adverbial temporal reduzida de infinitivo (equivalente a: 'Quando entrou na sala...')." },
        { letra: "B", texto: "Oração subordinada adverbial causal reduzida de particípio." },
        { letra: "C", texto: "Oração subordinada substantiva subjetiva da oração principal." },
        { letra: "D", texto: "Oração coordenada assindética de valor conclusivo." },
        { letra: "E", texto: "Oração subordinada adjetiva restritiva de gerúndio." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A locução prepositiva temporal 'ao + infinitivo' expressa simultaneidade cronológica ou anterioridade imediata.",
        porque: "Ao desenvolver a oração reduzida: 'Quando o presidente entrou na sala de reuniões, ele cumprimentou...', evidenciando sua natureza estritamente adverbial temporal."
      }
    },
    {
      id: "LP_SIN_13",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Discurso Direto vs Discurso Indireto Livre",
      tipo: "aberta",
      enunciado: "Transponha o seguinte trecho em discurso direto para o discurso indireto formal na 3ª pessoa, efetuando todos os ajustes necessários de tempos verbais, pronomes demonstrativos e advérbios de tempo e espaço:\n'O réu afirmou categoricamente ao magistrado: — Eu não cometi este delito aqui ontem; partirei amanhã para a minha cidade natal.'",
      resposta: "'O réu afirmou categoricamente ao magistrado que ele não cometera (ou não havia cometido) aquele delito ali no dia anterior e que partiria no dia seguinte para a sua cidade natal.'",
      gabarito: {
        letra: "Aberta",
        ancora: "Regras de transposição para discurso indireto: 1ª pessoa vira 3ª; pretérito perfeito vira pretérito mais-que-perfeito; futuro do presente vira futuro do pretérito; 'este' vira 'aquele'; 'aqui' vira 'ali/lá'; 'ontem' vira 'no dia anterior'; 'amanhã' vira 'no dia seguinte'.",
        espera_se: "A resposta deve realizar com precisão todas as transmutações deítico-temporais exigidas pela sintaxe do relato indireto."
      }
    },
    {
      id: "LP_SIN_14",
      origem: "UNICAMP 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Acentuação de Formas Verbais com Pronomes Enclíticos",
      tipo: "aberta",
      enunciado: "Justifique detalhadamente as regras de acentuação gráfica que determinam a grafia dos verbos com pronomes enclíticos nas seguintes palavras:\n(a) fazê-lo;\n(b) pô-lo;\n(c) encontrá-las.",
      resposta: "(a) Oxítona terminada em 'e' seguida de pronome; (b) Monossílabo tônico terminado em 'o' com acento diferencial; (c) Oxítona terminada em 'a'.",
      gabarito: {
        letra: "Aberta",
        ancora: "A acentuação das formas verbais enclíticas analisa a forma verbal isoladamente, desconsiderando o pronome oblíquo como parte da palavra fonológica.",
        espera_se: "(a) 'fazê-lo': deriva do verbo 'fazer' que perde o 'r' final ao associar-se ao pronome 'o' (transformado em 'lo'). A forma verbal remanescente 'fa-zê' é uma palavra oxítona terminada na vogal 'e', exigindo acento circunflexo pela regra geral das oxítonas.\n(b) 'pô-lo': deriva do verbo 'pôr' (que perde o 'r' diante de 'o', gerando 'lo'). A forma 'pô' é um monossílabo tônico fechado terminado em 'o', recebendo acento circunflexo (preservando o acento gráfico do infinitivo 'pôr').\n(c) 'encontrá-las': deriva de 'encontrar' (perde o 'r', gerando 'las'). A forma 'en-con-trá' é oxítona terminada na vogal aberta 'a', recebendo acento agudo obrigatório."
      }
    },
    {
      id: "LP_SIN_15",
      origem: "ITA 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Zeugma, Elipse e Silepse na Construção Literária",
      tipo: "aberta",
      enunciado: "Identifique e classifique com rigor filológico as figuras de sintaxe presentes em cada um dos períodos célebres da literatura brasileira:\nI. 'Na terra, tanta guerra, tanto engano, / Tanta necessidade aborrecida!' (Camões)\nII. 'A igreja era grande e pobre. Os altares, humildes.' (Machado de Assis)\nIII. 'A multidão de torcedores enfurecidos invadiram o gramado após o apito final.'",
      resposta: "I. Elipse (omissão do verbo haver/existir); II. Zeugma (omissão do verbo eram já citado anteriormente); III. Silepse de número (concordância ideológica com o coletivo multidão).",
      gabarito: {
        letra: "Aberta",
        ancora: "Figuras de sintaxe ou de construção baseadas em omissão e concordância ideológica.",
        espera_se: "I. Elipse: omissão implícita do verbo de existência ('Há na terra tanta guerra...'), dedutível pelo contexto sem citação anterior na oração.\nII. Zeugma: omissão de um termo verbal que já foi expressamente mencionado na oração anterior ('Os altares [eram] humildes'), evitando repetição deselegante.\nIII. Silepse de número: concordância ideológica com o sentido implícito da ideia plural ('torcedores') e não com a forma gramatical singular do núcleo sintático 'multidão', que formalmente exigiria verbo no singular ('invadiu')."
      }
    }
  ]
};

// -------------------------------------------------------------
// 4. LÍNGUA PORTUGUESA - INTERPRETAÇÃO DE TEXTO (ENEM E UERJ)
// -------------------------------------------------------------
const lpInterpretacao = {
  disciplina: "Lingua Portuguesa",
  modulo: "Interpretacao_ENEM_UERJ",
  subpasta: "Interpretacao_de_Texto",
  arquivo_origem: "Questoes_Interpretacao_ENEM_UERJ.json",
  benchmark_didatico: {
    capitulo: "Compreensão, Interpretação Textual, Gêneros Discursivos e Argumentação (ENEM e UERJ)",
    objetivos_aprendizagem: [
      "Distinguir com precisão 'compreensão textual' (o que está explicitamente no texto) de 'interpretação textual' (o que se infere a partir do texto).",
      "Identificar teses, argumentos de autoridade, dados estatísticos e estratégias de persuasão em textos dissertativo-argumentativos.",
      "Reconhecer efeitos de sentido provocados por recursos gráficos, polifonia, intertextualidade, ironia e linguagem não-verbal em charges e campanhas publicitárias.",
      "Analisar variações linguísticas (diatópicas, diastráticas, diafásicas e diacrônicas) e valorizar a diversidade sociolinguística contra o preconceito linguístico."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Níveis de Leitura: Decodificação, Compreensão e Inferência",
          definicao: "A leitura proficiente opera em camadas: A Decodificação é o reconhecimento linguístico formal das palavras. A Compreensão textual localiza e parafraseia dados explícitos na superfície textual ('segundo o texto', 'o autor afirma que'). A Interpretação textual exige leitura crítica nas entrelinhas: deduz pressupostos e subentendidos ('infere-se do texto', 'conclui-se que', 'o objetivo comunicativo é'). Os pressupostos decorrem de marcadores linguísticos formais (ex.: 'Ele ainda continua estudando' pressupõe que ele já estudava antes); os subentendidos dependem de inferência pragmática do leitor a partir do contexto discursivo."
        },
        {
          termo: "Gêneros Discursivos e Funções da Linguagem",
          definicao: "Roman Jakobson sistematizou seis funções da linguagem centradas nos elementos da comunicação: Emotiva/Expressiva (centrada no emissor, 1ª pessoa, subjetividade); Conativa/Apelativa (centrada no receptor, verbos no imperativo, persuasão, típica da publicidade); Referencial/Informativa (centrada no referente/contexto, 3ª pessoa, clareza objetiva, jornalística e científica); Metalinguística (centrada no próprio código linguístico, o dicionário que explica a palavra); Fática (centrada no canal, testa o contato: 'Alô?', 'Veja bem'); Poética (centrada na própria mensagem, forma estética, ritmo e sonoridade)."
        },
        {
          termo: "Variação Linguística e Preconceito Linguístico",
          definicao: "A língua é um organismo vivo e heterogêneo. Variação Regional/Geográfica (diatópica: mandioca/aipim/macaxeira, sotaques); Variação Social/Sociocultural (diastrática: jargão profissional de médicos e advogados, gírias etárias urbanas); Variação Situacional (diafásica: registro formal culto vs coloquial informal familiar); Variação Histórica (diacrônica: evolução de 'Vossa Mercê' para 'você'). O preconceito linguístico desqualifica variedades populares estigmatizadas ignorando que todas as variedades linguísticas possuem coerência e gramática interna estruturada."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico no ENEM e vestibulares: extrapolação e intromissão de opinião própria. O candidato deve responder com base EXCLUSIVA no que o texto sustenta ou infere logicamente, e jamais com base em suas convicções pessoais que não encontrem âncora textual nos parágrafos da prova."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Identificação da Tese Central em Artigo de Opinião",
      enunciado: "Em um artigo sobre a inteligência artificial, o autor elenca dados econômicos positivos de produtividade gerados por algoritmos, mas conclui: 'A automação sem freios éticos e sem regulação democrática aprofundará as desigualdades sociais históricas, convertendo o ganho tecnológico em precarização do trabalho humano'. Qual é a tese defendida pelo autor?",
      resolucao_passo_a_passo: "1. Distinção entre argumentos e tese: Os dados econômicos favoráveis apresentados no início são contra-argumentos ou contexto introdutório.\n2. Identificação da posição crítica do autor: A conjunção adversativa 'mas' desloca o foco para o posicionamento real que o articulista assume perante o leitor.\n3. Tese central: O avanço tecnológico da inteligência artificial não pode prescindir de regulação ética e democrática, sob o risco de agravar a injustiça social e precarizar as relações de trabalho.\n4. A tese é a ideia nuclear que o autor defende e para a qual todos os outros parágrafos convergem."
    }
  },
  questoes: [
    {
      id: "LP_INT_01",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Função Conativa/Apelativa em Cartaz Institucional",
      tipo: "fechada",
      enunciado: "Um cartaz de campanha do Ministério da Saúde estampa a foto de uma criança sorridente segurando a caderneta de saúde com o slogan: 'Vacine seu filho contra o sarampo. Não deixe quem você ama desprotegido. Procure o posto de saúde mais próximo até o dia 30!' A função da linguagem predominante nesse cartaz institucional é a:",
      alternativas: [
        { letra: "A", texto: "Conativa (ou apelativa), caracterizada pelo uso de verbos no imperativo com o propósito de persuadir e mobilizar o leitor a adotar um comportamento preventivo." },
        { letra: "B", texto: "Metalinguística, pois discute o significado lexicográfico da palavra vacina." },
        { letra: "C", texto: "Emotiva, pois o texto expressa sentimentos individuais de dor do redator." },
        { letra: "D", texto: "Fática, pois visa apenas testar o canal de comunicação televisiva." },
        { letra: "E", texto: "Poética, focada unicamente no arranjo sonoro de versos rimados." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A função conativa foca no interlocutor/receptor, utilizando pronomes de 2ª/3ª pessoa ('seu filho', 'você') e verbos no imperativo ('vacine', 'não deixe', 'procure') para induzir uma ação concreta.",
        porque: "O objetivo de campanhas públicas de imunização é o convencimento e engajamento ativo da população, marca definidora da função conativa."
      }
    },
    {
      id: "LP_INT_02",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Polifonia e Intertextualidade",
      tipo: "fechada",
      enunciado: "Em uma crônica contemporânea, o autor escreve: 'E no meio do caminho não havia apenas uma pedra; havia um engarrafamento quilométrico, a buzina insana dos ônibus e o relógio cobrando impiedosamente o horário de entrada no trabalho'. O autor dialoga explicitamente com o famoso poema 'No meio do caminho', de Carlos Drummond de Andrade. Esse diálogo entre textos configura um recurso estilístico denominado:",
      alternativas: [
        { letra: "A", texto: "Intertextualidade por paráfrase e paródia, ressignificando o obstáculo existencial drummondiano no contexto caótico da mobilidade urbana moderna." },
        { letra: "B", texto: "Plágio literário desprovido de originalidade." },
        { letra: "C", texto: "Metonímia sintática de inversão de termos." },
        { letra: "D", texto: "Sinestesia sensorial estrita." },
        { letra: "E", texto: "Antítese conceitual entre poesia e prosa." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A intertextualidade ocorre quando um texto absorve, cita, adapta ou parodia elementos de outro texto consagrado preexistente na memória cultural dos leitores.",
        porque: "O cronista convoca o verso célebre de Drummond ('No meio do caminho tinha uma pedra') para metaforizar os tormentos cotidianos do trabalhador urbano atual no trânsito."
      }
    },
    {
      id: "LP_INT_03",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Variação Linguística e Preconceito Linguístico",
      tipo: "fechada",
      enunciado: "Na canção 'Assum Preto', de Luiz Gonzaga e Humberto Teixeira, lê-se: 'Tudo em vorta é só beleza / Sol de Abril e a mata em frô / Mas o Assum Preto, cego dos óio / Não vendo a luz, ai, canta de dor'. A presença de marcas como 'vorta', 'frô' e 'cego dos óio' representa:",
      alternativas: [
        { letra: "A", texto: "Uma legítima variedade linguística regional caipira/nordestina, dotada de coerência fonológica e expressividade estética, adequada ao gênero musical e à identidade cultural da personagem." },
        { letra: "B", texto: "Um erro gramatical grosseiro motivado pelo descaso dos compositores com a norma culta." },
        { letra: "C", texto: "Uma deformação patológica da língua portuguesa que deve ser erradicada da música." },
        { letra: "D", texto: "Um jargão técnico restrito a especialistas em botânica do semiárido." },
        { letra: "E", texto: "Uma tentativa frustrada de imitar a linguagem formal acadêmica." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A sociolinguística reconhece que a variação diatópica reflete a riqueza cultural do povo, possuindo plena legitimidade comunicativa e poética.",
        porque: "Condenar a letra como 'erro' é manifestação de preconceito linguístico; a rotacização ('vorta', 'frô') é um fenômeno fonético histórico documentado desde o português arcaico."
      }
    },
    {
      id: "LP_INT_04",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Inferência e Pressuposto em Editorial Jornalístico",
      tipo: "fechada",
      enunciado: "Em um editorial intitulado 'A urgência do saneamento básico', o jornal afirma: 'A cidade maravilhosa ainda convive com esgotos a céu aberto em centenas de comunidades da Baixada e da periferia'. O termo 'ainda' expressa um pressuposto linguístico de que:",
      alternativas: [
        { letra: "A", texto: "A situação precária já se arrasta há muito tempo e já deveria ter sido solucionada há tempos pelo poder público." },
        { letra: "B", texto: "O problema do esgoto começou recentemente na semana anterior." },
        { letra: "C", texto: "Apenas as capitais desenvolvidas possuem esgoto tratado." },
        { letra: "D", texto: "O poder público não tem qualquer responsabilidade sobre o saneamento." },
        { letra: "E", texto: "O problema nunca terá viabilidade técnica de resolução." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O advérbio de tempo 'ainda' é um marcador de pressuposição que introduz a continuidade de um estado pretérito que já se esperava superado.",
        porque: "Dizer que a cidade 'ainda convive' com esgoto a céu aberto pressupõe uma inadmissível morosidade histórica do Estado em prover serviços essenciais básicos."
      }
    },
    {
      id: "LP_INT_05",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Ironia e Crítica Social em Charge",
      tipo: "fechada",
      enunciado: "Uma charge retrata uma família miserável vivendo debaixo de um viaduto de concreto. O pai segura um jornal e lê para os filhos: 'Aqui diz que todo cidadão brasileiro tem direito constitucional à moradia digna, saúde, educação e lazer'. Um dos filhos pequenos olha para a lona plástica esburacada que lhes serve de teto e pergunta: 'Pai, e onde é que fica esse país aí da notícia?' O efeito de humor e a força crítica da charge residem:",
      alternativas: [
        { letra: "A", texto: "No abismo irônico entre os direitos formalmente garantidos pela Constituição Federal e a dura realidade material de exclusão social vivida pelos moradores de rua." },
        { letra: "B", texto: "Na ingenuidade geográfica do menino que desconhece os estados vizinhos." },
        { letra: "C", texto: "No fato de o jornal divulgar notícias intencionalmente falsas sobre leis revogadas." },
        { letra: "D", texto: "Na recusa deliberada da família em construir sua própria casa de alvenaria." },
        { letra: "E", texto: "Na falta de interesse dos filhos por notícias do caderno de economia." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A ironia da pergunta do menino ('onde fica esse país?') desmascara o fosso intransponível entre a utopia da lei escrita e a desumanidade da vida cotidiana dos desvalidos.",
        porque: "O chargista utiliza a linguagem verbal e não-verbal conjugadas para denunciar a ineficácia social dos direitos fundamentais perante as populações vulneráveis."
      }
    },
    {
      id: "LP_INT_06",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Estratégia Argumentativa: Argumento de Autoridade e Contra-argumentação",
      tipo: "fechada",
      enunciado: "Em um ensaio filosófico, o autor utiliza a seguinte estrutura: 'Embora muitos economistas ortodoxos defendam que o livre mercado autorregulado é capaz de distribuir riqueza espontaneamente, pensadores como Amartya Sen e Thomas Piketty demonstraram empiricamente que a ausência de políticas distributivas amplifica a concentração de renda'. O recurso argumentativo central empregado pelo autor para sustentar sua posição é:",
      alternativas: [
        { letra: "A", texto: "A concessão com contra-argumentação embasada em argumento de autoridade respaldado por evidências de economistas de renome." },
        { letra: "B", texto: "O apelo puramente emocional e sentimentalista sem dados teóricos." },
        { letra: "C", texto: "O ataque pessoal (ad hominem) aos economistas ortodoxos." },
        { letra: "D", texto: "A falsa analogia entre ciências exatas e ciências humanas." },
        { letra: "E", texto: "A circularidade tautológica que repete a mesma premissa como conclusão." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O articulista utiliza a concessão ('Embora...') para reconhecer a tese oposta e em seguida rebatê-la com autoridades mundiais na matéria (Sen e Piketty).",
        porque: "Essa estratégia confere solidez acadêmica e credibilidade argumentativa irrefutável à tese defendida."
      }
    },
    {
      id: "LP_INT_07",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Polissemia e Ambiguidade Lexical como Recurso Expressivo",
      tipo: "fechada",
      enunciado: "Em uma crônica machadiana, uma personagem avarenta é descrita como alguém que 'possuía um coração de ouro e mãos de ferro: o ouro nunca brilhava e o ferro nunca se abria'. A expressividade poética dessa passagem apoia-se no recurso da:",
      alternativas: [
        { letra: "A", texto: "Metáfora antagônica e subversão do clichê popular, no qual o 'coração de ouro' torna-se estéril e as 'mãos de ferro' explicitam a avareza inflexível." },
        { letra: "B", texto: "Aliteração de sons sibilantes sem conteúdo imagético." },
        { letra: "C", texto: "Personificação dos minerais em detrimento da personagem." },
        { letra: "D", texto: "Pleonasmo vicioso de termos redundantes." },
        { letra: "E", texto: "Gradação descendente que anula o caráter humano da personagem." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Machado desconstrói a expressão habitual 'ter coração de ouro' (que normalmente indicaria generosidade) reinterpretando-a de modo cáustico: o ouro jaz sepultado sem brilhar.",
        porque: "A contraposição entre o ouro inútil e o ferro que não se abre condensa a essência mesquinha da personagem em uma síntese estilística brilhante."
      }
    },
    {
      id: "LP_INT_08",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Gêneros Textuais Digitais e Linguagem da Internet",
      tipo: "fechada",
      enunciado: "Os 'memes' que circulam com velocidade vertiginosa nas redes sociais digitais combinam imagens populares estáticas ou GIFs animados com legendas curtas e irônicas. Para que a mensagem de um meme seja decodificada e produza o efeito de humor pretendido, é imprescindível que o leitor:",
      alternativas: [
        { letra: "A", texto: "Compartilhe do repertório cultural comunitário, do conhecimento prévio sobre o tema e do contexto sócio-histórico aludido na imagem." },
        { letra: "B", texto: "Domine com perfeição a sintaxe clássica do latim arcaico." },
        { letra: "C", texto: "Leia o texto exclusivamente em seu sentido literal e dicionarizado." },
        { letra: "D", texto: "Ignore os elementos visuais e foque apenas na pontuação formal." },
        { letra: "E", texto: "Seja um programador de software especialista em informática." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A compreensão do meme depende da ativação de conhecimentos de mundo prévios e referências da cultura pop/política compartilhadas pelo grupo social.",
        porque: "Sem o repertório cultural que contextualiza a imagem e a legenda, o meme perde sua carga irônica e transforma-se em uma imagem desconexa e incompreensível."
      }
    },
    {
      id: "LP_INT_09",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Modalizadores Discursivos e Posição Enunciativa",
      tipo: "fechada",
      enunciado: "Modalizadores são palavras ou expressões que indicam a atitude do enunciador em relação ao que está dizendo (certeza, probabilidade, obrigatoriedade, lamentação). No excerto: 'Infelizmente, é bastante provável que o aquecimento global ultrapasse o limite de 1,5 °C estabelecido pelo Acordo de Paris', os termos sublinhados revelam:",
      alternativas: [
        { letra: "A", texto: "Um juízo de valor afetivo/deplorativo ('Infelizmente') associado a uma estimativa de alta probabilidade epistêmica ('bastante provável')." },
        { letra: "B", texto: "Uma certeza matemática absoluta e inquestionável." },
        { letra: "C", texto: "Uma ordem imperativa com tom de ameaça." },
        { letra: "D", texto: "Uma total neutralidade e distanciamento objetivo do redator." },
        { letra: "E", texto: "Uma dúvida irresolvível que anula qualquer valor dos dados científicos." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Modalizadores apreciativos ('infelizmente') revelam o julgamento valorativo subjetivo do locutor; modalizadores epistêmicos ('provável') graduam a certeza da informação.",
        porque: "O autor lamenta a perda do controle climático ao mesmo tempo em que quantifica o risco com base nas projeções dos relatórios do IPCC."
      }
    },
    {
      id: "LP_INT_10",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Função Metalinguística na Poesia",
      tipo: "fechada",
      enunciado: "Nos versos de 'Catar feijão', de João Cabral de Melo Neto: 'Catar feijão se limita com escrever: / joga-se os grãos na água do alguidar / e as palavras na folha de papel; / e depois, joga-se fora o que boiar', o poeta estabelece uma analogia entre a faina doméstica e o fazer literário, manifestando predominantemente a função:",
      alternativas: [
        { letra: "A", texto: "Metalinguística, pois o poema reflete conscientemente sobre o próprio ato de escrita e o trabalho artesanal de seleção e depuração das palavras." },
        { letra: "B", texto: "Fática, pois testa o som das palavras no papel." },
        { letra: "C", texto: "Conativa, ordenando ao leitor que cozinhe feijão diariamente." },
        { letra: "D", texto: "Referencial jornalística sobre culinária popular nordestina." },
        { letra: "E", texto: "Emotiva, expressando um lamento confessional melancólico." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A função metalinguística ocorre quando o código (a linguagem poética) é utilizado para explicar e dissecar o próprio código e o ofício da criação artística.",
        porque: "João Cabral concebe a poesia não como inspiração mágica transcendental, mas como trabalho lúcido, manual e rigoroso de descarte e poda verbal, metaforizado na catação de feijão."
      }
    },
    {
      id: "LP_INT_11",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Eufemismo e Hipérbole no Discurso Político e Social",
      tipo: "fechada",
      enunciado: "Em pronunciamentos governamentais sobre crises econômicas, expressões como 'reajuste tarifário de emergência' e 'crescimento negativo do PIB' costumam substituir termos como 'aumento abusivo de preços' e 'recessão com desemprego'. O emprego deliberado desses eufemismos burocráticos objetiva:",
      alternativas: [
        { letra: "A", texto: "Atenuar o impacto negativo das más notícias e minimizar o desgaste político perante a opinião pública." },
        { letra: "B", texto: "Intensificar o drama da população para exigir sacrifícios maiores." },
        { letra: "C", texto: "Tornar a linguagem matemática mais poética e emotiva." },
        { letra: "D", texto: "Criar uma contradição cómica intencional no discurso." },
        { letra: "E", texto: "Ensinar conceitos econômicos avançados ao leitor leigo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O eufemismo é a figura de pensamento que substitui termos desagradáveis, agressivos ou chocantes por formulações mais suaves e amenas.",
        porque: "No marketing político e corporativo, a 'novilíngua' burocrática camufla perdas de poder aquisitivo sob jargões técnicos assépticos."
      }
    },
    {
      id: "LP_INT_12",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Paráfrase Fiel vs Extrapolação em Textos Complexos",
      tipo: "fechada",
      enunciado: "Considere o seguinte aforismo do filósofo Walter Benjamin: 'Nunca houve um monumento da cultura que não fosse também um monumento da barbárie'. A leitura crítica que parafraseia com absoluta fidelidade o pensamento do autor é:",
      alternativas: [
        { letra: "A", texto: "Os grandes patrimônios e realizações artísticas e materiais da civilização humana foram historicamente erguidos às custas da exploração, opressão e sofrimento de multidões silenciadas." },
        { letra: "B", texto: "A arte e a cultura são inerentemente más e devem ser destruídas para que a humanidade evolua." },
        { letra: "C", texto: "Os povos bárbaros da antiguidade produziram mais monumentos arquitetônicos do que os romanos." },
        { letra: "D", texto: "Não há relação entre história política e patrimônio cultural da humanidade." },
        { letra: "E", texto: "O desenvolvimento econômico contemporâneo aboliu totalmente a barbárie no mundo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Benjamin ressalta que os troféus da cultura triunfante carregam indelevelmente o sangue e a servidão dos vencidos (das pirâmides aos palácios imperiais).",
        porque: "A assertiva sintetiza a crítica materialista histórica da cultura, sem cair em extrapolações ingênuas ou reducionismos niilistas."
      }
    },
    {
      id: "LP_INT_13",
      origem: "UERJ 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Estratégia Argumentativa de Refutação",
      tipo: "aberta",
      enunciado: "Leia o excerto de um ensaio sobre a inteligência artificial generativa:\n'Argumenta-se frequentemente que as máquinas criativas substituirão integralmente os escritores e poetas, produzindo obras de arte perfeitas num piscar de olhos. Essa visão tecno-utópica comete um erro fundamental: a inteligência artificial recombina estatisticamente fragmentos do passado com base em probabilidades de linguagem, mas ela não tem corpo, não sente a dor da finitude mortal, não chora e não sonha. A arte não é cálculo algorítmico; a arte é a expressão da frágil experiência humana no tempo.'\n(a) Identifique a tese oposta apresentada pelo autor. (b) Qual é o contra-argumento nuclear desenvolvido para refutá-la?",
      resposta: "(a) A tese de que a IA substituirá integralmente os artistas humanos gerando obras de arte perfeitas; (b) A arte decorre da experiência sensorial e existencial corpórea humana (finitude, dor e emoção), elementos inacessíveis a meros cálculos algorítmicos.",
      gabarito: {
        letra: "Aberta",
        ancora: "Identificação de contra-argumentação em texto de reflexão estética.",
        espera_se: "(a) Tese oposta: A premissa determinista de que a IA generativa tornará o artista humano obsoleto, sendo capaz de suplantar integralmente poetas e romancistas na produção de obras estéticas perfeitas.\n(b) Contra-argumento nuclear: O autor distingue a mecânica estatística do cálculo da essência genuína da criação artística. Enquanto o algoritmo opera apenas como um processador estatístico de banco de dados do passado, a verdadeira arte nasce da experiência existencial humana vivida na carne — a consciência da morte, a dor física e emocional, a memória afetiva e a capacidade de sonhar —, dimensões ontológicas que nenhuma máquina pode simular."
      }
    },
    {
      id: "LP_INT_14",
      origem: "ENEM - Redação e Linguagens",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Problematização e Proposta de Intervenção Cidadã",
      tipo: "aberta",
      enunciado: "Ao redigir a conclusão dissertativa para o tema 'Caminhos para combater a evasão escolar entre jovens do ensino médio no Brasil', quais são os cinco elementos obrigatórios que compõem uma Proposta de Intervenção Social completa e avaliada com nota máxima na Competência 5 do ENEM?",
      resposta: "Agente, Ação, Meio/Modo, Efeito/Finalidade e Detalhamento de um dos elementos.",
      gabarito: {
        letra: "Aberta",
        ancora: "A matriz de referência oficial do INEP para a Competência 5 exige rigorosamente cinco elementos constitutivos articulados.",
        espera_se: "1. Agente social executor: Quem realizará a ação (Ministério da Educação, secretarias estaduais, famílias, terceiro setor);\n2. Ação interventiva concreta: O que deve ser feito (oferta de bolsas de permanência, reformulação curricular, horário integral);\n3. Modo/Meio de execução: Como a ação será implementada na prática (por meio de convênios governamentais, destinação orçamentária de fundos públicos);\n4. Efeito/Finalidade visada: Para que a intervenção será realizada (a fim de garantir a permanência dos jovens e erradicar o abandono);\n5. Detalhamento: Um desdobramento explicativo ou exemplificativo detalhado de qualquer um dos elementos anteriores."
      }
    },
    {
      id: "LP_INT_15",
      origem: "UERJ 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Análise Crítica de Recursos Expressivos em Poema Lírico",
      tipo: "aberta",
      enunciado: "Leia os versos de Manuel Bandeira no poema 'O bicho':\n'Vi ontem um bicho / Na imundície do pátio / Catando comida entre os detritos. / Quando achava alguma coisa, / Não examinava nem cheirava: / Engolia com voracidade. / O bicho não era um cão, / Não era um gato, / Não era um rato. / O bicho, meu Deus, era um homem.'\nExplique de que maneira a escolha do substantivo 'bicho' e a estrutura em gradação negativa constroem o processo de animalização (zoomorfização) do ser humano e a crítica à miséria social.",
      resposta: "A zoomorfização desumaniza a pessoa faminta através da linguagem, revelando no verso final o choque ético da degradação social da miséria.",
      gabarito: {
        letra: "Aberta",
        ancora: "Processo de zoomorfização/reificação como denúncia da desumanização gerada pela fome extrema.",
        espera_se: "O eu lírico adota inicialmente o vocábulo 'bicho' para descrever o comportamento puramente instintivo e voraz do indivíduo que busca restos de comida no lixo, suprimindo qualquer atributo de civilidade. A estrofe de gradação negativa ('não era um cão, não era um gato, não era um rato') cria uma expectativa crescente no leitor para descobrir qual animal exótico ou imundo estaria ali. O clímax e o impacto ético e emocional ocorrem no último verso ('O bicho, meu Deus, era um homem'): a invocação à divindade expressa horror diante da miséria que animaliza o semelhante, privando-o da própria dignidade humana."
      }
    }
  ]
};

// -------------------------------------------------------------
// 5. LÍNGUA PORTUGUESA - SINTAXE AVANÇADA E ESTILÍSTICA (IME/ITA)
// -------------------------------------------------------------
const lpImeIta = {
  disciplina: "Lingua Portuguesa",
  modulo: "Sintaxe_Avancada_e_Estilistica_IME_ITA",
  subpasta: "IME_ITA",
  arquivo_origem: "Questoes_Sintaxe_Avancada_e_Estilistica_IME_ITA.json",
  benchmark_didatico: {
    capitulo: "Língua Portuguesa de Nível Superior: Sintaxe Filológica, Estilística Camoniana e Machado-de-Assisiana, Pragmática e Semântica para Concursos Militares",
    objetivos_aprendizagem: [
      "Compreender estruturas sintáticas de alta complexidade (anacoluto, hipérbato extremo, próclise e ênclise em cadeias verbais modais e aspectuais, silepse e zeugma).",
      "Analisar a predicação de verbos vicários, verbos de apoio, construções acusativas de infinitivo e construções com infinitivo flexionado e pessoal.",
      "Identificar e interpretar recursos de estilística textual, polifonia camoniana, ironia machadiana velada e intertextualidade bíblica e greco-latina.",
      "Dominar o padrão prescritivo da norma culta em questões discursivas do IME e ITA, com justificativas morfossintáticas e históricas."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Infinitivo Pessoal (Flexionado) e Impessoal",
          definicao: "O infinitivo flexionado é uma peculiaridade histórica do português. Regras fundamentais: (1) O infinitivo deve ser flexionado quando possuir sujeito próprio expresso ou claramente determinado diferente do sujeito da oração principal (ex.: 'O professor deu sinal para os alunos entrarem'); (2) Deve ser flexionado para evidenciar reciprocidade ou quando o sujeito estiver posposto; (3) É OBRIGATORIAMENTE impessoal (não-flexionado) quando precedido de preposição 'de' após adjetivos ('fáceis de entender'), em locuções verbais com auxiliares modais ('eles devem partir', e não 'devem partirem') e em construções com verbos causativos/sensitivos com pronome oblíquo ('mandei-os calar')."
        },
        {
          termo: "Figuras de Sintaxe Complexas e Desvios Estilísticos",
          definicao: "Anacoluto: quebra brusca da estrutura sintática da frase, deixando um termo inicial isolado sem função gramatical definida (ex.: 'A velha da esquina, não sei o que aconteceu com ela'). Hipérbato: inversão violenta da ordem direta dos termos da oração (típico do Arcadismo, Barroco e de Os Lusíadas: 'As armas e os barões assinalados / Que da ocidental praia lusitana...'). Silepse: concordância gramatical com a ideia implícita e não com a forma literal (silepse de gênero: 'Vossa Excelência está cansado'; silepse de número: 'O povo gritavam'; silepse de pessoa: 'Os brasileiros somos patriotas')."
        },
        {
          termo: "Estilística da Ironia Machadiana e Polifonia",
          definicao: "A poética de Machado de Assis consolidou o narrador não-confiável e a ironia de segundo grau (cáustica, distanciada, metalinguística e desencantada). Suas construções recorrem a litotes (afirmação por negação do contrário: 'não era desprovido de inteligência'), zeugmas elegantes, paródias bíblicas e quebras de quarta parede ('Tu tens pressa de envelhecer, e o livro anda devagar...'). A análise sintática no IME/ITA exige desconstruir a ordem indireta e identificar termos oracionais e seus respectivos papéis argumentativos."
        }
      ],
      atencao_ponto_cego: "Ponto cego militar crítico: flexionar o verbo infinitivo em locuções verbais. É erro gravíssimo no ITA/IME flexionar o infinitivo principal em locuções como 'Eles podem chegarem cedo'; o auxiliar já assume a concordância ('Eles podem chegar cedo')."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Análise do Infinitivo Flexionado em Concurso Militar",
      enunciado: "Justifique a obrigatoriedade ou proibição da flexão do infinitivo na frase: 'A diretoria reuniu os funcionários para eles ______________ (expor) as suas reivindicações'.",
      resolucao_passo_a_passo: "1. Identificação da oração reduzida: A oração iniciada por 'para' é uma oração subordinada adverbial final reduzida de infinitivo.\n2. Sujeito da oração reduzida: A oração possui sujeito próprio expressamente grafado e diferente do sujeito da oração principal ('A diretoria'): o pronome pessoal 'eles' (3ª pessoa do plural).\n3. Aplicação da regra normativa: Sempre que a oração no infinitivo possui sujeito próprio explícito e distinto da oração regente, a flexão em número e pessoa torna-se obrigatória para clareza da referência sintática.\n4. Forma culta: 'para eles exporem as suas reivindicações'."
    }
  },
  questoes: [
    {
      id: "LP_IME_01",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Infinitivo Flexionado em Locuções Verbais",
      tipo: "fechada",
      enunciado: "Assinale a alternativa que apresenta erro de flexão do infinitivo de acordo com a norma gramatical prescritiva culta:",
      alternativas: [
        { letra: "A", texto: "Os deputados pareciam compreenderem a gravidade da votação." },
        { letra: "B", texto: "Os deputados pareciam compreender a gravidade da votação." },
        { letra: "C", texto: "Os deputados parecia compreenderem a gravidade da votação." },
        { letra: "D", texto: "Era necessário os deputados compreenderem a gravidade da votação." },
        { letra: "E", texto: "O presidente ordenou aos deputados compreenderem a matéria." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Em locuções verbais com o verbo auxiliar 'parecer', a dupla flexão simultânea (auxiliar no plural e infinitivo no plural) é terminantemente proibida pela norma culta.",
        porque: "Admite-se ou flexionar o auxiliar ('pareciam compreender': opção B) ou flexionar o infinitivo oracional considerando o verbo parecer impessoal ('parecia compreenderem': opção C). A flexão em ambas as formas ('pareciam compreenderem') constitui vício de dupla concordância incorreto."
      }
    },
    {
      id: "LP_IME_02",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Hipérbato e Ordem Inversa em Camões",
      tipo: "fechada",
      enunciado: "Nos versos iniciais de 'Os Lusíadas': 'As armas e os barões assinalados, / Que da ocidental praia Lusitana, / Por mares nunca de antes navegados, / Passaram ainda além da Taprobana...', o sujeito gramatical da forma verbal 'Passaram' é:",
      alternativas: [
        { letra: "A", texto: "O pronome relativo 'Que', que retoma o antecedente 'As armas e os barões assinalados'." },
        { letra: "B", texto: "O termo composto 'As armas e os barões assinalados' diretamente." },
        { letra: "C", texto: "'Por mares nunca navegados'." },
        { letra: "D", texto: "O termo oculto 'os portugueses'." },
        { letra: "E", texto: "'A praia Lusitana'." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O verbo 'passaram' situa-se no interior da oração subordinada adjetiva restritiva/explicativa introduzida pelo pronome relativo 'Que'.",
        porque: "O pronome 'Que' é o sujeito sintático formal imediato da forma verbal 'passaram', concordando com o antecedente plural 'armas e barões'."
      }
    },
    {
      id: "LP_IME_03",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Figuras de Sintaxe: Anacoluto",
      tipo: "fechada",
      enunciado: "Assinale a alternativa que exemplifica a figura de sintaxe denominada Anacoluto:",
      alternativas: [
        { letra: "A", texto: "Esse homem desonesto, não se pode confiar na sua palavra." },
        { letra: "B", texto: "Choraram lágrimas amargas os velhos pescadores." },
        { letra: "C", texto: "A cidade maravilhosa dormia sob o luar sereno." },
        { letra: "D", texto: "Ouvi um grito que cortou o silêncio da noite." },
        { letra: "E", texto: "Eles queriam vencer; nós, descansar." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O anacoluto é a quebra sintática na qual um termo é colocado em evidência no início da frase mas fica destituído de ligação gramatical com o predicado seguinte.",
        porque: "O sintagma 'Esse homem desonesto' fica sintaticamente 'no ar' (tópico pendente), pois o sujeito da oração seguinte é indeterminado ('não se pode confiar') e o termo é retomado frouxamente pelo adjunto 'na sua palavra'."
      }
    },
    {
      id: "LP_IME_04",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Colocação Pronominal com Verbos no Futuro",
      tipo: "fechada",
      enunciado: "De acordo com a norma culta tradicional, na presença de verbo no futuro do presente do indicativo sem palavra atrativa precedente, a colocação pronominal deve ser:",
      alternativas: [
        { letra: "A", texto: "Obrigatoriamente em Mesóclise (ex.: 'Realizar-se-á o congresso no próximo mês')." },
        { letra: "B", texto: "Obrigatoriamente em Ênclise (ex.: 'Realizará-se o congresso')." },
        { letra: "C", texto: "Obrigatoriamente em Próclise inicial (ex.: 'Se realizará o congresso')." },
        { letra: "D", texto: "Facultativa entre próclise e ênclise." },
        { letra: "E", texto: "Substituída por oração passiva analítica exclusivamente." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Verbos no futuro do presente e futuro do pretérito rejeitam terminantemente a ênclise na língua portuguesa; no início absoluto de período, o pronome deve ser intercalado no corpo do verbo (mesóclise).",
        porque: "'Realizar-se-á' é a única forma gramaticalmente impecável segundo a norma-padrão prescritiva clássica."
      }
    },
    {
      id: "LP_IME_05",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Regência do Verbo 'Preferir' na Norma Culta",
      tipo: "fechada",
      enunciado: "O verbo 'preferir' na língua padrão erudita é transitivo direto e indireto. Assinale a opção que atende estritamente à sua regência gramatical:",
      alternativas: [
        { letra: "A", texto: "O sábio preferia a tranquilidade do campo à agitação das grandes metrópoles." },
        { letra: "B", texto: "O sábio preferia mais a tranquilidade do campo do que a agitação." },
        { letra: "C", texto: "O sábio preferia a tranquilidade antes do que a agitação." },
        { letra: "D", texto: "O sábio preferia mil vezes a tranquilidade que a agitação." },
        { letra: "E", texto: "O sábio preferia a tranquilidade do que a agitação das cidades." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O verbo preferir rege a preposição 'a' para introduzir o termo preterido e repele terminantemente intensificadores como 'mais', 'muito mais', 'antes', 'mil vezes' e a locução 'do que'.",
        porque: "'Preferir A a B': o objeto direto é 'a tranquilidade do campo' e o objeto indireto é 'à agitação' (preposição 'a' + artigo feminino 'a' = crase)."
      }
    },
    {
      id: "LP_IME_06",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Concordância com o Verbo 'SER' em Predicados Nominais",
      tipo: "fechada",
      enunciado: "Na oração 'A vida nem sempre são flores perfumadas', a concordância do verbo 'ser' no plural justifica-se pelo fato de que:",
      alternativas: [
        { letra: "A", texto: "Quando o sujeito é nome de coisa no singular ('A vida') e o predicativo é um substantivo no plural ('flores'), o verbo 'ser' concorda preferencialmente com o predicativo no plural." },
        { letra: "B", texto: "O verbo 'ser' é impessoal e não concorda com nenhum dos termos." },
        { letra: "C", texto: "Trata-se de uma oração subordinada adjetiva truncada." },
        { letra: "D", texto: "A palavra 'nem sempre' atua como pronome indefinido pluralizador." },
        { letra: "E", texto: "Ocorreu uma silepse de gênero com o substantivo flores." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Regra especial do verbo ser: entre nome de coisa no singular e substantivo plural no predicativo, a norma culta preconiza a atração pelo plural ('são flores').",
        porque: "A concordância no singular ('A vida nem sempre é flores') é admitida, mas a atração pelo predicativo plural é a mais elegante e consagrada pelos clássicos."
      }
    },
    {
      id: "LP_IME_07",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Valores Aspectuais do Verbo",
      tipo: "fechada",
      enunciado: "O aspecto verbal expressa a maneira como a ação é encarada no tempo (conclusão, processo, início, iteração). Na frase 'Ele vinha estudando física intensamente nos últimos três anos', o aspecto verbal da locução é caracterizado como:",
      alternativas: [
        { letra: "A", texto: "Cursivo (ou contínuo) durativo com valor iterativo/frequorativo prolongado no tempo." },
        { letra: "B", texto: "Pontual conclusivo perfeito instantâneo." },
        { letra: "C", texto: "Incoativo, focalizando exclusivamente o início da ação." },
        { letra: "D", texto: "Cessativo, indicando a interrupção definitiva dos estudos." },
        { letra: "E", texto: "Permissivo de modo imperativo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A perífrase com verbo auxiliar 'vir' no imperfeito + gerúndio expressa um processo progressivo que se desdobra e se repete ao longo de uma extensão temporal durativa.",
        porque: "Distingue-se claramente do aspecto pontual/concluso ('Ele estudou')."
      }
    },
    {
      id: "LP_IME_08",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Pronome Demonstrativo Neutro 'O' como Objeto ou Predicativo",
      tipo: "fechada",
      enunciado: "Na oração 'Eles pensam que somos ingênuos, mas não o somos', a palavra sublinhada 'o' desempenha a função morfossintática de:",
      alternativas: [
        { letra: "A", texto: "Pronome demonstrativo neutro (equivalente a 'isso') com função sintática de predicativo do sujeito." },
        { letra: "B", texto: "Artigo definido masculino singular." },
        { letra: "C", texto: "Pronome pessoal oblíquo com função de objeto direto." },
        { letra: "D", texto: "Advérbio de negação pleonástico." },
        { letra: "E", texto: "Conjunção coordenativa explicativa elíptica." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O pronome 'o' pode funcionar como pronome demonstrativo invariável retomando um predicativo anteriormente citado ('não somos isso / não somos ingênuos').",
        porque: "Como o verbo 'somos' é de ligação, o termo que completa o seu sentido é um predicativo do sujeito."
      }
    },
    {
      id: "LP_IME_09",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Crase com Pronomes Relativos 'A QUAL' e 'QUE'",
      tipo: "fechada",
      enunciado: "Assinale a opção em que o uso do acento indicativo de crase é absolutamente obrigatório:",
      alternativas: [
        { letra: "A", texto: "A proposta à qual fizemos veemente oposição foi rejeitada em plenário." },
        { letra: "B", texto: "A jovem a quem me dirigi nada respondeu." },
        { letra: "C", texto: "Chegamos a uma encruzilhada perigosa." },
        { letra: "D", texto: "Ele referiu-se a qualquer pessoa presente." },
        { letra: "E", texto: "Fomos a cavalo até a fazenda vizinha." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Quem faz oposição, faz oposição 'a' (preposição). O pronome relativo antecedido de artigo feminino 'a qual' recebe crase pela fusão da preposição regida com o artigo: 'à qual'.",
        porque: "Em B, 'quem' não aceita artigo; em C, 'uma' é artigo indefinido; em D, 'qualquer' não admite artigo; em E, 'cavalo' é palavra masculina."
      }
    },
    {
      id: "LP_IME_10",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Plural dos Substantivos Compostos",
      tipo: "fechada",
      enunciado: "Assinale a alternativa em que todos os substantivos compostos foram flexionados no plural com rigorosa exatidão normativa:",
      alternativas: [
        { letra: "A", texto: "Tenentes-coronéis, guardas-civis, couves-flores, abaixo-assinados." },
        { letra: "B", texto: "Tenentes-coronéis, guarda-civis, couve-flores, abaixos-assinados." },
        { letra: "C", texto: "Tenente-coronéis, guardas-civil, couves-flor, abaixo-assinados." },
        { letra: "D", texto: "Tenentes-coronel, guardas-civis, couves-flores, abaixo-assinado." },
        { letra: "E", texto: "Tenentes-coronéis, guarda-civis, couves-flores, abaixos-assinado." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Regras de plural dos compostos: substantivo + substantivo flexionam ambos (tenentes-coronéis, couves-flores); substantivo + adjetivo flexionam ambos (guardas-civis); advérbio + particípio flexiona apenas o segundo (abaixo-assinados, pois abaixo é invariável).",
        porque: "A opção A é a única em que todas as palavras obedecem rigorosamente à regra das classes variáveis e invariáveis que integram os compostos."
      }
    },
    {
      id: "LP_IME_11",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Silepse de Pessoa e Ideologia Gramatical",
      tipo: "fechada",
      enunciado: "No excerto machadiano: 'Todos os homens somos mortais e sujeitos aos caprichos do destino', a concordância da forma verbal 'somos' constitui um clássico exemplo de:",
      alternativas: [
        { letra: "A", texto: "Silepse de pessoa, na qual o autor inclui a si mesmo (1ª pessoa do plural) dentro do sujeito formalmente expresso na 3ª pessoa do plural ('Todos os homens')." },
        { letra: "B", texto: "Erro crassíssimo de concordância verbal que desabona o escritor." },
        { letra: "C", texto: "Silepse de gênero decorrente de elipse de substantivo." },
        { letra: "D", texto: "Anacoluto estilístico com apagamento de sujeito." },
        { letra: "E", texto: "Hipercorreção decorrente de arcaísmo linguístico." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A silepse de pessoa (ou concordância mental) ocorre quando o locutor inclui-se no grupo designado pelo sujeito na terceira pessoa.",
        porque: "Em vez de dizer friamente 'Todos os homens são mortais', Machado escreve 'somos mortais' para fraternizar sua própria condição existencial perecível com a do leitor."
      }
    },
    {
      id: "LP_IME_12",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Oração Reduzida de Gerúndio com Valor Coordenativo",
      tipo: "fechada",
      enunciado: "Na oração 'O míssil foi disparado da plataforma costeira, atingindo o alvo com precisão milimétrica', o gerúndio 'atingindo' expressa semanticamente:",
      alternativas: [
        { letra: "A", texto: "Uma ação cronologicamente posterior à da oração principal, equivalendo a uma oração coordenada sindética aditiva/conclusiva ('e atingiu o alvo')." },
        { letra: "B", texto: "Uma oração subordinada adverbial temporal estritamente anterior." },
        { letra: "C", texto: "Uma condição hipotética necessária para o disparo." },
        { letra: "D", texto: "Uma concessão evidente que contraria o disparo." },
        { letra: "E", texto: "Uma comparação proporcional continuada." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Gerúndio de posterioridade coordenativo: embora alguns gramáticos puristas critiquem o gerúndio com valor posterior, a estilística consagrada reconhece seu papel narrativo aditivo/consecutivo.",
        porque: "O míssil é primeiro disparado e, em consequência e sucessão temporal imediata, atinge o alvo com precisão."
      }
    },
    {
      id: "LP_IME_13",
      origem: "ITA 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Distinção entre Agente da Passiva e Adjunto Adverbial de Causa",
      tipo: "aberta",
      enunciado: "Analise sintaticamente as duas orações abaixo e diferencie a função sintática dos termos preposicionados destacados:\nI. 'A floresta foi consumida pelo fogo violento.'\nII. 'O soldado morreu de sede e pelo cansaço extenuante.'",
      resposta: "I. 'pelo fogo violento' é Agente da Passiva; II. 'de sede' e 'pelo cansaço extenuante' são Adjuntos Adverbiais de Causa.",
      gabarito: {
        letra: "Aberta",
        ancora: "O agente da passiva pratica a ação em oração com verbo transitivo na voz passiva analítica. O adjunto adverbial de causa indica a motivação ou causa física de um verbo intransitivo (como morrer).",
        espera_se: "I. Na oração I, o verbo 'foi consumida' está na voz passiva analítica (derivado do VTD consumir). O termo 'pelo fogo violento' é o Agente da Passiva, pois ao transpor para a voz ativa ele assume o papel de sujeito agente: 'O fogo violento consumiu a floresta'.\nII. Na oração II, o verbo 'morreu' é intransitivo (não admite voz passiva). Os termos 'de sede' e 'pelo cansaço extenuante' expressam a causa etiológica ou motivo biológico do falecimento, classificando-se formalmente como Adjuntos Adverbiais de Causa."
      }
    },
    {
      id: "LP_IME_14",
      origem: "IME 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Transformação de Oração com Infinitivo Pessoal e Regência",
      tipo: "aberta",
      enunciado: "Reescreva a frase seguinte em um único período culto, substituindo a oração subordinada desenvolvida pela correspondente oração reduzida de infinitivo flexionado e aplicando a regência culta da norma-padrão:\n'O reitor da universidade concedeu autorização para que os estudantes participassem do seminário internacional.'",
      resposta: "'O reitor da universidade concedeu autorização para os estudantes participarem do seminário internacional.'",
      gabarito: {
        letra: "Aberta",
        ancora: "Elimina-se a conjunção integrante 'que'; o verbo no pretérito imperfeito do subjuntivo ('participassem') é convertido em infinitivo pessoal flexionado na 3ª pessoa do plural ('participarem'), concordando com o sujeito 'os estudantes'.",
        espera_se: "A frase resultante 'O reitor da universidade concedeu autorização para os estudantes participarem do seminário internacional' demonstra domínio preciso da redução oracional com infinitivo flexionado."
      }
    },
    {
      id: "LP_IME_15",
      origem: "ITA 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Subjunção e Parataxe: Efeitos de Estilo",
      tipo: "aberta",
      enunciado: "Em estilística clássica, a organização das frases pode apoiar-se na Hipotaxe (subordinação complexa de orações com hierarquia lógica rígida) ou na Parataxe (coordenação ou justaposição assindética de orações breves sem conectivos subordinativos). Compare sucintamente os efeitos de sentido e de ritmo textual proporcionados pela parataxe machadiana e pela hipotaxe barroca ou jurídica clássica.",
      resposta: "Parataxe produz concisão, agilidade, sobriedade cética e impacto direto; Hipotaxe produz solenidade, densidade dialética e encadeamento argumentativo minucioso.",
      gabarito: {
        letra: "Aberta",
        ancora: "A parataxe privilegia a sucessão ágil de cortes sintáticos; a hipotaxe organiza o pensamento em arquitetura arquitetônica subordinada.",
        espera_se: "1. Parataxe: Típica da prosa madura de Machado de Assis e da modernidade literária, utiliza orações curtas, justapostas por vírgula ou ponto final, gerando um ritmo sincopado, seco, conciso e irônico. Transmite sobriedade, ceticismo e força reflexiva direta, deixando para o leitor a tarefa de deduzir as conexões lógicas implícitas.\n2. Hipotaxe: Típica da oratória barroca (como nos sermões do Padre Antônio Vieira) e do discurso jurídico solene, constrói longos períodos ramificados em múltiplas orações subordinadas encaixadas (causais, consecutivas, concessivas). Produz um ritmo caudaloso, majestoso e formal, orientando detalhadamente cada nuança lógica e causal do raciocínio argumentativo."
      }
    }
  ]
};

salvar('Lingua Portuguesa/Anos_Iniciais_2to5EF/Questoes_Leitura_e_Alfabetizacao_2ao5ano.json', lpAnosIniciais);
salvar('Lingua Portuguesa/Anos_Finais_6to9EF/Questoes_Compreensao_e_Gramatica_6ao9ano.json', lpAnosFinais);
salvar('Lingua Portuguesa/Sintaxe_e_Morfologia/Questoes_Gramatica_e_Sintaxe.json', lpGramaticaSintaxe);
salvar('Lingua Portuguesa/Interpretacao_de_Texto/Questoes_Interpretacao_ENEM_UERJ.json', lpInterpretacao);
salvar('Lingua Portuguesa/IME_ITA/Questoes_Sintaxe_Avancada_e_Estilistica_IME_ITA.json', lpImeIta);

console.log('--- LOTE 5 (LÍNGUA PORTUGUESA) CONCLUÍDO COM SUCESSO ---');
