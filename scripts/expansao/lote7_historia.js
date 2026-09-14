const fs = require('fs');
const path = require('path');

const BASE_DIR = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';

function salvar(subpath, dados) {
  const p = path.join(BASE_DIR, subpath);
  fs.writeFileSync(p, JSON.stringify(dados, null, 2), 'utf-8');
  console.log(`Atualizado: ${subpath} com ${dados.questoes.length} questões.`);
}

// -------------------------------------------------------------
// 1. HISTÓRIA - ANOS INICIAIS (2º AO 5º ANO EF)
// -------------------------------------------------------------
const histAnosIniciais = {
  disciplina: "Historia",
  modulo: "Historia_Comunidade_e_Tempo_2ao5ano",
  subpasta: "Anos_Iniciais_2to5EF",
  arquivo_origem: "Questoes_Historia_Comunidade_e_Tempo_2ao5ano.json",
  benchmark_didatico: {
    capitulo: "História e Memória: O Tempo, a Família, a Comunidade, o Trabalho e os Patrimônios",
    objetivos_aprendizagem: [
      "Compreender a noção de tempo cronológico e tempo histórico, identificando permanências e transformações nos modos de vida, nas famílias e nas cidades.",
      "Reconhecer diferentes tipos de fontes históricas (documentos escritos, fotografias, relatos orais, objetos materiais e sítios arqueológicos).",
      "Identificar o papel dos diferentes grupos sociais e étnicos (indígenas, africanos escravizados, colonizadores portugueses e imigrantes) na formação cultural do Brasil.",
      "Diferenciar patrimônio material (monumentos, edifícios, cidades históricas) de patrimônio imaterial (festas populares, saberes tradicionais, culinária e manifestações artísticas)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Tempo Cronológico e Tempo Histórico",
          definicao: "O tempo cronológico é o tempo mensurável do calendário, do relógio e da contagem sequencial linear dos dias, meses e séculos. O tempo histórico refere-se às transformações, continuidades e rupturas nas formas de organização social, cultural, política e tecnológica da humanidade. Os historiadores investigam o passado através de fontes históricas materiais (cartas, certidões, ferramentas, construções) e imateriais (memórias orais de idosos, cantigas de roda, lendas)."
        },
        {
          termo: "Família, Comunidade e Diversidade Cultural",
          definicao: "Ao longo das décadas, a estrutura das famílias transformou-se: das antigas famílias patriarcais extensas rurais para configurações plurais e urbanas contemporâneas. Na comunidade, o convívio democrático requer respeito às regras coletivas e valorização da diversidade ética e cultural. A sociedade brasileira formou-se pelo encontro forçado e complexo de matrizes indígenas autóctones, povos africanos escravizados de diversas etnias (iorubás, bantus) e colonizadores europeus, enriquecida no século XIX e XX por correntes migratórias de italianos, alemães, japoneses, sírios e libaneses."
        },
        {
          termo: "Patrimônio Cultural Material e Imaterial",
          definicao: "Patrimônio cultural é o conjunto de bens herdados das gerações passadas que expressam a identidade e a memória de um povo. Patrimônio Material compreende bens tangíveis (o centro histórico de Ouro Preto, o Cristo Redentor, fósseis e ferramentas antigas em museus). Patrimônio Imaterial compreende tradições vivas, saberes, modos de fazer e celebrações comunitárias (o Frevo pernambucano, a Roda de Capoeira, o Círio de Nazaré e o modo artesanal de fazer Queijo Minas)."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente nos anos iniciais: acreditar que fontes históricas são apenas livros antigos escritos em bibliotecas. Uma fotografia de família, um brinquedo que pertenceu aos avós, um áudio de voz ou uma receita culinária antiga guardada pela avó são fontes históricas valiosas para investigar o passado."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Distinção entre Patrimônio Material e Imaterial",
      enunciado: "Classifique o Pelourinho em Salvador e a Roda de Capoeira em Patrimônio Material ou Imaterial, justificando a resposta com base na preservação da memória histórica.",
      resolucao_passo_a_passo: "1. O Pelourinho (Salvador - BA): Trata-se de um conjunto arquitetônico colonial de casarios de alvenaria, igrejas barrocas e calçamento de pedras (bens físicos edificados tangíveis). Portanto, é classificado como Patrimônio Cultural Material.\n2. A Roda de Capoeira: Trata-se de uma manifestação cultural de matriz afro-brasileira que envolve música, cantos em coro, toque do berimbau, gestos corporais de luta e dança e transmissão oral de saberes ancestrais (bem intangível que vive nas pessoas que o praticam). Portanto, é classificada como Patrimônio Cultural Imaterial da Humanidade (UNESCO).\n3. Preservação: O patrimônio material preserva-se com obras de restauração arquitetônica; o patrimônio imaterial preserva-se garantindo a transmissão viva de suas práticas para as novas gerações."
    }
  },
  questoes: [
    {
      id: "HIS_AI_01",
      origem: "SAEB - 5º Ano EF",
      ano_escolar: "3º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Fontes Históricas Materiais e Orais",
      tipo: "fechada",
      enunciado: "Para descobrir como era a vida das crianças há cem anos, um pesquisador entrevista pessoas idosas de uma cidade e analisa álbuns de fotografias antigas da família. Essas fontes de pesquisa são classificadas, respectivamente, como fontes:",
      alternativas: [
        { letra: "A", texto: "Orais e visuais (materiais)." },
        { letra: "B", texto: "Escritas e biológicas." },
        { letra: "C", texto: "Digitais e imaginárias." },
        { letra: "D", texto: "Fictícias e mitológicas." },
        { letra: "E", texto: "Arqueológicas e radioativas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Relatos orais gravados constituem fontes orais; fotografias e pinturas constituem fontes visuais/materiais.",
        porque: "O historiador baseia suas conclusões em vestígios e registros deixados pelos seres humanos ao longo do tempo."
      }
    },
    {
      id: "HIS_AI_02",
      origem: "Prova Paraná - 5º Ano EF",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Patrimônio Cultural Imaterial do Brasil",
      tipo: "fechada",
      enunciado: "Qual das opções abaixo apresenta um exemplo consagrado de Patrimônio Cultural Imaterial brasileiro reconhecido pela UNESCO?",
      alternativas: [
        { letra: "A", texto: "A Roda de Capoeira e o Frevo pernambucano." },
        { letra: "B", texto: "O Palácio do Planalto em Brasília." },
        { letra: "C", texto: "As ruínas de São Miguel das Missões." },
        { letra: "D", texto: "O prédio do Teatro Amazonas em Manaus." },
        { letra: "E", texto: "A Ponte Rio-Niterói." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Patrimônio imaterial compreende saberes, tradições orais, rituais e festas populares.",
        porque: "A Capoeira e o Frevo são manifestações culturais dinâmicas executadas por pessoas e passadas entre gerações (as opções B, C, D e E trazem monumentos físicos materiais)."
      }
    },
    {
      id: "HIS_AI_03",
      origem: "SAEB - 5º Ano EF",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Modos de Vida Indígena antes da Chegada dos Portugueses",
      tipo: "fechada",
      enunciado: "Antes da chegada da esquadra de Pedro Álvares Cabral em 1500, o território brasileiro já era povoado por milhões de indígenas organizados em diversas etnias e línguas (como os povos Tupi-Guarani, Macro-Jê e Aruak). A relação dessas comunidades nativas com a natureza caracterizava-se por:",
      alternativas: [
        { letra: "A", texto: "Uso comunitário e sustentável da terra através da caça, pesca, coleta e coivara (agricultura itinerante de subsistência), sem a noção europeia de propriedade privada individual ou cercamento do solo." },
        { letra: "B", texto: "Destruição sistemática das matas para implantação de grandes usinas siderúrgicas." },
        { letra: "C", texto: "Uso de moedas de ouro e prata cunhadas em bancos imperiais nativos." },
        { letra: "D", texto: "Criação de gado bovino confinado em pastagens cercadas por arame farpado." },
        { letra: "E", texto: "Escravização em massa de animais silvestres para comércio marítimo transatlântico." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Os povos originários possuíam organização societária sem divisão em classes sociais capitalistas nem posse privada da terra.",
        porque: "A terra era um bem comum sagrado partilhado por toda a aldeia para a garantia de alimentos e a preservação do equilíbrio espiritual e ecológico com as florestas."
      }
    },
    {
      id: "HIS_AI_04",
      origem: "Colégio Militar",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "O Trabalho Escravizado e a Resistência Quilombola",
      tipo: "fechada",
      enunciado: "Durante o período colonial e imperial no Brasil, milhões de africanos foram trazidos à força através do tráfico negreiro para trabalhar sob regime de escravidão nas lavouras de cana-de-açúcar e nas minas de ouro. A mais célebre forma de resistência coletiva organizada contra o cativeiro foi a formação de:",
      alternativas: [
        { letra: "A", texto: "Quilombos (como o Quilombo dos Palmares, liderado por Zumbi e Dandara), povoados fortificados no interior das matas que abrigavam escravizados fugidos e cultivavam a liberdade." },
        { letra: "B", texto: "Partidos políticos de oposição legal que concorriam às eleições para deputado." },
        { letra: "C", texto: "Associações empresariais de compra de terras no centro das capitais." },
        { letra: "D", texto: "Viagens pacíficas de retorno imediato à África custeadas pela Coroa Portuguesa." },
        { letra: "E", texto: "Greves remuneradas combinadas previamente com os senhores de engenho." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Os quilombos foram centros de resistência física, cultural, social e militar contra a opressão desumanizadora da escravidão.",
        porque: "Palmares, na Serra da Barriga (atual Alagoas), resistiu por quase um século como símbolo imperecível da luta do povo negro pela liberdade e autonomia."
      }
    },
    {
      id: "HIS_AI_05",
      origem: "SAEB - 5º Ano EF",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Imigração Europeia e Asiática no Século XIX e XX",
      tipo: "fechada",
      enunciado: "A partir do final do século XIX, com a decadência e a abolição da escravidão, o governo brasileiro incentivou a vinda de milhares de famílias de imigrantes europeus (como italianos e alemães) e asiáticos (como japoneses) para o Brasil. Esses imigrantes fixaram-se principalmente:",
      alternativas: [
        { letra: "A", texto: "Nas fazendas de café do interior de São Paulo como trabalhadores assalariados/colonos e nas colônias agrícolas familiares do Sul do país." },
        { letra: "B", texto: "Nos seringais da Amazônia para caçar onças pintadas." },
        { letra: "C", texto: "Nas minas de prata do sertão nordestino." },
        { letra: "D", texto: "Exclusivamente nas capitais litorâneas como pescadores de baleias." },
        { letra: "E", texto: "Nas aldeias indígenas do Xingu para catequizar os nativos." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A expansão cafeeira no Oeste Paulista e o povoamento de pequenas propriedades no Rio Grande do Sul e Santa Catarina atraíram levas migratórias volumosas.",
        porque: "Os imigrantes trouxeram suas tradições culturais, culinárias, técnicas agrícolas e sotaques, enriquecendo a identidade pluricultural das regiões Sul e Sudeste."
      }
    },
    {
      id: "HIS_AI_06",
      origem: "Colégio Pedro II",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Transformação dos Meios de Transporte e Comunicação",
      tipo: "fechada",
      enunciado: "Nas cidades brasileiras do início do século XX, as pessoas deslocavam-se a pé, a cavalo ou em bondes puxados por burros. Com a introdução dos bondes elétricos, das ferrovias a vapor e mais tarde dos automóveis particulares, o espaço urbano transformou-se com:",
      alternativas: [
        { letra: "A", texto: "O crescimento da velocidade dos deslocamentos, a ampliação dos bairros para além do centro histórico e o surgimento dos subúrbios residenciais." },
        { letra: "B", texto: "A extinção definitiva de todas as estradas de rodagem do país." },
        { letra: "C", texto: "A proibição de viagens de longa distância entre cidades vizinhas." },
        { letra: "D", texto: "A obrigatoriedade de todas as pessoas morarem no mesmo local de trabalho." },
        { letra: "E", texto: "O abandono completo do uso da eletricidade urbana." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A evolução tecnológica dos transportes permitiu a expansão física e a descentralização das cidades modernas.",
        porque: "O trabalhador pôde morar mais longe do centro produtivo, surgindo linhas ferroviárias suburbanas que articularam a expansão metropolitana."
      }
    },
    {
      id: "HIS_AI_07",
      origem: "Olimpíada Nacional de História do Brasil - Mirim",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "O Trabalho Infantil no Passado e os Direitos da Criança",
      tipo: "fechada",
      enunciado: "No início da industrialização no Brasil (século XIX e primeiras décadas do século XX), crianças de 7 a 12 anos trabalhavam até 14 horas por dia em fábricas de tecidos sob péssimas condições e salários miseráveis. Hoje, o trabalho infantil é proibido e criminalizado no Brasil graças a lutas históricas que culminaram na aprovação do:",
      alternativas: [
        { letra: "A", texto: "Estatuto da Criança e do Adolescente (ECA) e na Constituição de 1988, que garantem à criança o direito fundamental de estudar, brincar e ter proteção integral da família e do Estado." },
        { letra: "B", texto: "Tratado de Tordesilhas assinado no século XV." },
        { letra: "C", texto: "Código de Hamurabi babilônico da Antiguidade." },
        { letra: "D", texto: "Ato Institucional nº 5 do regime militar." },
        { letra: "E", texto: "Regulamento das Capitanias Hereditárias da Coroa." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A infância passou a ser reconhecida juridicamente como etapa especial de desenvolvimento humano que exige proteção integral contra a exploração laboral.",
        porque: "O ECA (Lei nº 8.069/1990) proíbe qualquer trabalho a menores de 14 anos (salvo como aprendiz a partir dos 14), priorizando a educação formal e o lazer."
      }
    },
    {
      id: "HIS_AI_08",
      origem: "Colégio Militar de Curitiba",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Cidadania e Espaço Público vs Espaço Privado",
      tipo: "fechada",
      enunciado: "Na organização das cidades, é fundamental distinguir o espaço público do espaço privado. Assinale a alternativa que exemplifica corretamente um espaço público e os direitos e deveres dos cidadãos em relação a ele:",
      alternativas: [
        { letra: "A", texto: "Uma praça municipal com parque infantil é um espaço público de livre acesso de todos, cujo dever coletivo é preservar a limpeza, os brinquedos e os jardins comuns." },
        { letra: "B", texto: "A sala de estar de uma residência particular é um espaço público onde qualquer estranho pode entrar livremente." },
        { letra: "C", texto: "Um shopping center privado pertence à prefeitura e não visa lucro." },
        { letra: "D", texto: "O quarto de uma criança na fazenda é administrado pelos deputados federais." },
        { letra: "E", texto: "Os cidadãos não têm nenhuma obrigação em cuidar das ruas e praças da cidade." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Espaço público é de uso comum do povo e mantido pelo poder público através dos impostos pagos pelos cidadãos.",
        porque: "O exercício pleno da cidadania requer a preservação cuidadosa do patrimônio coletivo e o respeito ao bem-estar da comunidade."
      }
    },
    {
      id: "HIS_AI_09",
      origem: "SAEB - 5º Ano EF",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "A Mudança da Capital: De Salvador ao Rio e a Brasília",
      tipo: "fechada",
      enunciado: "Ao longo de sua história política, o Brasil teve três capitais oficiais. A ordem cronológica correta dessas capitais e a razão principal da transferência definitiva para o Planalto Central (Brasília) em 1960 foram:",
      alternativas: [
        { letra: "A", texto: "Salvador → Rio de Janeiro → Brasília; com o objetivo de integrar o interior do país ao desenvolvimento econômico e proteger o centro político nacional." },
        { letra: "B", texto: "São Paulo → Salvador → Brasília; para aproximar o governo dos portos de café." },
        { letra: "C", texto: "Rio de Janeiro → Salvador → Recife; por motivos de clima frio." },
        { letra: "D", texto: "Brasília → Rio de Janeiro → Salvador; para devolver o poder à Bahia colonial." },
        { letra: "E", texto: "Belo Horizonte → Curitiba → Manaus; para fugir das tempestades marinhas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Salvador (1549-1763, ciclo do açúcar); Rio de Janeiro (1763-1960, escoamento do ouro e café); Brasília (inaugurada por Juscelino Kubitschek para interiorizar o desenvolvimento).",
        porque: "A transferência planejada para o coração do Centro-Oeste visava povoar o interior do território e conectar as regiões rodoviariamente."
      }
    },
    {
      id: "HIS_AI_10",
      origem: "Colégio de Aplicação UERJ",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Patrimônio Histórico e a Cidade de Ouro Preto",
      tipo: "fechada",
      enunciado: "A cidade histórica de Ouro Preto (antiga Vila Rica), em Minas Gerais, foi declarada Patrimônio Mundial da Humanidade pela UNESCO devido à:",
      alternativas: [
        { letra: "A", texto: "Excepcional preservação de seu conjunto arquitetônico e urbano barroco colonial do século XVIII, marcado pelas igrejas e esculturas de Aleijadinho e pelo ciclo do ouro." },
        { letra: "B", texto: "Existência de modernas fábricas automobilísticas futuristas no centro urbano." },
        { letra: "C", texto: "Presença dos maiores arranha-céus de vidro e aço da América Latina." },
        { letra: "D", texto: "Grande muralha de pedra construída pelos imperadores incas." },
        { letra: "E", texto: "Extensa praia tropical onde atracaram as caravelas de Cabral." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Ouro Preto foi a primeira cidade brasileira a receber o título de Patrimônio Cultural da Humanidade em 1980.",
        porque: "Suas ladeiras de pedras, igrejas barrocas com talha dourada e obras do mestre Antônio Francisco Lisboa (Aleijadinho) testemunham o apogeu da mineração no século XVIII."
      }
    },
    {
      id: "HIS_AI_11",
      origem: "Colégio Militar de Manaus",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Vida nos Quilombos Contemporâneos e Demarcação",
      tipo: "fechada",
      enunciado: "Hoje existem no Brasil milhares de comunidades remanescentes de quilombos (comunidades quilombolas). De acordo com a Constituição Federal de 1988, essas comunidades têm direito garantido por lei à:",
      alternativas: [
        { letra: "A", texto: "Titulação definitiva e demarcação da posse de suas terras tradicionais ancestrais, bem como à preservação de suas memórias, saberes e costumes culturais." },
        { letra: "B", texto: "Obrigatoriedade de mudar-se imediatamente para as capitais industriais." },
        { letra: "C", texto: "Venda compulsória de suas florestas para mineradoras estrangeiras." },
        { letra: "D", texto: "Perda da cidadania brasileira por viverem no campo." },
        { letra: "E", texto: "Substituição de sua cultura tradicional por modelos importados." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O Artigo 68 do Ato das Disposições Constitucionais Transitórias (ADCT) reconheceu a propriedade definitiva das terras aos remanescentes das comunidades dos quilombos.",
        porque: "A titulação quilombola é uma reparação histórica que garante aos descendentes o direito de cultivar suas terras coletivas com sustentabilidade e dignidade."
      }
    },
    {
      id: "HIS_AI_12",
      origem: "ONHB Mirim",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Sítios Arqueológicos e Pinturas Rupestres no Brasil",
      tipo: "fechada",
      enunciado: "No Parque Nacional da Serra da Capivara, no Piauí, a arqueóloga Niède Guidon e sua equipe descobriram milhares de pinturas rupestres antiquíssimas gravadas em paredões de rocha que retratam cenas de caça, danças e animais pré-históricos. A importância científica desse sítio arqueológico reside no fato de:",
      alternativas: [
        { letra: "A", texto: "Comprovar que a presença humana na América do Sul é muito mais antiga do que se acreditava (ultrapassando dezenas de milhares de anos), desafiando a teoria tradicional do povoamento pelo Estreito de Bering." },
        { letra: "B", texto: "Provar que os dinossauros foram domesticados pelos colonizadores portugueses." },
        { letra: "C", texto: "Descobrir uma cidade soterrada feita inteiramente de vidro e metal." },
        { letra: "D", texto: "Demonstrar que o Piauí era um país independente governado por faraós egípcios." },
        { letra: "E", texto: "Apresentar as primeiras fotografias coloridas tiradas por viajantes franceses." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A Serra da Capivara abriga o maior acervo de arte rupestre das Américas e fósseis que revolucionaram o debate sobre a ocupação humana do continente.",
        porque: "Os vestígios de fogueiras e ferramentas de quartzo de datação pleistocênica colocaram o Brasil no centro da arqueologia mundial sobre as primeiras migrações humanas."
      }
    },
    {
      id: "HIS_AI_13",
      origem: "Colégio Pedro II 2ª Fase",
      ano_escolar: "4º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Trabalho Formal vs Informal e Trabalho Doméstico",
      tipo: "aberta",
      enunciado: "Ao longo do tempo, as formas de trabalho mudaram bastante. Explique: (a) Qual a diferença entre trabalho com carteira assinada (formal) e trabalho informal; (b) Por que o trabalho doméstico e de cuidado realizado em casa (cozinhar, limpar, cuidar dos filhos e idosos) é fundamental para a sociedade, mesmo muitas vezes não sendo remunerado financeiramente?",
      resposta: "(a) Formal tem direitos garantidos por lei (férias, 13º, previdência); Informal não tem registro nem garantias; (b) Sustenta a vida, a saúde e a capacidade de todos os outros membros da família trabalharem fora.",
      gabarito: {
        letra: "Aberta",
        ancora: "Reconhecimento das relações sociolaborais e valorização da economia do cuidado doméstico.",
        espera_se: "(a) Relações de trabalho:\n1. Trabalho formal: É aquele registrado na Carteira de Trabalho, garantindo ao trabalhador os direitos da CLT (salário mínimo fixo, férias remuneradas, 13º salário, descanso semanal, seguro-desemprego e aposentadoria);\n2. Trabalho informal: É realizado sem registro legal (como vendedores ambulantes, bicos ocasionais), onde o trabalhador não possui proteção da previdência, estabilidade salarial nem direitos trabalhistas em caso de acidente ou doença.\n(b) Trabalho de cuidado/doméstico: É o alicerce silencioso de toda a economia. Sem a preparação da alimentação diária, a higiene da casa e o cuidado afetuoso de crianças e enfermos (historicamente desempenhado quase sempre por mulheres), os demais trabalhadores não teriam saúde, nutrição nem equilíbrio para produzir riqueza nas fábricas, escritórios e escolas."
      }
    },
    {
      id: "HIS_AI_14",
      origem: "Olimpíada Nacional de História do Brasil",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Luta pelo Direito ao Voto Feminino no Brasil",
      tipo: "aberta",
      enunciado: "Durante o Império e as primeiras décadas da República brasileira, as mulheres eram proibidas por lei de votar e de concorrer a cargos políticos, ficando excluídas das decisões do país. Somente em 1932, após intensa mobilização do movimento sufragista (liderado por mulheres pioneiras como Bertha Lutz), o direito ao voto feminino foi conquistado. Explique: (a) Por que essa conquista representou um marco histórico fundamental para a democracia brasileira; (b) Por que a cidadania não é algo doado de presente, mas sim fruto de lutas coletivas continuadas.",
      resposta: "(a) Reconheceu metade da população como cidadãs plenas com direito de escolher governantes; (b) Porque os direitos sociais e políticos resultam de coragem, mobilização e pressão histórica do povo sobre as leis vigentes.",
      gabarito: {
        letra: "Aberta",
        ancora: "A história do sufragismo feminino e o conceito dinâmico de conquista da cidadania participativa.",
        espera_se: "(a) Marco democrático: Uma nação onde mais de 50% dos seus habitantes é impedida de votar simplesmente por pertencer ao sexo feminino não é uma democracia verdadeira. O direito ao voto feminino em 1932 (incorporado no Código Eleitoral e na Constituição de 1934) reconheceu a igualdade política civil das mulheres, permitindo que elas ocupassem parlamentos, prefeituras e influenciassem as leis do país.\n(b) Conquista cidadã: A história ensina que nenhum direito fundamental (como fim da escravidão, férias, voto feminino, liberdade religiosa) foi concedido espontaneamente de presente pelos governantes poderosos. Todos os avanços civilizatórios nasceram da coragem, organização coletiva, passeatas, artigos e protestos de cidadãos que enfrentaram preconceitos para alargar os horizontes da justiça social."
      }
    },
    {
      id: "HIS_AI_15",
      origem: "Colégio Militar de Brasília",
      ano_escolar: "5º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Memória das Escolas e as Mudanças nos Materiais Escolares",
      tipo: "aberta",
      enunciado: "Ao examinar uma fotografia de uma sala de aula de 1920, um estudante nota que os alunos usavam tinteiro e caneta com pena de metal para escrever em cadernos pautados, sentavam em carteiras pesadas de madeira fixadas no chão de assoalho e meninos e meninas estudavam em salas ou prédios rigorosamente separados. Compare com a escola atual e responda: (a) Aponte duas transformações técnicas ocorridas nos materiais e suportes de escrita; (b) Aponte uma transformação social pedagógica fundamental na convivência entre os alunos na sala de aula contemporânea.",
      resposta: "(a) Da pena com tinteiro e mata-borrão para a caneta esferográfica plástica e tablets/computadores digitais; (b) O fim da segregação por gênero com salas de aula mistas e democráticas voltadas para o diálogo cooperativo.",
      gabarito: {
        letra: "Aberta",
        ancora: "Análise comparativa de cultura material escolar e evolução dos paradigmas pedagógicos.",
        espera_se: "(a) Transformações nos materiais: 1. A caneta de pena mergulhada no tinteiro líquido (que borrava com facilidade e exigia mata-borrão) foi substituída a partir da década de 1950 pela caneta esferográfica moderna, descartável e de secagem rápida; 2. O papel e o quadro-negro de giz convivem hoje com telas digitais, computadores, tablets e quadros brancos interativos, ampliando a pesquisa imediata de informações na internet.\n(b) Transformação social e pedagógica: No passado, a pedagogia tradicional impunha a disciplina do silêncio passivo e a separação estrita entre meninos e meninas (escolas masculinas e femininas que ensinavam tarefas domésticas para elas e matemática/ciências para eles). A escola contemporânea é mista, inclusiva e democrática: meninos e meninas estudam os mesmos conteúdos juntos, aprendendo a cooperar, debater e respeitar-se mutuamente em pé de igualdade."
      }
    }
  ]
};

// -------------------------------------------------------------
// 2. HISTÓRIA - ANOS FINAIS (6º AO 9º ANO EF)
// -------------------------------------------------------------
const histAnosFinais = {
  disciplina: "Historia",
  modulo: "Historia_Antiga_e_Brasil_Colonia_6ao9ano",
  subpasta: "Anos_Finais_6to9EF",
  arquivo_origem: "Questoes_Historia_Antiga_e_Brasil_Colonia_6ao9ano.json",
  benchmark_didatico: {
    capitulo: "História das Civilizações: Da Antiguidade Clássica ao Brasil Colonial e Iluminismo",
    objetivos_aprendizagem: [
      "Compreender as civilizações da Antiguidade Clássica (a Democracia Ateniense, a República e o Império Romano, e a instituição da escravidão antiga).",
      "Analisar o Feudalismo medieval europeu (suserania e vassalagem, sociedade estamental e poder da Igreja) e o Renascimento Cultural e Científico.",
      "Examinar a Expansão Marítima Europeia (Grandes Navegações), o Mercantilismo e a colonização do Brasil (pau-brasil, capitanias hereditárias e governo-geral).",
      "Investigar a economia açucareira (plantation, engenho, escravidão africana) e o ciclo da mineração no século XVIII, relacionando-o às revoltas coloniais e à Inconfidência Mineira."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Democracia Ateniense vs República Romana",
          definicao: "Atenas criou a democracia direta na Eclésia: os cidadãos debatiam e votavam diretamente as leis em praça pública (isonomia e isegoria). Contudo, a cidadania ateniense era excludente: reservada exclusivamente a homens adultos, livres e filhos de pai e mãe atenienses, excluindo categoricamente mulheres, metecos (estrangeiros) e a grande massa de escravizados que sustentava a produção. Em Roma, a República substituiu a Monarquia, dividida entre Patrícios (aristocratas de sangue que dominavam o Senado) e Plebeus (livres sem direitos políticos, que conquistaram os Tribunos da Plebe e a Lei das Doze Tábuas após revoltas). A crise republicana levou à expansão territorial militarizada e ao Principado/Império."
        },
        {
          termo: "Feudalismo e Transição para a Idade Moderna",
          definicao: "Após a fragmentação do Império Romano do Ocidente (476 d.C.), a Europa medieval organizou-se em torno do Feudo: economia agrária autossuficiente e sociedade estamental rígida (Nobreza guerreira, Clero orante e Servos camponeses adstritos à terra sob pesados tributos: corveia, talha, banalidades). Relações de suserania e vassalagem articulavam a nobreza militar por juramento de fidelidade e honra. A crise do século XIV (Peste Negra, Guerra dos Cem Anos e revoltas camponesas) abalou a servidão feudal, impulsionando o Renascimento Cultural (humanismo, antropocentrismo, racionalismo) e a centralização do poder nas Monarquias Absolutistas."
        },
        {
          termo: "Brasil Colonial: Açúcar, Escravidão e Ouro",
          definicao: "Inserido no sistema do Antigo Regime e Mercantilismo sob o Pacto Colonial (exclusivo metropolitano). O ciclo da cana-de-açúcar no Nordeste (séculos XVI e XVII) estruturou-se no tripé da plantation: latifúndio monocultor agroexportador com mão de obra escravizada africana, sob comando do patriarca senhor de engenho na casa-grande. No século XVIII, a descoberta de ouro e diamantes em Minas Gerais deslocou o eixo econômico e político para o Sudeste (transferência da capital para o Rio em 1763), gerando urbanização, forte fiscalização da Coroa (quinto, derrama, casas de fundição) e a eclosão da Inconfidência Mineira (1789) e da Conjuração Baiana (1798)."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico nos anos finais: confundir a escravidão na Antiguidade Clássica (Grécia e Roma) com a escravidão mercantil moderna no Brasil. Na Antiguidade, a escravidão decorria de prisioneiros de guerra ou dívidas econômicas, sem conotação racial ou biológica. No Brasil colonial e no Atlântico moderno, a escravidão foi um gigantesco empreendimento mercantil racializado, que desumanizou especificamente as populações negras africanas e indígenas."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Comparação entre Inconfidência Mineira e Conjuração Baiana",
      enunciado: "Compare a Inconfidência Mineira (1789) com a Conjuração Baiana (1798) quanto à composição social de seus participantes e à defesa do fim da escravidão.",
      resolucao_passo_a_passo: "1. Inconfidência Mineira (1789): Movimento de caráter elitista, liderado por intelectuais, poetas árcades, magistrados e grandes mineradores endividados com a Coroa contra a cobrança da Derrama. Propunha a Proclamação da República e universidade em Vila Rica, mas não defendia a abolição da escravidão, pois os próprios líderes inconfidentes eram proprietários de escravizados.\n2. Conjuração Baiana (ou Revolta dos Alfaiates, 1798): Movimento popular e radical, influenciado pela fase jacobina da Revolução Francesa e pela Revolução do Haiti. Teve ampla participação de alfaiates, soldados rasos, homens livres pobres e negros escravizados e libertos (como Lucas Dantas, Manuel Faustino, João de Deus e Luís Gonzaga das Virgens).\n3. Pauta sobre escravidão: A Conjuração Baiana defendia explicitamente a Proclamação da República, a abertura dos portos e a imediata e total Abolição da Escravidão, constituindo um projeto democrático muito mais profundo e igualitário."
    }
  },
  questoes: [
    {
      id: "HIS_AF_01",
      origem: "SAEB - 9º Ano EF",
      ano_escolar: "6º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "A Democracia Ateniense e seus Limites",
      tipo: "fechada",
      enunciado: "Na Grécia Antiga, a cidade-estado de Atenas desenvolveu o modelo pioneiro de democracia direta durante o século V a.C. (Século de Péricles). No entanto, esse sistema democrático era profundamente excludente porque a cidadania plena era restrita a:",
      alternativas: [
        { letra: "A", texto: "Homens adultos livres nascidos em Atenas de pai e mãe atenienses, excluindo categoricamente mulheres, estrangeiros (metecos) e escravizados." },
        { letra: "B", texto: "Todas as mulheres e crianças que trabalhavam no campo." },
        { letra: "C", texto: "Exclusivamente aos soldados espartanos prisioneiros de guerra." },
        { letra: "D", texto: "Qualquer pessoa que pagasse um tributo financeiro aos sacerdotes do oráculo." },
        { letra: "E", texto: "Filósofos que abrissem mão de suas propriedades rurais." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Apesar de revolucionária por abolir a tirania e instituir a isonomia entre os iguais, a cidadania ateniense englobava menos de 10% da população total da pólis.",
        porque: "A grande maioria (mulheres, escravos e metecos) sustentava economicamente a pólis sem ter qualquer direito a voz ou voto na Ágora ou na Eclésia."
      }
    },
    {
      id: "HIS_AF_02",
      origem: "Colégio Pedro II",
      ano_escolar: "7º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Sociedade Estamental Feudal e Relações de Vassalagem",
      tipo: "fechada",
      enunciado: "Na Europa medieval feudal, a sociedade organizava-se em três ordens estamentais bem delimitadas justificadas pela teologia cristã: 'Os que rezam' (o Clero), 'Os que guerreiam' (a Nobreza senhorial) e 'Os que trabalham' (os Servos camponeses). Uma característica central das relações no interior da nobreza feudal era:",
      alternativas: [
        { letra: "A", texto: "O contrato feudo-vassálico de suserania e vassalagem, fundado no juramento sagrado de lealdade mútua, auxílio militar e concessão de feudos/terras." },
        { letra: "B", texto: "O assalariamento livre dos cavaleiros com carteira assinada pelos reis." },
        { letra: "C", texto: "A realização de eleições democráticas anuais para escolha dos senhores dos castelos." },
        { letra: "D", texto: "A proibição de casamentos entre membros de famílias nobres." },
        { letra: "E", texto: "O pagamento de impostos exclusivamente pela nobreza armada." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A homenagem e a investidura selavam a aliança militar entre o suserano (que doa o feudo) e o vassalo (que deve prestar serviço militar e fidelidade ao senhor).",
        porque: "Essa rede fragmentada de lealdades nobres mantinha o poder político descentralizado nas mãos dos barões e duques locais, em detrimento da autoridade central dos reis."
      }
    },
    {
      id: "HIS_AF_03",
      origem: "Colégio Militar",
      ano_escolar: "7º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "O Renascimento Cultural: Humanismo e Racionalismo",
      tipo: "fechada",
      enunciado: "Entre os séculos XIV e XVI, cidades mercantis italianas como Florença e Veneza foram o berço do Renascimento Cultural e Artístico (marcado por mestres como Leonardo da Vinci, Michelangelo e Rafael). Os ideais intelectuais que balizaram esse movimento humanista foram:",
      alternativas: [
        { letra: "A", texto: "Antropocentrismo (o ser humano no centro do pensamento), racionalismo, valorização da observação da natureza e resgate dos ideais estéticos e filosóficos da Antiguidade greco-romana." },
        { letra: "B", texto: "Teocentrismo radical e negação de qualquer estudo sobre a anatomia humana." },
        { letra: "C", texto: "Destruição sistemática de todas as esculturas e pinturas clássicas romanas." },
        { letra: "D", texto: "Proibição da imprensa e fechamento de todas as universidades europeias." },
        { letra: "E", texto: "Retorno à vida primitiva nas cavernas sem uso da escrita." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O humanismo renascentista celebrou a dignidade, a inteligência e o potencial criativo do homem através da razão e da ciência empírica.",
        porque: "Sem abandonar a fé em Deus, os artistas renascentistas romperam com o dogmatismo medieval estrito, inovando com a perspectiva geométrica, o claro-escuro e o realismo anatômico."
      }
    },
    {
      id: "HIS_AF_04",
      origem: "IFSP / IFs Técnicos",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "O Sistema Colonial e o Pacto Colonial Mercantilista",
      tipo: "fechada",
      enunciado: "No contexto do Mercantilismo europeu da Idade Moderna, a relação entre Portugal (a Metrópole) e o Brasil (a Colônia) foi regida pelo chamado 'Pacto Colonial' (exclusivo metropolitano), que determinava que:",
      alternativas: [
        { letra: "A", texto: "A colônia só podia comercializar seus produtos agrícolas e minerais com a metrópole e era obrigada a consumir exclusivamente as manufaturas vindas de Portugal a preços fixados pelos mercadores lusos." },
        { letra: "B", texto: "A colônia tinha total liberdade para comerciar com ingleses, franceses e espanhóis sem pagar taxas." },
        { letra: "C", texto: "Os colonos brasileiros governavam o reino de Lisboa e elegiam os reis da dinastia de Bragança." },
        { letra: "D", texto: "A colônia podia desenvolver indústrias pesadas avançadas sem autorização régia." },
        { letra: "E", texto: "Os lucros das lavouras de açúcar ficavam inteiramente retidos nas mãos dos escravizados." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O Exclusivo Comercial colonial visava garantir balança comercial favorável e enriquecimento metálico da Coroa e da burguesia mercantil reinol.",
        porque: "A colônia existia em função da metrópole: fornecia matérias-primas tropicais a preços baixos e absorvia manufaturas caras, sendo proibida de ter indústrias manufatureiras próprias (como ratificado pelo Alvará de 1785 de D. Maria I)."
      }
    },
    {
      id: "HIS_AF_05",
      origem: "Colégio Naval",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Economia Açucareira e o Engenho Colonial",
      tipo: "fechada",
      enunciado: "O complexo do engenho colonial de cana-de-açúcar no Nordeste brasileiro do século XVII constituía um microcosmo social completo e autossuficiente. As duas construções que simbolizavam a extrema polarização e hierarquia social do engenho eram:",
      alternativas: [
        { letra: "A", texto: "A Casa-Grande (moradia patriarcal e centro de poder do senhor de engenho) e a Senzala (habitação coletiva escura, desumana e superlotada dos escravizados africanos)." },
        { letra: "B", texto: "O Senado da Câmara e a Casa da Moeda." },
        { letra: "C", texto: "A biblioteca iluminista e a câmara frigorífica." },
        { letra: "D", texto: "O quartel dos generais e a alfândega portuária." },
        { letra: "E", texto: "A capela dos frades franciscanos e o tribunal de júri popular." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Gilberto Freyre consagrou o binômio 'Casa-Grande & Senzala' para sintetizar a estrutura patriarcal, autoritária e escravocrata que moldou a formação social brasileira.",
        porque: "A casa-grande concentrava a soberania senhorial quase feudal; a senzala materializava o cárcere cotidiano onde a força de trabalho dos negros escravizados era explorada até a exaustão física."
      }
    },
    {
      id: "HIS_AF_06",
      origem: "SAEB - 9º Ano EF",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "O Iluminismo e os Filósofos das Luzes",
      tipo: "fechada",
      enunciado: "O movimento intelectual do Iluminismo (século XVIII), liderado por pensadores como Voltaire, Montesquieu, Rousseau e Locke, contestou radicalmente as bases do Antigo Regime ao defender:",
      alternativas: [
        { letra: "A", texto: "A razão crítica contra o obscurantismo religioso, a igualdade jurídica dos cidadãos perante a lei, a divisão dos poderes (Executivo, Legislativo e Judiciário) e a soberania popular." },
        { letra: "B", texto: "O poder absoluto inquestionável dos reis concedido por direito divino." },
        { letra: "C", texto: "A censura obrigatória de livros e o fortalecimento dos tribunais da Santa Inquisição." },
        { letra: "D", texto: "A restauração do feudalismo agrário e o aumento dos impostos clericais." },
        { letra: "E", texto: "A proibição da ciência experimental e da astronomia moderna." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O Século das Luzes defendeu as liberdades civis, os direitos naturais inalienáveis à vida e à propriedade e a limitação constitucional do Estado.",
        porque: "As teorias iluministas inspiraram as grandes revoluções burguesas mundiais (Independência dos EUA e Revolução Francesa) e as conspirações emancipacionistas no Brasil colonial."
      }
    },
    {
      id: "HIS_AF_07",
      origem: "Colégio Militar",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Ciclo do Ouro e a Cobrança dos Impostos Régios",
      tipo: "fechada",
      enunciado: "Durante o auge da mineração em Minas Gerais no século XVIII, a Coroa Portuguesa estabeleceu rigorosos mecanismos de fiscalização tributária para combater o contrabando de ouro em pó. O imposto correspondente à quinta parte de todo o metal extraído (20%) fundido em barras com o selo real e a exigência de arrecadar anualmente 100 arrobas de ouro sob pena de penhora violenta de bens eram, respectivamente, denominados:",
      alternativas: [
        { letra: "A", texto: "O Quinto (e as Casas de Fundição) e a Derrama." },
        { letra: "B", texto: "A Dízima real e o DPVAT colonial." },
        { letra: "C", texto: "A Capitação e a Carta Régia de Perdão." },
        { letra: "D", texto: "O Alvará das Fábricas e a Tarifa Alves Branco." },
        { letra: "E", texto: "O Dote da Princesa e a Fiança do Ouro." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O Quinto incidia sobre todo o ouro declarado nas Casas de Fundição. A ameaça da Derrama (cobrança forçada do déficit das 100 arrobas) deflagrou a Inconfidência Mineira em 1789.",
        porque: "Diante do esgotamento geológico das jazidas e da asfixia tributária metropolitana, a insatisfação dos fazendeiros e mineradores endividados com a Coroa atingiu níveis insustentáveis."
      }
    },
    {
      id: "HIS_AF_08",
      origem: "Colégio Pedro II",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Inconfidência Mineira e o Julgamento de Tiradentes",
      tipo: "fechada",
      enunciado: "Após a delação de Joaquim Silvério dos Reis em troca do perdão de suas vultosas dívidas fiscais, a Inconfidência Mineira foi desmantelada pelas autoridades da Coroa Portuguesa antes de ser deflagrada. Dentre todos os participantes condenados na Devassa, por que apenas o alferes Joaquim José da Silva Xavier (Tiradentes) foi enforcado e esquartejado em praça pública no Rio de Janeiro em 1792?",
      alternativas: [
        { letra: "A", texto: "Porque pertencia à patente militar mais baixa entre os conspiradores (não era rico nem desembargador), assumiu com coragem a liderança do movimento sem delatar companheiros e serviu de bode expiatório para uma punição exemplar com exibição pedagógica de terror pela Coroa." },
        { letra: "B", texto: "Porque foi o único conspirador que de fato tentou assassinar o rei de Portugal pessoalmente." },
        { letra: "C", texto: "Porque confessou ser espião remunerado pelo governo imperial britânico." },
        { letra: "D", texto: "Porque todos os demais inconfidentes fugiram para o exterior antes do julgamento." },
        { letra: "E", texto: "Porque era o homem mais rico e influente de toda a capitania de Minas Gerais." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A Coroa comutou a pena de morte dos inconfidentes da alta aristocracia para o degredo perpétuo na África, poupando os nobres.",
        porque: "Tiradentes, sendo de origem social humilde, foi escolhido para o suplício público: seu corpo foi esquartejado e sua cabeça fincada num poste em Vila Rica para aterrorizar qualquer súdito que ousasse pensar em rebelião."
      }
    },
    {
      id: "HIS_AF_09",
      origem: "SAEB - 9º Ano EF",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "A Vinda da Família Real Portuguesa ao Brasil (1808)",
      tipo: "fechada",
      enunciado: "Em 1808, fugindo da invasão das tropas napoleônicas na Península Ibérica escoltada pela esquadra de guerra britânica, a Família Real portuguesa e a corte de D. João VI transferiram-se para o Brasil. A primeira medida econômica de impacto histórico tomada pelo príncipe regente ao aportar em Salvador foi:",
      alternativas: [
        { letra: "A", texto: "A Abertura dos Portos às Nações Amigas, que rompeu na prática o Pacto Colonial e concedeu privilégios alfandegários imediatos às manufaturas inglesas." },
        { letra: "B", texto: "A decretação imediata da abolição total da escravidão nas fazendas." },
        { letra: "C", texto: "A entrega definitiva de todo o território colonial ao império da França." },
        { letra: "D", texto: "O confisco de todos os depósitos de ouro dos bancos cariocas." },
        { letra: "E", texto: "A proibição da circulação de moeda metálica em terras brasileiras." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A Carta Régia de 28 de janeiro de 1808 decretou o fim do monopólio comercial português sobre o Brasil.",
        porque: "Essa abertura comercial beneficiou amplamente a Inglaterra (que quebrava o Bloqueio Continental napoleônico) e acelerou a autonomia econômica que conduziria à independência política em 1822."
      }
    },
    {
      id: "HIS_AF_10",
      origem: "Colégio Militar",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Revolução Francesa e a Queda do Antigo Regime",
      tipo: "fechada",
      enunciado: "A Revolução Francesa de 1789 é considerada pelos historiadores o marco inaugural da Idade Contemporânea. O documento revolucionário seminal aprovado pela Assembleia Nacional Constituinte que proclamou solenemente que 'os homens nascem e permanecem livres e iguais em direitos' intitula-se:",
      alternativas: [
        { letra: "A", texto: "Declaração dos Direitos do Homem e do Cidadão." },
        { letra: "B", texto: "Tratado de Versalhes da Primeira Guerra Mundial." },
        { letra: "C", texto: "Constituição Civil do Clero Absolutista." },
        { letra: "D", texto: "Código Napoleônico de Direito de Família." },
        { letra: "E", texto: "Manifesto Comunista da Liga dos Justos." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A Declaração dos Direitos do Homem e do Cidadão (agosto de 1789) consagrou as premissas universais da liberdade, igualdade, fraternidade e propriedade privada.",
        porque: "O documento demoliu os privilégios seculares feudais de nascença da nobreza e do clero, inspirando cartas constitucionais de todo o mundo moderno."
      }
    },
    {
      id: "HIS_AF_11",
      origem: "Colégio Naval / EPCAR",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "As Invasões Holandesas no Nordeste e a Administração de Maurício de Nassau",
      tipo: "fechada",
      enunciado: "Durante a União Ibérica (1580-1640), a Companhia das Índias Ocidentais (WIC) holandesa invadiu e dominou a capitania de Pernambuco por mais de duas décadas (1630-1654). O período de governo do conde Maurício de Nassau (1637-1644) no Recife foi marcado por:",
      alternativas: [
        { letra: "A", texto: "Tolerância religiosa entre católicos, calvinistas e judeus, modernização e urbanização da 'Cidade Maurícia', empréstimos aos senhores de engenho luso-brasileiros e atração de cientistas e artistas europeus (como Frans Post e Albert Eckhout)." },
        { letra: "B", texto: "Massacre sistemático e imediato de todos os colonos de origem portuguesa." },
        { letra: "C", texto: "Destruição total de todos os engenhos de cana-de-açúcar de Olinda e Recife." },
        { letra: "D", texto: "Abolição definitiva da escravidão em todas as possessões holandesas das Américas." },
        { letra: "E", texto: "Entrega voluntária de Pernambuco ao imperador da Espanha sem resistência armada." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O governo de Nassau representou uma época de apogeu econômico, embelezamento urbano e florescimento cultural no Nordeste açucareiro.",
        porque: "Após a sua demissão pelos diretores financistas da WIC, os holandeses passaram a cobrar violentamente as dívidas dos senhores de engenho, deflagrando a Insurreição Pernambucana (1645-1654) que expulsou os invasores batavos."
      }
    },
    {
      id: "HIS_AF_12",
      origem: "ONHB Fase Nacional",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Revolução do Haiti e o Medo das Elites Escravocratas (O 'Haitianismo')",
      tipo: "fechada",
      enunciado: "Em 1791, a colônia francesa de São Domingos no Caribe foi sacudida pela Revolução do Haiti, na qual os negros escravizados rebelaram-se contra os colonizadores brancos, derrotaram o exército de Napoleão e proclamaram a primeira república negra e independente das Américas em 1804. No Brasil escravocrata do século XIX, esse acontecimento gerou o fenômeno sociopolítico denominado 'Haitianismo', que consistia no:",
      alternativas: [
        { letra: "A", texto: "Pânico permanente das elites senhoriais de que a população negra escravizada do Brasil (amplamente majoritária) se rebelasse em revolta armada geral, assassinasse os senhores brancos e tomasse o controle do país." },
        { letra: "B", texto: "Desejo das elites brasileiras de emigrar imediatamente para as praias do Caribe." },
        { letra: "C", texto: "Adoção da língua francesa e do dialeto crioulo haitiano no parlamento do Império." },
        { letra: "D", texto: "Apoio militar do imperador D. Pedro I aos generais rebeldes haitianos." },
        { letra: "E", texto: "Proibição da importação de café e açúcar originários da ilha de Santo Domingo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O 'Haitianismo' foi o maior pesadelo político dos senhores de terras e escravizados no Brasil oitocentista.",
        porque: "O medo visceral de uma insurreição negra em massa motivou a repressão brutal a qualquer conspiração popular (como na Revolta dos Malês em Salvador, 1835) e manteve a elite coesa em torno do poder centralizado da monarquia imperial para preservar a ordem escravista."
      }
    },
    {
      id: "HIS_AF_13",
      origem: "Colégio Pedro II 2ª Fase",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Escravidão Indígena vs Africana na Colonização",
      tipo: "aberta",
      enunciado: "Nos primeiros anos de colonização do Brasil, os colonizadores portugueses tentaram utilizar em larga escala a mão de obra indígena escravizada, mas a partir de meados do século XVI passaram a priorizar o tráfico negreiro transatlântico de escravizados africanos. (a) Aponte dois motivos históricos, econômicos ou biológicos que levaram à substituição da escravização indígena pela africana nos canaviais nordestinos; (b) Por que é um mito colonial racista afirmar que 'o indígena não trabalhava porque era preguiçoso'?",
      resposta: "(a) Alta lucratividade do tráfico negreiro mercantil para a Coroa e mortandade indígena por epidemias europeias; (b) O indígena não se submetia à disciplina do lucro mercantil mercantilista alheia à sua cultura comunitária e resistia fugindo pelo domínio da mata.",
      gabarito: {
        letra: "Aberta",
        ancora: "Desconstrução do mito da 'passividade' indígena e análise da engrenagem capitalista mercantil do tráfico negreiro atlântico.",
        espera_se: "(a) Motivos da substituição:\n1. Lucratividade do Tráfico Negreiro: O comércio transatlântico de almas africanas gerava lucros astronômicos para os mercadores portugueses e fornecia volumosa arrecadação de impostos alfandegários diretos para a Coroa de Lisboa;\n2. Choque biológico e resistência territorial: As populações nativas foram dizimadas por epidemias de varíola, gripe e sarampo (catástrofe demográfica). Além disso, os indígenas conheciam profundamente o território florestal, resistiam militarmente e fugiam com facilidade para o sertão, inviabilizando a segurança do cativeiro no litoral.\n(b) Desconstrução do mito da indolência: Classificar o indígena como 'preguiçoso' é um preconceito etnocêntrico europeu. Na cultura indígena, trabalhava-se apenas o estritamente necessário para atender às necessidades alimentares e rituais da aldeia (economia de subsistência e lazer comunitário). O nativo não via nenhum sentido em ser açoitado por 16 horas por dia para acumular riqueza e açúcar para enriquecer um fidalgo distante em Lisboa, e sua recusa em aceitar a servidão forçada foi um ato sublime de rebeldia e resistência à escravidão."
      }
    },
    {
      id: "HIS_AF_14",
      origem: "ONHB 2ª Fase",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Revolução Pernambucana de 1817",
      tipo: "aberta",
      enunciado: "Em 1817 eclodiu a Revolução Pernambucana, considerada o mais bem-sucedido movimento emancipacionista pré-independência no Brasil colonial, chegando a tomar o poder e instalar um governo provisório republicano por mais de dois meses em Pernambuco, Paraíba e Rio Grande do Norte. (a) Quais foram as principais causas de insatisfação popular e das elites locais contra a corte do rei D. João VI instalada no Rio de Janeiro? (b) Cite duas medidas republicanas e libertárias implementadas pelo governo revolucionário de 1817.",
      resposta: "(a) Altos impostos criados para sustentar os luxos da corte no Rio e a seca de 1816; (b) Proclamação da República com liberdade de imprensa e de consciência religiosa.",
      gabarito: {
        letra: "Aberta",
        ancora: "A Revolução de 1817 como a única revolta separatista do período joanino que ultrapassou a fase conspiratória e fundou um Estado soberano.",
        espera_se: "(a) Causas da revolta:\n1. Sangria tributária e privilégios da corte: Os produtores de açúcar e algodão de Pernambuco estavam sufocados por pesados impostos criados pela corte joanina para custear o luxo e os privilégios dos cortesãos e da burocracia do Rio de Janeiro;\n2. Crise econômica e seca: A terrível seca de 1816 gerou quebra de safras, fome e desabastecimento de gêneros básicos em Recife, contrastando com o desprezo das autoridades coloniais portuguesas em relação ao sofrimento da província.\n(b) Medidas implementadas:\n1. Proclamação formal de uma República independente com governo provisório colegiado;\n2. Instituição da liberdade de imprensa, liberdade de expressão e liberdade de culto religioso (tolerância a credos não-católicos);\n3. Extinção de tributos odiosos sobre a carne e farinha, embora os revolucionários tenham mantido a escravidão para não perder o apoio dos grandes senhores rurais."
      }
    },
    {
      id: "HIS_AF_15",
      origem: "Colégio Naval / EPCAR",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Conjuração Baiana (1798) e seu Pioneirismo Abolicionista e Popular",
      tipo: "aberta",
      enunciado: "A Conjuração Baiana de 1798 (também conhecida como Revolta dos Alfaiates ou Revolução dos Búzios) espalhou panfletos manuscritos pelos muros da cidade de Salvador conclamando o povo: 'Animai-vos, povo baiense, que está para chegar o tempo feliz da nossa liberdade...'. (a) Explique por que a Conjuração Baiana apresentou um caráter social e democrático muito mais radical e avançado do que a Inconfidência Mineira; (b) Como a Coroa Portuguesa puniu os quatro líderes negros do movimento (Lucas Dantas, Manuel Faustino, Luís Gonzaga das Virgens e João de Deus)?",
      resposta: "(a) Tinha liderança popular e defendia a República, a igualdade racial e o fim imediato da escravidão; (b) Foram enforcados e esquartejados na Praça da Piedade com seus restos mortais expostos para aterrorizar a população.",
      gabarito: {
        letra: "Aberta",
        ancora: "A Conjuração Baiana como o primeiro movimento político emancipacionista brasileiro a vincular independência nacional com abolição da escravidão e igualdade racial.",
        espera_se: "(a) Radicalismo social:\nA Inconfidência Mineira (1789) foi um levante de fidalgos e proprietários brancos que não defendiam a libertação dos negros escravizados. Já a Conjuração Baiana de 1798 nasceu das aspirações de homens livres pobres, artesãos, alfaiates e negros escravizados e forros inspirados na fase popular e jacobina da Revolução Francesa. O programa baiano exigia não apenas o fim do domínio português e a proclamação da República, mas também a Abertura dos Portos, o aumento do soldo dos soldados rasos e a Imediata Abolição da Escravidão com igualdade de direitos sem distinção de cor de pele.\n(b) Punição implacável:\nA reação do governo colonial português foi sanguinária e aterrorizante. Ao contrário dos inconfidentes mineiros nobres que ganharam penas de degredo suave, os quatro líderes populares negros e pardos (os soldados Lucas Dantas e Luís Gonzaga das Virgens, e os alfaiates João de Deus e Manuel Faustino) foram sumariamente condenados à morte por enforcamento na Praça da Piedade em Salvador em novembro de 1799. Seus corpos foram decepados e esquartejados, e suas cabeças e membros pendurados em postes em locais públicos para demonstrar a crueldade com que o Império Português sufocava qualquer revolta que ameaçasse o regime escravocrata."
      }
    }
  ]
};

// -------------------------------------------------------------
// 3. HISTÓRIA - BRASIL (FUVEST, ENEM E UERJ)
// -------------------------------------------------------------
const histBrasil = {
  disciplina: "Historia",
  modulo: "Historia_do_Brasil_FUVEST_ENEM_UERJ",
  subpasta: "Brasil",
  arquivo_origem: "Questoes_Historia_do_Brasil_FUVEST_ENEM_UERJ.json",
  benchmark_didatico: {
    capitulo: "História do Brasil Império e República: Do Primeiro Reinado à Redemocratização",
    objetivos_aprendizagem: [
      "Compreender a consolidação do Império brasileiro: a Constituição de 1824 e o Poder Moderador, o Período Regencial e as revoltas provinciais (Cabanagem, Farroupilha, Sabinada, Balaiada e Malês).",
      "Analisar o Segundo Reinado (1840-1889): a economia cafeeira do Vale do Paraíba e Oeste Paulista, a Guerra do Paraguai e a crise da monarquia escravista com as leis abolicionistas.",
      "Examinar a República Velha (1889-1930): coronelismo, política do café-com-leite, movimentos sociais rurais (Canudos, Contestado) e urbanos (Revolta da Vacina, Revolta da Chibata, Tenentismo).",
      "Analisar a Era Vargas (1930-1945), a Ditadura Militar (1964-1985) e o processo de Redemocratização culminando na Constituição Cidadã de 1988."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Império do Brasil: Poder Moderador e Regências",
          definicao: "A Constituição outorgada de 1824 por D. Pedro I instaurou a monarquia parlamentarista peculiar brasileira com quatro poderes: Executivo, Legislativo, Judiciário e o Poder Moderador (privilégio exclusivo e absoluto do Imperador para dissolver a Câmara, nomear senadores vitalícios e vetar leis). O Período Regencial (1831-1840) foi o mais agitado e descentralizado da história imperial, marcado por revoltas separatistas e populares (Cabanagem no Pará, Farroupilha no RS, Revolta dos Malês na Bahia), contidas pelo 'Golpe da Maioridade' (1840) que coroou D. Pedro II aos 14 anos, restaurando a unidade territorial e o controle conservador centralizado."
        },
        {
          termo: "República Oligárquica (1889-1930)",
          definicao: "Proclamada por um golpe cívico-militar em 1889, estruturou-se sob a Constituição de 1891 (federalismo descentralizado, voto aberto e restrito aos homens alfabetizados). Mecanismos de dominação oligárquica: Política dos Governadores (pacto entre o presidente e os oligarcas estaduais), Política do Café com Leite (alternância hegemônica de São Paulo e Minas Gerais no poder federal) e o Coronelismo (poder privatista dos latifundiários locais baseado no voto de cabresto, violência de jagunços e clientelismo de troca de favores). Resistências populares: Canudos (1897), Revolta da Vacina (1904), Revolta da Chibata (1910) e Tenentismo (1922-1924)."
        },
        {
          termo: "Era Vargas, Ditadura Militar e Redemocratização",
          definicao: "A Revolução de 30 rompeu a hegemonia cafeeira. A Era Vargas (1930-1945) promoveu a industrialização de base (CSN, Vale), a legislação trabalhista (CLT) atrelada ao corporativismo e culminou na ditadura civil do Estado Novo (1937-1945). O Golpe Civil-Militar de 1964 instaurou 21 anos de regime autoritário focado na Doutrina de Segurança Nacional, censura, tortura e cassação de direitos políticos (AI-5, 1968), justificado pelo 'Milagre Econômico' que gerou endividamento externo e inflação descontrolada. A redemocratização foi impulsionada pelo movimento das Diretas Já (1984), culminando na Assembleia Nacional Constituinte e na promulgação da Constituição de 1988."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente no ENEM e FUVEST: acreditar que a Lei Áurea (1888) foi um presente de pura bondade da Princesa Isabel. A abolição foi fruto de intensa resistência e revoltas ativas dos próprios escravizados (fugas em massa, quilombos urbanos como o do Leblon, insurreições), combinada à formidável pressão política do movimento abolicionista negro e intelectual (Luiz Gama, André Rebouças, José do Patrocínio) e às pressões econômicas inglesas."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: O Papel de Luiz Gama no Movimento Abolicionista",
      enunciado: "Quem foi Luiz Gama e qual método inédito ele empregou na luta abolicionista durante o Segundo Reinado em São Paulo?",
      resolucao_passo_a_passo: "1. Biografia e identidade: Luiz Gama (1830-1882) foi filho de uma mulher negra livre (Luísa Mahin) e de um fidalgo português. Foi vendido ilegalmente como escravo pelo próprio pai aos 10 anos de idade, aprendeu a ler sozinho na mocidade, conquistou judicialmente sua própria liberdade comprovando sua condição de nascido livre e tornou-se rábula (advogado prático autodidata) e jornalista brilhante.\n2. Método de luta inovador: Enquanto muitos abolicionistas se limitavam a discursos poéticos e jantares de caridade, Luiz Gama utilizou as brechas da própria legislação imperial escravocrata nos tribunais para libertar escravizados.\n3. Estratégia jurídica: Apoiou-se na Lei Feijó de 7 de novembro de 1831 (lei que proibia a entrada de escravizados no Brasil e declarava livres todos os africanos desembarcados ilegalmente após aquela data). Ao exigir em juízo que os fazendeiros provassem a data legal de compra de seus escravos, Luiz Gama libertou mais de 500 homens e mulheres escravizados gratuitamente nos tribunais paulistas, tornando-se o maior herói jurista popular do abolicionismo brasileiro."
    }
  },
  questoes: [
    {
      id: "HIS_BRA_01",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Constituição de 1824 e o Poder Moderador",
      tipo: "fechada",
      enunciado: "A Constituição brasileira de 1824, outorgada pelo imperador D. Pedro I após dissolver a Assembleia Constituinte à força militar, instituiu uma estrutura política baseada em quatro poderes. O Poder Moderador, definido como a 'chave de toda a organização política', concedia ao monarca a prerrogativa soberana de:",
      alternativas: [
        { letra: "A", texto: "Dissolver a Câmara dos Deputados, vetar projetos de lei, nomear senadores vitalícios e destituir juízes, sobrepondo a vontade do imperador aos demais poderes do Estado." },
        { letra: "B", texto: "Submeter todas as decisões executivas à aprovação prévia dos sindicatos de trabalhadores." },
        { letra: "C", texto: "Declarar a abolição imediata da escravidão em todas as províncias do país." },
        { letra: "D", texto: "Extinguir a monarquia e convocar eleições para um presidente da República." },
        { letra: "E", texto: "Entregar a soberania das decisões diplomáticas à Inglaterra sem contestação." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Inspirado no filósofo francês Benjamin Constant, o Poder Moderador tornou o imperador um árbitro supremo inquestionável e inviolável.",
        porque: "Essa concentração absolutista de poder nas mãos de D. Pedro I deflagrou violenta oposição liberal, culminando na Confederação do Equador (1824) e em sua posterior abdicação em 1831."
      }
    },
    {
      id: "HIS_BRA_02",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Revoltas Regenciais: A Revolta dos Malês (1835)",
      tipo: "fechada",
      enunciado: "Em janeiro de 1835, na cidade de Salvador, eclodiu a Revolta dos Malês, um dos levantes urbanos mais singulares e temidos do Brasil imperial. O diferencial histórico desse movimento de escravizados africanos foi:",
      alternativas: [
        { letra: "A", texto: "Ser liderado por escravizados e libertos de religião muçulmana (iorubás e hauçás), alfabetizados em língua árabe, que organizaram a conspiração através de escritos e almejavam tomar o poder em Salvador e libertar os adeptos do Islã." },
        { letra: "B", texto: "Ter sido planejado exclusivamente por padres católicos jesuítas no convento de São Francisco." },
        { letra: "C", texto: "A defesa da restauração do império colonial português e da monarquia absolutista de D. Miguel." },
        { letra: "D", texto: "A aliança militar com os grandes senhores de engenho contra a Guarda Nacional." },
        { letra: "E", texto: "Ter conquistado pacificamente a independência da Bahia sem derramamento de sangue." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Os 'Malês' (termo derivado de imale, muçulmano em iorubá) portavam amuletos com passagens do Alcorão e demonstraram altíssimo grau de organização letrada secreta.",
        porque: "O levante aterrorizou as autoridades brancas provinciais, que temiam a repetição da Revolução Haitiana em solo soteropolitano, resultando em execuções, deportações massivas para a África e proibição de cultos islâmicos."
      }
    },
    {
      id: "HIS_BRA_03",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "A Lei de Terras de 1850 e a Concentração Fundiária",
      tipo: "fechada",
      enunciado: "Promulgada em 1850, mesmo ano da extinção oficial do tráfico negreiro transatlântico pela Lei Eusébio de Queirós, a Lei de Terras (Lei nº 601) estabeleceu que as terras públicas devolutas só poderiam ser adquiridas a partir de então através de:",
      alternativas: [
        { letra: "A", texto: "Compra em leilão público com pagamento exclusivo em dinheiro à vista, impedindo o acesso à posse da terra por posseiros pobres, imigrantes assalariados e futuros ex-escravizados." },
        { letra: "B", texto: "Doação gratuita e universal para qualquer família sem teto." },
        { letra: "C", texto: "Divisão igualitária dos latifúndios em assentamentos de reforma agrária familiar." },
        { letra: "D", texto: "Permuta por títulos de nobreza concedidos pelo imperador." },
        { letra: "E", texto: "Ocupação primária por usucapião após um ano de cultivo de hortaliças." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A Lei de Terras privatizou o solo em benefício da oligarquia cafeeira e garantiu que os trabalhadores livres fossem forçados a trabalhar como assalariados nas fazendas dos coronéis.",
        porque: "Ao proibir a posse simples pela ocupação e exigir vultosas quantias monetárias à vista, a lei blindou a estrutura latifundiária arcaica, cujas raízes de desigualdade fundiária perduram até o presente no Brasil."
      }
    },
    {
      id: "HIS_BRA_04",
      origem: "UNICAMP",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "A Guerra do Paraguai (1864-1870) e a Crise do Império",
      tipo: "fechada",
      enunciado: "A Guerra do Paraguai (ou Guerra da Tríplice Aliança), o conflito armado interestatal mais sangrento da história da América do Sul, gerou profundas consequências políticas para o Segundo Reinado brasileiro, destacando-se:",
      alternativas: [
        { letra: "A", texto: "O fortalecimento do Exército Brasileiro como instituição política coesa, profissional e modernizadora, que passou a criticar abertamente a monarquia escravista e abraçou o ideal republicano e positivista." },
        { letra: "B", texto: "A anexação completa de todo o território paraguaio como nova província imperial do Brasil." },
        { letra: "C", texto: "O pagamento integral de toda a dívida externa brasileira aos bancos de Londres." },
        { letra: "D", texto: "A abolição imediata da escravidão assinada durante a batalha de Curupaiti." },
        { letra: "E", texto: "A coroação militar do marechal Caxias como imperador vitalício." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O Exército retornou da guerra consciente de sua força política e indignado por conviver com a escravidão (muitos soldados eram 'Voluntários da Pátria' escravizados que lutaram com bravura pela nação).",
        porque: "A Questão Militar, associada ao abolicionismo e à adesão dos cafeicultores paulistas ao Partido Republicano, desferiu o golpe de misericórdia que sepultou o trono de Pedro II em 1889."
      }
    },
    {
      id: "HIS_BRA_05",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "República Velha: O Coronelismo e o Voto de Cabresto",
      tipo: "fechada",
      enunciado: "Na Primeira República (1889-1930), a Constituição de 1891 estabelecia que o voto era universal masculino para alfabetizados, mas aberto (não-secreto). Essa ausência de sigilo no voto viabilizou a consolidação do mecanismo oligárquico do 'Voto de Cabresto', que consistia em:",
      alternativas: [
        { letra: "A", texto: "A coação moral, física e eleitoral exercida pelos coronéis sobre os eleitores dependentes de suas fazendas, que eram forçados a votar nos candidatos da situação sob ameaça de violência de capangas ou perda de emprego." },
        { letra: "B", texto: "A contagem digital automatizada dos votos pelas cooperativas operárias." },
        { letra: "C", texto: "A votação secreta em urnas blindadas transportadas pela marinha de guerra." },
        { letra: "D", texto: "A proibição de proprietários de terras de votarem nas eleições presidenciais." },
        { letra: "E", texto: "A anulação sumária dos votos de quem residisse na zona rural." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Como os jagunços do coronel vigiavam quem assinava a ata eleitoral, o eleitor vulnerável não tinha alternativa senão votar no apadrinhado do patrão.",
        porque: "O 'curral eleitoral' dos coronéis garantia votos para os governadores estaduais, que em contrapartida apoiavam o presidente da República na política dos governadores montada por Campos Sales."
      }
    },
    {
      id: "HIS_BRA_06",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Revoltas Populares da Primeira República: Canudos (1896-1897)",
      tipo: "fechada",
      enunciado: "O arraial de Canudos, fundado pelo líder messiânico Antônio Conselheiro no sertão árido da Bahia, reuniu cerca de vinte e cinco mil camponeses pobres, ex-escravizados e sertanejos despossuídos em uma comunidade autônoma e comunal. A violenta reação militar do Estado republicano que culminou no massacre de Canudos foi motivada pelo:",
      alternativas: [
        { letra: "A", texto: "Temor das oligarquias latifundiárias locais diante da perda de mão de obra barata e pela histeria da imprensa da capital que acusava falsamente a comunidade messiânica de ser uma perigosa conspiração monarquista financiada pela Inglaterra contra a jovem República." },
        { letra: "B", texto: "Ataque militar armado e invasão de navios de guerra conselheiristas ao porto do Rio de Janeiro." },
        { letra: "C", texto: "Assalto de Canudos aos cofres do Banco do Brasil em Salvador." },
        { letra: "D", texto: "Aliança comprovada entre Antônio Conselheiro e o czar da Rússia soviética." },
        { letra: "E", texto: "Desejo dos sertanejos de entregar a Bahia aos colonizadores holandeses." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Canudos incomodava os coronéis porque acolhia os oprimidos que abandonavam as fazendas de gado para viver comunitariamente no Belo Monte.",
        porque: "O governo federal enviou quatro expedições militares consecutivas; as tropas do Exército empregaram artilharia pesada e degolaram os prisioneiros rendidos, queimando e arrasando a cidade até os alicerces, como denunciado por Euclides da Cunha em 'Os Sertões'."
      }
    },
    {
      id: "HIS_BRA_07",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "A Revolta da Vacina (1904) e a Modernização Higienista do Rio",
      tipo: "fechada",
      enunciado: "Em novembro de 1904, a cidade do Rio de Janeiro foi palco de uma violenta insurreição popular com barricadas nas ruas e quebra-quebra, conhecida como a Revolta da Vacina. Esse protesto de massa não foi apenas uma reação ingênua contra a obrigatoriedade da vacina contra a varíola, expressando primordialmente:",
      alternativas: [
        { letra: "A", texto: "A revolta contra a reforma urbana autoritária do prefeito Pereira Passos ('Bota-Abaixo'), que demoliu milhares de cortiços e expulsou a população pobre do centro para os morros sem indenização, aliada à invasão violenta de lares por agentes sanitários armados." },
        { letra: "B", texto: "O descontentamento militar com a compra de submarinos nucleares dos Estados Unidos." },
        { letra: "C", texto: "A exigência dos operários por fábricas de vacinas estatais em todos os bairros." },
        { letra: "D", texto: "A tentativa de restauração da corte da princesa Isabel no Palácio Guanabara." },
        { letra: "E", texto: "O protesto contra o encarecimento das passagens de bondes elétricos." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A campanha higienista de Oswaldo Cruz foi a gota d'água de uma profunda crise social de moradia e humilhação civil da classe trabalhadora carioca.",
        porque: "A população ressentia-se da violência da polícia higienista que arrombava residências privadas e da perda de seus lares nos cortiços demolidos para a abertura das largas avenidas parisienses da capital."
      }
    },
    {
      id: "HIS_BRA_08",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "A Era Vargas: Legislação Trabalhista e Corporativismo",
      tipo: "fechada",
      enunciado: "Durante o governo de Getúlio Vargas, em especial no Estado Novo (1937-1945), a criação da Consolidação das Leis do Trabalho (CLT, 1943), do salário mínimo e da carteira de trabalho atendeu a uma dupla finalidade estratégica:",
      alternativas: [
        { letra: "A", texto: "Atender a históricas reivindicações do operariado urbano e, simultaneamente, tutelar, controlar e desmobilizar os sindicatos sob a égide corporativista do Ministério do Trabalho, proibindo greves independentes." },
        { letra: "B", texto: "Abolir a propriedade privada das indústrias e implantar o modelo de sovietes fabris no Brasil." },
        { letra: "C", texto: "Eliminar todos os direitos trabalhistas conquistados na República Velha." },
        { letra: "D", texto: "Obrigar os operários a trabalhar gratuitamente nas lavouras de cana do Nordeste." },
        { letra: "E", texto: "Substituir a moeda brasileira pelo dólar norte-americano nas fábricas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O varguismo construiu a imagem de Vargas como o 'Pai dos Pobres', concedendo direitos sociais vitais ao mesmo tempo em que enquadrava os sindicatos como órgãos atrelados ao Estado ('sindicatos pelegos').",
        porque: "A CLT pacificou os conflitos operários urbanos e acelerou a industrialização nacional, embora tenha excluído intencionalmente os trabalhadores rurais da legislação trabalhista."
      }
    },
    {
      id: "HIS_BRA_09",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "O Governo JK e o Plano de Metas: '50 Anos em 5'",
      tipo: "fechada",
      enunciado: "O governo de Juscelino Kubitschek (1956-1961) celebrizou-se pelo lema ufanista '50 anos de progresso em 5 anos de governo' através do Plano de Metas e da construção de Brasília. O modelo econômico implementado pelo chamado 'nacional-desenvolvimentismo' caracterizou-se pelo:",
      alternativas: [
        { letra: "A", texto: "Tripé macroeconômico articulando o capital estatal em infraestrutura de base (energia e transportes), o capital estrangeiro multinacional em bens de consumo duráveis (indústria automobilística) e o capital privado nacional em bens não-duráveis." },
        { letra: "B", texto: "Fechamento absoluto da economia brasileira para qualquer investimento externo." },
        { letra: "C", texto: "Congelamento total de salários e eliminação de estradas de rodagem em favor de canais fluviais." },
        { letra: "D", texto: "Monopólio estatal exclusivo sobre todas as padarias, lojas e comércios do país." },
        { letra: "E", texto: "Investimento prioritário na reforma agrária radical e no campesinato sem terras." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "JK abriu as portas do país para as multinacionais automobilísticas (Ford, Volkswagen, GM) e acelerou a rodoviarização nacional.",
        porque: "Embora tenha modernizado e industrializado o país erguendo Brasília, o modelo gerou disparada inflacionária, endividamento externo e acentuou as desigualdades regionais e a crise da dívida pública."
      }
    },
    {
      id: "HIS_BRA_10",
      origem: "UERJ",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Ditadura Civil-Militar e o Ato Institucional nº 5 (AI-5)",
      tipo: "fechada",
      enunciado: "Baixado em 13 de dezembro de 1968 pelo general Costa e Silva no auge dos protestos estudantis e da oposição civil, o Ato Institucional nº 5 (AI-5) inaugurou o período mais sombrio da ditadura militar brasileira ('os anos de chumbo') porque:",
      alternativas: [
        { letra: "A", texto: "Fechou o Congresso Nacional por tempo indeterminado, suspendeu a garantia de habeas corpus para crimes políticos, instituiu a censura prévia irrestrita à imprensa e às artes e conferiu poder ao presidente para cassar mandatos e direitos políticos sem controle judicial." },
        { letra: "B", texto: "Restabeleceu eleições diretas para presidente e anistiou todos os exilados políticos." },
        { letra: "C", texto: "Extinguiu as Forças Armadas e entregou o poder ao Supremo Tribunal Federal." },
        { letra: "D", texto: "Proibiu o ensino da língua inglesa em todas as escolas e universidades do país." },
        { letra: "E", texto: "Nacionalizou todas as agências bancárias estrangeiras sediadas no território nacional." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O AI-5 rasgou qualquer verniz de legalidade jurídica democrática no Brasil, consolidando o terror de Estado.",
        porque: "Sem habeas corpus e sob censura militar, os órgãos de repressão (DOI-CODI e DOPS) institucionalizaram prisões arbitrárias, torturas bárbaras, assassinatos e desaparecimentos forçados de opositores políticos."
      }
    },
    {
      id: "HIS_BRA_11",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Campanha das 'Diretas Já' (1984) e a Emenda Dante de Oliveira",
      tipo: "fechada",
      enunciado: "Em 1984, milhões de cidadãos vestidos de amarelo tomaram as ruas das capitais brasileiras no maior movimento de massas da história nacional, conhecido como a campanha das 'Diretas Já'. O objetivo central do movimento era aprovar a Emenda Constitucional Dante de Oliveira, que propunha:",
      alternativas: [
        { letra: "A", texto: "O restabelecimento de eleições diretas imediatas para a Presidência da República em 1984, derrotada no plenário da Câmara pela abstenção orquestrada da base de apoio governista do regime militar." },
        { letra: "B", texto: "A proclamação do parlamentarismo monárquico com o retorno de herdeiros de D. Pedro II." },
        { letra: "C", texto: "A prorrogação por mais dez anos do mandato presidencial do general João Figueiredo." },
        { letra: "D", texto: "A fusão do Brasil com os países do Cone Sul em uma república socialista única." },
        { letra: "E", texto: "A convocação imediata de uma intervenção militar estrangeira da OTAN." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Apesar de levar multidões históricas às ruas, a Emenda Dante de Oliveira não alcançou o quórum qualificado de dois terços dos votos na Câmara devido à manobra dos parlamentares governistas do PDS.",
        porque: "Em razão dessa derrota parlamentar, a transição para o governo civil de Tancredo Neves e José Sarney deu-se ainda de forma indireta pelo Colégio Eleitoral em 1985."
      }
    },
    {
      id: "HIS_BRA_12",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "A Constituição Cidadã de 1988 e os Direitos Sociais",
      tipo: "fechada",
      enunciado: "Promulgada em 5 de outubro de 1988 sob a liderança do deputado Ulysses Guimarães, a atual Constituição da República Federativa do Brasil ficou consagrada historicamente como a 'Constituição Cidadã' porque:",
      alternativas: [
        { letra: "A", texto: "Consagrou o Estado Democrático de Direito, ampliou expressivamente os direitos humanos individuais e sociais, criou o Sistema Único de Saúde (SUS), garantiu o voto aos analfabetos e jovens de 16 anos e demarcou direitos originários aos povos indígenas e quilombolas." },
        { letra: "B", texto: "Aboliu todos os partidos políticos e instituiu o bipartidarismo obrigatório de voto indireto." },
        { letra: "C", texto: "Extinguiu a separação entre Igreja e Estado declarando o catolicismo religião oficial obrigatória." },
        { letra: "D", texto: "Eliminou o direito de greve e instituiu a pena de morte para crimes contra o patrimônio." },
        { letra: "E", texto: "Proibiu qualquer tipo de eleição presidencial até o ano 2000." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A Carta Magna de 1988 representou a superação institucional definitiva dos vinte e um anos de arbítrio militar autoritário.",
        porque: "Ulysses Guimarães declarou: 'Traidor da pátria é o traidor da Constituição... Temos ódio à ditadura. Ódio e nojo!'. A nova Carta erigiu a dignidade da pessoa humana e a cidadania como pilares inegociáveis da República."
      }
    },
    {
      id: "HIS_BRA_13",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Abolição Inacabada e a Lei Áurea de 1888",
      tipo: "aberta",
      enunciado: "Em 13 de maio de 1888, a Princesa Isabel sancionou a Lei Áurea com apenas dois artigos: 'Art. 1º: É declarada extinta desde a data desta lei a escravidão no Brasil. Art. 2º: Revogam-se as disposições em contrário'. O historiador Sidney Chalhoub e diversos sociólogos apontam que essa abolição formal foi uma 'abolição inconclusa'. Explique: (a) Quais foram as limitações sociais da Lei Áurea em relação à integração material da população negra recém-liberta; (b) De que modo a ausência de políticas públicas de reforma agrária, moradia e educação para os libertos perpetuou o racismo estrutural e a marginalização social no pós-abolição.",
      resposta: "(a) Não concedeu terras, indenizações, moradia ou educação aos ex-escravizados; (b) Empurrou a população negra para a informalidade precária, cortiços e favelas, mantendo a dependência subordinada perante a elite branca.",
      gabarito: {
        letra: "Aberta",
        ancora: "A crítica historiográfica contemporânea à abolição liberal burguesa desprovida de reparação ou justiça social.",
        espera_se: "(a) Limitações materiais: A Lei Áurea foi uma canetada jurídica puramente formal que concedeu a liberdade civil negativa (não ser mais mercadoria), mas não proveu absolutamente nenhuma condição material de subsistência: não houve distribuição de terras, indenização pecuniária pelo trabalho acumulado por séculos, nem programas de moradia ou alfabetização básica para os libertos.\n(b) Consequências estruturais no pós-abolição: Jogados nas ruas da noite para o dia sem teto e sem meios de produção, os libertos foram abandonados à própria sorte pelo Estado monárquico e republicano. O governo subsidiou a imigração de europeus brancos para substituí-los nas fazendas sob o ideal eugenista de 'branqueamento da raça'. Essa exclusão forçou a população negra a ocupar as encostas de morros (origem das favelas), aceitar subempregos precarizados e enfrentar a criminalização de suas manifestações culturais (como a vadiagem e a capoeira no Código Penal de 1890), assentando as bases históricas do racismo estrutural contemporâneo."
      }
    },
    {
      id: "HIS_BRA_14",
      origem: "UNICAMP 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Revolta da Chibata (1910) e a Cidadania na Marinha",
      tipo: "aberta",
      enunciado: "Em novembro de 1910, marinheiros negros e mestiços liderados por João Cândido Felisberto (o 'Almirante Negro') rebelaram-se a bordo dos mais modernos couraçados da Armada de Guerra brasileira (o 'Minas Geraes' e o 'São Paulo') ancorados na Baía de Guanabara, apontando os canhões para a capital da República. (a) Qual era a principal reivindicação dos marujos amotinados?; (b) Por que esse levante expôs as contradições da recém-proclamada República dos fazendeiros de café em relação aos cidadãos negros e pobres?",
      resposta: "(a) Fim imediato dos castigos corporais na Marinha (o chicote/chibata) e melhoria da alimentação e soldo; (b) Revelou que a jovem República moderna mantinha métodos escravistas arcaicos de punição física sobre praças negros.",
      gabarito: {
        letra: "Aberta",
        ancora: "A Revolta da Chibata como denúncia da sobrevivência da mentalidade escravocrata nas Forças Armadas da República Velha.",
        espera_se: "(a) Reivindicação dos marinheiros: O motim explodiu após o marinheiro Marcelino Rodrigues Menezes ter sido condenado a receber 250 chibatadas diante de toda a tripulação até desmaiar. O manifesto escrito enviado ao presidente Marechal Hermes da Fonseca exigia a cessação imediata e definitiva dos castigos corporais degradantes de açoite (chibata), aumento dos soldos miseráveis, alimentação digna e anistia para os rebelados.\n(b) Contradição republicana: A República brasileira ostentava perante o mundo couraçados ultramodernos de tecnologia militar de ponta comprados na Inglaterra, mas tratava os seus marinheiros (na sua imensa maioria afrodescendentes pobres) como escravos de senzala submetidos ao pelourinho da marinha. O episódio desvelou que a modernização republicana era uma fachada aristocrática que preservava a violência escravista sobre os corpos subalternos."
      }
    },
    {
      id: "HIS_BRA_15",
      origem: "UERJ 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Comissão Nacional da Verdade e a Lei de Anistia de 1979",
      tipo: "aberta",
      enunciado: "Em 2014, a Comissão Nacional da Verdade (CNV) entregou ao governo brasileiro o seu relatório final sobre as graves violações de direitos humanos cometidas pelo Estado durante a ditadura civil-militar (1964-1985), identificando centenas de mortos, desaparecidos políticos e centenas de agentes públicos torturadores. No entanto, nenhum militar ou policial torturador foi formalmente julgado e condenado judicialmente no Brasil, ao contrário do que ocorreu na Argentina e no Chile. Explique: (a) Qual o papel desempenhado pela interpretação jurídica da Lei de Anistia (Lei nº 6.683 de 1979) nesse desfecho; (b) Qual a importância do direito à memória e à verdade para a consolidação democrática de uma sociedade que viveu um regime autoritário.",
      resposta: "(a) A lei foi interpretada de forma 'ampla e recíproca', anistiando tanto os opositores políticos quanto os agentes estatais que cometeram crimes de tortura e homicídio; (b) Conhecer a verdade histórica impede o negacionismo, homenageia as vítimas e evita a repetição de abusos autoritários no futuro.",
      gabarito: {
        letra: "Aberta",
        ancora: "Justiça de transição, reparação histórica e os dilemas da Lei de Anistia na democracia brasileira contemporânea.",
        espera_se: "(a) Papel da Lei de Anistia de 1979: Promulgada ainda durante o governo do general Figueiredo, a lei foi estruturada pelo regime militar com a tese da autoanistia 'recíproca e bilateral'. Embora tenha permitido o retorno de líderes exilados e libertado presos políticos, a jurisprudência dominante no Supremo Tribunal Federal (STF na ADPF 153) manteve o entendimento de que os agentes da repressão estatal que praticaram tortura, ocultação de cadáver e assassinatos também foram formalmente anistiados por crimes conexos, blindando os torturadores de responsabilização criminal perante a justiça comum.\n(b) Direito à memória e à verdade: Como ensina a justiça de transição, um país que sela um pacto de silêncio e esquecimento sobre os crimes de Estado perpetua a impunidade e a violência policial institucionalizada. O trabalho da CNV é vital para resgatar a dignidade e a história das famílias das vítimas, combater o negacionismo fascistoide e consolidar a consciência cívica de que o respeito incondicional aos direitos humanos e às liberdades democráticas é o único limite moral que impede a barbárie estatal de se repetir."
      }
    }
  ]
};

// -------------------------------------------------------------
// 4. HISTÓRIA - MILITARES E OLIMPÍADAS (ONHB, ESPCEX, IME, ITA)
// -------------------------------------------------------------
const histMilitares = {
  disciplina: "Historia",
  modulo: "Questoes_Historia_ONHB_EsPCEx_IME_ITA",
  subpasta: "Militares_e_Olimpiadas",
  arquivo_origem: "Questoes_Historia_ONHB_EsPCEx_IME_ITA.json",
  benchmark_didatico: {
    capitulo: "História Geral e do Brasil em Nível Avançado: Historiografia Crítica, Estratégia Militar, Geopolítica e Guerras Mundiais",
    objetivos_aprendizagem: [
      "Analisar a Primeira e a Segunda Guerra Mundial (tratados de paz, ascensão do nazifascismo, a participação do Brasil e da FEB na Campanha da Itália).",
      "Compreender a dinâmica da Guerra Fria (Doutrina Truman, Plano Marshall, crises dos mísseis em Cuba, Guerras da Coreia e do Vietnã e queda do Muro de Berlim).",
      "Examinar criticamente a historiografia das revoltas coloniais e regenciais brasileiras à luz das novas abordagens da ONHB e concursos militares (EsPCEx/IME/ITA).",
      "Investigar o processo de modernização conservadora, geopolítica dos recursos naturais (petróleo, minérios) e a formação do Estado Nacional brasileiro."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Primeira Guerra Mundial e a Paz Punitiva de Versalhes",
          definicao: "Deflagrada pelo assassinato do arquiduque Francisco Ferdinando em Sarajevo (1914), a Grande Guerra foi gestada pelas rivalidades imperialistas interimperialistas, a corrida armamentista naval e a política de alianças (Tríplice Entente vs Tríplice Aliança). Caracterizada pela mortífera guerra de trincheiras e pelo emprego massivo de tecnologia industrial bélica (gases asfixiantes, metralhadoras, tanques e aviação). O Tratado de Versalhes (1919) impôs pesadíssimas reparações e desmilitarização humilhante à Alemanha (o 'Diktat'), alimentando o revanchismo ultranacionalista que pavimentou a ascensão do Terceiro Reich nazista de Adolf Hitler."
        },
        {
          termo: "Segunda Guerra Mundial e a Participação da FEB",
          definicao: "Desencadeada pela invasão da Polônia pela Alemanha nazista em setembro de 1939. O Eixo Roma-Berlim-Tóquio enfrentou os Aliados (Reino Unido, URSS e EUA). Batalhas decisivas: Batalha de Stalingrado (virada soviética na frente oriental, 1942-1943) e o Dia D na Normandia (1944). O Brasil rompeu a neutralidade inicial em 1942 após o torpedeamento de navios mercantes nacionais por submarinos alemães no litoral, cedendo bases estratégicas no Nordeste ('Trampolim da Vitória' em Natal) e enviando a Força Expedicionária Brasileira (FEB), que combateu com heroísmo nos Apeninos italianos (Monte Castello, Castelnuovo e Montese, 1944-1945), capturando a 148ª Divisão de Infantaria alemã."
        },
        {
          termo: "Guerra Fria e a Nova Ordem Mundial",
          definicao: "A bipolarização ideológica e militar mundial entre os Estados Unidos (bloco capitalista ocidental, OTAN) e a União Soviética (bloco socialista, Pacto de Varsóvia), marcada pela corrida nuclear e pela dissuasão da Destruição Mútua Assegurada (MAD). Guerras por procuração: Coreia (1950-1953) e Vietnã (1959-1975). Na América Latina, a Revolução Cubana (1959) deflagrou a intervenção norte-americana via Doutrina de Segurança Nacional apoiando regimes ditatoriais militares burocrático-autoritários. O colapso econômico soviético culminou nas reformas de Gorbachev (Glasnost e Perestroika), na queda do Muro de Berlim (1989) e na dissolução da URSS (1991)."
        }
      ],
      atencao_ponto_cego: "Ponto cego militar crítico: subestimar a contradição política da FEB em 1945. Os pracinhas brasileiros foram à Europa arriscar a própria vida combatendo as tiranias nazi-fascistas autoritárias, enquanto o seu próprio país natal vivia sob a ditadura civil do Estado Novo de Vargas. Essa contradição insustentável precipitou a deposição imediata de Getúlio Vargas em outubro de 1945 pelo próprio Exército."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: A Batalha de Monte Castello e o Desempenho da FEB",
      enunciado: "Explique o valor estratégico e simbólico da vitória da Força Expedicionária Brasileira (FEB) na tomada de Monte Castello, na Itália, em 21 de fevereiro de 1945.",
      resolucao_passo_a_passo: "1. Desafio geográfico e militar: Monte Castello era uma posição fortificada alemã crucial na Cordilheira dos Apeninos (Linha Gótica), que barrava o avanço do V Exército Aliado em direção ao Vale do Rio Pó e à planície da Bolonha. As tropas de infantaria e artilharia nazistas ocupavam os cumes elevados com ninhos de metralhadoras em terreno íngreme e congelado.\n2. Superação de fracassos iniciais: As tropas aliadas e os primeiros ataques brasileiros haviam fracassado sob rigoroso inverno com temperaturas negativas e lama densa. Os soldados da FEB ('pracinhas'), muitos deles oriundos do clima tropical brasileiro e com treinamento básico inicial, aprenderam a duras penas as táticas de guerra em montanha.\n3. A vitória heróica: Em 21 de fevereiro de 1945, num ataque coordenado com a 10ª Divisão de Montanha dos EUA e artilharia de precisão brasileira, os pracinhas escalaram a montanha expostos ao fogo cerrado inimigo e conquistaram definitivamente o cume de Monte Castello.\n4. Significado: A vitória consagrou internacionalmente a competência, a coragem e a disciplina militar do combatente brasileiro e abriu caminho para a derrocada definitiva das forças do Eixo no norte da Itália."
    }
  },
  questoes: [
    {
      id: "HIS_MIL_01",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Primeira Guerra Mundial: A Crise do Tratado de Versalhes",
      tipo: "fechada",
      enunciado: "Ao final da Primeira Guerra Mundial (1914-1918), as potências vencedoras reunidas na Conferência de Paz de Paris redigiram o Tratado de Versalhes (1919). O célebre Artigo 231 desse tratado impôs à Alemanha uma cláusula que gerou intenso ressentimento e desestabilizou a República de Weimar, conhecida como:",
      alternativas: [
        { letra: "A", texto: "A Cláusula de Culpa de Guerra, que responsabilizava formal e exclusivamente a Alemanha e seus aliados por todas as perdas e danos do conflito, obrigando-a a pagar indenizações financeiras astronômicas e entregar a Alsácia-Lorena." },
        { letra: "B", texto: "A autorização para a Alemanha anexar a Áustria e os Sudetos imediatamente." },
        { letra: "C", texto: "A obrigatoriedade de adotar o idioma inglês em todas as repartições públicas alemãs." },
        { letra: "D", texto: "A eleição de um monarca britânico para governar Berlim." },
        { letra: "E", texto: "A concessão de assento permanente à Alemanha na Liga das Nações com poder de veto militar." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O Artigo 231 do Tratado de Versalhes rotulou a Alemanha como a única culpada pela guerra, impondo reparações impagáveis, perda de todas as colônias ultramarinas e limitação das forças armadas a 100 mil soldados.",
        porque: "O historiador Eric Hobsbawm demonstrou que essa paz punitiva e vingativa foi a semente direta que nutriu a hiperinflação alemã e a propaganda nazista de revanche que deflagrou a Segunda Guerra Mundial vinte anos depois."
      }
    },
    {
      id: "HIS_MIL_02",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Participação do Brasil na Segunda Guerra Mundial e a FEB",
      tipo: "fechada",
      enunciado: "Durante a Segunda Guerra Mundial, a Força Expedicionária Brasileira (FEB), composta por mais de 25 mil soldados comandados pelo general João Batista Mascarenhas de Morais, atuou na Campanha da Itália incorporada ao IV Corpo do V Exército dos EUA. O lema adotado pela FEB — 'A cobra está fumando' — nasceu como uma resposta patriótica a qual circunstância histórica?",
      alternativas: [
        { letra: "A", texto: "Ao ceticismo da opinião pública e da imprensa que afirmavam zombeteiramente ser mais fácil 'uma cobra fumar cachimbo' do que o Brasil conseguir organizar uma força militar e enviá-la para combater na Europa." },
        { letra: "B", texto: "À existência de veneno de cascavel utilizado nas pontas das baionetas dos pracinhas." },
        { letra: "C", texto: "Ao hábito generalizado dos soldados alemães de fumar cigarros de fumo de rolo brasileiro." },
        { letra: "D", texto: "À queima de campos de trigo nos Apeninos italianos pela cavalaria brasileira." },
        { letra: "E", texto: "Ao sinal de fumaça indígena utilizado para comunicação tática na tomada de Bolonha." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A frase desdenhosa corrente no Brasil era: 'É mais fácil a cobra fumar do que o Brasil entrar na guerra'.",
        porque: "Quando a FEB desembarcou em Nápoles em julho de 1944, adotou orgulhosamente o distintivo da cobra verde fumando cachimbo, convertendo a zombaria inicial em símbolo incontestável de bravura e determinação militar."
      }
    },
    {
      id: "HIS_MIL_03",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Crise dos Mísseis em Cuba (1962) e a Dissuasão Nuclear",
      tipo: "fechada",
      enunciado: "Em outubro de 1962, durante a Guerra Fria, a descoberta por aviões de espionagem U-2 norte-americanos da instalação de bases de mísseis nucleares soviéticos de médio alcance em Cuba deflagrou o momento de maior tensão e perigo de hecatombe atômica da história da humanidade. O desenlace diplomático pacífico da crise entre John F. Kennedy e Nikita Khrushchev baseou-se em qual compromisso mútuo confidencial?",
      alternativas: [
        { letra: "A", texto: "A URSS retirou publicamente todos os mísseis e bombardeiros de Cuba sob inspeção da ONU; em troca, os EUA comprometeram-se publicamente a não invadir militarmente a ilha e concordaram secretamente em retirar os mísseis nucleares Júpiter instalados na Turquia e na Itália." },
        { letra: "B", texto: "Os Estados Unidos anexaram Cuba como seu quinquagésimo primeiro estado federado." },
        { letra: "C", texto: "A União Soviética concordou em desmantelar todo o seu arsenal atômico e dissolver o Pacto de Varsóvia." },
        { letra: "D", texto: "Fidel Castro foi deposto e exilado na Sibéria pelos próprios generais comunistas." },
        { letra: "E", texto: "A frota naval soviética afundou os porta-aviões norte-americanos no bloqueio marítimo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O acordo Khrushchev-Kennedy evitou a guerra nuclear total através do pragmatismo da reciprocidade: desarmamento dos mísseis soviéticos em Cuba contra a remoção discreta dos mísseis norte-americanos na fronteira da URSS (Turquia).",
        porque: "Após o susto da crise dos treze dias, instalou-se o 'telefone vermelho' direto entre a Casa Branca e o Kremlin e assinou-se o Tratado de Interdição Parcial de Testes Nucleares de 1963."
      }
    },
    {
      id: "HIS_MIL_04",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Guerra da Crimeia (1853-1856) e a Geopolítica da 'Questão do Oriente'",
      tipo: "fechada",
      enunciado: "A Guerra da Crimeia (1853-1856), travada entre o Império Russo de um lado e a coalizão formada pelo Império Otomano, Grã-Bretanha, França e o Reino da Sardenha de outro, destacou-se na história bélica do século XIX por:",
      alternativas: [
        { letra: "A", texto: "Ser considerada a primeira guerra moderna industrializada (empregando ferrovias, telégrafo elétrico, fotografia jornalística e enfermagem de campo moderna com Florence Nightingale) e por barrar o expansionismo russo em direção ao Mar Negro e aos estreitos de Bósforo e Dardanelos." },
        { letra: "B", texto: "A destruição definitiva do Império Britânico pelas tropas do czar Nicolau I." },
        { letra: "C", texto: "A proclamação da primeira constituição democrática universal da Europa oriental." },
        { letra: "D", texto: "A invenção da bomba atômica nas oficinas navais de Sebastopol." },
        { letra: "E", texto: "O retorno da monarquia dos Habsburgos ao trono imperial da França." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A Guerra da Crimeia freou o avanço do 'gigante russo' sobre os despojos do decadente Império Otomano ('o homem doente da Europa'), preservando a hegemonia marítima britânica no Mediterrâneo Oriental.",
        porque: "A derrota desastrosa obrigou o czar Alexandre II a modernizar a Rússia e decretar a abolição da servidão feudal dos camponeses em 1861."
      }
    },
    {
      id: "HIS_MIL_05",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Batalha do Riachuelo (1865) e o Poder Naval Imperial",
      tipo: "fechada",
      enunciado: "Em 11 de junho de 1865, durante a Guerra da Tríplice Aliança, travou-se a crucial Batalha Naval do Riachuelo nas águas do Rio Paraná. A esquadra imperial brasileira, comandada pelo Almirante Francisco Manuel Barroso da Silva (Barão do Amazonas) a bordo da fragata 'Amazonas', alcançou uma vitória decisiva ao:",
      alternativas: [
        { letra: "A", texto: "Esporear e afundar navios paraguaios com a proa de ferro de sua fragata capitânia, destruindo o poder naval da esquadra de Solano López e garantindo o bloqueio fluvial dos rios da bacia platina até o fim da guerra." },
        { letra: "B", texto: "Assinar um armistício imediato entregando o controle de Mato Grosso ao Paraguai." },
        { letra: "C", texto: "Empregar torpedos teleguiados de longo alcance construídos na França." },
        { letra: "D", texto: "Fugir para o porto de Montevidéu para evitar o combate frontal." },
        { letra: "E", texto: "Ser completamente destruída pela artilharia de terra paraguaia." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Riachuelo é a data magna da Marinha do Brasil. O célebre sinal içado por Barroso: 'O Brasil espera que cada um cumpra o seu dever'.",
        porque: "A vitória naval brasileira estrangulou militar e logisticamente o Paraguai, que perdeu sua única frota e ficou completamente isolado do oceano Atlântico e do reabastecimento de armas externas pelo restante do conflito."
      }
    },
    {
      id: "HIS_MIL_06",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Guerra Civil Americana (1861-1865) e a Guerra Total",
      tipo: "fechada",
      enunciado: "A Guerra de Secessão dos Estados Unidos (1861-1865) entre os estados da União (Norte industrializado) e os Estados Confederados (Sul agrário e escravocrata) é analisada pelos historiadores militares como a precursora da 'Guerra Total' moderna. Essa conceituação decorre:",
      alternativas: [
        { letra: "A", texto: "Da mobilização industrial e demográfica integral das sociedades em conflito, do uso maciço de ferrovias estratégicas e telégrafo, do bloqueio naval de estrangulamento ('Plano Anaconda') e da destruição sistemática da infraestrutura econômica e agrícola inimiga (como a Marcha para o Mar do general Sherman)." },
        { letra: "B", texto: "Do combate exclusivamente cavalheiresco em campos abertos entre oficiais generais sem tocar na população civil." },
        { letra: "C", texto: "Do uso de armas químicas bacteriológicas desenvolvidas pela Confederação." },
        { letra: "D", texto: "Da recusa do presidente Abraham Lincoln em abolir a escravidão nas fazendas rebeldes." },
        { letra: "E", texto: "Da intervenção armada direta das forças navais da China imperial." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A Guerra Civil Americana fundiu a tecnologia da Revolução Industrial com a carnificina em massa (mais de 600 mil mortos).",
        porque: "A Proclamação de Emancipação de Lincoln (1863) converteu o conflito em uma cruzada moral de libertação dos escravizados, enquanto a superioridade fabril e demográfica do Norte esmagou inexoravelmente a economia plantation sulista."
      }
    },
    {
      id: "HIS_MIL_07",
      origem: "ONHB Fase Final",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Coluna Prestes (1924-1927) e o Movimento Tenentista",
      tipo: "fechada",
      enunciado: "Entre 1924 e 1927, a Coluna Miguel Costa-Prestes, formada por militares tenentistas e rebeldes civis, percorreu mais de 25 mil quilômetros pelo interior do Brasil, atravessando doze estados sem ser derrotada pelas forças do governo da República Oligárquica. O programa político fundamental defendido pelos líderes da Coluna era:",
      alternativas: [
        { letra: "A", texto: "A moralização da República, a instauração do voto secreto eleitoral, a justiça social, o fim do coronelismo e da corrupção oligárquica e a implantação do ensino primário público e obrigatório para toda a população." },
        { letra: "B", texto: "A restauração imediata do Império com a coroação de D. Pedro de Alcântara." },
        { letra: "C", texto: "A entrega do controle das jazidas minerais do Brasil à Standard Oil norte-americana." },
        { letra: "D", texto: "A defesa intransigente da política do café com leite e do voto aberto de cabresto." },
        { letra: "E", texto: "A proclamação de uma teocracia protestante chefiada por generais messiânicos." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O Tenentismo expressava a insatisfação da jovem oficialidade das Forças Armadas e das classes médias urbanas com o domínio corrupto dos barões do café.",
        porque: "A marcha da 'Coluna Invicta' demonstrou extraordinária capacidade de manobra militar em guerra de movimento, pavimentando a desestabilização da República Velha que culminaria na Revolução de 1930."
      }
    },
    {
      id: "HIS_MIL_08",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Batalha de Stalingrado (1942-1943) e o Ponto de Inflexão da Segunda Guerra",
      tipo: "fechada",
      enunciado: "A Batalha de Stalingrado (agosto de 1942 a fevereiro de 1943) foi o confronto militar mais gigantesco e sangrento da Segunda Guerra Mundial, custando cerca de dois milhões de vidas. A rendição incondicional do VI Exército alemão do marechal Friedrich Paulus perante o Exército Vermelho soviético teve como significado militar supremo:",
      alternativas: [
        { letra: "A", texto: "O ponto de inflexão decisivo da guerra na Europa, destruindo o mito da invencibilidade da Wehrmacht nazista e iniciando a grande contraofensiva soviética ininterrupta que culminaria na tomada de Berlim em 1945." },
        { letra: "B", texto: "A rendição imediata de Adolf Hitler e o suicídio de todos os generais alemães em 1943." },
        { letra: "C", texto: "A conquista dos poços de petróleo do Cáucaso pelas forças mecanizadas do Eixo." },
        { letra: "D", texto: "A retirada da União Soviética da Segunda Guerra Mundial para assinar um tratado de paz." },
        { letra: "E", texto: "O desembarque imediato de tropas norte-americanas nas praias do Japão." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Stalingrado quebrou a espinha dorsal militar da Alemanha nazista na frente oriental.",
        porque: "A Operação Urano cercou 300 mil soldados de elite alemães; a partir dessa derrota catastrófica no rio Volga, a Alemanha perdeu a iniciativa estratégica e passou a recuar até o colapso final de maio de 1945."
      }
    },
    {
      id: "HIS_MIL_09",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Guerra do Yom Kippur (1973) e o Primeiro Choque do Petróleo",
      tipo: "fechada",
      enunciado: "Em outubro de 1973, forças do Egito e da Síria atacaram Israel de surpresa durante o feriado judaico do Yom Kippur para recuperar territórios perdidos na Guerra dos Seis Dias de 1967. Como represália ao apoio militar ocidental a Israel, a Organização dos Países Exportadores de Petróleo (OPEP) promoveu uma ação geopolítica de impacto mundial avassalador:",
      alternativas: [
        { letra: "A", texto: "Embargo petrolífero e cortes deliberados na produção que quadruplicaram o preço internacional do barril de petróleo bruto (Primeiro Choque do Petróleo), provocando recessão global, estagflação no Ocidente e acelerando o endividamento externo do 'Milagre Econômico' brasileiro." },
        { letra: "B", texto: "A invasão militar árabe de todos os portos petrolíferos do Texas e da Califórnia." },
        { letra: "C", texto: "O fechamento perpétuo e irreversível de todo o Canal de Suez até os dias atuais." },
        { letra: "D", texto: "A destruição de todas as usinas hidrelétricas da América Latina." },
        { letra: "E", texto: "A substituição total do uso de petróleo por carros elétricos já na década de 1970." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O petróleo foi utilizado pela primeira vez como arma de guerra geopolítica com efeitos macroeconômicos globais devastadores.",
        porque: "A disparada do barril encareceu brutalmente as importações de combustíveis no Brasil, implodiu o modelo do Milagre Econômico da ditadura militar, elevou a dívida externa para níveis estratosféricos e deu origem ao programa nacional do Proálcool."
      }
    },
    {
      id: "HIS_MIL_10",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "A Revolução Constitucionalista de 1932 em São Paulo",
      tipo: "fechada",
      enunciado: "A Revolução Constitucionalista de 1932 deflagrada pelo estado de São Paulo contra o Governo Provisório de Getúlio Vargas foi precedida pela morte de quatro estudantes (Martins, Miragaia, Dráusio e Camargo), dando origem à sigla heróica MMDC. A bandeira política central que uniu os paulistas no conflito armado foi:",
      alternativas: [
        { letra: "A", texto: "A exigência da promulgação de uma nova Constituição republicana para o país, a convocação de eleições e o fim do governo ditatorial discricionário dos tenentes interventores nomeados por Vargas." },
        { letra: "B", texto: "A separação definitiva do estado de São Paulo para formar uma república independente." },
        { letra: "C", texto: "A restauração imediata do regime da escravidão nas fazendas de café do interior." },
        { letra: "D", texto: "A declaração de guerra civil contra os Estados Unidos da América." },
        { letra: "E", texto: "A extinção definitiva das Forças Armadas brasileiras." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Embora militarmente derrotados após três meses de combates intensos na serra da Mantiqueira, os paulistas alcançaram sua vitória política.",
        porque: "Pressionado pela força do movimento constitucionalista, Getúlio Vargas convocou a Assembleia Nacional Constituinte que elaborou a democrática e avançada Constituição de 1934."
      }
    },
    {
      id: "HIS_MIL_11",
      origem: "ITA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Doutrina de Segurança Nacional e a Operação Condor",
      tipo: "fechada",
      enunciado: "Durante a Guerra Fria nas décadas de 1970 e 1980, as ditaduras militares do Cone Sul (Brasil, Argentina, Chile, Uruguai, Paraguai e Bolívia) estruturaram uma rede secreta de cooperação de inteligência e repressão clandestina transnacional conhecida como Operação Condor. A finalidade primordial dessa operação articulada sob o respaldo da Doutrina de Segurança Nacional era:",
      alternativas: [
        { letra: "A", texto: "Monitorar, sequestrar, torturar e assassinar de forma coordenada opositores políticos e ativistas que buscavam refúgio em países vizinhos, eliminando qualquer barreira de fronteira nacional na perseguição aos dissidentes." },
        { letra: "B", texto: "Construir uma usina nuclear compartilhada no leito do rio da Prata." },
        { letra: "C", texto: "Promover feiras de artesanato indígena nas montanhas dos Andes." },
        { letra: "D", texto: "Organizar a Copa do Mundo de futebol com equipes amadoras de operários." },
        { letra: "E", texto: "Declarar a independência das Guianas em relação à Grã-Bretanha e à França." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A Operação Condor representou a globalização do terrorismo de Estado e da repressão militar na América do Sul com apoio logístico e de telecomunicações da CIA.",
        porque: "Documentos desclassificados dos 'Arquivos do Terror' no Paraguai comprovaram o assassinato de líderes democráticos e o sequestro sistemático de dissidentes exilados além das fronteiras soberanas."
      }
    },
    {
      id: "HIS_MIL_12",
      origem: "IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Batalha das Termópilas (480 a.C.) e as Guerras Médicas",
      tipo: "fechada",
      enunciado: "Na Segunda Guerra Médica (480 a.C.), o rei espartano Leônidas I e sua guarda pessoal de 300 hoplitas (ao lado de aliados téspios e tebanos) defenderam o estreito desfiladeiro das Termópilas contra o colossal exército do Império Aquemênida Persa de Xerxes I. O valor tático primordial dessa célebre resistência militar heroica até a morte foi:",
      alternativas: [
        { letra: "A", texto: "Reter o avanço massivo do exército persa por dias suficientes para permitir a evacuação de Atenas e a reorganização da esquadra de trirremes gregas que destruiria a frota persa na decisiva Batalha de Salamina." },
        { letra: "B", texto: "O aniquilamento militar imediato de todos os soldados de infantaria de Xerxes." },
        { letra: "C", texto: "A captura e execução sumária do imperador persa no próprio desfiladeiro." },
        { letra: "D", texto: "A rendição incondicional de Esparta que se tornou satrapia persa." },
        { letra: "E", texto: "A assinatura imediata da paz de Calias sem novas batalhas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O sacrifício supremo de Leônidas e dos 300 de Esparta nas Termópilas tornou-se o maior símbolo da história militar de fidelidade ao dever e de atraso estratégico do inimigo superior.",
        porque: "O tempo precioso conquistado pela resistência espartana permitiu a Temístocles atrair a marinha persa para as águas estreitas do golfo de Salamina, onde a frota de Xerxes foi massacrada, salvando a civilização grega."
      }
    },
    {
      id: "HIS_MIL_13",
      origem: "ONHB Fase Final",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Batalha dos Guararapes (1648-1649) e o Nascimento do Exército Brasileiro",
      tipo: "aberta",
      enunciado: "As duas Batalhas dos Montes Guararapes (1648 e 1649), travadas no litoral de Pernambuco durante a Insurreição Pernambucana, culminaram na derrota fragorosa das tropas holandesas da Companhia das Índias Ocidentais e são consagradas na tradição castrense como o berço histórico do Exército Brasileiro. (a) De que maneira a composição étnica e social das forças patriotas luso-brasileiras expressou a união das matrizes formadoras da nacionalidade?; (b) Cite dois dos principais líderes representativos dessa convergência militar nos Guararapes.",
      resposta: "(a) Reuniu brancos luso-brasileiros, indígenas nativos e negros livres/escravizados lutando juntos em defesa da terra; (b) O indígena Felipe Camarão e o negro Henrique Dias (ao lado de André Vidal de Negreiros e João Fernandes Vieira).",
      gabarito: {
        letra: "Aberta",
        ancora: "O 'Sentimento de Pátria' e a convergência das três raças nas trincheiras contra o invasor estrangeiro.",
        espera_se: "(a) Composição étnica e social: Pela primeira vez na história militar do território colonial, a resistência armada não dependeu de tropas enviadas de Lisboa (Portugal vivia as dificuldades da Restauração contra a Espanha), mas brotou espontaneamente da aliança nativa entre os habitantes da terra: senhores de engenho brancos luso-brasileiros, guerreiros indígenas aldeados e soldados negros e forros, que se uniram com armas nas mãos sob uma identidade compartilhada de amor ao solo pátrio e à fé comum.\n(b) Líderes históricos:\n1. Dom Antônio Filipe Camarão (nobre indígena Potiguara de extrema bravura e mestre em táticas de guerra de emboscada na mata);\n2. Henrique Dias (o 'Governador dos Pretos', filho de escravizados que comandou com heroísmo o terço de homens negros que combateu os neerlandeses);\n3. João Fernandes Vieira e André Vidal de Negreiros (líderes militares e estrategistas luso-brasileiros da Restauração Pernambucana)."
      }
    },
    {
      id: "HIS_MIL_14",
      origem: "EsPCEx / ITA 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Campanha de Canudos e o Relatório Militar de Euclides da Cunha",
      tipo: "aberta",
      enunciado: "Na monumental obra 'Os Sertões', Euclides da Cunha analisa com rigor geográfico, sociológico e bélico a Quarta Expedição Militar contra Canudos comandada pelo general Artur Oscar. O autor descreve que, após o bombardeio maciço com canhões Withworth e o cerco implacável, o arraial resistiu até o último cartucho. Explique: (a) Qual a célebre descrição feita por Euclides sobre os últimos quatro defensores de Canudos encontrados na trincheira no dia 5 de outubro de 1897; (b) Por que o autor classifica o desfecho da campanha não como uma vitória militar gloriosa, mas sim como um 'crime de Estado' e uma 'barbárie' cometida pela jovem República brasileira.",
      resposta: "(a) Um velho, dois homens feitos e uma criança, na frente dos quais rugiam raivosamente cinco mil soldados; (b) Porque o Exército massacrou covardemente uma população miserável de sertanejos famintos que apenas defendiam seu vilarejo.",
      gabarito: {
        letra: "Aberta",
        ancora: "A denúncia ética imortal de Euclides da Cunha desmascarando a vergonha do massacre de Canudos pelo Estado.",
        espera_se: "(a) Os quatro últimos defensores: Euclides imortalizou a cena fúnebre definitiva da resistência sertaneja: 'Canudos não se rendeu. Exemplo único em toda a história, resistiu até ao esgotamento completo... Caíra o arraial a 5. No dia 6 morreram os quatro últimos defensores, que fecharam o quadro da resistência: um velho, dois homens feitos e uma criança, na frente dos quais rugiam raivosamente cinco mil soldados'.\n(b) Crime e vergonha nacional: A imprensa e os generais de gabinete do Rio de Janeiro propagavam que Canudos era uma ameaça imperial monarquista armada até os dentes. Quando Euclides chegou ao sertão, constatou a tragédia real: Canudos era o refúgio pacífico de milhares de homens e mulheres esquálidos, mutilados e famintos que fugiam do latifúndio e da seca. O massacre indiscriminado a tiros de canhão, a degola sumária dos prisioneiros desarmados e a exumação para decapitação do cadáver em decomposição de Antônio Conselheiro revelaram a face hedionda de um Estado republicano que recorreu à barbárie militar sanguinária contra o seu próprio povo desvalido."
      }
    },
    {
      id: "HIS_MIL_15",
      origem: "ITA 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "A Queda do Muro de Berlim e o Fim da Guerra Fria: Consequências Geopolíticas",
      tipo: "aberta",
      enunciado: "Em 9 de novembro de 1989, a queda do Muro de Berlim marcou simbolicamente o desmoronamento da Cortina de Ferro na Europa e o colapso do bloco comunista soviético, culminando na dissolução da URSS em dezembro de 1991. Analise criticamente: (a) Duas causas internas socioeconômicas que levaram à falência do modelo soviético e à inviabilidade das reformas de Gorbachev (Perestroika e Glasnost); (b) A tese do 'Fim da História' formulada pelo cientista político Francis Fukuyama na década de 1990 e por que essa tese foi amplamente refutada pelos acontecimentos geopolíticos globais do século XXI.",
      resposta: "(a) Estagnação econômica, burocracia corrupta e custo insustentável da corrida armamentista; (b) Fukuyama previu o triunfo definitivo e pacífico da democracia liberal ocidental, refutado pelo terrorismo, ascensão da China autocrática e retorno de guerras imperialistas.",
      gabarito: {
        letra: "Aberta",
        ancora: "A transição geopolítica da ordem bipolar para a multipolaridade turbulenta do século XXI.",
        espera_se: "(a) Causas do colapso soviético:\n1. Esgotamento do modelo econômico centralizado e planejado: A economia soviética sofria de baixa produtividade crônica, incapacidade crônica de fornecer bens de consumo básicos à população, corrupção da Nomenklatura burocrática e ineficiência tecnológica na indústria civil;\n2. Peso esmagador da corrida militar e desgaste no Afeganistão: A URSS gastava mais de 20% do seu PIB para competir militarmente com os EUA no projeto Guerra nas Estrelas de Reagan, falindo financeiramente o país. A Glasnost (abertura política) e a Perestroika (reestruturação econômica) de Gorbachev libertaram as demandas reprimidas por soberania nacional nas repúblicas satélites, precipitando a desintegração incontrolável do bloco.\n(b) Refutação da tese de Fukuyama:\n1. Tese de Fukuyama: Francis Fukuyama proclamou que a humanidade havia atingido o 'Fim da História' — o triunfo final, universal e irreversível da democracia liberal capitalista de livre mercado sobre qualquer outra ideologia concorrente;\n2. Refutação no século XXI: Os acontecimentos históricos demonstraram a ingenuidade dessa previsão. O século XXI testemunhou o surgimento do terrorismo fundamentalista transnacional (11 de setembro), o colossal crescimento geopolítico da China sob regime autocrático de capitalismo de Estado, a ascensão de autocracias e populismos iliberais em diversas democracias, e o retorno de guerras de agressão imperialista territorial na Europa (como a invasão russa da Ucrânia em 2022), comprovando que a história continua aberta, conflituosa e perigosa."
      }
    }
  ]
};

salvar('Historia/Anos_Iniciais_2to5EF/Questoes_Historia_Comunidade_e_Tempo_2ao5ano.json', histAnosIniciais);
salvar('Historia/Anos_Finais_6to9EF/Questoes_Historia_Antiga_e_Brasil_Colonia_6ao9ano.json', histAnosFinais);
salvar('Historia/Brasil/Questoes_Historia_do_Brasil_FUVEST_ENEM_UERJ.json', histBrasil);
salvar('Historia/Militares_e_Olimpiadas/Questoes_Historia_ONHB_EsPCEx_IME_ITA.json', histMilitares);

console.log('--- LOTE 7 (HISTÓRIA) CONCLUÍDO COM SUCESSO ---');
