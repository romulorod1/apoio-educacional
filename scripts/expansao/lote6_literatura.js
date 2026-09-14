const fs = require('fs');
const path = require('path');

const BASE_DIR = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';

function salvar(subpath, dados) {
  const p = path.join(BASE_DIR, subpath);
  fs.writeFileSync(p, JSON.stringify(dados, null, 2), 'utf-8');
  console.log(`Atualizado: ${subpath} com ${dados.questoes.length} questões.`);
}

// -------------------------------------------------------------
// 1. LITERATURA - FÁBULAS E POESIA (2º AO 5º ANO EF)
// -------------------------------------------------------------
const litInfantil = {
  disciplina: "Literatura",
  modulo: "Fabulas_e_Poesia_2ao5ano",
  subpasta: "Infantojuvenil_e_Fabulas_2to5EF",
  arquivo_origem: "Questoes_Fabulas_e_Poesia_2ao5ano.json",
  benchmark_didatico: {
    capitulo: "Literatura Infantojuvenil: Contos de Fadas, Fábulas Tradicionais, Poesia Lúdica e Folclore",
    objetivos_aprendizagem: [
      "Compreender a estrutura clássica das narrativas infantis (situação inicial, conflito gerador, clímax e desfecho moral ou mágico).",
      "Identificar e caracterizar fábulas (Esopo, La Fontaine e Monteiro Lobato) e a personificação/prosopopeia de animais.",
      "Explorar a musicalidade, o ritmo, as rimas e os jogos de palavras na poesia infantil de autores como Vinicius de Moraes, Cecília Meireles e Ruth Rocha.",
      "Valorizar personagens e mitos do folclore brasileiro (Saci-Pererê, Curupira, Iara e Boto Cor-de-Rosa) em suas dimensões culturais e ecológicas."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Estrutura da Fábula e Moral da História",
          definicao: "A fábula é uma narrativa curta de tradição oral milenar, imortalizada por Esopo e La Fontaine e abrasileirada por Monteiro Lobato no Sítio do Picapau Amarelo. Seus traços essenciais são: personagens animais com atributos e defeitos humanos (vaidade, astúcia, preguiça, lealdade), enredo condensado em torno de um dilema ético e a presença explícita ou implícita de uma 'moral da história' que visa educar moralmente a criança sobre prudência, respeito e discernimento social."
        },
        {
          termo: "Poesia Infantil: Ritmo, Rima e Imaginação",
          definicao: "A poesia para crianças explora a linguagem sensorial e lúdica. Em obras canônicas como 'Ou Isto ou Aquilo' (Cecília Meireles) e 'A Arca de Noé' (Vinicius de Moraes), os versos trabalham a aliteração, a onomatopeia (sons de animais, relógios, portas), a rima e o jogo de opostos. A poesia estimula o letramento poético, mostrando que as palavras têm som, cor, peso e movimento, desenvolvendo a fruição estética e o amor pelos livros desde a primeira infância."
        },
        {
          termo: "Contos Maravilhosos e Folclore Brasileiro",
          definicao: "Os contos maravilhosos (irmãos Grimm e Perrault) lidam com elementos sobrenaturais, fadas, bruxas e desafios iniciáticos que simbolizam o amadurecimento e a superação do medo. No folclore brasileiro, as lendas tradicionais trazem seres mágicos com forte ligação com a preservação ambiental: o Curupira com pés virados para trás despista caçadores na mata; o Saci-Pererê representa a travessura e a astúcia popular; e a Iara alerta para o respeito aos rios e florestas."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente nos anos iniciais: confundir o conceito de fábula com o de conto de fadas. A fábula tem animais personificados e moral prática objetiva; o conto de fadas tem seres humanos, magia/encantamento e final frequentemente feliz sem uma frase moral explícita no rodapé."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Personificação e Moral em Esopo",
      enunciado: "Na fábula 'O Leão e o Ratinho', o poderoso leão poupa a vida de um pequeno rato que o incomodava. Mais tarde, o leão fica preso nas cordas da rede de caçadores, e o ratinho o salva roendo as cordas. Qual é a moral fundamental dessa história e qual figura de linguagem torna os animais personagens ativos?",
      resolucao_passo_a_passo: "1. Análise da relação entre os personagens: O leão representa a força física e o poder; o ratinho representa a pequenez e a aparente fragilidade.\n2. Inversão de papéis no clímax: Quando a força física bruta do leão falha, a paciência e os dentes afiados do pequeno roedor resolvem a situação.\n3. Moral da história: Ninguém é tão insignificante que não possa um dia ajudar o mais forte. Amigos pequenos podem revelar-se grandes aliados, demonstrando que a gentileza gera gratidão e socorro mútuo.\n4. Figura de linguagem: Personificação ou Prosopopeia (atribuição de sentimentos morais, gratidão, inteligência e diálogo verbal a animais irracionais)."
    }
  },
  questoes: [
    {
      id: "LIT_INF_01",
      origem: "SAEB - 5º Ano EF",
      ano_escolar: "3º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Características do Gênero Fábula",
      tipo: "fechada",
      enunciado: "A fábula 'A Lebre e a Tartaruga' narra uma corrida em que a lebre, zombando da lentidão da tartaruga e confiante na sua extrema velocidade, decide tirar uma soneca no meio do caminho e acaba perdendo a prova. O ensinamento moral dessa narrativa evidencia que:",
      alternativas: [
        { letra: "A", texto: "A perseverança, a dedicação contínua e a modéstia vencem a arrogância e o excesso de confiança desatenta." },
        { letra: "B", texto: "Animais lentos nunca devem competir com animais velozes." },
        { letra: "C", texto: "Dormir durante o dia é a melhor maneira de vencer desafios." },
        { letra: "D", texto: "A lebre correu mais rápido e levou o troféu para a toca." },
        { letra: "E", texto: "As tartarugas devem sempre pedir carona aos coelhos." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A moral clássica ressalta que o esforço constante e disciplinado (tartaruga) supera a soberba descuidada do talento natural negligente (lebre).",
        porque: "O texto ensina o valor da persistência inabalável diante de adversidades aparentemente desfavoráveis."
      }
    },
    {
      id: "LIT_INF_02",
      origem: "Avaliação Formativa - 4º Ano EF",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Poesia Infantil e Onomatopeia: Vinicius de Moraes",
      tipo: "fechada",
      enunciado: "No poema 'O Relógio', de Vinicius de Moraes: 'Passa, tempo, tic-tac / Tic-tac, passa, hora / Chega logo, tic-tac / Tic-tac, e vai-te embora...', a repetição da expressão 'tic-tac' funciona como qual recurso sonoro?",
      alternativas: [
        { letra: "A", texto: "Uma onomatopeia, imitando com ritmo verbal o som característico dos ponteiros mecânicos do relógio." },
        { letra: "B", texto: "Uma metáfora sobre a escuridão da noite." },
        { letra: "C", texto: "Uma contradição absurda sem sentido poético." },
        { letra: "D", texto: "Um diminutivo carinhoso da palavra tempo." },
        { letra: "E", texto: "Uma hipérbole exagerando a velocidade das horas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Onomatopeia é a figura de linguagem que reproduz acusticamente sons, ruídos ou vozes de seres e objetos da realidade.",
        porque: "O 'tic-tac' reproduz o compasso rítmico do relógio, acelerando poeticamente a percepção da passagem dos minutos."
      }
    },
    {
      id: "LIT_INF_03",
      origem: "Colégio Pedro II - 6º Ano EF",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Conto Maravilhoso e Personagens Arquetípicas",
      tipo: "fechada",
      enunciado: "Nos contos de fadas tradicionais, como 'Cinderela', 'Branca de Neve' e 'Rapunzel', a personagem da madrasta malvada desempenha no enredo a função arquetípica de:",
      alternativas: [
        { letra: "A", texto: "Antagonista (vilã), que gera o conflito central ao opor-se à protagonista heroína por inveja ou vaidade." },
        { letra: "B", texto: "Fada-madrinha conselheira e protetora." },
        { letra: "C", texto: "Narradora onisciente que encerra a história." },
        { letra: "D", texto: "Personagem secundária sem influência no desfecho." },
        { letra: "E", texto: "Membro da corte real encarregada da justiça." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Nos contos clássicos, o antagonista corporifica as forças de opressão e desafio que impulsionam a jornada de amadurecimento e provação da protagonista.",
        porque: "A hostilidade da madrasta obriga a protagonista a revelar coragem, bondade e resiliência moral para alcançar a redenção final."
      }
    },
    {
      id: "LIT_INF_04",
      origem: "Olimpíada de Língua Portuguesa",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Poesia Infantil: Cecília Meireles e Jogo de Palavras",
      tipo: "fechada",
      enunciado: "No poema 'Ou Isto ou Aquilo', de Cecília Meireles: 'Ou se tem chuva e não se tem sol, / ou se tem sol e não se tem chuva! / Ou se calça a luva e não se põe o anel, / ou se põe o anel e não se calça a luva!...', o tema existencial central apresentado ludicamente para a criança é:",
      alternativas: [
        { letra: "A", texto: "A constante necessidade humana de fazer escolhas e aceitar que escolher algo implica abrir mão de outra coisa." },
        { letra: "B", texto: "A previsão do tempo meteorológico para os dias chuvosos." },
        { letra: "C", texto: "A proibição de usar anéis de ouro durante o inverno." },
        { letra: "D", texto: "A superioridade da chuva em relação aos dias ensolarados." },
        { letra: "E", texto: "A incapacidade das pessoas em comprar calçados adequados." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Cecília Meireles traduz o dilema das escolhas humanas para a linguagem infantil com extrema delicadeza e sensibilidade.",
        porque: "A alternância de conjunções 'ou... ou' simboliza a impossibilidade de abarcar tudo na vida, ensinando que crescer é aprender a escolher e conviver com as renúncias decorrentes."
      }
    },
    {
      id: "LIT_INF_05",
      origem: "Colégio Militar",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Monteiro Lobato e o Sítio do Picapau Amarelo",
      tipo: "fechada",
      enunciado: "Na obra infantojuvenil de Monteiro Lobato, a boneca Emília destaca-se como uma das personagens mais originais e marcantes da literatura brasileira porque:",
      alternativas: [
        { letra: "A", texto: "É uma boneca de pano irreverente, falastrona, contestadora e dona de uma 'pílula falante' que questiona o mundo dos adultos com liberdade e imaginação sem limites." },
        { letra: "B", texto: "É uma princesa tímida e obediente que segue à risca todos os conselhos da nobreza." },
        { letra: "C", texto: "É uma feiticeira má do fundo do rio que persegue Pedrinho e Narizinho." },
        { letra: "D", texto: "É uma cozinheira idosa que apenas faz doces e quitutes para as crianças." },
        { letra: "E", texto: "É um sabugo de milho erudito que passa o dia lendo enciclopédias na biblioteca." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Emília encarna o espírito crítico, lúdico e independente lobatiano, subvertendo a convenção da infância passiva e submissa.",
        porque: "Feita de retalhos por Tia Nastácia, ganha vida ao tomar a pílula do Dr. Caramujo e passa a comandar as aventuras do Sítio com frases memoráveis ('A vida é um pisca-pisca')."
      }
    },
    {
      id: "LIT_INF_06",
      origem: "SAEB - 5º Ano EF",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Folclore Brasileiro e Mitos da Natureza: O Curupira",
      tipo: "fechada",
      enunciado: "Segundo a lenda tradicional indígena, o Curupira é um ser mítico de cabelos de fogo e pés virados para trás que habita as profundezas das florestas brasileiras. A função primordial atribuída a esse ser folclórico é:",
      alternativas: [
        { letra: "A", texto: "Proteger as matas e os animais silvestres contra a ganância de caçadores e lenhadores que destroem a natureza desnecessariamente." },
        { letra: "B", texto: "Incendiar as árvores sagradas durante as noites de lua cheia." },
        { letra: "C", texto: "Ajudar os fazendeiros a abrir pastagens com facilidade." },
        { letra: "D", texto: "Ensinar truques de mágica aos viajantes perdidos nas cidades." },
        { letra: "E", texto: "Construir casas de tijolo para os índios às margens dos rios." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O Curupira é o guardião ancestral ecológico da fauna e da flora das florestas nativas.",
        porque: "Seus pés virados para trás confundem as pegadas, fazendo com que caçadores predatórios sigam o rastro na direção oposta e se percam na mata, salvando as fêmeas com filhotes e as árvores jovens."
      }
    },
    {
      id: "LIT_INF_07",
      origem: "Colégio de Aplicação UERJ",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Ruth Rocha e a Cidadania Infantil",
      tipo: "fechada",
      enunciado: "No livro clássico 'Marcelo, Marmelo, Martelo', de Ruth Rocha, o menino Marcelo passa a inventar nomes próprios para os objetos ('moradeira' para casa, 'pontudinho' para lápis) porque acha os nomes tradicionais sem lógica. Essa atitude da personagem infantil expressa poeticamente:",
      alternativas: [
        { letra: "A", texto: "A curiosidade genuína da criança sobre a relação entre as palavras e as coisas, questionando a arbitrariedade dos signos linguísticos através do brincar." },
        { letra: "B", texto: "Um distúrbio cognitivo grave que impede a aprendizagem do idioma." },
        { letra: "C", texto: "Uma teimosia prejudicial que levou à sua expulsão definitiva da escola." },
        { letra: "D", texto: "A obediência cega aos manuais de gramática do século XIX." },
        { letra: "E", texto: "A recusa em se comunicar com os próprios pais por desamor." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Ruth Rocha retrata com genialidade o pensamento intuitivo e a criatividade linguística infantil que reinventa o mundo pela palavra.",
        porque: "Marcelo questiona por que uma cadeira não se chama 'sentador' e por que casa não é 'moradeira', revelando o raciocínio funcional e poético da infância sobre o léxico."
      }
    },
    {
      id: "LIT_INF_08",
      origem: "Prova Brasil - 5º Ano EF",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Poesia Lúdica: 'A Casa' de Vinicius de Moraes",
      tipo: "fechada",
      enunciado: "Nos versos iniciais do poema 'A Casa', de Vinicius de Moraes: 'Era uma casa / Muito engraçada / Não tinha teto / Não tinha nada / Ninguém podia / Entrar nela, não / Porque na casa / Não tinha chão...', o humor e o encantamento do texto nascem da:",
      alternativas: [
        { letra: "A", texto: "Construção de uma casa imaginária e surreal feita inteiramente de ausências e impossibilidades físicas." },
        { letra: "B", texto: "Denúncia jornalística sobre problemas na construção civil urbana." },
        { letra: "C", texto: "Descrição minuciosa de um castelo imperial da Idade Média." },
        { letra: "D", texto: "História de um roubo de telhados em uma vila de pescadores." },
        { letra: "E", texto: "Tristeza da personagem por não possuir um endereço postal." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A poética de Vinicius dialoga com o universo do nonsense e do absurdo lúdico para encantar o leitor infantil.",
        porque: "A casa 'muito engraçada' é pura invenção lírica: não tem teto, nem chão, nem parede, mas é cheia de poesia e afeto no 'número zero dos bobos'."
      }
    },
    {
      id: "LIT_INF_09",
      origem: "Colégio Militar de Curitiba",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Fábula e Astúcia: A Raposa e as Uvas",
      tipo: "fechada",
      enunciado: "Na fábula esópica 'A Raposa e as Uvas', a raposa faminta tenta de todas as formas alcançar um cacho de uvas maduras suspensas numa parreira alta. Após inúmeros saltos fracassados e exausta pelo esforço inútil, ela se afasta dizendo: 'Estavam verdes mesmo, não quero mais'. Essa célebre atitude psicológica da raposa representa:",
      alternativas: [
        { letra: "A", texto: "O mecanismo de defesa de desdenhar e desprezar aquilo que não se tem a capacidade ou competência para alcançar." },
        { letra: "B", texto: "A prudência científica de quem examina as frutas antes de comer." },
        { letra: "C", texto: "A generosidade de deixar a comida para os passarinhos." },
        { letra: "D", texto: "A vitória esmagadora da inteligência sobre a parreira de uvas." },
        { letra: "E", texto: "O medo de ser envenenada por frutas desconhecidas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A expressão popular 'quem desdenha quer comprar' e a teoria da dissonância cognitiva ilustram essa fábula atemporal.",
        porque: "Incapaz de admitir sua própria limitação física para alcançar as uvas suculentas, a raposa prefere inventar uma justificativa desvalorizadora ('estão verdes') para proteger seu orgulho ferido."
      }
    },
    {
      id: "LIT_INF_10",
      origem: "Colégio Pedro II",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Mito Indígena: A Lenda da Mandioca (Mani)",
      tipo: "fechada",
      enunciado: "A lenda indígena tupi narra a história da indiazinha branca Mani que faleceu muito cedo e foi enterrada na sua oca com choro e carinho da tribo. No local de sua sepultura nasceu uma planta cuja raiz marrom por fora e branca por dentro serviu de alimento farto para todo o povo ('Mani-oca'). Essa narrativa lendária pertence ao gênero:",
      alternativas: [
        { letra: "A", texto: "Mito etiológico de tradição indígena, que explica a origem sobrenatural e sagrada de um alimento vital da terra através da memória afetiva da comunidade." },
        { letra: "B", texto: "Notícia factual publicada em jornais agrícolas do século XVI." },
        { letra: "C", texto: "Receita culinária com modo de preparo de farinha de mandioca." },
        { letra: "D", texto: "Relatório de botânica descritiva com classificação de espécies." },
        { letra: "E", texto: "Fábula moralizante com animais falantes domesticados." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Mitos etiológicos são histórias fundadoras que explicam como certas coisas do mundo (plantas, rios, estrelas) passaram a existir.",
        porque: "A lenda de Mani confere significado sagrado e conexão comunitária à mandioca, alimento basilar da subsistência dos povos originários do Brasil."
      }
    },
    {
      id: "LIT_INF_11",
      origem: "Colégio Militar de Fortaleza",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Intertextualidade e Releitura de Contos Tradicionais",
      tipo: "fechada",
      enunciado: "Em livros contemporâneos de literatura infantil, autores recriam histórias clássicas sob novas perspectivas, como no livro 'A Verdadeira História dos Três Porquinhos', narrada sob o ponto de vista do Lobo Mau, que alega que estava apenas com um forte resfriado e queria pedir uma xícara de açúcar emprestada. Esse recurso literário moderno denomina-se:",
      alternativas: [
        { letra: "A", texto: "Paródia e inversão de ponto de vista focalizador, humanizando o vilão tradicional e estimulando o senso crítico do leitor mirim." },
        { letra: "B", texto: "Cópia pirata sem valor literário educativo." },
        { letra: "C", texto: "Tradução juramentada fiel aos manuscritos medievais." },
        { letra: "D", texto: "Fábula com moral religiosa estrita e dogmática." },
        { letra: "E", texto: "Crônica histórica sobre técnicas de construção civil suína." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A paródia desconstrói o cânone clássico, conferindo voz ao antagonista tradicional e revelando a relatividade das versões narrativas.",
        porque: "O lobo alega que os espirros causaram a queda das casas de palha e madeira, ensinando à criança que uma mesma história possui diferentes perspectivas de quem a narra."
      }
    },
    {
      id: "LIT_INF_12",
      origem: "Olimpíada de Língua Portuguesa",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Poesia Visual e Concreta para Crianças",
      tipo: "fechada",
      enunciado: "Em um poema visual infantil sobre o outono, os versos com as palavras 'folhas', 'vento' e 'chão' estão dispostos graficamente em espiral descendente flutuando pela folha de papel até acumularem-se na margem inferior. Esse diálogo entre a imagem visual no espaço da página e o sentido semântico das palavras é característico da:",
      alternativas: [
        { letra: "A", texto: "Poesia concreta / visual, na qual a distribuição espacial das letras e palavras no papel participa ativamente da construção do significado do poema." },
        { letra: "B", texto: "Prosa técnica dissertativa com tipografia defeituosa." },
        { letra: "C", texto: "Tabela estatística de medição da força eólica." },
        { letra: "D", texto: "Tradução de soneto clássico camoniano decassílabo." },
        { letra: "E", texto: "Fábula tradicional rimada em quadras regulares AABB." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Na poesia visual e no concretismo, a espacialidade gráfica é indissociável da mensagem verbal (verbivocovisual).",
        porque: "A disposição das palavras caindo em espiral imita visualmente a trajetória das folhas secas despencando das copas das árvores durante o outono."
      }
    },
    {
      id: "LIT_INF_13",
      origem: "Colégio Pedro II 2ª Fase",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Análise de Poema: 'O Elefante' de Vinicius de Moraes",
      tipo: "aberta",
      enunciado: "Leia o trecho do poema infantil 'O Elefante':\n'Onde vais, elefantinho / Correndo pelo caminho / Assim tão desconsolado? / Andas perdido, bichinho / Espetaste o pé no espinho / Que sentes, pobre coitado? / — Estou com um medo danado / Encontrei um passarinho!'\n(a) Qual é o efeito de surpresa e quebra de expectativa produzido pela fala final do elefante? (b) O que esse desfecho revela sobre os medos e a fragilidade das aparências?",
      resposta: "(a) Um animal gigantesco ter pavor de um diminuto passarinho; (b) Revela que o tamanho exterior não define a coragem e que todos nós sentimos medos singulares.",
      gabarito: {
        letra: "Aberta",
        ancora: "Quebra de expectativa e humor afetuoso na poesia infantil lírica.",
        espera_se: "(a) Efeito de surpresa: O narrador descreve o elefante assustado e imagina perigos proporcionais ao seu tamanho gigantesco (como espinhos terríveis ou monstros da selva). A resposta final do elefante quebra comicamente a expectativa ao revelar que ele está com um pavor desmedido de uma criaturinha minúscula e inofensiva: um passarinho.\n(b) Significado humano: Vinicius ensina com ternura que a força ou o tamanho físico de um ser não o tornam imune ao medo ou à insegurança. Mesmo os maiores e mais fortes podem assustar-se com coisas pequenas, mostrando que a vulnerabilidade é universal e deve ser acolhida sem julgamento."
      }
    },
    {
      id: "LIT_INF_14",
      origem: "Avaliação Pedagógica de Alfabetização",
      ano_escolar: "3º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Fábula e Solidariedade: A Pomba e a Formiga",
      tipo: "aberta",
      enunciado: "Na fábula 'A Pomba e a Formiga', uma formiga cai no riacho e está se afogando quando a pomba joga uma folha de árvore salvando sua vida. Mais tarde, um caçador de aves aponta a espingarda para abater a pomba, mas a formiga pica o calcanhar do caçador, que erra o tiro e a pomba escapa ilesa. Responda: (a) Qual lição ética essa história transmite às crianças? (b) Dê um exemplo do cotidiano escolar em que essa mesma lição pode ser praticada entre colegas de classe.",
      resposta: "(a) A generosidade é sempre recompensada e uma boa ação gera outra boa ação; (b) Ajudar um colega com material escolar ou estudo e mais tarde receber apoio em uma dificuldade.",
      gabarito: {
        letra: "Aberta",
        ancora: "Princípio da reciprocidade e gratidão solidária mútua nas relações comunitárias.",
        espera_se: "(a) Lição ética: O altruísmo, a compaixão e a generosidade nunca são desperdiçados. Uma atitude de bondade e socorro desinteressado a quem precisa cria laços de gratidão mútua, demonstrando que até o menor dos amigos pode salvar a nossa vida quando estivermos em perigo.\n(b) Exemplo escolar: Um aluno que empresta um lápis ou explica pacientemente uma questão de matemática difícil a um colega em apuros, e tempos depois esse mesmo colega o defende contra o bullying no recreio ou o apoia emocionalmente quando ele estiver triste."
      }
    },
    {
      id: "LIT_INF_15",
      origem: "Colégio Militar de Belo Horizonte",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Interpretação e Comparação entre Gêneros: Fábula vs Notícia",
      tipo: "aberta",
      enunciado: "Compare o gênero textual 'Fábula' com o gênero 'Notícia de Jornal'. Aponte: (a) Duas diferenças essenciais quanto à finalidade comunicativa de cada gênero; (b) Duas diferenças estruturais na linguagem e nos personagens de cada um.",
      resposta: "(a) Fábula visa educar moralmente por alegoria; Notícia visa informar objetivamente fatos reais; (b) Fábula usa animais personificados e linguagem figurada; Notícia usa pessoas/fontes reais e linguagem denotativa neutra.",
      gabarito: {
        letra: "Aberta",
        ancora: "Distinção entre texto ficcional alegórico/formativo e texto informativo jornalístico da esfera pública.",
        espera_se: "(a) Finalidade comunicativa:\n1. A Fábula tem finalidade educativa, moralizadora e lúdica, buscando transmitir ensinamentos éticos e comportamentais universais por meio de alegorias ficcionais;\n2. A Notícia tem finalidade essencialmente informativa, pretendendo relatar acontecimentos reais, inéditos e de relevância pública e imediata para a sociedade.\n(b) Linguagem e personagens:\n1. A Fábula emprega personagens fictícios (animais humanizados por prosopopeia, plantas ou objetos), tempo indeterminado ('Era uma vez') e linguagem literária conotativa e metafórica;\n2. A Notícia envolve pessoas e instituições reais, situa os acontecimentos com rigor de tempo e espaço (quem, quando, onde, como, por quê) e adota linguagem denotativa, objetiva e neutra na 3ª pessoa segundo o padrão formal da imprensa."
      }
    }
  ]
};

// -------------------------------------------------------------
// 2. LITERATURA - FORMAÇÃO LITERÁRIA (6º AO 9º ANO EF)
// -------------------------------------------------------------
const litFormacao = {
  disciplina: "Literatura",
  modulo: "Leitura_Literaria_6ao9ano",
  subpasta: "Formacao_Literaria_6to9EF",
  arquivo_origem: "Questoes_Leitura_Literaria_6ao9ano.json",
  benchmark_didatico: {
    capitulo: "Formação do Leitor Literário: Crônica Urbana, Contos Clássicos, Romance Juvenil e Teatro Brasileiro",
    objetivos_aprendizagem: [
      "Compreender a crônica brasileira (Rubem Braga, Fernando Sabino, Luis Fernando Verissimo e Clarice Lispector) como gênero híbrido entre jornalismo e literatura.",
      "Analisar a narrativa de suspense e mistério (Edgar Allan Poe, Arthur Conan Doyle e Agatha Christie) identificando pistas, enigmas e deduções lógicas.",
      "Compreender o romance juvenil formativo (como 'O Meu Pé de Laranja Lima', de José Mauro de Vasconcelos, e 'A Bolsa Amarela', de Lygia Bojunga).",
      "Reconhecer o texto dramático teatral (estrutura em rubricas, atos, cenas e diálogos) através de clássicos como 'O Auto da Compadecida', de Ariano Suassuna."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "A Crônica Urbana Brasileira",
          definicao: "A crônica é uma das expressões mais originais da literatura brasileira moderna. Nascida nos rodapés dos jornais diários, parte de um fato corriqueiro e aparentemente banal do cotidiano (uma conversa no ponto de ônibus, um pássaro na janela, uma recordação de infância) para tecer reflexões líricas, filosóficas ou bem-humoradas sobre a condição humana. Rubem Braga (o poeta da crônica lírica), Fernando Sabino e Luis Fernando Verissimo (o mestre do humor irônico e das comédias da vida privada) consolidaram a linguagem fluida, afável e íntima da crônica com o leitor."
        },
        {
          termo: "Narrativas de Enigma e Romance Policial",
          definicao: "Criado por Edgar Allan Poe com o conto 'Os Assassinatos da Rua Morgue' (personagem Auguste Dupin) e imortalizado por Conan Doyle com Sherlock Holmes, o conto policial clássico estrutura-se em torno de um enigma aparentemente insolúvel (um crime em quarto fechado, um desaparecimento misterioso). A narrativa valoriza a observação científica minuciosa, o raciocínio dedutivo rigoroso e o despistamento do leitor através de pistas falsas (red herrings), culminando na revelação surpreendente e lógica pelo detetive."
        },
        {
          termo: "O Teatro e o Auto Popular de Ariano Suassuna",
          definicao: "O texto teatral é concebido para a encenação cênica, composto pelos diálogos das personagens e pelas rubricas (orientações do dramaturgo sobre cenário, iluminação, gestos e entonação dos atores). Em 'O Auto da Compadecida' (1955), Ariano Suassuna funde a tradição do teatro medieval de Gil Vicente com a literatura de cordel e o romanceiro popular nordestino. Através das peripécias e da astúcia de João Grilo e Chicó, Suassuna expõe com humor corrosivo a hipocrisia das elites clericais e latifundiárias do sertão, exaltando a compaixão divina para com os deserdados da terra."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente nos anos finais: confundir 'narrador' com 'autor'. O autor é a pessoa histórica real que escreveu a obra; o narrador é uma entidade fictícia criada pelo autor para contar a história (que pode ser em 1ª pessoa - narrador-personagem ou testemunha - ou em 3ª pessoa - narrador onisciente ou observador)."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Análise do Protagonismo Popular em 'O Auto da Compadecida'",
      enunciado: "Em 'O Auto da Compadecida', de Ariano Suassuna, a personagem João Grilo é pobre, amarelo e faminto, mas consegue sobreviver às armadilhas do sertão enganando o padeiro, o padre e até o diabo no tribunal celeste. Qual arquétipo popular João Grilo encarna e qual crítica social Suassuna desenvolve através de sua astúcia?",
      resolucao_passo_a_passo: "1. Identificação da personagem: João Grilo é o arquétipo do herói pícaro (o 'amarelo' esperto, o bufão sagaz e o sobrevivente popular das narrativas de cordel ibérico-brasileiras).\n2. Arma de sobrevivência: Sem dinheiro, sem terras e sem poder político ou armas de fogo, a única ferramenta de que o pobre sertanejo dispõe para não morrer de fome diante da opressão estrutural é a sua inteligência viva, imaginação rápida e esperteza verbal.\n3. Crítica social: Suassuna utiliza a astúcia de João Grilo para ridicularizar e denunciar a avareza dos patrões (o padeiro que alimentava o cachorro com bife enquanto os empregados passavam fome) e a simonia/corrupção religiosa do clero (que aceitou benzer o cachorro da mulher do padeiro após o pagamento em dinheiro).\n4. Desfecho teológico: No julgamento final, a Virgem Maria (Nossa Senhora da Compunção/Compadecida) intercede por João Grilo, demonstrando que a misericórdia e a justiça de Deus acolhem o homem simples e oprimido antes dos hipócritas poderosos."
    }
  },
  questoes: [
    {
      id: "LIT_FOR_01",
      origem: "SAEB - 9º Ano EF",
      ano_escolar: "7º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Características da Crônica Urbana",
      tipo: "fechada",
      enunciado: "A crônica é um gênero textual consagrado no Brasil que se caracteriza primordialmente por:",
      alternativas: [
        { letra: "A", texto: "Partir de fatos corriqueiros e passageiros do cotidiano urbano para construir reflexões líricas, filosóficas ou bem-humoradas em tom de conversa íntima com o leitor." },
        { letra: "B", texto: "Apresentar rigorosa linguagem técnica e científica em tratados de duzentas páginas." },
        { letra: "C", texto: "Narrar grandes batalhas mitológicas com heróis sobrenaturais e deuses greco-romanos." },
        { letra: "D", texto: "Prescrever fórmulas e leis jurídicas obrigatórias de comércio internacional." },
        { letra: "E", texto: "Estruturar-se estritamente em sonetos clássicos decassílabos rimados." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A crônica aborda a efemeridade do dia a dia com leveza, sensibilidade poética e brevidade estilística.",
        porque: "Nascida na imprensa diária, a crônica brasileira de mestres como Rubem Braga transforma uma cena miúda da rua em literatura profunda e universal."
      }
    },
    {
      id: "LIT_FOR_02",
      origem: "Colégio Pedro II",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Ariano Suassuna e o Movimento Armorial",
      tipo: "fechada",
      enunciado: "Na peça teatral 'O Auto da Compadecida', de Ariano Suassuna, o autor recorre à tradição dos autos medievais vicentinos e à cultura popular sertaneja para:",
      alternativas: [
        { letra: "A", texto: "Criticar com humor satírico a avareza dos ricos e a hipocrisia do clero, exaltando a sabedoria e a misericórdia para com o povo sertanejo oprimido." },
        { letra: "B", texto: "Defender que os coronéis latifundiários eram governantes perfeitos e justos." },
        { letra: "C", texto: "Imitar rigidamente o teatro realista francês do século XIX sem elementos nacionais." },
        { letra: "D", texto: "Condenar João Grilo e Chicó às chamas eternas do inferno por serem pobres." },
        { letra: "E", texto: "Propor a abolição da fé religiosa católica em todo o Nordeste brasileiro." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Suassuna satiriza o bispo e o padre venais que celebram o enterro em latim do cachorro da mulher do padeiro mediante propina, enquanto desprezam os pobres.",
        porque: "No tribunal transcendental, Cristo (Manuel) e a Virgem Maria concedem graça a João Grilo, legitimando sua astúcia como defesa contra a crueldade da vida no sertão."
      }
    },
    {
      id: "LIT_FOR_03",
      origem: "Colégio Militar",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Conto de Enigma e Raciocínio Dedutivo: Arthur Conan Doyle",
      tipo: "fechada",
      enunciado: "Nas histórias clássicas de Sherlock Holmes criadas por Sir Arthur Conan Doyle, o método de investigação utilizado pelo detetive apoia-se fundamentalmente na:",
      alternativas: [
        { letra: "A", texto: "Observação minuciosa de pequenos detalhes materiais que passam despercebidos aos olhos comuns e na lógica dedutiva rigorosa baseada em evidências." },
        { letra: "B", texto: "Vidência sobrenatural e adivinhação astrológica de cartas de tarô." },
        { letra: "C", texto: "Tortura física sistemática de todos os suspeitos interrogados." },
        { letra: "D", texto: "Confissão voluntária e espontânea do criminoso logo na primeira página." },
        { letra: "E", texto: "Sorte cega e no acaso fortuito de pistas deixadas pelo vento." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Sherlock Holmes é o símbolo do positivismo e da racionalidade científica do século XIX aplicada à elucidação criminal.",
        porque: "Holmes analisa a cinza do charuto, as marcas de lama nos sapatos e os arranhões no relógio para reconstruir toda a cadeia de causas e efeitos que levou ao delito."
      }
    },
    {
      id: "LIT_FOR_04",
      origem: "SAEB - 9º Ano EF",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Foco Narrativo: Narrador-Personagem vs Narrador Onisciente",
      tipo: "fechada",
      enunciado: "Leia o fragmento: 'Entrei no casarão deserto sentindo um calafrio percorrer minha espinha. Não sabia o que esperar daquele silêncio que me sufocava, mas apertei a lanterna entre os dedos úmidos e dei mais três passos em direção à adega escura.' Nesse trecho, o foco narrativo é de:",
      alternativas: [
        { letra: "A", texto: "Primeira pessoa (narrador-personagem), pois a história é contada pela ótica subjetiva da própria personagem que vivencia a ação ('entrei', 'minha espinha', 'me sufocava')." },
        { letra: "B", texto: "Terceira pessoa onisciente que conhece os pensamentos de todos os habitantes da vila." },
        { letra: "C", texto: "Segunda pessoa intimista que acusa o leitor de covardia." },
        { letra: "D", texto: "Narrador-observador imparcial e distante como uma câmera de vigilância." },
        { letra: "E", texto: "Voz coletiva em coral sem individualidade." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O narrador em 1ª pessoa compartilha suas sensações corporais, dúvidas, medos e limitações de visão diretamente com o leitor.",
        porque: "Os pronomes e verbos conjugados na 1ª pessoa do singular marcam a subjetividade intrínseca de quem protagoniza o relato misterioso."
      }
    },
    {
      id: "LIT_FOR_05",
      origem: "Colégio de Aplicação UFRJ",
      ano_escolar: "7º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Romance Juvenil: 'O Meu Pé de Laranja Lima'",
      tipo: "fechada",
      enunciado: "No aclamado romance infantojuvenil 'O Meu Pé de Laranja Lima', de José Mauro de Vasconcelos, o menino Zezé conversa e desabafa suas mágoas e fantasias com 'Minguinho' (o pé de laranja lima do quintal) e desenvolve uma profunda amizade paterna com o português Manuel Valadares (o 'Portuga'). A perda trágica do Portuga e a perda de seu pé de laranja lima simbolizam:",
      alternativas: [
        { letra: "A", texto: "O doloroso rito de passagem da infância para a maturidade, com o fim precoce da ilusão e a descoberta da dor e da perda no mundo real." },
        { letra: "B", texto: "A vitória econômica da família que comprou uma grande fazenda produtiva." },
        { letra: "C", texto: "A revolta de Zezé que decide abandonar os estudos para virar marinheiro." },
        { letra: "D", texto: "O castigo exemplar aplicado ao menino por ser excessivamente travesso." },
        { letra: "E", texto: "Uma lenda fantástica indígena sobre plantas carnívoras gigantes." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A obra tematiza a sensibilidade e o sofrimento da infância pobre em Bangu, onde o afeto e a dor moldam o despertar precoce da consciência.",
        porque: "Ao perder o Portuga (sua âncora de carinho e ternura) e ver cortado o pé de laranja lima para o alargamento da rua, Zezé chora a morte definitiva de sua própria inocência infantil."
      }
    },
    {
      id: "LIT_FOR_06",
      origem: "IFs Técnicos",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Contos Fantásticos e de Terror: Edgar Allan Poe",
      tipo: "fechada",
      enunciado: "No conto clássico 'O Coração Delator' (The Tell-Tale Heart), de Edgar Allan Poe, o assassino esconde o cadáver desmembrado da vítima sob as tábuas do assoalho do quarto. Quando os policiais chegam para investigar, ele começa a ouvir um som incessante que vai aumentando de volume até fazê-lo confessar desesperado o crime. Esse som terrível provém:",
      alternativas: [
        { letra: "A", texto: "Da própria culpa alucinada e da consciência perturbada do assassino projetando as batidas do seu próprio coração acelerado pelo remorso e pânico." },
        { letra: "B", texto: "De um gravador escondido pelos detetives sob o tapete da sala." },
        { letra: "C", texto: "De um relógio de parede quebrado que disparou o alarme de incêndio." },
        { letra: "D", texto: "Da vítima que estava viva e acordou dos ferimentos." },
        { letra: "E", texto: "De ratos roendo os fios elétricos da residência." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Poe explora a psicologia do terror gótico e o colapso mental da paranoia criminosa.",
        porque: "A pulsação que enlouquece o narrador é a materialização psicótica da sua culpa irrevogável: o coração que bate no assoalho é o seu próprio coração desgovernado de terror diante da justiça moral inevitável."
      }
    },
    {
      id: "LIT_FOR_07",
      origem: "Colégio Militar",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Conto Social e Regionalismo: Graciliano Ramos e 'Baleia'",
      tipo: "fechada",
      enunciado: "No célebre capítulo 'Baleia', do livro 'Vidas Secas', de Graciliano Ramos, a cachorrinha da família de retirantes sertanejos é sacrificada por Fabiano por suspeita de hidrofobia. Ao narrar os momentos finais do animal, o narrador constrói os pensamentos e anseios de Baleia sonhando com um mundo cheio de preás gordos. Esse recurso expressivo revela:",
      alternativas: [
        { letra: "A", texto: "A extrema humanização e sensibilidade da cadela Baleia, estabelecendo um contraste comovente com a animalização e desumanização sofrida pelos seres humanos retirantes no sertão ressequido." },
        { letra: "B", texto: "O desinteresse do autor pelo sofrimento das crianças da família." },
        { letra: "C", texto: "Uma fábula cómica sem qualquer vínculo com a realidade das secas." },
        { letra: "D", texto: "A prova científica de que animais sonham em idioma português clássico." },
        { letra: "E", texto: "A celebração da caça predatória no bioma da Caatinga." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Graciliano inverte poeticamente a hierarquia: o animal é dotado de alma e generosidade, enquanto a miséria da seca embrutece e animaliza os homens.",
        porque: "Baleia morre querendo lamber as mãos de Fabiano e sonhando com um paraíso de caça, tornando esse um dos momentos mais líricos e dilacerantes de toda a literatura brasileira."
      }
    },
    {
      id: "LIT_FOR_08",
      origem: "Colégio Pedro II",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Gênero Dramático: As Rubricas Teatrais",
      tipo: "fechada",
      enunciado: "Em um texto dramático teatral, trechos destacados em itálico entre parênteses como: '(João Grilo aproxima-se cautelosamente da janela, olha para os lados com ar assustado e sussurra em tom conspiratório)' desempenham a função técnica de:",
      alternativas: [
        { letra: "A", texto: "Rubricas cênicas (indicações de cena), que instruem os atores e o diretor teatral sobre movimentação física, gestos, expressão facial e entonação vocal." },
        { letra: "B", texto: "Falas que devem ser lidas em voz alta por um narrador oculto no teatro." },
        { letra: "C", texto: "Pensamentos secretos da plateia registrados pelo bilheteiro." },
        { letra: "D", texto: "Críticas do jornal do dia seguinte sobre a atuação do elenco." },
        { letra: "E", texto: "Correções ortográficas feitas pelo editor do livro." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "As didascálias ou rubricas são instruções cênicas do dramaturgo fundamentais para a montagem e encenação física do texto dramático.",
        porque: "Diferenciam-se das falas dialogadas das personagens por orientarem o trabalho do diretor, figurinista, iluminador e atores nos tablados."
      }
    },
    {
      id: "LIT_FOR_09",
      origem: "Olimpíada de Língua Portuguesa",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "A Crônica Lírica de Rubem Braga",
      tipo: "fechada",
      enunciado: "Rubem Braga é consagrado como o maior cronista da literatura brasileira por elevar a crônica jornalística à categoria de alta poesia em prosa. Na sua crônica 'Ai de ti, Copacabana!', o tom nostálgico e melancólico diante da urbanização desenfreada expressa:",
      alternativas: [
        { letra: "A", texto: "A saudade da beleza lírica original da praia e a crítica à especulação imobiliária e ao concreto que sufocam a espontaneidade da vida simples." },
        { letra: "B", texto: "A comemoração pelo asfaltamento total de todas as áreas verdes do Rio de Janeiro." },
        { letra: "C", texto: "Um guia turístico comercial voltado para a venda de passagens aéreas." },
        { letra: "D", texto: "A recusa da praia como espaço de convivência pública democrática." },
        { letra: "E", texto: "Um estudo de engenharia sobre a dragagem de areia da orla oceânica." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A lírica braguiana alia a contemplação da natureza e do mar à reflexão amarga sobre a modernização desumanizadora dos grandes centros.",
        porque: "Rubem Braga poetiza a perda da cidade bucólica e a solidão do homem moderno aprisionado nos arranha-céus de apartamentos cinzentos."
      }
    },
    {
      id: "LIT_FOR_10",
      origem: "Colégio Militar",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Lygia Bojunga e a Emancipação Feminina Juvenil",
      tipo: "fechada",
      enunciado: "No livro premiado 'A Bolsa Amarela', de Lygia Bojunga, a menina Raquel guarda em uma grande bolsa amarela três vontades secretas que a família censura: a vontade de crescer, a vontade de ter nascido menino e a vontade de escrever. A bolsa amarela funciona na narrativa como uma metáfora de:",
      alternativas: [
        { letra: "A", texto: "Um espaço íntimo e seguro de resistência psíquica e imaginação, onde a jovem guarda seus desejos reprimidos pelo machismo e pelo autoritarismo familiar até conquistar sua própria voz autônoma." },
        { letra: "B", texto: "Um acessório de moda comprado em loja cara para ostentar riqueza às amigas." },
        { letra: "C", texto: "Uma bolsa mágica que multiplica moedas de ouro e joias preciosas." },
        { letra: "D", texto: "Um castigo imposto pelos professores para carregar livros pesados." },
        { letra: "E", texto: "O desinteresse completo da personagem pelos estudos literários." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A obra de Lygia Bojunga (vencedora do Prêmio Hans Christian Andersen) aborda a repressão dos sentimentos da infância e a busca de identidade.",
        porque: "A bolsa é o refúgio das angústias de Raquel; ao libertar seus desejos ao longo do livro, ela aprende a aceitar-se como mulher e como escritora talentosa."
      }
    },
    {
      id: "LIT_FOR_11",
      origem: "Colégio Naval",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Novela Policial e o Método Indutivo-Dedutivo",
      tipo: "fechada",
      enunciado: "Em 'O Cão dos Baskervilles', de Arthur Conan Doyle, uma lenda secular sobre uma fera fantasmagórica que assombra os pântanos de Devonshire é investigada por Sherlock Holmes e Dr. Watson. O desenlace da narrativa demonstra a vitória de qual cosmovisão sobre a crendice supersticiosa?",
      alternativas: [
        { letra: "A", texto: "O triunfo da razão lógica, da investigação material e da ciência moderna que desmascara a manipulação criminosa orquestrada sob o disfarce de um mito sobrenatural." },
        { letra: "B", texto: "A confirmação de que demônios e lobisomens habitam as montanhas inglesas." },
        { letra: "C", texto: "A renúncia da polícia que admite sua incapacidade diante da magia negra." },
        { letra: "D", texto: "A conversão de Sherlock Holmes ao ocultismo espiritualista." },
        { letra: "E", texto: "A fuga definitiva do assassino para a América sem qualquer punição." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A novela policial clássica é herdeira direta do Iluminismo: toda sombra e terror sobrenatural são dissipados pela luz da razão e das provas empíricas.",
        porque: "Holmes descobre que o monstro era um mastim real coberto com fósforo luminescente pelo vilão Stapleton para induzir a morte dos herdeiros por parada cardíaca e usurpar o patrimônio."
      }
    },
    {
      id: "LIT_FOR_12",
      origem: "Colégio Militar de Salvador",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Clarice Lispector e a Crônica Epifânica",
      tipo: "fechada",
      enunciado: "Em crônicas intimistas de Clarice Lispector, como 'Restos do Carnaval' ou 'Banhos de Mar', fatos mínimos da infância ou uma flor sobre a mesa deflagram um momento de súbita revelação existencial e percepção profunda da realidade. Na crítica literária, esse instante de iluminação e choque de consciência é denominado:",
      alternativas: [
        { letra: "A", texto: "Epifania (momento epifânico de revelação)." },
        { letra: "B", texto: "Catarse cômica teatral." },
        { letra: "C", texto: "Aventura picaresca de capa e espada." },
        { letra: "D", texto: "Aliteração barroca gongórica." },
        { letra: "E", texto: "Parataxe jornalística fria." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A epifania clariceana é o salto do banal para o transcendental, onde um objeto cotidiano rasga a casca do hábito e expõe a crueza do ser.",
        porque: "Clarice transforma a crônica em um espaço de sondagem psicológica visceral e filosófica do mistério da existência."
      }
    },
    {
      id: "LIT_FOR_13",
      origem: "Colégio Pedro II 2ª Fase",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Análise Crítica de Crônica: Luis Fernando Verissimo",
      tipo: "aberta",
      enunciado: "Na famosa crônica humorística 'O Lixo', de Luis Fernando Verissimo, dois vizinhos solteiros que moram em apartamentos em frente começam a conversar e a conhecer profundamente a intimidade, hábitos de consumo e gostos um do outro ao se encontrarem no corredor do prédio examinando o conteúdo dos sacos de lixo reciclável que colocavam para fora. (a) De que maneira o lixo doméstico atua no texto como um retrato sociológico da vida privada contemporânea? (b) Qual é a crítica bem-humorada que o cronista faz sobre as aparências sociais nos grandes edifícios?",
      resposta: "(a) O lixo revela os hábitos alimentares, remédios e segredos reais que as pessoas ocultam nas redes sociais; (b) As pessoas vivem isoladas em edifícios sem se comunicar diretamente, precisando de pretextos insólitos para quebrar a solidão urbana.",
      gabarito: {
        letra: "Aberta",
        ancora: "O lixo cotidiano como raio X semiótico e sociológico da sociedade de consumo moderna.",
        espera_se: "(a) Retrato sociológico: Na sociedade de consumo, o que descartamos na lixeira doméstica é o espelho mais fidedigno de quem realmente somos: as embalagens de comida pronta, as garrafas de vinho barato, os remédios para insônia e as faturas revelam as carências, os vícios e a rotina íntima desprovida das máscaras sociais que usamos em público.\n(b) Crítica urbana: Verissimo ironiza a alienação e a solidão crônica dos moradores de grandes metrópoles, que dividem o mesmo corredor por anos sem trocar um 'bom-dia'. O encontro inusitado e romântico mediado pelos sacos de lixo quebra essa barreira de indiferença, mostrando a fome humana de conexão e diálogo."
      }
    },
    {
      id: "LIT_FOR_14",
      origem: "Olimpíada de Língua Portuguesa",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Poema Narrativo e Personagens Marginalizadas: 'Morte e Vida Severina'",
      tipo: "aberta",
      enunciado: "No auto de natal pernambucano 'Morte e Vida Severina', de João Cabral de Melo Neto, o protagonista Severino se apresenta logo no início dizendo que há muitos 'Severinos' com a mesma vida franzina, filhos de tantas Marias, que morrem de velhice antes dos trinta e de emboscada antes dos vinte. (a) O que o substantivo próprio 'Severino' passa a representar na obra? (b) Por que se pode afirmar que Severino deixa de ser um único indivíduo para se tornar um personagem-tipo coletivo?",
      resposta: "(a) Representa a sorte severa, dura e miserável do homem do sertão; (b) É um personagem-tipo coletivo porque sintetiza as agruras e a tragédia anônima de todo o campesinato retirante nordestino.",
      gabarito: {
        letra: "Aberta",
        ancora: "Severino como arquétipo coletivo do retirante da seca e da opressão fundiária.",
        espera_se: "(a) Significado simbólico: O nome Severino carrega a raiz da palavra 'severo' (dureza, rigor, sofrimento implacável). A 'vida severina' é a existência privada de água, de terra e de direitos, onde a morte é a única certeza constante da infância à velhice precoce.\n(b) Personagem coletivo: Ao declarar que é apenas mais um entre tantos com a mesma cara magra e a mesma sina desgraçada, Severino perde a individualidade burguesa e encarna a voz universal de milhares de trabalhadores sertanejos expulsos pela seca e pela monocultura do latifúndio em marcha desesperada em direção ao litoral."
      }
    },
    {
      id: "LIT_FOR_15",
      origem: "Colégio Militar / EPCAR",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Conto Policial Psicológico: O Duplo em 'William Wilson' de Poe",
      tipo: "aberta",
      enunciado: "No conto clássico 'William Wilson', de Edgar Allan Poe, o protagonista é atormentado ao longo de toda a vida por um colega de escola de mesmo nome, mesma data de nascimento e mesma fisionomia, que fala apenas sussurrando e sempre aparece nos momentos em que o narrador vai cometer uma trapaça moral ou jogo desonesto. Ao final, Wilson esfaqueia seu duplo diante de um grande espelho. (a) O que a figura do duplo (Doppelgänger) sussurrante personifica na psicologia do protagonista? (b) O que significa a fala final do duplo moribundo: 'Em mim mesmo tu existias — e, na minha morte, vê como assassinaste a ti mesmo'?",
      resposta: "(a) Personifica a voz da própria Consciência Moral reprimida que ele tentava sufocar; (b) Ao assassinar a própria consciência moral, o indivíduo aniquila a sua própria alma e existência espiritual.",
      gabarito: {
        letra: "Aberta",
        ancora: "O tema do Duplo (Doppelgänger) como cisão psíquica e destruição da integridade moral do indivíduo.",
        espera_se: "(a) Personificação psíquica: O duplo sussurrante de William Wilson não é uma pessoa externa real, mas a projeção tangível e alucinada de sua própria Consciência Moral e do Superego. A voz em sussurro constante é o sussurro da culpa e da ética que o persegue toda vez que ele se entrega à devassidão, ao crime ou à fraude.\n(b) Significado da morte no espelho: Quando Wilson mata a facadas o duplo que refletia sua imagem no espelho, ele comete suicídio moral e espiritual irrevogável. A fala final evidencia que a moralidade e a consciência eram partes inseparáveis do seu próprio ser essencial; ao extirpar violentamente a sua capacidade de distinguir o bem do mal, ele matou a própria essência humana que o mantinha espiritualmente vivo."
      }
    }
  ]
};

// -------------------------------------------------------------
// 3. LITERATURA - REALISMO E ROMANTISMO
// -------------------------------------------------------------
const litRomantismoRealismo = {
  disciplina: "Literatura",
  modulo: "Realismo_e_Romantismo",
  subpasta: "Romantismo_e_Realismo",
  arquivo_origem: "Questoes_Realismo_e_Romantismo.json",
  benchmark_didatico: {
    capitulo: "A Literatura do Século XIX no Brasil: Romantismo, Realismo e Naturalismo",
    objetivos_aprendizagem: [
      "Caracterizar as três gerações da poesia romântica brasileira (Nacionalista/Indianista, Ultrarromântica/Byroniana e Condoreira/Social).",
      "Analisar o romance romântico urbano, indianista e regionalista de José de Alencar e sua busca pela identidade e linguagem nacional.",
      "Compreender a ruptura realista machadiana com 'Memórias Póstumas de Brás Cubas' e dominar as técnicas narrativas do Realismo (psicologismo, ironia, narrador não-confiável e desconstrução das ilusões burguesas).",
      "Diferenciar Realismo de Naturalismo (Aluísio Azevedo e 'O Cortiço': determinismo biológico, zoomorfização e patologia social)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Gerações Românticas no Brasil",
          definicao: "1ª Geração (Nacionalista/Indianista: Gonçalves Dias): celebra a pátria independente, a natureza exuberante e elege o indígena como herói nobre e puro ('Canção do Exílio', 'I-Juca Pirama'). 2ª Geração (Ultrarromantismo/Mal do Século: Álvares de Azevedo, Casimiro de Abreu): subjetivismo exacerbado, pessimismo, escapismo na morte, morbidez e idealização amorosa inalcançável. 3ª Geração (Condoreira/Hugoana: Castro Alves): poesia social, engajada e abolicionista ('O Navio Negreiro'), clamando por justiça e liberdade dos escravizados com grandiloquência oratória."
        },
        {
          termo: "O Realismo Machadiano e a Ruptura de 1881",
          definicao: "Inaugurado com 'Memórias Póstumas de Brás Cubas' (1881), o Realismo sepulta a ingenuidade romântica. Machado de Assis adota o narrador em 1ª pessoa defunto autor ('não sou propriamente um autor defunto, mas um defunto autor'), liberto das pressões sociais, que disseca a hipocrisia, a mediocridade, a volubilidade e o egoísmo da elite carioca escravocrata do Segundo Reinado. Obras-primas da trilogia madura ('Quincas Borba', 'Dom Casmurro') consagram a psicologia profunda, a ironia sutil, o diálogo metalinguístico com o leitor e a ambiguidade perene (o enigma de Capitu)."
        },
        {
          termo: "Naturalismo e o Determinismo Científico",
          definicao: "Influenciado pelo positivismo de Comte, o evolucionismo de Darwin e o determinismo de Taine (o homem é produto biológico da raça, do meio e do momento histórico). Em 'O Cortiço' (1890), de Aluísio Azevedo, o verdadeiro protagonista é a própria habitação coletiva insalubre. As personagens agem movidas por instintos primitivos sexuais e de sobrevivência, ocorrendo o fenômeno da zoomorfização (homens descritos com traços de animais e o cortiço descrito como um organismo biológico vivo e pulsante)."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico em vestibulares: afirmar que Capitu traiu Bentinho em 'Dom Casmurro'. O narrador é Bento Santiago (o próprio marido corroído pelo ciúme patológico e pela necessidade de justificar seu abandono), tornando o relato unilateral e não-confiável. O romance é uma obra-prima da suspeita e do julgamento enviesado, e não um caso de polícia com provas materiais definitivas."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: O Narrador Não-Confiável em 'Dom Casmurro'",
      enunciado: "Explique por que a crítica literária moderna considera Bento Santiago um narrador não-confiável e como essa técnica narrativa sustenta o enigma da traição de Capitu.",
      resolucao_passo_a_passo: "1. Identificação do foco narrativo: O romance é narrado em primeira pessoa por Bento Santiago já idoso, solitário e amargurado no Engenho Novo, tentando 'atar as duas pontas da vida'.\n2. Natureza da voz narrativa: Bento é a única fonte de informação do leitor. Não temos acesso direto aos pensamentos, diários ou depoimentos de Capitu nem de Escobar; tudo o que sabemos passa pelo filtro seletivo, ciumento e rancoroso da memória do narrador.\n3. Construção do delírio de ciúme: Desde a adolescência, Bentinho revela imaginação doentia, insegurança e fixação obsessiva ('olhos de cigana oblíqua e dissimulada'). As 'provas' da semelhança de Ezequiel com Escobar são indícios subjetivos interpretados por ele próprio.\n4. Conclusão estética: A genialidade de Machado não reside em desvendar se houve adultério ou não, mas em aprisionar o leitor no labirinto da mente de um homem obcecado que constrói a culpa da mulher para absolver a si mesmo de sua própria covardia e fracasso existencial."
    }
  },
  questoes: [
    {
      id: "LIT_ROM_01",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Primeira Geração Romântica: O Indianismo de Gonçalves Dias",
      tipo: "fechada",
      enunciado: "Na primeira geração do Romantismo brasileiro, a escolha do indígena como símbolo da nacionalidade e herói épico atendeu primordialmente à necessidade ideológica de:",
      alternativas: [
        { letra: "A", texto: "Construir uma identidade nacional autônoma no pós-Independência (1822), elegendo o nativo pré-cabralino como o 'bom selvagem' virtuoso e nobre, sem os laços coloniais portugueses nem a presença incômoda da escravidão africana." },
        { letra: "B", texto: "Denunciar a miséria contemporânea dos povos indígenas explorados pela borracha na Amazônia." },
        { letra: "C", texto: "Retratar fielmente os rituais antropofágicos reais com rigor etnográfico moderno." },
        { letra: "D", texto: "Imitar rigidamente as tragédias gregas de Sófocles em território colonial." },
        { letra: "E", texto: "Substituir a literatura de língua portuguesa por poemas em tupi-guarani arcaico." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O índio romântico foi uma construção poética idealizada para dotar o Brasil recém-independente de um passado heroico e cavalheiresco equivalente à Idade Média europeia.",
        porque: "Gonçalves Dias e Alencar moldaram o indígena segundo os códigos de nobreza e cavalaria, ignorando a violência real da colonização para erguer um mito fundador da nação."
      }
    },
    {
      id: "LIT_ROM_02",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Terceira Geração Romântica: A Poesia Condoreira de Castro Alves",
      tipo: "fechada",
      enunciado: "Nos versos de 'O Navio Negreiro', de Castro Alves: 'Era um sonho dantesco... o tombadilho / Que das luzernas avermelha o brilho, / Em sangue a se banhar. / Tinir de ferros... estalar do açoite... / Legiões de homens negros como a noite, / Horrendos a dançar...', a estética condoreira manifesta-se através de:",
      alternativas: [
        { letra: "A", texto: "Grandiloquência oratória, imagens hiperbólicas, apelo dramático sensorial e denúncia veemente da desumanidade criminosa do tráfico negreiro transatlântico." },
        { letra: "B", texto: "Subjetivismo melancólico focado na tuberculose e na morte prematura do poeta." },
        { letra: "C", texto: "Celebração das belezas naturais da fauna marinha brasileira." },
        { letra: "D", texto: "Ironia cética que ridiculariza o sofrimento dos marinheiros escravistas." },
        { letra: "E", texto: "Rigidez formal parnasiana focada na impassibilidade métrica pura." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O 'Condor' é a ave que voa alto; a poesia condoreira de Castro Alves desce da torre de marfim para clamar na praça pública pela abolição imediata da escravidão.",
        porque: "A evocação de Dante Alighieri ('sonho dantesco') transforma o porão do navio negreiro em um círculo infernal terreno, convocando o leitor à indignação moral e política."
      }
    },
    {
      id: "LIT_ROM_03",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Memórias Póstumas de Brás Cubas e a Condição de Defunto Autor",
      tipo: "fechada",
      enunciado: "Ao iniciar suas 'Memórias Póstumas' declarando que dedica a obra 'ao verme que primeiro roeu as frias carnes do meu cadáver', Brás Cubas inaugura uma nova postura narrativa na literatura brasileira porque:",
      alternativas: [
        { letra: "A", texto: "Escreve a partir do túmulo ('defunto autor'), liberto da hipocrisia social, do medo das opiniões alheias e das convenções morais dos vivos, podendo dissecar com franqueza impiedosa a futilidade da elite carioca." },
        { letra: "B", texto: "Acredita na reencarnação espírita como salvação para seus crimes da juventude." },
        { letra: "C", texto: "Pretende escrever um tratado de biologia médica sobre a decomposição de tecidos humanos." },
        { letra: "D", texto: "Lamenta profundamente ter morrido sem se casar com Virgília." },
        { letra: "E", texto: "Tenta comover o leitor para que rezem missas de sufrágio por sua alma." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A condição póstuma do narrador confere a Brás Cubas a imunidade absoluta contra o julgamento da sociedade.",
        porque: "Do além-túmulo, ele pode confessar sem pudor seu egoísmo, suas vaidades medíocres, a exploração do escravo Prudêncio e seu grande invento inútil (o emplastro), coroando o livro com o balanço cáustico das 'negativas': 'não tive filhos, não transmiti a nenhuma criatura o legado da nossa miséria'."
      }
    },
    {
      id: "LIT_ROM_04",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Naturalismo e Zoomorfização em 'O Cortiço'",
      tipo: "fechada",
      enunciado: "Em 'O Cortiço', de Aluísio Azevedo, personagens humanas são frequentemente comparadas a animais ('formigueiro', 'enxame', 'fêmea no cio', 'cães farejadores'). Esse recurso estilístico da estética naturalista é denominado:",
      alternativas: [
        { letra: "A", texto: "Zoomorfização (ou animalização), que reduz os comportamentos humanos aos instintos biológicos mais básicos de fome, sexo e agressividade regidos pelo meio ambiente." },
        { letra: "B", texto: "Personificação alegórica do mundo vegetal." },
        { letra: "C", texto: "Sinestesia sensorial acústica." },
        { letra: "D", texto: "Hipérbole idealizadora do romantismo sertanejo." },
        { letra: "E", texto: "Eufemismo que embeleza a vida dos desvalidos." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O Naturalismo enxerga o homem sob a ótica da zoologia e da patologia médica, desprovido de livre-arbítrio espiritual.",
        porque: "No romance, os moradores do cortiço agem impulsionados por impulsos fisiológicos deterministas, transformando a habitação coletiva em um organismo biológico coletivo em permanente fermentação."
      }
    },
    {
      id: "LIT_ROM_05",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "O Humanitismo em 'Quincas Borba'",
      tipo: "fechada",
      enunciado: "A filosofia ficcional do 'Humanitismo' criada pela personagem Quincas Borba tem como lema a célebre máxima: 'Ao vencedor, as batatas!'. Essa teoria filosófica machadiana funciona como uma paródia sarcástica de qual corrente do pensamento do século XIX?",
      alternativas: [
        { letra: "A", texto: "Do Darwinismo Social e do Positivismo, ironizando a justificativa científica da vitória do mais forte e o extermínio cruel dos vulneráveis sob o pretexto de evolução civilizatória." },
        { letra: "B", texto: "Do Marxismo e da luta de classes proletária revolucionária." },
        { letra: "C", texto: "Da escolástica medieval católica tomista." },
        { letra: "D", texto: "Do Existencialismo sartreano do pós-guerra." },
        { letra: "E", texto: "Da mística oriental hinduísta sobre a reencarnação pacífica." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Quincas Borba cria uma filosofia delirante segundo a qual a guerra entre duas tribos famintas por um prato de batatas é legítima porque a sobrevivência de uma garante a conservação de 'Humanitas'.",
        porque: "Machado ridiculariza com elegância atroz as teorias sociológicas que usavam a biologia darwinista para justificar a espoliação imperialista e a crueldade social da época."
      }
    },
    {
      id: "LIT_ROM_06",
      origem: "UNESP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Romantismo: O Regionalismo de 'Inocência' (Visconde de Taunay)",
      tipo: "fechada",
      enunciado: "O romance 'Inocência', de Visconde de Taunay, ambientado no sertão do Mato Grosso, retrata os costumes rígidos da sociedade patriarcal do interior do Brasil no século XIX. O drama central da protagonista Inocência decorre da:",
      alternativas: [
        { letra: "A", texto: "Imposição autoritária do pai (Pereira), que a promete em casamento de conveniência ao rude Manecão, impedindo seu amor verdadeiro e puro pelo jovem médico itinerante Cirino." },
        { letra: "B", texto: "Disputa de terras armadas entre fazendeiros de café no Vale do Paraíba." },
        { letra: "C", texto: "Invasão de tropas paraguaias durante o conflito da Guerra da Tríplice Aliança." },
        { letra: "D", texto: "Recusa de Inocência em aceitar os sacramentos religiosos da Igreja Católica." },
        { letra: "E", texto: "Fuga dos escravizados da fazenda em direção aos quilombos do Pantanal." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Taunay retrata a tragédia amorosa romântica sufocada pelas leis de honra inflexíveis e patriarcais do sertão profundo.",
        porque: "O desfecho trágico (o assassinato de Cirino por Manecão e a morte de Inocência por desespero amoroso) consagra o choque entre o sentimento individual autêntico e a opressão dos casamentos arranjados."
      }
    },
    {
      id: "LIT_ROM_07",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "O Papel da Mulher: Romantismo vs Realismo",
      tipo: "fechada",
      enunciado: "Compare a representação feminina em 'Senhora' (José de Alencar, Romantismo) e em 'Dom Casmurro' (Machado de Assis, Realismo). É correto afirmar que:",
      alternativas: [
        { letra: "A", texto: "Em 'Senhora', Aurélia Camargo, embora compre o noivo por dote, regenera-se pelo perdão romântico e amor idealizado final; em 'Dom Casmurro', Capitu é uma personagem densa, autônoma e enigmática, cuja complexidade psicológica escapa ao controle do narrador patriarcal." },
        { letra: "B", texto: "Ambas as personagens são vítimas passivas e submissas sem voz própria na sociedade." },
        { letra: "C", texto: "Aurélia é uma vilã perversa assassinada no fim, e Capitu confessa seus adultérios publicamente." },
        { letra: "D", texto: "Alencar retrata a mulher sob determinismo zoomórfico e Machado sob angelismo infantil." },
        { letra: "E", texto: "Ambos os autores defendem o casamento comercial por dote financeiro como o único modelo ideal." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Alencar ainda se curva ao fechamento moralizante romântico do amor redentor; Machado constrói a figura feminina mais rica e inesgotável da literatura em língua portuguesa.",
        porque: "Capitu transcende o estereótipo da donzela pura ou da adúltera simplória, tornando-se uma esfinge que desafia a mediocridade provinciana de Bentinho."
      }
    },
    {
      id: "LIT_ROM_08",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Naturalismo e Crítica Social em 'O Ateneu'",
      tipo: "fechada",
      enunciado: "No romance 'O Ateneu' (1888), de Raul Pompéia, o narrador Sérgio relembra sua internação no famoso colégio interno dirigido pelo pomposo diretor Aristarco. A frase inicial célebre do livro resume o impacto desse universo educacional sobre o jovem:",
      alternativas: [
        { letra: "A", texto: "'“Vais encontrar o mundo”, disse-me meu pai à porta do Ateneu: “coragem para a luta”.' — apresentando a escola como um microcosmo impiedoso da hipocrisia e corrupção da sociedade adulta." },
        { letra: "B", texto: "'Minha infância querida nunca conheceu dores ou lágrimas naquele colégio paradisíaco.'" },
        { letra: "C", texto: "'Aristarco era um mestre humilde que abriu mão de todo o dinheiro para educar os órfãos.'" },
        { letra: "D", texto: "'Aprendi no internato que a lealdade militar é o único valor verdadeiro da vida.'" },
        { letra: "E", texto: "'O Ateneu ardeu em chamas porque os alunos queriam apenas brincar no pátio.'" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Pompéia concebe o colégio interno não como refúgio pedagógico, mas como um palco sufocante de jogos de poder, aparências falsas e degradação moral.",
        porque: "O incêndio final do colégio simboliza a derrocada catastrófica daquele monumento à vaidade burguesa administrado pelo falso pedagogo Aristarco."
      }
    },
    {
      id: "LIT_ROM_09",
      origem: "AFA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Segunda Geração Romântica: O Mal do Século de Álvares de Azevedo",
      tipo: "fechada",
      enunciado: "A obra 'Noite na Taverna' e os poemas de 'Lira dos Vinte Anos', de Álvares de Azevedo, são os expoentes máximos do Ultrarromantismo (Byronismo) no Brasil. Seus temas recorrentes são caracterizados por:",
      alternativas: [
        { letra: "A", texto: "Obsessão pela morte como refúgio supremo, melancolia, tédio existencial (spleen), morbidez, erotismo difuso e idealização inalcançável da mulher virgem e fantasmagórica." },
        { letra: "B", texto: "Exaltação patriótica do trabalho nas fábricas de carvão de São Paulo." },
        { letra: "C", texto: "Defesa enfática da abolição da escravatura nos comícios do Senado." },
        { letra: "D", texto: "Descrição realista e científica das doenças venéreas da época." },
        { letra: "E", texto: "Tradução fiel dos sonetos de Camões e Petrarca sem inovações." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O Mal do Século alimentou-se da frustração da juventude acadêmica de Direito do Largo São Francisco em São Paulo, assolada pela tuberculose e pelo pessimismo.",
        porque: "Álvares de Azevedo oscila magistralmente entre a pureza etérea da virgem adormecida e o cinismo macabro das orgias soturnas da taverna."
      }
    },
    {
      id: "LIT_ROM_10",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "O Pastiche e a Ironia Estrutural Machadiana",
      tipo: "fechada",
      enunciado: "Em 'Memórias Póstumas de Brás Cubas', o capítulo 'Das Negativas' resume a trajetória do protagonista: 'Não alcancei a celebridade do emplastro, não fui ministro, não fui califa, não conheci o casamento... Não tive filhos, não transmiti a nenhuma criatura o legado da nossa miséria'. Esse encerramento condensa a visão machadiana de mundo como:",
      alternativas: [
        { letra: "A", texto: "Um ceticismo irônico radical sobre a existência humana, no qual o alívio supremo consiste em não perpetuar a linhagem do sofrimento e das vaidades burguesas estéreis." },
        { letra: "B", texto: "Um desespero suicida que clama pelo perdão e salvação no purgatório." },
        { letra: "C", texto: "Uma lição moral cristã tradicional sobre a importância da família numerosa." },
        { letra: "D", texto: "Uma apologia à revolução socialista proletária do século XIX." },
        { letra: "E", texto: "O arrependimento sincero de um herói que falhou em salvar a pátria militarmente." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Brás Cubas contabiliza como vitória positiva final o fato de não ter procriado.",
        porque: "O niilismo e a ironia de Machado atingem seu ápice: numa vida inteira pautada pelo ócio fútil da classe dominante, o único saldo positivo foi ter poupado uma nova geração de herdar a miséria moral da humanidade."
      }
    },
    {
      id: "LIT_ROM_11",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "O Cortiço e a Tese do Meio Modificador (Taine)",
      tipo: "fechada",
      enunciado: "Em 'O Cortiço', a trajetória da personagem Jerônimo — o imigrante português sério, sóbrio, trabalhador e apegado à sua família — sofre uma drástica metamorfose ao transferir-se para o cortiço e envolver-se com a mestiça Rita Baiana. Essa transformação ilustra a tese naturalista de que:",
      alternativas: [
        { letra: "A", texto: "O meio físico e social tropical insalubre e o contágio dos instintos sensuais 'abrasileirados' degradam e sobrepujam a força de vontade individual, determinando a decadência moral do europeu." },
        { letra: "B", texto: "O trabalho braçal na pedreira regenera espiritualmente qualquer homem vicioso." },
        { letra: "C", texto: "O casamento com mulheres europeias é incompatível com o clima do Rio de Janeiro." },
        { letra: "D", texto: "A moral religiosa católica resiste incólume a qualquer tentação do ambiente." },
        { letra: "E", texto: "O imigrante português enriqueceu rapidamente montando uma fábrica têxtil." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Aplicação direta do determinismo de Hippolyte Taine: Meio, Raça e Momento.",
        porque: "Jerônimo troca a fado pelo violão e pela cachaça, abandona a esposa Piedade e assassina Firmo por ciúmes de Rita Baiana, servindo de comprovação laboratorial à tese do autor sobre a força 'corruptora' do meio ambiente."
      }
    },
    {
      id: "LIT_ROM_12",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Metalinguagem e Digressões na Prosa Machadiana",
      tipo: "fechada",
      enunciado: "Em diversos momentos de seus romances maduros, o narrador machadiano interrompe o fio da narrativa para dirigir-se diretamente ao leitor: 'Tu tens pressa de envelhecer, e o livro anda devagar; tu amas a narração direta e nutrida, o estilo regular e fluente, e este meu estilo é frouxo, como os ébrios...'. Esse procedimento formal tem por função estilística:",
      alternativas: [
        { letra: "A", texto: "Quebrar a ilusão mimética da ficção, forçando o leitor a adotar uma postura crítica e consciente perante o próprio processo de construção do texto literário." },
        { letra: "B", texto: "Pedir desculpas sinceras aos leitores por sua incapacidade estilística de escrever romances." },
        { letra: "C", texto: "Cumprir uma exigência comercial dos editores de folhetins de jornal." },
        { letra: "D", texto: "Adormecer a atenção do leitor para esconder o desfecho do mistério policial." },
        { letra: "E", texto: "Imitar as tragédias gregas que exigiam um coro de anciãos no palco." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Machado desconstrói a passividade do leitor burguês acostumado aos folhetins românticos lineares.",
        porque: "Ao chamar a atenção para os truques, pausas e costuras da escrita, o narrador desmistifica o realismo ingênuo e instaura a modernidade da autoconsciência metalinguística."
      }
    },
    {
      id: "LIT_ROM_13",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Escravidão na Obra de Machado de Assis",
      tipo: "aberta",
      enunciado: "No conto machadiano 'Pai contra Mãe', o protagonista Cândido Neves, na extrema miséria e prestes a entregar o filho recém-nascido na Roda dos Enjeitados, captura a escrava fugida Arminda para receber a recompensa de cem mil-réis. Ao ser capturada grávida e devolvida ao senhor, a escrava sofre um aborto violento na presença de Cândido, que diz consigo: 'Nem todas as crianças vingam'. Analise com rigor crítico: (a) Como a escravidão corrompe a moral de homens livres e pobres como Cândido Neves; (b) O significado ético da frase final pronunciada pelo protagonista.",
      resposta: "(a) Força homens pobres a caçar seus semelhantes como única alternativa de sobrevivência econômica; (b) Expressa a fria racionalização moral que anestesia a culpa através de uma máxima genérica conformista.",
      gabarito: {
        letra: "Aberta",
        ancora: "Machado expõe o horror da escravidão entranhada na ordem social cotidiana e na sobrevivência material das classes pobres.",
        espera_se: "(a) Degradação moral do homem livre: Cândido Neves ('Candinho') não é um monstro sádico vocacional; é um homem pobre e desqualificado para o trabalho formal numa sociedade escravocrata que despreza o trabalho braçal. Para conseguir o dinheiro que salvará seu próprio filho da mendicância ou morte, ele é empurrado a se tornar um capitão-do-mato profissional que caça seres humanos escravizados como mercadorias lucrativas.\n(b) Significado ético da frase final: A frase 'Nem todas as crianças vingam' representa o ápice da covardia moral e da autojustificação cínica. Diante do espetáculo pavoroso do feto natimorto jogado no chão pela escrava espancada, Candinho alivia seu remorso transferindo a responsabilidade da tragédia para a natureza biológica impessoal, consolando-se de que o seu próprio filho sobreviverá às custas da destruição do filho da mulher negra escravizada."
      }
    },
    {
      id: "LIT_ROM_14",
      origem: "UNICAMP 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "O Triângulo Amoroso em 'Dom Casmurro': Ezequiel e o Retrato de Escobar",
      tipo: "aberta",
      enunciado: "No velório de Escobar, afogado na praia do Flamengo, Bentinho observa fixamente a reação de Capitu diante do esquife e descreve: 'Capitu olhou alguns segundos para o cadáver... olhou como quem chora uma perda sem remédio... Os olhos de ressaca fitavam o defunto; e se lágrimas não correram, era porque o mar as engolira todas para dentro'. Explique de que modo o ciúme de Bentinho converte a dor da amiga de infância da família em uma evidência subjetiva de adultério para corroborar sua própria desconfiança prévia.",
      resposta: "Bentinho lê a dor de Capitu pelo prisma pré-moldado do ciúme, interpretando a condolência sincera como confissão muda de amor proibido.",
      gabarito: {
        letra: "Aberta",
        ancora: "A hermenêutica do ciúme e a manipulação dos indícios pelo narrador apaixonado e vingativo.",
        espera_se: "Bentinho não tolera que Capitu manifeste dor pelo falecimento do amigo mais íntimo do casal. Em vez de enxergar uma amiga de casa entristecida com a morte trágica de Escobar, o narrador projeta sobre o olhar de Capitu a sua paranoia de traição. A metáfora dos 'olhos de ressaca que engolem o choro para dentro' é uma construção retórica machadiana que não comprova qualquer fato concreto material de adultério, mas sim a certeza obsessiva e inabalável que já havia se instalado no espírito de Bentinho, transformando qualquer gesto de solidariedade em prova irrefutável de culpa."
      }
    },
    {
      id: "LIT_ROM_15",
      origem: "ITA 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Trilogia Realista Machadiana e a Teoria do Medalhão",
      tipo: "aberta",
      enunciado: "No conto 'Teoria do Medalhão', de Machado de Assis, um pai burguês conversa com o filho de vinte e um anos e ensina o manual definitivo para subir na sociedade e alcançar o sucesso público sem ter nenhum talento real ou pensamento próprio: 'Não deves ter opiniões tuas; deves usar chavões consagrados, não ter ideias originais, proibir-se a ironia e dormir bastante nas reuniões públicas'. (a) Qual a crítica machadiana às elites do Segundo Reinado contida nessa lição pedagógica? (b) Por que o pai proíbe taxativamente o uso da ironia para aquele que deseja se tornar um 'medalhão'?",
      resposta: "(a) Denúncia da mediocridade, da subserviência e da ausência de mérito real na ascensão social das elites brasileiras; (b) A ironia exige inteligência viva, pensamento autônomo e desperta desconfiança dos poderes constituídos.",
      gabarito: {
        letra: "Aberta",
        ancora: "Sátira feroz à cultura do compadrio, das aparências vazias e da mediocridade triunfante no Brasil.",
        espera_se: "(a) Crítica social: Machado satiriza a anatomia do homem público do Império (o 'medalhão'): uma figura oca, emproada e decorativa, cuja projeção política e social não advém da competência técnica, da cultura ou da moralidade, mas exatamente da habilidade de repetir lugares-comuns, bajular autoridades e não incomodar ninguém com ideias originais ou críticas incômodas.\n(b) Proibição da ironia: A ironia é a arma dos espíritos livres, perspicazes e desestabilizadores. Para ser um medalhão de sucesso respeitado pelos ignorantes, o jovem deve cultivar a solenidade pesada, a sisudez e a previsibilidade. O riso irônico demonstra inteligência crítica superior, o que assusta a mediocridade dos chefes e atrai inimigos poderosos que não toleram ser desmascarados."
      }
    }
  ]
};

// -------------------------------------------------------------
// 4. LITERATURA - MODERNISMO E CONTEMPORÂNEA (FUVEST E ENEM)
// -------------------------------------------------------------
const litModernismo = {
  disciplina: "Literatura",
  modulo: "Modernismo_FUVEST_ENEM",
  subpasta: "Modernismo_e_Contemporanea",
  arquivo_origem: "Questoes_Modernismo_FUVEST_ENEM.json",
  benchmark_didatico: {
    capitulo: "O Modernismo no Brasil e a Literatura Contemporânea",
    objetivos_aprendizagem: [
      "Compreender a Semana de Arte Moderna de 1922 e a Primeira Fase Modernista (destruição iconoclasta, nacionalismo crítico, verso livre e Antropofagia de Oswald de Andrade e Mário de Andrade).",
      "Analisar a Segunda Fase Modernista (1930-1945): o romance regionalista social (Graciliano Ramos, Jorge Amado, Rachel de Queiroz) e a poesia de inquietação existencial e engajamento histórico (Carlos Drummond de Andrade, Vinicius de Moraes, Cecília Meireles e Murilo Mendes).",
      "Examinar a Terceira Fase Modernista (Geração de 45): o experimentalismo linguístico transcendental de Guimarães Rosa ('Grande Sertão: Veredas') e a densidade psicológica e metafísica de Clarice Lispector ('A Hora da Estrela').",
      "Reconhecer tendências da literatura contemporânea brasileira (marginal, hiperficção, literatura indígena e afro-brasileira: Conceição Evaristo e Carolina Maria de Jesus)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Semana de 1922 e Antropofagia Oswaldiana",
          definicao: "Realizada no Teatro Municipal de São Paulo, a Semana de 22 rompeu com o academicismo parnasiano e o passadismo lusitano. A 1ª Fase (1922-1930) caracterizou-se pela irreverência, linguagem coloquial brasileira, poema-piada e valorização do cotidiano. Oswald de Andrade formulou o Manifesto Antropófago (1928): a metáfora da devoração cultural — deglutir as vanguardas europeias e as influências estrangeiras para sintetizá-las e refundi-las com a matriz cultural brasileira autóctone e afro-ameríndia ('Tupi or not tupi: that is the question'). Mário de Andrade publica 'Macunaíma, o herói sem nenhum caráter' (1928), o rapsodo da alma híbrida nacional."
        },
        {
          termo: "Geração de 30: Romance Social e Poesia Filosófica",
          definicao: "No contexto da Grande Depressão de 1929, da Revolução de 30 e da ascensão dos regimes totalitários na Europa: No Romance Social, autores nordestinos escancaram a tragédia da seca, da miséria, dos retirantes e da exploração do latifúndio em 'Vidas Secas' (Graciliano Ramos), 'Capitães da Areia' (Jorge Amado) e 'O Quinze' (Rachel de Queiroz). Na Poesia, Carlos Drummond de Andrade ('Sentimento do Mundo', 'A Rosa do Povo') atinge a maturidade da lírica em língua portuguesa, unindo o indivíduo gauche ao sentimento solidário da humanidade sob os escombros da Segunda Guerra Mundial ('E agora, José?')."
        },
        {
          termo: "Geração de 45: Guimarães Rosa e Clarice Lispector",
          definicao: "Superando o regionalismo documental anterior, Guimarães Rosa eleva o sertão de Minas Gerais a um espaço mítico e cósmico em 'Grande Sertão: Veredas' (1956), reinventando a língua portuguesa através de neologismos arrojados, arcaísmos, sintaxe poética e reflexão teológica sobre a existência do demônio e a transcendência do amor por Diadorim. Clarice Lispector mergulha no fluxo da consciência, na epifania sensorial e na perplexidade do existir, culminando na obra-prima 'A Hora da Estrela' (1977), na qual o narrador Rodrigo S.M. disseca a miséria e a invisibilidade social da nordestina Macabéa."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico no ENEM e FUVEST: achar que 'herói sem nenhum caráter' em Macunaíma significa 'bandido ou mau-caráter'. Mário de Andrade utiliza 'caráter' no sentido etnográfico e psicológico de personalidade formada e traços fixos: o Brasil é uma nação jovem em formação, sem um contorno identitário rígido definido, capaz de metamorfosear-se plasticamente."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: O Sertão como Metáfora Universal em Guimarães Rosa",
      enunciado: "Na célebre afirmação de Riobaldo em 'Grande Sertão: Veredas': 'O sertão é do tamanho do mundo. O sertão está em toda parte', explique como Guimarães Rosa supera o regionalismo geográfico tradicional.",
      resolucao_passo_a_passo: "1. O regionalismo de 1930 tratava o sertão como espaço físico-social documentado em suas mazelas concretas (a seca, o cangaço, a fome).\n2. A revolução rosiana de 1945: O sertão deixa de ser apenas uma coordenada geográfica de Minas Gerais ou do Nordeste e se converte no próprio palco da alma humana (o microcosmo do universo).\n3. 'O sertão é o mundo': Os conflitos de jagunços e coronéis são metáforas para o eterno combate entre o bem e o mal, a dúvida sobre a existência do diabo, os abismos do livre-arbítrio, o medo, a honra e o amor proibido.\n4. Universalização: O homem do sertão (Riobaldo) é todo e qualquer ser humano colocado diante da pergunta filosófica fundamental da vida: 'Viver é muito perigoso'."
    }
  },
  questoes: [
    {
      id: "LIT_MOD_01",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Primeira Fase do Modernismo e Poema-Piada",
      tipo: "fechada",
      enunciado: "No célebre poema 'Pronominais', de Oswald de Andrade: 'Dê-me um cigarro / Diz a gramática / Do professor e do aluno / E do mulato sabido / Mas o bom negro e o bom branco / Da Nação Brasileira / Dizem todos os dias / Deixa disso camarada / Me dá um cigarro', o poeta modernista defende:",
      alternativas: [
        { letra: "A", texto: "A legitimação da linguagem coloquial viva do povo brasileiro na literatura, combatendo o apego pedante e lusitano às regras rígidas da gramática normativa." },
        { letra: "B", texto: "A proibição do consumo de tabaco nas escolas públicas do país." },
        { letra: "C", texto: "A extinção definitiva do ensino da língua portuguesa no Brasil." },
        { letra: "D", texto: "A superioridade cultural dos professores sobre os trabalhadores urbanos." },
        { letra: "E", texto: "A necessidade de importar gramáticos de Portugal para corrigir a fala popular." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Oswald valoriza o português falado no Brasil ('língua brasileira') em contraste com o purismo arcaico herdado da colonização.",
        porque: "A transgressão da ênclise formal ('Me dá um cigarro' em vez de 'Dê-me um cigarro') afirma a identidade autônoma e democrática da voz da nação."
      }
    },
    {
      id: "LIT_MOD_02",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Segunda Fase: O Romance Social de 30 em 'Vidas Secas'",
      tipo: "fechada",
      enunciado: "Em 'Vidas Secas' (1938), de Graciliano Ramos, a linguagem seca, despojada de adjetivos supérfluos e quase telegráfica harmoniza-se esteticamente com:",
      alternativas: [
        { letra: "A", texto: "A paisagem árida da Caatinga e a mudez e precariedade vocabular dos retirantes sertanejos, embrutecidos pela opressão dos patrões e pela violência da seca." },
        { letra: "B", texto: "O delírio místico dos poetas românticos que buscavam a reclusão monástica." },
        { letra: "C", texto: "O estilo rococó e rebuscado dos folhetins parisienses da belle époque." },
        { letra: "D", texto: "A euforia das vanguardas futuristas que celebravam as fábricas velozes." },
        { letra: "E", texto: "O desdém de Graciliano pelo sofrimento da família de Fabiano." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Graciliano pratica uma estética da contenção: a economia verbal do texto espelha a escassez material da vida no semiárido.",
        porque: "Fabiano e Sinhá Vitória quase não falam com palavras articuladas; comunicam-se por resmungos, guturais e gestos, pois foram privados de letramento e cidadania pela estrutura agrária opressora."
      }
    },
    {
      id: "LIT_MOD_03",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Carlos Drummond de Andrade e 'Sentimento do Mundo'",
      tipo: "fechada",
      enunciado: "Publicado em 1940 em plena Segunda Guerra Mundial e sob a ditadura do Estado Novo varguista, o livro 'Sentimento do Mundo', de Carlos Drummond de Andrade, marca uma guinada decisiva na poesia do autor caracterizada por:",
      alternativas: [
        { letra: "A", texto: "A superação do isolamento individualista em favor do engajamento ético, da solidariedade aos oprimidos e da angústia com o destino trágico da humanidade em tempos de guerra." },
        { letra: "B", texto: "A fuga alienada para o paraíso campestre bucólico do arcadismo." },
        { letra: "C", texto: "A exaltação cega e acrítica dos líderes fascistas europeus." },
        { letra: "D", texto: "A escrita exclusiva de poemas infantis com rimas engraçadas." },
        { letra: "E", texto: "A celebração triunfalista da vitória da tecnologia atômica." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O poeta declara no poema de abertura: 'Tenho apenas duas mãos e o sentimento do mundo'.",
        porque: "Drummond abandona a pose de homem 'gauche' isolado em sua timidez provinciana para abrir os braços à fraternidade humana ('Mãos dadas': 'Não cantarei amores, não cantarei o futuro... O tempo é a minha matéria, o tempo presente')."
      }
    },
    {
      id: "LIT_MOD_04",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Clarice Lispector e 'A Hora da Estrela'",
      tipo: "fechada",
      enunciado: "Em 'A Hora da Estrela' (1977), a jovem nordestina Macabéa vive no Rio de Janeiro alienada de sua própria miséria, comendo cachorros-quentes, ouvindo a Rádio Relógio e sonhando em ser como Marilyn Monroe. O narrador Rodrigo S.M. declara que tem vergonha de sua própria condição de classe ao narrar a história dessa mulher. Esse recurso metanarrativo visa:",
      alternativas: [
        { letra: "A", texto: "Problematizar o próprio ato de narrar a miséria alheia, expondo a culpa do intelectual burguês que transforma a dor do excluído em objeto de consumo literário." },
        { letra: "B", texto: "Comprovar que Macabéa era uma criminosa procurada pela polícia fluminense." },
        { letra: "C", texto: "Exaltar o sucesso dos migrantes nordestinos no comércio de doces do Rio." },
        { letra: "D", texto: "Demonstrar que a astrologia da cartomante Madame Carlota era cientificamente perfeita." },
        { letra: "E", texto: "Substituir a literatura de denúncia por um conto de fadas romântico." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Clarice constrói um duplo literário (Rodrigo S.M.) para interrogar os limites éticos da literatura diante da invisibilidade social absoluta.",
        porque: "A morte de Macabéa atropelada por um Mercedes-Benz amarelo logo após a profecia otimista da cartomante é a 'hora da estrela': o único momento em que a sociedade enfim olha para ela, caída na calçada imunda."
      }
    },
    {
      id: "LIT_MOD_05",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Guimarães Rosa e a Ambiguidade de Diadorim",
      tipo: "fechada",
      enunciado: "Em 'Grande Sertão: Veredas', a relação afetiva entre o narrador Riobaldo e seu companheiro de bando Diadorim (Reinaldo) é marcada por intensa perturbação emocional e espiritual. A revelação final da identidade anatômica de Diadorim, após a sua morte heroica na batalha contra Hermógenes, simboliza:",
      alternativas: [
        { letra: "A", texto: "A revelação trágica de que Diadorim era mulher (Maria Deodorina da Fé Bettancourt), desfazendo o tabu da homossexualidade e escancarando a dor de um amor sublime que Riobaldo não pôde viver plenamente em vida." },
        { letra: "B", texto: "A prova de que Diadorim era o próprio Satanás encarnado em forma humana." },
        { letra: "C", texto: "O desmascaramento de uma espiã infiltrada pelo exército federal." },
        { letra: "D", texto: "A descoberta de que Diadorim era filha biológica do coronel Zé Bebelo." },
        { letra: "E", texto: "A certeza de que a guerra jagunça terminou em acordo diplomático pacífico." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A cena do desnudamento fúnebre do corpo de Diadorim é o clímax dilacerante de Grande Sertão: Veredas.",
        porque: "Riobaldo passa a vida torturado pelo desejo homoerótico por aquele guerreiro feroz e angelical de olhos de neblina verde; ao descobrir que Diadorim era uma mulher que se disfarçara para vingar a morte do pai Joca Ramiro, o desespero atinge dimensão trágica e mística indelével."
      }
    },
    {
      id: "LIT_MOD_06",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Literatura de Testemunho: Carolina Maria de Jesus",
      tipo: "fechada",
      enunciado: "Em 'Quarto de Despejo: Diário de uma Favelada' (1960), Carolina Maria de Jesus relata sua dura sobrevivência catando papel nas ruas de São Paulo para alimentar os filhos. Na obra, a autora utiliza a metáfora do 'quarto de despejo' para designar:",
      alternativas: [
        { letra: "A", texto: "A favela do Canindé, como o local marginalizado onde a cidade rica e higienista arremessa os indivíduos empobrecidos e indesejados, longe dos olhos dos salões da metrópole." },
        { letra: "B", texto: "O sótão da prefeitura municipal onde eram guardados livros escolares." },
        { letra: "C", texto: "Um depósito de reciclagem onde ela vendia o papelão coletado." },
        { letra: "D", texto: "Uma prisão política do regime varguista para operários grevistas." },
        { letra: "E", texto: "O porão da casa de seus patrões nos Jardins." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Carolina escreve: 'A cidade é a sala de visitas; a favela é o quarto de despejo onde se joga o que não serve mais'.",
        porque: "A força testemunhal de sua escrita autêntica e contundente revelou a fome como uma experiência física brutal e cotidiana na periferia brasileira."
      }
    },
    {
      id: "LIT_MOD_07",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Jorge Amado e a Infância Marginalizada em 'Capitães da Areia'",
      tipo: "fechada",
      enunciado: "No romance 'Capitães da Areia' (1937), de Jorge Amado, um grupo de meninos abandonados sobrevive praticando pequenos furtos pelas ruas de Salvador e habitando um trapiche abandonado na praia. O romance denuncia a responsabilidade social do Estado ao demonstrar que:",
      alternativas: [
        { letra: "A", texto: "A delinquência dos menores é consequência direta do abandono social, da desigualdade brutal e da violência institucional do reformatório e da polícia, e não de uma perversidade inata das crianças." },
        { letra: "B", texto: "As crianças nasceram com determinismo genético incorrigível para o crime." },
        { letra: "C", texto: "O reformatório juvenil da época era uma escola exemplar de humanismo." },
        { letra: "D", texto: "A polícia agia com extrema gentileza e oferecia bolsas de estudo aos jovens." },
        { letra: "E", texto: "A vida no trapiche era uma escolha de lazer de crianças abastadas da elite baiana." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Jorge Amado humaniza e individualiza cada um dos capitães (Pedro Bala, Professor, Pirulito, Sem-Pernas, Volta Seca), mostrando seus sonhos, dores e anseios de dignidade.",
        porque: "O livro foi queimado em praça pública pela ditadura do Estado Novo em 1937 exatamente por escancarar a falência do poder público e propor a revolta popular como caminho de libertação social."
      }
    },
    {
      id: "LIT_MOD_08",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Conceição Evaristo e o Conceito de 'Escrevivência'",
      tipo: "fechada",
      enunciado: "A consagrada escritora contemporânea Conceição Evaristo cunhou o termo 'Escrevivência' para definir a sua prática literária (presente em obras como 'Ponciá Vicêncio' e 'Olhos d'Água'). Esse conceito fundamenta-se na:",
      alternativas: [
        { letra: "A", texto: "Escrita que brota indissociavelmente da experiência de vida do corpo e da memória das mulheres negras brasileiras, transformando a vivência histórica de dor e resistência em literatura poética e política." },
        { letra: "B", texto: "Cópia exata dos poemas clássicos do parnasianismo francês do século XIX." },
        { letra: "C", texto: "Escrita automática surrealista desprovida de compromisso social e histórico." },
        { letra: "D", texto: "Ficção científica espacial sobre futuros distópicos intergalácticos." },
        { letra: "E", texto: "Literatura de autoajuda financeira corporativa para executivos." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Conceição Evaristo define: 'A nossa escrevivência não é para adormecer os da casa-grande, e sim para acordá-los dos seus sonos injustos'.",
        porque: "A escrevivência rompe com a tradição que colocava a população negra apenas como objeto passivo de estudo exótico na literatura, alçando-a ao papel de protagonista soberana da sua própria enunciação estética."
      }
    },
    {
      id: "LIT_MOD_09",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Mário de Andrade: 'Macunaíma' e a Rapsódia Nacional",
      tipo: "fechada",
      enunciado: "No romance modernista 'Macunaíma, o herói sem nenhum caráter' (1928), de Mário de Andrade, o protagonista nasce no fundo da mata virgem da Amazônia, torna-se príncipe do povo taulipangue, transforma-se em branco e viaja para a metrópole de São Paulo para recuperar o amuleto sagrado muiraquitã roubado pelo gigante comedor de gente Venceslau Pietro Pietra. A obra classifica-se como uma rapsódia porque:",
      alternativas: [
        { letra: "A", texto: "Costura e justapõe lendas indígenas, mitos folclóricos, ditados populares, modismos urbanos e relatos etnográficos de todas as regiões do Brasil numa linguagem artística híbrida e caleidoscópica." },
        { letra: "B", texto: "Foi composta exclusivamente para ser cantada em óperas líricas italianas." },
        { letra: "C", texto: "Constitui uma biografia histórica fidedigna de um imperador pré-colombiano." },
        { letra: "D", texto: "Trata-se de um relatório antropológico que não contém nenhum elemento de fantasia." },
        { letra: "E", texto: "Imita com fidelidade a epopeia clássica 'Os Lusíadas' em oitava rima." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Uma rapsódia é uma colcha de retalhos poética que funde tradições orais e mitologias populares diversas.",
        porque: "Mário de Andrade viajou pelo Norte e Nordeste registrando o folclore e criou um idioma literário sincrético que sintetiza a multiplicidade linguística e cultural de todo o povo brasileiro."
      }
    },
    {
      id: "LIT_MOD_10",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "João Cabral de Melo Neto e a Poética da Pedra",
      tipo: "fechada",
      enunciado: "A poética de João Cabral de Melo Neto ('A Educação pela Pedra', 'O Cão sem Plumas') destaca-se na literatura em língua portuguesa por sua absoluta repulsa ao sentimentalismo derramado e à confissão íntima. Em seus poemas, a 'pedra' é eleita como mestre e símbolo porque encarna:",
      alternativas: [
        { letra: "A", texto: "A impessoalidade mineral, a dureza formal, a secura, a precisão milimétrica e a resistência contra qualquer futilidade lírica piegas." },
        { letra: "B", texto: "A facilidade de moldar palavras como se fossem massinhas infantis coloridas." },
        { letra: "C", texto: "O retorno ao romantismo sentimental do século XIX." },
        { letra: "D", texto: "A incapacidade do homem em construir edifícios e cidades." },
        { letra: "E", texto: "O elogio à preguiça e à inércia contemplativa mística." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "João Cabral afirma: 'Uma educação pela pedra: por lições; / para aprender da pedra, frequentá-la; / captar sua voz inexpressiva, muda'.",
        porque: "O poeta rejeita a inspiração desgovernada e assume o ofício de arquiteto verbal da linguagem sólida, cortante e substantiva, sem espaço para devaneios românticos vazios."
      }
    },
    {
      id: "LIT_MOD_11",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Graciliano Ramos: 'Angústia' e o Colapso do Intelectual",
      tipo: "fechada",
      enunciado: "No romance 'Angústia' (1936), de Graciliano Ramos, o funcionário público e jornalista provinciano Luís da Silva apaixona-se por Marina, que o abandona seduzida pelo dinheiro do rico e cínico Julião Tavares. A narrativa, contada em fluxo de memória febril e asfixiante, culmina:",
      alternativas: [
        { letra: "A", texto: "No estrangulamento obsessivo de Julião Tavares por Luís da Silva no mato, seguido do mergulho do protagonista em delírio paranoico de culpa e claustrofobia existencial." },
        { letra: "B", texto: "No casamento feliz e harmonioso de Luís da Silva e Marina com o auxílio do padre local." },
        { letra: "C", texto: "Na fuga de Luís da Silva para o exterior onde publica um best-seller de sucesso." },
        { letra: "D", texto: "No suicídio do protagonista logo nas primeiras páginas em tom de comédia." },
        { letra: "E", texto: "Na reconciliação de cavalheiros entre os dois rivais com um brinde de champanhe." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Angústia é a obra mais densa e expressionista de Graciliano Ramos, inspirada diretamente em 'Crime e Castigo' de Dostoiévski.",
        porque: "O assassinato com a corda e a posterior alucinação em que os objetos e ratos do quarto parecem vigiar e acusar Luís da Silva simbolizam a falência e a degradação psíquica da pequena burguesia urbana desclassificada."
      }
    },
    {
      id: "LIT_MOD_12",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Murilo Mendes e o Surrealismo Católico",
      tipo: "fechada",
      enunciado: "A poesia de Murilo Mendes ('Tempo e Eternidade', 'As Metamorfoses') distingue-se no panorama do Modernismo brasileiro por articular:",
      alternativas: [
        { letra: "A", texto: "A ousadia imagética das vanguardas surrealistas (justaposição onírica e ilógica) com uma profunda cosmovisão mística e católica de transfiguração da carne e do tempo." },
        { letra: "B", texto: "O apego rígido aos sonetos barrocos seiscentistas do Padre Vieira." },
        { letra: "C", texto: "O materialismo histórico dialético estrito de exaltação dos tratores soviéticos." },
        { letra: "D", texto: "A poesia de cordel popular nordestina sem contato com a cultura europeia." },
        { letra: "E", texto: "A negação de qualquer dimensão espiritual ou transcendental humana." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Murilo Mendes cristianizou o surrealismo: as imagens fantásticas e os paradoxos cósmicos servem para desvelar a presença do divino encarnado no caos da matéria moderna.",
        porque: "Ao lado de Jorge de Lima, compôs a vertente espiritualista e visionária da geração modernista de 30."
      }
    },
    {
      id: "LIT_MOD_13",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Drummond e 'A Flor e a Náusea'",
      tipo: "aberta",
      enunciado: "Nos versos finais do célebre poema 'A flor e a náusea', de Carlos Drummond de Andrade: 'Uma flor nasceu na rua! / Passem de longe, bondes, ônibus, rio de aço do tráfego. / Uma flor ainda desbotada / ilude a polícia, rompe o asfalto. / Façam completo silêncio, paralisem os negócios, / garanto que uma flor nasceu. / Sua cor não se percebe. / Suas pétalas não se abrem. / Seu nome não está nos livros. / É feia. Mas é realmente uma flor. / Sento-me no chão da capital do país às cinco horas da tarde / e lentamente passo a mão nessa forma insegura. / É feia. Mas é uma flor. Furou o asfalto, o tédio, o nojo e o ódio.'\nAnalise o significado lírico e político dessa flor feia que fura o asfalto em meio ao contexto opressivo da Segunda Guerra Mundial e da ditadura.",
      resposta: "A flor é o símbolo da esperança frágil e da resistência poética que brota da dureza e desumanidade do mundo opressor.",
      gabarito: {
        letra: "Aberta",
        ancora: "A flor como triunfo milagroso da vida e da poesia contra o concreto e a violência totalitária.",
        espera_se: "O poema parte da 'náusea' sartreana perante a mediocridade, a guerra, o fascismo e a desumanização cotidiana ('o tédio, o nojo e o ódio'). O asfalto e o tráfego veloz representam o peso massacrante da civilização moderna desalmada e da repressão do Estado ('ilude a polícia'). O nascimento da flor não é uma visão romântica de beleza triunfante — ela é 'feia', 'insegura', 'sem nome nos livros', 'desbotada' —, mas possui a força cósmica inabalável de furar a crosta pétrea do chão. Ela representa a vitória da vida, da solidariedade e da criação poética genuína que teima em brotar mesmo sob as condições mais hostis e desesperançosas da história humana."
      }
    },
    {
      id: "LIT_MOD_14",
      origem: "UNICAMP 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Neologismos e Filosofia em Guimarães Rosa",
      tipo: "aberta",
      enunciado: "Guimarães Rosa recriou a língua portuguesa cunhando neologismos poéticos extraordinários como 'nonada', 'desafiar', 'infrassecular', 'vertiginoso-sutil' e a sentença filosófica 'O homem nasceu para desasombrar-se'. Explique: (a) Qual a função dos neologismos no projeto estético de 'Grande Sertão: Veredas'; (b) O que significa dizer que para Guimarães Rosa a linguagem comum e desgastada pelos clichês não serve para captar o mistério do ser.",
      resposta: "(a) Desautomatizar a leitura e recriar o mundo através da reinvenção verbal poética; (b) As palavras comuns viraram moedas gastas; para expressar o espanto da metafísica e do sagrado, é preciso forjar um idioma vivo e novo.",
      gabarito: {
        letra: "Aberta",
        ancora: "A alquimia da linguagem rosiana: refundar o idioma para acessar a ontologia profunda da existência.",
        espera_se: "(a) Função dos neologismos: O sertão de Rosa é um espaço metafísico inaudito. O autor cria novas palavras por derivação prefixal e sufixal, aglutinação e fusão de raízes latinas e gregas com a fala rústica sertaneja para forçar o leitor a reaprender a ler e a enxergar a realidade com olhos de espanto primitivo.\n(b) Superação do clichê: Na concepção rosiana, a linguagem burocrática e cotidiana tornou-se uma ferramenta mecânica desgastada que oculta as coisas em vez de revelá-las. Para tocar nos mistérios cósmicos — Deus, o Diabo, o Amor e a Morte —, o escritor tem o dever sagrado de resgatar o poder mágico e encantatório original do Verbo primordial, fazendo a língua vibrar como criação artística viva."
      }
    },
    {
      id: "LIT_MOD_15",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Raduan Nassar e a Tragédia Familiar em 'Lavoura Arcaica'",
      tipo: "aberta",
      enunciado: "No romance contemporâneo 'Lavoura Arcaica' (1975), de Raduan Nassar, o jovem André rebela-se contra a severa ordem patriarcal imposta pelo pai numa fazenda do interior, foge para uma pensão na cidade e envolve-se em uma relação incestuosa com a irmã Ana. A obra constrói-se através de uma prosa lírica torrencial e bíblica. Analise: (a) O conflito entre o tempo sagrado e imóvel da tradição paterna e a pulsão do corpo e da transgressão de André; (b) O desfecho trágico da dança de Ana diante da fúria do pai.",
      resposta: "(a) Choque entre a lei rígida do pai (ordem, lavoura e repressão) e o anseio de liberdade e paixão carnal do filho; (b) O pai degola Ana com a foice do trabalho, provando que a ordem patriarcal arcaica prefere o sangue e o infanticídio à desobediência moral.",
      gabarito: {
        letra: "Aberta",
        ancora: "A tragédia arquetípica patriarcal e o colapso da família tradicional em prosa de alta voltagem lírico-bíblica.",
        espera_se: "(a) Conflito nuclear: O pai prega nos sermões à mesa que o homem deve curvar a cabeça à terra, à paciência e à lei sagrada, domesticando o corpo como se doma o campo. André encarna o princípio dionisíaco da revolta do corpo: ele recusa a servidão da lavoura e a castração moral do desejo, proclamando o direito ao amor apaixonado e transgressor com a própria irmã como grito de autonomia existencial contra o patriarca.\n(b) O desfecho trágico: Quando André é trazido de volta pelo irmão mais velho Pedro, a família se reúne no almoço festivo. Ana inicia uma dança sensual, livre e provocativa diante da mesa sagrada. Incapaz de suportar a desfaçatez da transgressão visível e a quebra irrevogável de sua autoridade sagrada, o pai degola a própria filha com a foice com que lavrava a terra, revelando a violência homicida e ancestral que sustenta a ordem patriarcal arcaica."
      }
    }
  ]
};

// -------------------------------------------------------------
// 5. LITERATURA - CLÁSSICA E MODERNISTA (IME/ITA)
// -------------------------------------------------------------
const litImeIta = {
  disciplina: "Literatura",
  modulo: "Literatura_Classica_e_Modernista_IME_ITA",
  subpasta: "IME_ITA",
  arquivo_origem: "Questoes_Literatura_Classica_e_Modernista_IME_ITA.json",
  benchmark_didatico: {
    capitulo: "Literatura de Alto Desempenho para IME e ITA: Da Épica Camoniana e Poesia Barroca à Alta Modernidade Literária",
    objetivos_aprendizagem: [
      "Analisar a estrutura épica renascentista de 'Os Lusíadas' (Camões): estrofação em oitava rima, esquema métrico decassílabo, episódios líricos e a crise humanista do Velho do Restelo.",
      "Compreender a dialética barroca (Gregório de Matos e Padre Antônio Vieira): o conflito entre teocentrismo e antropocentrismo, o cultismo e o conceptismo (Sermão da Sexagésima).",
      "Examinar o Arcadismo e o Neoclassicismo (Cláudio Manuel da Costa e Tomás Antônio Gonzaga): tópicos horacianos (carpe diem, locus amoenus, aurea mediocritas) e a sátira política das 'Cartas Chilenas'.",
      "Interpretar obras modernas e contemporâneas cobradas no ITA/IME com rigor estético, intertextualidade e análise estilística profunda."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "A Épica Camoniana: 'Os Lusíadas' (1572)",
          definicao: "Composto por 10 cantos, 1.102 estrofes em oitava rima (ABABABCC) e 8.816 versos decassílabos heroicos. Estrutura clássica: Proposição, Invocação às Tágides, Dedicatória a D. Sebastião, Narração (in media res) e Epílogo amargo. Fundo histórico: a viagem de Vasco da Gama à Índia (1497-1498), associada à intervenção dos deuses do Olimpo (Vênus protetora vs Baco vingador). Episódios fundamentais: Inês de Castro (Canto III - o lirismo trágico do 'amor que foi puro e matou'), O Gigante Adamastor (Canto V - a personificação do Cabo das Tormentas e o horror do desconhecido), O Velho do Restelo (Canto IV - a voz da prudência moral que condena a cobiça expansionista e o despovoamento do reino) e a Ilha dos Amores (Canto IX - a recompensa alegórica da imortalidade mitológica aos heróis lusos)."
        },
        {
          termo: "O Barroco: Cultismo vs Conceptismo",
          definicao: "O Barroco (século XVII) expressa a crise espiritual e o dilema existencial da Contra-Reforma: a alma dilacerada entre o pecado mundano carnal e a salvação celestial divina. Manifesta-se em duas vertentes complementares: O Cultismo (Gongorismo) privilegia a forma plástica, a exuberância ornamental, trocadilhos, metáforas sensoriais audaciosas e hipérbatos vertiginosos; o Conceptismo (Quevedismo) privilegia o jogo dialético de ideias, a lógica argumentativa rigorosa, o silogismo e a retórica persuasiva. Padre Antônio Vieira é o mestre absoluto do conceptismo nos púlpitos ('Sermão da Sexagésima', onde disseca a arte de pregar com a metáfora do semeador evangélico). Gregório de Matos ('O Boca do Inferno') sintetiza a lírica amorosa, religiosa penitencial e a sátira corrosiva contra a nobreza e o clero corrupto da Bahia colonial."
        },
        {
          termo: "O Arcadismo e a Crítica Ilustrada: 'Cartas Chilenas'",
          definicao: "No século XVIII (Século das Luzes / Iluminismo), o Arcadismo busca o equilíbrio da razão, a clareza e a simplicidade neoclássica inspirada na Antiguidade greco-latina, expurgando os excessos ornamentais barrocos ('Inutilia truncat' - cortar o inútil). Os poetas adotam pseudônimos pastoris (pastor Dirceu, Alceste) e celebram a vida campestre ('Fugere urbem'). No Brasil, a poesia lírica de Tomás Antônio Gonzaga ('Marília de Dirceu') convive com as 'Cartas Chilenas', obra-prima da sátira política colonial em versos decassílabos brancos, na qual Critilo escreve a Doroteu denunciando as arbitrariedades, o nepotismo e a tirania do governador de Minas Gerais ('Fanfarrão Minésio' / Luís da Cunha Meneses às vésperas da Inconfidência Mineira de 1789)."
        }
      ],
      atencao_ponto_cego: "Ponto cego militar crítico: achar que 'Os Lusíadas' é uma propaganda imperialista triunfante do começo ao fim. Camões encerra a epopeia no Canto X com um tom profundamente amargurado, advertindo o jovem rei D. Sebastião sobre a decadência moral de Portugal ('No mais, Musa, no mais, que a lira tenho / Destemperada e a voz enrouquecida... metido no gosto da cobiça e na rudeza de uma austera, apagada e vil tristeza')."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: A Voz Dissonante do Velho do Restelo em Camões",
      enunciado: "No Canto IV de 'Os Lusíadas', no momento em que as caravelas de Vasco da Gama vão içar velas na praia de Belém perante a multidão que chora, surge um venerando ancião — o Velho do Restelo — que profere um severo discurso contra a empresa ultramarina. Explique o significado dessa voz no conjunto da epopeia nacional portuguesa.",
      resolucao_passo_a_passo: "1. Contexto narrativo: Todos no cais celebram a glória e a cobiça das conquistas marítimas em direção às Índias fabulosas de especiarias e ouro.\n2. O discurso do Velho do Restelo: Ele amaldiçoa o primeiro homem que pôs velas no mar, denunciando a 'vaidade a que chamamos Fama' e a cobiça cega do poder e do lucro fácil mercantil.\n3. Advertência profética: O velho alerta que a corrida marítima trará despovoamento para o reino de Portugal, abandono dos campos agrícolas e das fronteiras vizinhas, morte de milhares de marinheiros nas tormentas oceânicas e, por fim, a ruína e a servidão política da pátria.\n4. Conclusão dialética: Camões introduz no próprio coração do poema épico a voz crítica da razão humanista e moral, conferindo complexidade trágica à epopeia: a glória nacional lusa é indissociável de um preço humano terrível que prenuncia o desastre de Alcácer-Quibir."
    }
  },
  questoes: [
    {
      id: "LIT_IME_01",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Camões e a Estética de 'Os Lusíadas': Inês de Castro",
      tipo: "fechada",
      enunciado: "No célebre episódio lírico de Inês de Castro (Canto III de 'Os Lusíadas'), Camões imortalizou os versos: 'Tirar Inês ao mundo determina, / Por lhe tirar o filho que tem preso, / Crendo com sangue só da morte indina / Matar do povo o leve e furioso esô... / Estavas, linda Inês, posta em sossego, / De teus anos colhendo o doce fruto, / Naquele engano da alma, ledo e cego, / Que a Fortuna não deixa durar muito'. A expressão 'Naquele engano da alma, ledo e cego' traduz a concepção camoniana do amor como:",
      alternativas: [
        { letra: "A", texto: "Uma ilusão arrebatadora e doce que cega os amantes para os perigos reais da política e os expõe tragicamente aos golpes impiedosos do destino e do Estado." },
        { letra: "B", texto: "Um pecado mortal diabólico que exigia a decapitação imediata da amante para purificação da corte." },
        { letra: "C", texto: "Uma farsa calculada por Inês para usurpar a coroa portuguesa da dinastia de Borgonha." },
        { letra: "D", texto: "Um contrato matrimonial vantajoso para a nobreza de Castela." },
        { letra: "E", texto: "Um delírio passageiro de juventude sem consequências históricas duradouras." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Camões funde a tradição petrarquista à tragédia histórica: o amor lírico é 'ledo' (alegre, doce) mas 'cego' e frágil perante a razão de Estado do rei D. Afonso IV.",
        porque: "O assassinato de Inês nos campos do Mondego em Coimbra é transformado no ápice da piedade trágica, onde até os carrascos hesitam diante da sua beleza inocente."
      }
    },
    {
      id: "LIT_IME_02",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Padre Antônio Vieira e o 'Sermão da Sexagésima'",
      tipo: "fechada",
      enunciado: "No 'Sermão da Sexagésima' (1655), pregado na Capela Real de Lisboa, o Padre Antônio Vieira discorre sobre a arte da pregação e questiona por que a palavra de Deus, tão abundante nos púlpitos, produz tão poucos frutos de conversão nos ouvintes. A tese central defendida por Vieira para sanar essa crise retórica é que:",
      alternativas: [
        { letra: "A", texto: "A pregação deve seguir a clareza e a unidade do conceptismo bíblico (uma só matéria bem explicada e sentida), em oposição ao cultismo vazio dos pregadores gongóricos que se perdem em labirintos de palavras e metáforas sem tocar o coração dos fiéis." },
        { letra: "B", texto: "Os sermões devem ser pregados exclusivamente em latim eclesiástico arcaico para evitar a heresia dos leigos." },
        { letra: "C", texto: "A igreja deve abolir totalmente a leitura do Evangelho e adotar os manuais de retórica de Cícero." },
        { letra: "D", texto: "A culpa exclusiva da falta de frutos é da corrupção inata e incorrigível do povo português." },
        { letra: "E", texto: "Os padres devem parar de pregar e dedicar-se unicamente ao silêncio contemplativo monástico." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Vieira combate o cultismo ornamental: 'O sermão há de ser uma árvore: há de ter raízes, tronco, ramos, folhas e frutos. Mas hoje fazem os pregadores uns sermões como um ramalhete: muitas flores, cores diversas, mas sem raiz e sem fruto'.",
        porque: "O Sermão da Sexagésima é uma obra-prima de metalinguística conceptista, na qual o orador prova que a palavra evangélica só transforma os homens quando a conduta do pregador é coerente com a verdade que ele ensina."
      }
    },
    {
      id: "LIT_IME_03",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Gregório de Matos e a Poesia Barroca Satírica",
      tipo: "fechada",
      enunciado: "Nos versos cáusticos de Gregório de Matos: 'Que falta nesta cidade? Verdade. / Que mais por sua desonra? Honra. / Falta mais que se lhe ponha? Vergonha. / O demo a viver se exponha, / por mais que a fama a exalte, / numa cidade onde falta / Verdade, Honra, Vergonha', o poeta baiano emprega a técnica barroca do:",
      alternativas: [
        { letra: "A", texto: "Poema em eco com desdobramento dialético, diagnosticando com violência satírica a degradação ética, política e administrativa de Salvador colonial." },
        { letra: "B", texto: "Soneto petrarquista idílico de louvor à caridade dos governadores régios." },
        { letra: "C", texto: "Elogio encomiástico aos comerciantes portugueses do porto de Salvador." },
        { letra: "D", texto: "Poema concreto com destruição da sintaxe tradicional em favor de neologismos." },
        { letra: "E", texto: "Auto dramático pastoral para catequese de escravizados no Recôncavo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O poema em eco responde à pergunta inicial rimando na terminação das palavras (cidade/verdade, desonra/honra), construindo uma síntese perversa do vício colonial.",
        porque: "Gregório de Matos mereceu o epíteto de 'Boca do Inferno' pela audácia destemida de atacar fidalgos, juízes, o governador Antônio Luís da Câmara Coutinho e o clero venal."
      }
    },
    {
      id: "LIT_IME_04",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Arcadismo e Sátira Política: 'Cartas Chilenas'",
      tipo: "fechada",
      enunciado: "Nas 'Cartas Chilenas', atribuídas a Tomás Antônio Gonzaga, o remetente Critilo escreve de Santiago a Doroteu em Madri, narrando com indignação os desmandos despóticos do governador 'Fanfarrão Minésio'. O recurso da transposição geográfica do cenário (Chile em vez de Minas Gerais) tinha como finalidade primordial:",
      alternativas: [
        { letra: "A", texto: "Burlar a rigorosa censura régia da Coroa Portuguesa, permitindo criticar duramente a corrupção e a prepotência do governador Luís da Cunha Meneses às vésperas da Inconfidência Mineira." },
        { letra: "B", texto: "Descrever com exatidão científica a fauna dos Andes chilenos." },
        { letra: "C", texto: "Demonstrar que a monarquia espanhola era superior à monarquia de Lisboa." },
        { letra: "D", texto: "Declarar guerra civil imediata às capitanias vizinhas de São Paulo e Rio de Janeiro." },
        { letra: "E", texto: "Ensinar a língua castelhana aos estudantes de Vila Rica." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "As Cartas Chilenas constituem o mais contundente panfleto satírico em versos da era colonial brasileira.",
        porque: "O disfarce chileno (Santiago = Vila Rica; Fanfarrão Minésio = Cunha Meneses; Critilo = Gonzaga; Doroteu = Cláudio Manuel da Costa) protegia os conspiradores inconfidentes da prisão imediata por crime de lesa-majestade."
      }
    },
    {
      id: "LIT_IME_05",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "O Mito do Adamastor em Camões e a Superação Épica",
      tipo: "fechada",
      enunciado: "No Canto V de 'Os Lusíadas', a frota portuguesa depara-se no extremo sul da África com o hediondo Gigante Adamastor, uma figura colossal de rosto lívido, barba esquálida e olhos encovados. A função alegórica do Gigante Adamastor na epopeia camoniana é:",
      alternativas: [
        { letra: "A", texto: "Materializar os terrores do 'Mar Tenebroso', a fúria das tempestades do Cabo das Tormentas e a dor da punição dos Titãs pela audácia humana em transpor os limites da natureza geológica." },
        { letra: "B", texto: "Receber os navegadores portugueses com presentes de ouro e joias preciosas em nome dos deuses." },
        { letra: "C", texto: "Comandar a nau capitânia até o porto de Calecute na Índia como piloto fiel." },
        { letra: "D", texto: "Provar que a Terra era plana e que as caravelas despencariam no abismo oceânico." },
        { letra: "E", texto: "Simbolizar o apoio irrestrito da deusa Juno às conquistas ultramarinas de Portugal." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Adamastor é a criação mitológica original mais poderosa de Camões: o titã transformado em rochedo estéril por amar a ninfa Tétis que ameaça vingança futura contra os nautas lusos (profetizando os naufrágios de D. Manuel de Sousa Sepúlveda e sua família).",
        porque: "Ao dobrar o cabo, Vasco da Gama vence o gigante pelo diálogo destemido e pela coragem dos nautas, rebatizando o cabo de 'Boa Esperança'."
      }
    },
    {
      id: "LIT_IME_06",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Gregório de Matos e o Soneto Penitencial Barroco",
      tipo: "fechada",
      enunciado: "Nos versos religiosos de Gregório de Matos: 'Pequei, Senhor, mas não porque hei pecado, / Da vossa alta clemência me despido; / Porque quanto mais tenho delinquido, / Vos tenho a perdoar mais empenhado...', o eu lírico articula uma engenhosa argumentação teológica de matriz:",
      alternativas: [
        { letra: "A", texto: "Conceptista barroca, na qual a própria gravidade e o volume dos pecados humanos oferecem a Deus a matéria-prima indispensável para manifestar a infinita glória do Seu perdão e de Sua misericórdia divina." },
        { letra: "B", texto: "Herética e ateia, ridicularizando a existência de Cristo e dos sacramentos." },
        { letra: "C", texto: "Protestante calvinista que nega categoricamente a possibilidade do livre-arbítrio." },
        { letra: "D", texto: "Neoclássica pastoral em louvor às pastoras dos prados serenos." },
        { letra: "E", texto: "Romântica sentimental que clama pela morte prematura por tísica." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O silogismo teológico barroco: se Cristo é o Pastor que veio salvar a ovelha perdida, quanto mais perdida a ovelha, maior o empenho e a glória do Pastor ao resgatá-la.",
        porque: "O poeta coloca Deus numa espécie de 'armadilha da graça': se Deus é o Pai da Misericórdia infinita, recusar o perdão ao pecador confesso diminuiria a própria grandeza da misericórdia divina."
      }
    },
    {
      id: "LIT_IME_07",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Cláudio Manuel da Costa e a Tensão Árcade-Barroca",
      tipo: "fechada",
      enunciado: "O poeta inconfidente Cláudio Manuel da Costa ('Obras Poéticas', 1768) adota o pseudônimo pastoral Glauceste Satúrnio e busca as convenções bucólicas do Arcadismo. Contudo, seus sonetos são marcados por uma constante tensão que a crítica define como:",
      alternativas: [
        { letra: "A", texto: "O choque entre a norma bucólica idealizada européia de campos amenos e a aspereza real da paisagem rochosa, bruta e estéril da mineração em Vila Rica, carregada de resquícios da melancolia e da densidade barroca." },
        { letra: "B", texto: "O entusiasmo ufanista ingênuo com a riqueza dos diamantes do Tijuco." },
        { letra: "C", texto: "A submissão absoluta e bajuladora aos generais do imperador D. Pedro I." },
        { letra: "D", texto: "A recusa da poesia em língua portuguesa em favor exclusivo do verso em francês." },
        { letra: "E", texto: "A composição de poemas futuristas sobre ferrovias a vapor na serra." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O drama de Cláudio Manuel da Costa ('Destes penhascos fez a natureza / o berço em que nasci...'): o poeta quer pastorear ovelhas mansas como nos prados de Horácio, mas seus olhos contemplam penhascos escuros, escombros de minas e lavras de ouro esgotadas.",
        porque: "Essa fratura entre o modelo clássico europeu e a realidade física da serra mineira confere à sua lírica um tom soturno, denso e dilacerado, na fronteira entre o Barroco e o Arcadismo."
      }
    },
    {
      id: "LIT_IME_08",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Augusto dos Anjos e a Poética Cósmico-Científica de 'Eu'",
      tipo: "fechada",
      enunciado: "Na obra única 'Eu' (1912), de Augusto dos Anjos (poeta de transição do Pré-Modernismo), versos como 'Vês?! Ninguém assistiu ao quase encanto / De tua última hora, e uma abelha apenas / A ornar teu corpo de ocre e de areias plenas / Passou... / O homem que, nesta terra miserável, / Mora entre feras, sente inevitável / Necessidade de também ser fera' combinam:",
      alternativas: [
        { letra: "A", texto: "Rigor métrico parnasiano, pessimismo cósmico schopenhaueriano, vocabulário científico e anatômico (escarro, vermes, carbono, micróbios) e angústia existencial expressionista." },
        { letra: "B", texto: "Leveza impressionista e celebração das festas aristocráticas da corte portuguesa." },
        { letra: "C", texto: "Ufanismo republicano e crença cega no progresso idílico da humanidade." },
        { letra: "D", texto: "Poemas religiosos de exaltação ao clero romano sem questionamentos teológicos." },
        { letra: "E", texto: "Crônicas bem-humoradas em versos livres sobre o carnaval carioca." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Augusto dos Anjos é uma voz singular e inclassificável na literatura brasileira: a união da obsessão pela decomposição da matéria biológica à perfeição rítmica dos sonetos decassílabos.",
        porque: "Seu poema 'Versos Íntimos' ('Abafe o monstro na caverna... Acostuma-te à lama que te espera! / O homem, que, nesta terra miserável, / Mora entre feras, sente inevitável / Necessidade de também ser fera') é um monumento à desilusão ontológica humana."
      }
    },
    {
      id: "LIT_IME_09",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Ilha dos Amores e a Apoteose Humanista em Camões",
      tipo: "fechada",
      enunciado: "No Canto IX de 'Os Lusíadas', a deusa Vênus prepara para os marinheiros exaustos de Vasco da Gama o prêmio paradisíaco da 'Ilha dos Amores', onde as ninfas marinhas os acolhem com banquetes e deleites sensuais. A deusa Tétis conduz o capitão ao cume do monte e lhe revela a 'Máquina do Mundo'. O significado filosófico renascentista dessa recompensa mitológica é:",
      alternativas: [
        { letra: "A", texto: "A apoteose humanista do herói navegador, demonstrando que os deuses pagãos e a imortalidade são alegorias criadas pelos homens para consagrar os feitos terrenos extraordinários da coragem e do saber humano." },
        { letra: "B", texto: "A condenação definitiva dos marinheiros ao pecado carnal da luxúria irremediável." },
        { letra: "C", texto: "A prova de que a frota naufragou e todos os personagens estavam no purgatório." },
        { letra: "D", texto: "O estabelecimento de um posto comercial mercantil permanente da Companhia das Índias." },
        { letra: "E", texto: "A vitória militar das ninfas contra o rei D. Manuel I." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Camões explicita no Canto IX que a divindade dos deuses mitológicos não é real: 'Que essas deusas e a Ilha deleitosa / Não são mais que as baroniais proezas / Que a Fama faz sublime e gloriosa'.",
        porque: "A Máquina do Mundo (o modelo cosmológico ptolomaico revelado a Gama) premia o espírito científico e a audácia empírica do homem renascentista, capaz de decifrar as engrenagens do universo pela coragem e pela navegação."
      }
    },
    {
      id: "LIT_IME_10",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "O Parnasianismo e a 'Profissão de Fé' de Olavo Bilac",
      tipo: "fechada",
      enunciado: "No poema-manifesto 'Profissão de Fé', de Olavo Bilac, o poeta parnasiano compara o seu labor artístico ao trabalho minucioso de um ourives que cinzela joias raras em ouro e prata: 'Invejo o ourives quando escreve: / Imito o amor / Com que ele, em ouro, o alto-relevo / Faz de uma flor... / Torce, aprimora, alteia, lima / A frase; e, enfim, / No verso de ouro engasta a rima, / Como um rubim'. A estética parnasiana defendida no poema sustenta:",
      alternativas: [
        { letra: "A", texto: "O culto da 'arte pela arte', a perfeição métrica, o rigor da rima rica e rara, a impassibilidade objetiva e a recusa do sentimentalismo confessional romântico." },
        { letra: "B", texto: "A quebra anárquica de toda e qualquer regra gramatical em versos desordenados." },
        { letra: "C", texto: "A urgência da revolta operária armada contra os donos das fábricas de joias." },
        { letra: "D", texto: "O retorno à religiosidade mística dos monges franciscanos medievais." },
        { letra: "E", texto: "A poesia escrita unicamente na linguagem coloquial caipira do interior." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O Parnasianismo é o triunfo da forma escultural e do lavor artesanal paciente sobre a inspiração ingênua.",
        porque: "Bilac, Raimundo Correia e Alberto de Oliveira formaram a 'Tríade Parnasiana', que reinou absoluta na Academia Brasileira de Letras até ser desafiada pela iconoclastia da Semana de 22."
      }
    },
    {
      id: "LIT_IME_11",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Simbolismo e a Sinestesia Transcendental em Cruz e Sousa",
      tipo: "fechada",
      enunciado: "Nos versos de 'Antífona', poema que abre o livro 'Broquéis' (1893), de Cruz e Sousa (o 'Cisne Negro'): 'Ó Formas alvas, brancas, Formas claras / De luares, de neves, de neblinas!... / Ó Formas vagas, fluidas, cristalinas... / Incensos dos turíbulos das aras... / Formas do Amor, constelarmente puras, / De virgens e de santas vaporosas...', a estética simbolista revela-se através de:",
      alternativas: [
        { letra: "A", texto: "Aliterações em sons sibilantes (/s/) e líquidos (/l/), sinestesia sensorial, obsessão pela cor branca como símbolo do infinito transcendental e busca pela musicalidade pura ('A música antes de tudo')." },
        { letra: "B", texto: "Retrato documental sociológico do trabalho assalariado nas indústrias têxteis." },
        { letra: "C", texto: "Versos satíricos e debochados contra a corte imperial de D. Pedro II." },
        { letra: "D", texto: "Linguagem jornalística crua com estatísticas demográficas de saúde pública." },
        { letra: "E", texto: "Imitação literal das comédias de costumes de Martins Pena." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O Simbolismo reage ao materialismo mecanicista parnasiano e naturalista, buscando a sugestão, o mistério e a comunhão espiritual além dos sentidos.",
        porque: "Cruz e Sousa, filho de escravizados alforriados em Santa Catarina que sofreu na pele o racismo da sociedade republicana, sublima sua dor numa poesia de transcendentalismo metafísico e brancura cósmica deslumbrante."
      }
    },
    {
      id: "LIT_IME_12",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Euclides da Cunha e a Tragédia de 'Os Sertões'",
      tipo: "fechada",
      enunciado: "Em 'Os Sertões' (1902), obra seminal do Pré-Modernismo estruturada em três partes majestosas ('A Terra', 'O Homem' e 'A Luta'), Euclides da Cunha imortaliza a célebre frase: 'O sertanejo é, antes de tudo, um forte'. Essa caracterização do homem do sertão de Canudos fundamenta-se na:",
      alternativas: [
        { letra: "A", texto: "Resiliência quase milagrosa do sertanejo diante da agressividade climática da seca, desmentindo os preconceitos raciais do litoral que viam o mestiço como biologicamente degenerado e expondo o massacre covarde perpetrado pelo Exército da jovem República." },
        { letra: "B", texto: "Exaltação de Antônio Conselheiro como um imperador militar perfeito e invencível." },
        { letra: "C", texto: "Comprovação da superioridade física e moral dos generais do Rio de Janeiro." },
        { letra: "D", texto: "Celebração do clima ameno e chuvoso do interior da Bahia." },
        { letra: "E", texto: "Defesa de que Canudos foi fundada com capital estrangeiro britânico." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Euclides vai a Canudos como correspondente de guerra entusiasmado com a República e retorna estarrecido com o crime de Estado contra um povo faminto.",
        porque: "Embora parta do determinismo racial de sua época, a honestidade intelectual de Euclides obriga-o a reconhecer a têmpera hercúlea do sertanejo e a proclamar que a expedição contra Canudos foi uma 'barbárie' e 'um crime'."
      }
    },
    {
      id: "LIT_IME_13",
      origem: "ITA 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "O Soneto dos Sonetos de Camões: Amor é Fogo que Arde sem se Ver",
      tipo: "aberta",
      enunciado: "Leia o célebre soneto renascentista de Luís de Camões:\n'Amor é fogo que arde sem se ver;\nÉ ferida que dói e não se sente;\nÉ um contentamento descontente;\nÉ dor que desatina sem doer.\n\nÉ um não querer mais que bem querer;\nÉ um andar solitário entre a gente;\nÉ nunca contentar-se de contente;\nÉ cuidar que se ganha em se perder.\n\nÉ querer estar preso por vontade;\nÉ servir a quem vence o vencedor;\nÉ ter com quem nos mata lealdade.\n\nMas como causar pode seu favor\nNos corações humanos amizade,\nSe tão contrário a si é o mesmo Amor?'\n\n(a) Identifique a figura de linguagem estruturante que se desdobra em quase todos os versos do poema, explicando o seu mecanismo semântico. (b) Explique a perplexidade racional levantada pelo eu lírico no terceto final diante do mistério do amor humano.",
      resposta: "(a) Antítese / Paradoxo (oxímoro), unindo termos e sentimentos inconciliáveis e mutuamente excludentes; (b) Questiona como um sentimento fundado em contradições tão dolorosas pode gerar amizade e ser tão desejado pelo coração humano.",
      gabarito: {
        letra: "Aberta",
        ancora: "A poética camoniana dos paradoxos amorosos e a dialética do amor petrarquista e neoplatônico.",
        espera_se: "(a) Figura de linguagem: O poema é estruturado fundamentalmente sobre Paradoxos (oxímoros) e Antíteses ('arde sem se ver', 'dói e não se sente', 'contentamento descontente', 'ganha em se perder'). O mecanismo semântico consiste em associar conceitos lógicos que se anulam reciprocamente no plano da razão objetiva, mas que se revelam plenamente verdadeiros e simultâneos na experiência interior e subjetiva da paixão amorosa.\n(b) Perplexidade no terceto final: Camões conclui com uma pergunta retórica de perplexidade filosófica racional. Se o amor é a própria encarnação da contradição, da servidão voluntária e da dor que desatina, como pode ele suscitar no coração dos homens um favor benévolo, a concórdia e a atração irresistível? A razão humana revela-se incapaz de decifrar o mistério de uma força cósmica que é 'tão contrária a si mesma'."
      }
    },
    {
      id: "LIT_IME_14",
      origem: "IME 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "O Sermão do Mandato e a Dialética do Amor em Vieira",
      tipo: "aberta",
      enunciado: "No 'Sermão do Mandato', pregado na Quinta-Feira Santa em Roma, o Padre Antônio Vieira discute qual foi 'a maior fineza' (o maior ato de amor) praticada por Cristo antes de Sua Paixão: se foi lavar os pés dos discípulos, instituir a Eucaristia ou dar a vida na cruz. Vieira argumenta, com rigor conceptista arrebatador, que a maior fineza do amor de Cristo foi 'ausentar-se' de Seus amados na morte deixando-lhes o Sacramento da Eucaristia para que sentissem Sua falta. Explique de que modo Vieira utiliza a psicologia humana e os paradoxos do amor mundano para sustentar sua tese teológica.",
      resposta: "Vieira argumenta que o amor presente acostuma-se e adormece; a ausência aguça a saudade e desperta a plenitude do desejo amoroso ardente.",
      gabarito: {
        letra: "Aberta",
        ancora: "A engrenagem psicológica do conceptismo de Vieira aplicada aos abismos do amor divino e humano.",
        espera_se: "1. Psicologia do amor: Vieira argumenta que a presença contínua da pessoa amada gera saciedade, desatenção e arrefecimento do ardor. Quando estamos juntos de quem amamos, o amor repousa e perde o ímpeto da busca;\n2. A arte da ausência: Para manter acesa a chama infinita da paixão humana por Deus, a maior fineza de Cristo foi a genialidade amorosa de partir fisicamente (ausentar-se na morte) e, simultaneamente, permanecer velado no pão e no vinho consagrados (presença oculta). Assim, Ele desperta a 'fome da saudade' nos apóstolos e nos fiéis de todos os séculos, convertendo a dor da ausência no maior estímulo para o amor eterno."
      }
    },
    {
      id: "LIT_IME_15",
      origem: "ITA 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Crise da Representação no Romance Machadiano e a Forma Conflituosa da Modernidade",
      tipo: "aberta",
      enunciado: "O crítico literário Roberto Schwarz, em seu célebre ensaio 'Um Mestre na Periferia do Capitalismo', demonstra que a volubilidade e o capricho do narrador de 'Memórias Póstumas de Brás Cubas' não são meros recursos formais importados de Laurence Sterne, mas sim a expressão estilística exata da estrutura de classes da sociedade patriarcal e escravocrata do Brasil do Segundo Reinado. Explique de que maneira o vai-e-vem arbitrário, as mudanças súbitas de humor e o descompromisso ético de Brás Cubas materializam o 'favor' e a conduta real da elite senhorial brasileira do século XIX.",
      resposta: "O estilo volúvel de Brás Cubas mimetiza a arbitrariedade dos senhores de escravos, imunes à lei e ao trabalho, regidos unicamente por seus próprios caprichos soberanos.",
      gabarito: {
        letra: "Aberta",
        ancora: "A tese de Roberto Schwarz sobre as 'ideias fora de lugar' e a forma literária como precipitado da história social.",
        espera_se: "1. A elite brasileira do século XIX adotava da boca para fora o ideário liberal e iluminista europeu (direitos individuais, progresso, civilização), mas sustentava sua riqueza material na barbárie da escravidão e no arbítrio do clientelismo (o favor);\n2. Como herdeiro da classe proprietária e escravocrata, Brás Cubas nunca precisou trabalhar nem obedecer a regras coletivas universais: sua vontade pessoal era a lei indiscutível em sua fazenda e em seu círculo social;\n3. O estilo narrativo de Machado faz com que a forma do romance encarne essa contradição histórica: o narrador pula de um assunto para outro, interrompe capítulos, desdenha do leitor, promete uma ideia filosófica e a abandona no parágrafo seguinte, agindo como um perfeito déspota caprichoso. O estilo volúvel e instável de Brás Cubas é, portanto, a transcrição estética precisa do arbítrio senhorial escravista brasileiro."
      }
    }
  ]
};

salvar('Literatura/Infantojuvenil_e_Fabulas_2to5EF/Questoes_Fabulas_e_Poesia_2ao5ano.json', litInfantil);
salvar('Literatura/Formacao_Literaria_6to9EF/Questoes_Leitura_Literaria_6ao9ano.json', litFormacao);
salvar('Literatura/Romantismo_e_Realismo/Questoes_Realismo_e_Romantismo.json', litRomantismoRealismo);
salvar('Literatura/Modernismo_e_Contemporanea/Questoes_Modernismo_FUVEST_ENEM.json', litModernismo);
salvar('Literatura/IME_ITA/Questoes_Literatura_Classica_e_Modernista_IME_ITA.json', litImeIta);

console.log('--- LOTE 6 (LITERATURA) CONCLUÍDO COM SUCESSO ---');
