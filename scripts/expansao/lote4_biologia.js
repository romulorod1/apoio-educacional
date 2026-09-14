const fs = require('fs');
const path = require('path');

const BASE_DIR = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados';

function salvar(subpath, dados) {
  const p = path.join(BASE_DIR, subpath);
  fs.writeFileSync(p, JSON.stringify(dados, null, 2), 'utf-8');
  console.log(`Atualizado: ${subpath} com ${dados.questoes.length} questões.`);
}

// -------------------------------------------------------------
// 1. BIOLOGIA - SERES VIVOS E CORPO HUMANO (2º AO 9º ANO EF)
// -------------------------------------------------------------
const biologiaEF = {
  disciplina: "Biologia",
  modulo: "Seres_Vivos_e_Corpo_Humano",
  subpasta: "Anos_Iniciais_e_Finais_2to9EF",
  arquivo_origem: "Questoes_Seres_Vivos_e_Corpo_Humano.json",
  benchmark_didatico: {
    capitulo: "Ciências Naturais: Diversidade dos Seres Vivos, Fisiologia e Sistemas do Corpo Humano",
    objetivos_aprendizagem: [
      "Caracterizar os cinco reinos dos seres vivos (Monera, Protoctista, Fungi, Plantae e Animalia) e compreender os níveis de organização biológica (célula, tecido, órgão, sistema, organismo).",
      "Compreender a anatomia e a fisiologia dos principais sistemas humanos: digestório, respiratório, circulatório, excretor, nervoso e endócrino.",
      "Identificar o mecanismo de imunização ativa (vacinas) e passiva (soros) e correlacionar hábitos de vida à prevenção de doenças infectocontagiosas e crônicas.",
      "Reconhecer a reprodução humana, os hormônios sexuais, a puberdade e os métodos contraceptivos de barreira e hormonais."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Níveis de Organização e Classificação Biológica",
          definicao: "A vida organiza-se hierarquicamente: átomo → molécula → organela → célula (unidade fundamental morfofisiológica) → tecido → órgão → sistema → organismo → população → comunidade → ecossistema → biosfera. Os seres vivos dividem-se em procariontes (sem envoltório nuclear/carioteca, ex.: bactérias) e eucariontes (com núcleo delimitado e organelas membranosas). Na taxonomia biológica (Lineu): Reino → Filo → Classe → Ordem → Família → Gênero → Espécie (nomenclatura binomial, ex.: Homo sapiens)."
        },
        {
          termo: "Sistemas Integrados de Nutrição e Transporte",
          definicao: "O sistema digestório processa alimentos mecanicamente (mastigação) e quimicamente por enzimas (ptialina na boca quebra amido; pepsina no estômago sob pH ácido quebra proteínas; tripsina, lipase e amilase no duodeno auxiliadas pela bile emulsificante do fígado). A absorção de nutrientes ocorre nas microvilosidades do intestino delgado. O sistema circulatório (fechado, duplo e completo em humanos) transporta nutrientes, excretas e gases respiratórios (hemoglobina nas hemácias liga-se ao O₂). O sistema respiratório realiza a hematose nos alvéolos pulmonares por difusão de gases."
        },
        {
          termo: "Sistema Imunológico: Vacinas versus Soros",
          definicao: "A imunização ativa artificial é conferida pelas vacinas, que contêm antígenos atenuados ou inativados (ou fragmentos de RNAm), estimulando os linfócitos B e T a produzirem anticorpos próprios e células de memória imunológica de longa duração (ação preventiva). A imunização passiva artificial é realizada pelos soros terapêuticos, que já contêm anticorpos pré-fabricados prontos em alta concentração (ação curativa imediata de emergência contra venenos de cobras, escorpiões ou toxina tetânica, sem gerar memória imune)."
        }
      ],
      atencao_ponto_cego: "Ponto cego frequente no Ensino Fundamental: achar que a bile contém enzimas digestivas. A bile (produzida no fígado e armazenada na vesícula) é um emulsificante físico (detergente biológico) que quebra grandes gotas de gordura em micelas menores, aumentando a área de contato para a ação da lipase pancreática, mas não possui nenhuma enzima própria. Outro erro clássico é confundir vacina (antígeno preventivo) com soro (anticorpo curativo)."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Mecanismo de Ação e Escolha entre Soro e Vacina",
      enunciado: "Um trabalhador rural é picado no pé por uma serpente cascavel no interior do estado. Ao dar entrada no posto de saúde com dor intensa e sintomas neurológicos, o médico deve administrar uma vacina antiofídica ou um soro antiofídico? Justifique com base no mecanismo imunológico.",
      resolucao_passo_a_passo: "1. Análise da situação clínica: O paciente já recebeu a peçonha (veneno com toxinas letais ativas circulando na corrente sanguínea), tratando-se de uma emergência toxicológica aguda.\n2. Avaliação da vacina: A vacina estimula a imunidade ativa através de antígenos, levando de 10 a 20 dias para induzir a produção de anticorpos pelo próprio organismo, o que seria fatal para o paciente picado.\n3. Avaliação do soro: O soro antiofídico contém imunoglobulinas (anticorpos prontos e específicos previamente purificados em cavalos) capazes de neutralizar imediatamente as toxinas circulantes por complexação antígeno-anticorpo.\n4. Conclusão: O médico deve administrar obrigatoriamente o Soro Antiofídico, pois oferece imunização passiva com ação curativa imediata indispensável para salvar a vida do paciente."
    }
  },
  questoes: [
    {
      id: "BIO_EF_01",
      origem: "Autoral Didático - Apoio Escolar",
      ano_escolar: "6º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Diferenciação Celular e Fotossíntese",
      tipo: "fechada",
      enunciado: "As células vegetais diferenciam-se das células animais por possuírem três estruturas exclusivas que lhes conferem sustentação, capacidade de produzir o próprio alimento e regulação osmótica. Essas três estruturas são:",
      alternativas: [
        { letra: "A", texto: "Parede celular celulósica, cloroplastos e grande vacúolo central de suco celular." },
        { letra: "B", texto: "Mitocôndrias, membrana plasmática e centríolos." },
        { letra: "C", texto: "Retículo endoplasmático liso, ribossomos e carioteca." },
        { letra: "D", texto: "Complexo de Golgi, lisossomos e flagelos." },
        { letra: "E", texto: "Parede celular de quitina, cápsula proteica e plasmídeos." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A parede vegetal de celulose garante rigidez estrutural; os cloroplastos contêm clorofila para a fotossíntese; o vacúolo controla o equilíbrio hídrico.",
        porque: "Células animais não realizam fotossíntese (não têm cloroplastos), não possuem parede celular rígida de celulose e têm vacúolos muito diminutos ou ausentes."
      }
    },
    {
      id: "BIO_EF_02",
      origem: "OBB-Jr (Olimpíada Brasileira de Biologia Júnior)",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Digestão Química de Macronutrientes no Trato Digestório",
      tipo: "fechada",
      enunciado: "Durante um almoço, uma pessoa consome um prato contendo bife de carne bovina (rico em proteínas), batatas cozidas (ricas em amido) e manteiga (rica em lipídios). A digestão enzimática do amido e da carne inicia-se, respectivamente, em quais órgãos do tubo digestório?",
      alternativas: [
        { letra: "A", texto: "Boca (ptialina) e estômago (pepsina em meio ácido)." },
        { letra: "B", texto: "Estômago e duodeno." },
        { letra: "C", texto: "Boca e intestino delgado." },
        { letra: "D", texto: "Esôfago e pâncreas." },
        { letra: "E", texto: "Estômago e fígado." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A amilase salivar (ptialina) inicia a hidrólise do amido na boca em pH neutro (~7). A pepsina inicia a quebra de proteínas no estômago ativada pelo ácido clorídrico (HCl, pH ~2).",
        porque: "O amido começa a ser degradado na cavidade oral pela saliva. As proteínas passam intactas pela boca e esôfago, iniciando sua desnaturação e quebra proteolítica no suco gástrico estomacal."
      }
    },
    {
      id: "BIO_EF_03",
      origem: "Colégio Militar",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Circulação Humana e Tipos de Sangue",
      tipo: "fechada",
      enunciado: "O coração humano é uma bomba muscular tetracameral composta por dois átrios e dois ventrículos. O sangue venoso, rico em gás carbônico (CO₂), chega ao coração pelas veias cavas e é bombeado aos pulmões para ser oxigenado através de qual câmara cardíaca e qual vaso?",
      alternativas: [
        { letra: "A", texto: "Ventrículo direito, através da artéria pulmonar." },
        { letra: "B", texto: "Ventrículo esquerdo, através da artéria aorta." },
        { letra: "C", texto: "Átrio direito, através das veias pulmonares." },
        { letra: "D", texto: "Átrio esquerdo, através da artéria coronária." },
        { letra: "E", texto: "Ventrículo esquerdo, através da veia jugular." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Lado direito do coração conduz sangue desoxigenado (venoso): Átrio direito → Ventrículo direito → Artéria pulmonar → Pulmões (hematose).",
        porque: "O ventrículo direito contrai durante a sístole impulsionando o sangue venoso pela artéria pulmonar até o leito capilar dos alvéolos pulmonares, onde ocorre a liberação de CO₂ e captação de O₂."
      }
    },
    {
      id: "BIO_EF_04",
      origem: "OBB-Jr",
      ano_escolar: "7º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Reino Fungi e Importância Ecológica/Econômica",
      tipo: "fechada",
      enunciado: "Os fungos (cogumelos, leveduras e bolores) outrora foram classificados como vegetais primitivos. Hoje constituem um reino biológico próprio (Reino Fungi) porque apresentam:",
      alternativas: [
        { letra: "A", texto: "Nutrição heterotrófica por absorção, parede celular constituída de quitina e reserva energética na forma de glicogênio." },
        { letra: "B", texto: "Autotrofia fotossintetizante e parede celular de celulose." },
        { letra: "C", texto: "Organização celular procariótica sem membrana nuclear." },
        { letra: "D", texto: "Nutrição quimiossintetizante e locomoção por pseudópodes." },
        { letra: "E", texto: "Ausência total de núcleo e DNA circular livre." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Fungos são eucariontes aclorofilados (heterótrofos) com quitina na parede celular e glicogênio como carboidrato de reserva.",
        porque: "Ao contrário das plantas, fungos não realizam fotossíntese e possuem parede de quitina (mesmo polissacarídeo do exoesqueleto dos artrópodes) e armazenam glicogênio (como os animais), sendo filogeneticamente mais próximos dos animais do que dos vegetais."
      }
    },
    {
      id: "BIO_EF_05",
      origem: "Colégio Pedro II",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Sistema Excretor Humano e Formação da Urina",
      tipo: "fechada",
      enunciado: "Os rins humanos filtram cerca de 180 litros de plasma sanguíneo diariamente através de milhões de unidades funcionais microscópicas chamadas néfrons. As três etapas sucessivas que ocorrem no néfron durante a formação da urina são:",
      alternativas: [
        { letra: "A", texto: "Filtração glomerular, reabsorção tubular de água e nutrientes úteis, e secreção tubular de excretas." },
        { letra: "B", texto: "Digestão renal, hematose e micção." },
        { letra: "C", texto: "Decantação estática, centrifugação osmótica e diálise." },
        { letra: "D", texto: "Sedimentação na uretra, absorção de sais e evaporação pela bexiga." },
        { letra: "E", texto: "Oxigenação medular, coagulação e excreção de glicose." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O sangue sob pressão no glomérulo de Malpighi é filtrado para a cápsula de Bowman; os túbulos renais reabsorvem quase 99% da água, glicose e aminoácidos de volta ao sangue.",
        porque: "A filtração gera o filtrado glomerular. Na reabsorção tubular, substâncias vitais retornam aos capilares peritubulares. Na secreção, toxinas e íons em excesso (como H⁺ e K⁺) são ativamente lançados no lúmen tubular para eliminação na urina."
      }
    },
    {
      id: "BIO_EF_06",
      origem: "Apoio Escolar - Avaliação Formativa",
      ano_escolar: "7º Ano EF",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Vírus e Doenças Infectocontagiosas",
      tipo: "fechada",
      enunciado: "Os vírus são considerados parasitas intracelulares obrigatórios porque não possuem metabolismo próprio fora das células vivas. Das enfermidades abaixo, marque a opção em que todas são causadas exclusivamente por agentes virais:",
      alternativas: [
        { letra: "A", texto: "Gripe, dengue, sarampo e febre amarela." },
        { letra: "B", texto: "Cólera, tuberculose, tétano e hanseníase." },
        { letra: "C", texto: "Malária, doença de Chagas e amebíase." },
        { letra: "D", texto: "Candidíase, micose de praia e sapinho." },
        { letra: "E", texto: "Gripe, leptospirose e sífilis." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Gripe (Influenza), dengue (Flavivirus), sarampo (Morbillivirus) e febre amarela (Flavivirus) são infecções estritamente virais.",
        porque: "Tuberculose e tétano são causadas por bactérias (B); malária e Chagas por protozoários (C); micoses e candidíase por fungos (D); leptospirose e sífilis por bactérias (E)."
      }
    },
    {
      id: "BIO_EF_07",
      origem: "OBB-Jr",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Primeira Lei de Mendel e Cruzamentos Monohíbridos",
      tipo: "fechada",
      enunciado: "Em cobaias, a pelagem preta é determinada por um alelo dominante B e a pelagem branca pelo alelo recessivo b. Do cruzamento entre dois animais heterozigotos (Bb × Bb), a probabilidade fenotípica esperada de descendentes com pelagem preta é de:",
      alternativas: [
        { letra: "A", texto: "75% (3/4)" },
        { letra: "B", texto: "50% (1/2)" },
        { letra: "C", texto: "25% (1/4)" },
        { letra: "D", texto: "100%" },
        { letra: "E", texto: "33,3% (1/3)" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Quadro de Punnett para Bb × Bb gera os genótipos: 1 BB, 2 Bb e 1 bb.",
        porque: "Os genótipos BB (1/4) e Bb (2/4) expressam o fenótipo dominante de pelagem preta, totalizando 1/4 + 2/4 = 3/4 (75%). Apenas o duplo recessivo bb (1/4 ou 25%) apresenta pelagem branca."
      }
    },
    {
      id: "BIO_EF_08",
      origem: "IFs Técnicos",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Sistema Endócrino e Regulação da Glicemia",
      tipo: "fechada",
      enunciado: "Após uma refeição rica em carboidratos, a taxa de glicose no sangue (glicemia) eleva-se rapidamente. Em resposta, o pâncreas secreta um hormônio vital que facilita a entrada de glicose nas células e estimula o armazenamento sob forma de glicogênio no fígado. Esse hormônio e seu antagonista secretado em jejum são:",
      alternativas: [
        { letra: "A", texto: "Insulina (produzida pelas células beta) e glucagon (produzido pelas células alfa)." },
        { letra: "B", texto: "Glucagon e adrenalina." },
        { letra: "C", texto: "Tiroxina e calcitonina." },
        { letra: "D", texto: "Cortisol e hormônio do crescimento." },
        { letra: "E", texto: "Insulina e estrogênio." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Insulina é um hormônio hipoglicemiante que reduz o açúcar sanguíneo; o glucagon é hiperglicemiante estimulando a quebra de glicogênio hepático no jejum.",
        porque: "Ambos são produzidos nas ilhotas pancreáticas e mantêm a homeostase glicêmica estreita entre 70 e 99 mg/dL no indivíduo saudável."
      }
    },
    {
      id: "BIO_EF_09",
      origem: "Colégio Militar",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Evolução Biológica: Lamarckismo vs. Darwinismo",
      tipo: "fechada",
      enunciado: "O pescoço comprido das girafas atuais é explicado classicamente por duas correntes teóricas distintas da biologia evolutiva. A explicação científica aceita pela moderna Teoria Sintética da Evolução (Neodarwinismo) sustenta que:",
      alternativas: [
        { letra: "A", texto: "Na população ancestral já existiam variações genéticas aleatórias no comprimento do pescoço; em períodos de escassez alimentar rasteira, os indivíduos de pescoço mais longo tiveram maior sucesso adaptativo de sobrevivência e reprodução (seleção natural)." },
        { letra: "B", texto: "O esforço contínuo das girafas em esticar o pescoço para alcançar folhas altas desenvolveu essa estrutura durante a vida, transmitindo o comprimento aumentado aos seus filhotes (uso e desuso)." },
        { letra: "C", texto: "O clima quente provocou mutações direcionadas com a finalidade exclusiva de alongar as vértebras cervicais." },
        { letra: "D", texto: "As girafas cruzaram intencionalmente com árvores altas herdando sua altura." },
        { letra: "E", texto: "A seleção natural causou o surgimento de pescoços longos de forma instantânea em uma única geração sem ancestralidade comum." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O darwinismo baseia-se na variabilidade pré-existente e na seleção natural não-direcionada pelo ambiente.",
        porque: "O ambiente não cria ativamente a característica vantajosa (visão lamarckista do uso/desuso e herança de caracteres adquiridos); o ambiente atua como agente seletivo, favorecendo os indivíduos portadores de variações mais aptas."
      }
    },
    {
      id: "BIO_EF_10",
      origem: "OBB-Jr",
      ano_escolar: "7º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Cadeias Alimentares e Fluxo de Energia",
      tipo: "fechada",
      enunciado: "Em uma cadeia alimentar terrestre típica constituída por: Capim → Gafanhoto → Sapo → Serpente → Gavião, a transferência de matéria e de energia ao longo dos níveis tróficos comporta-se, respectivamente, de modo:",
      alternativas: [
        { letra: "A", texto: "Cíclico (reciclada pelos decompositores) e unidirecional decrescente (perda progressiva de calor a cada nível trófico)." },
        { letra: "B", texto: "Unidirecional e acumulativo crescente para a energia." },
        { letra: "C", texto: "Cíclico para a energia e unidirecional para a matéria." },
        { letra: "D", texto: "Constante e inalterado do produtor ao topo da cadeia." },
        { letra: "E", texto: "Interrompido no nível dos carnívoros primários." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A matéria circula ciclicamente na biosfera pelos ciclos biogeoquímicos; a energia tem fluxo unidirecional dissipando-se continuamente na forma de calor metabólico não-reaproveitável (Segunda Lei da Termodinâmica).",
        porque: "Cerca de 90% da energia útil é perdida a cada nível trófico por respiração celular e calor, restando apenas ~10% para o nível trófico seguinte, o que limita o comprimento máximo das cadeias alimentares."
      }
    },
    {
      id: "BIO_EF_11",
      origem: "Colégio Naval",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Sistema Nervoso e Arco Reflexo Medular",
      tipo: "fechada",
      enunciado: "Ao tocar inadvertidamente uma panela em brasa com a mão, a pessoa recolhe o braço bruscamente antes mesmo de perceber conscientemente a sensação de dor. Essa resposta motora rápida e involuntária é orquestrada por qual circuito fisiológico?",
      alternativas: [
        { letra: "A", texto: "Arco reflexo simples integrado diretamente na medula espinhal por neurônios sensitivos, associativos e motores." },
        { letra: "B", texto: "Comando motor do córtex cerebral consciente após processamento visual." },
        { letra: "C", texto: "Liberação de adrenalina pelas glândulas suprarrenais sem envolvimento do sistema nervoso." },
        { letra: "D", texto: "Contração autônoma do músculo cardíaco." },
        { letra: "E", texto: "Estímulo gerado exclusivamente no cerebelo para controle de equilíbrio." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O arco reflexo medular produz respostas motoras de defesa imediatas antes que o sinal aferente atinja o córtex somatossensorial cerebral.",
        porque: "O neurônio aferente (sensitivo) conduz o potencial de ação até a substância cinzenta da medula espinhal, que sinapta com neurônios eferentes (motores) nos músculos flexores, minimizando lesões teciduais antes da percepção cerebral consciente."
      }
    },
    {
      id: "BIO_EF_12",
      origem: "OBB Fase Nacional",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Grupos Sanguíneos Sistema ABO e Fator Rh",
      tipo: "fechada",
      enunciado: "Um casal em que a mãe é do grupo sanguíneo O negativo (O Rh⁻) e o pai é do grupo sanguíneo AB positivo heterozigoto para Rh (AB Rh⁺) planeja ter filhos. A probabilidade de esse casal gerar uma criança com sangue do tipo A positivo (A Rh⁺) é:",
      alternativas: [
        { letra: "A", texto: "25% (1/4)" },
        { letra: "B", texto: "50% (1/2)" },
        { letra: "C", texto: "12,5% (1/8)" },
        { letra: "D", texto: "75% (3/4)" },
        { letra: "E", texto: "0%" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Cruzamento do sistema ABO: ii × IᴬIᴮ => 50% Iᴬi (tipo A) e 50% Iᴮi (tipo B). Cruzamento do fator Rh: rr × Rr => 50% Rr (Rh⁺) e 50% rr (Rh⁻).",
        porque: "Aplicando a regra do produto de eventos genéticos independentes: P(Tipo A e Rh⁺) = P(Tipo A) × P(Rh⁺) = (1/2) × (1/2) = 1/4 = 25%."
      }
    },
    {
      id: "BIO_EF_13",
      origem: "OBB-Jr 2ª Fase",
      ano_escolar: "8º Ano EF",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Mecanismo da Hematose Pulmonar e Transporte de Gases",
      tipo: "aberta",
      enunciado: "Explique como ocorre o processo de troca gasosa (hematose) nos alvéolos pulmonares humanos. Na sua resposta, mencione o papel do gradiente de concentração por difusão simples do oxigênio e do gás carbônico e a molécula carreadora de oxigênio presente nas hemácias.",
      resposta: "Difusão simples passiva a favor do gradiente de pressão parcial e ligação do O₂ à hemoglobina.",
      gabarito: {
        letra: "Aberta",
        ancora: "Troca gasosa por difusão passiva alveolar impulsionada pela diferença de pressões parciais de O₂ e CO₂.",
        espera_se: "O ar alveolar possui alta concentração de O₂ e baixa de CO₂, enquanto o sangue venoso que chega aos capilares peri-alveolares possui baixa pressão de O₂ e alta de CO₂. Por simples difusão passiva através da finíssima membrana alvéolo-capilar, o O₂ passa do alvéolo para o sangue e o CO₂ passa do sangue para o alvéolo para ser exalado. No sangue, a quase totalidade do O₂ liga-se reversivelmente aos átomos de ferro da proteína hemoglobina no interior das hemácias, formando a oxi-hemoglobina que irrigará todos os tecidos corpóreos."
      }
    },
    {
      id: "BIO_EF_14",
      origem: "Colégio de Aplicação UERJ",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Eritroblastose Fetal e Fator Rh",
      tipo: "aberta",
      enunciado: "A eritroblastose fetal (doença hemolítica do recém-nascido) pode ocorrer quando há incompatibilidade do fator Rh entre mãe e bebê. (a) Quais devem ser os tipos sanguíneos da mãe, do feto e do pai quanto ao fator Rh para que exista risco da doença? (b) Por que o primeiro filho geralmente nasce saudável e o risco agrava-se nas gestações seguintes?",
      resposta: "(a) Mãe Rh⁻, Feto Rh⁺ e Pai Rh⁺; (b) A sensibilização imunológica materna ocorre no parto do 1º filho.",
      gabarito: {
        letra: "Aberta",
        ancora: "A incompatibilidade requer mãe Rh negativo e concepto Rh positivo.",
        espera_se: "(a) A mãe deve ser obrigatoriamente Rh negativo (rr), o feto deve ser Rh positivo (R_), o que exige que o pai biológico seja Rh positivo.\n(b) Durante o parto do primeiro concepto Rh⁺, ocorre contato acidental de sangue fetal com a circulação materna, sensibilizando o sistema imune da mulher a produzir anticorpos anti-Rh (linfócitos de memória). Em uma segunda gestação de feto Rh⁺, esses anticorpos maternos da classe IgG, por serem pequenos, atravessam ativamente a barreira placentária, destruindo as hemácias fetais e provocando anemia grave, icterícia e hipóxia no bebê."
      }
    },
    {
      id: "BIO_EF_15",
      origem: "OBB Fase Final",
      ano_escolar: "9º Ano EF",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Bioacumulação e Magnificação Trófica",
      tipo: "aberta",
      enunciado: "Metais pesados (como o metilmercúrio em garimpos) e pesticidas organoclorados (como o DDT) são substâncias lipossolúveis e não-biodegradáveis. Explique a diferença entre os conceitos de bioacumulação e magnificação trófica ao longo de uma cadeia alimentar aquática (Fitoplâncton → Zooplâncton → Peixes pequenos → Peixes carnívoros → Aves piscívoras). Qual nível trófico sofrerá as maiores concentrações de toxina?",
      resposta: "As aves piscívoras no topo da cadeia alimentar sofrem a maior concentração por magnificação trófica.",
      gabarito: {
        letra: "Aberta",
        ancora: "Substâncias não metabolizáveis e lipofílicas acumulam-se progressivamente ao longo dos níveis tróficos sucessivos.",
        espera_se: "1. Bioacumulação: É o acúmulo contínuo de uma substância química nos tecidos gordurosos de um único indivíduo ao longo da sua vida, porque a taxa de absorção supera a taxa de excreção e degradação metabólica.\n2. Magnificação trófica (biomagnificação): É o aumento progressivo da concentração do poluente tóxico a cada nível trófico sucessivo ao longo da cadeia alimentar. Como a biomassa consumida para sustentar os níveis superiores é imensa e o poluente não é excretado, a toxina atinge concentrações astronômicas no topo da cadeia.\n3. O topo da cadeia (as aves piscívoras/mamíferos predadores) sofrerá a maior concentração e danos biológicos severos (como fragilidade da casca dos ovos e falência neurológica)."
      }
    }
  ]
};

// -------------------------------------------------------------
// 2. BIOLOGIA - CITOLOGIA, DNA E HEREDITARIEDADE
// -------------------------------------------------------------
const biologiaCitologia = {
  disciplina: "Biologia",
  modulo: "Biologia_Celular_DNA_e_Hereditariedade",
  subpasta: "Citologia_e_Genetica",
  arquivo_origem: "Questoes_Biologia_Celular_DNA_e_Hereditariedade.json",
  benchmark_didatico: {
    capitulo: "Citologia, Genética Molecular e Biotecnologia",
    objetivos_aprendizagem: [
      "Compreender a estrutura e função das membranas biológicas (Modelo do Mosaico Fluido) e os transportes através da membrana (passivos, ativos e em bloco).",
      "Analisar o Dogma Central da Biologia Molecular: replicação semiconservativa do DNA, transcrição em RNAm e tradução proteica ribossômica com código genético universal degenerado.",
      "Distinguir as etapas da Mitose (reprodução celular/crescimento) e Meiose (gametogênese/crossing-over/redução cromossômica).",
      "Resolver problemas genéticos envolvendo alelos múltiplos (Sistema ABO), herança ligada ao sexo (daltonismo e hemofilia) e biotecnologia moderna (PCR, CRISPR e clonagem)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Membrana Plasmática e Fisiologia Celular",
          definicao: "O modelo do mosaico fluido (Singer e Nicolson) descreve uma bicamada fosfolipídica anfipática incrustada de proteínas integrais e periféricas e colesterol (em células animais, que confere fluidez). Os transportes passivos ocorrem a favor do gradiente eletroquímico sem gasto de ATP: Difusão Simples (gases e moléculas apolares), Osmose (deslocamento passivo de água do meio hipotônico para o hipertônico) e Difusão Facilitada (via permeases/canais). O transporte ativo (Bomba de Na⁺/K⁺ ATPase) bombeia 3 Na⁺ para o meio extracelular e 2 K⁺ para o intracelular contra seus gradientes de concentração com consumo de ATP."
        },
        {
          termo: "Dogma Central: Replicação, Transcrição e Tradução",
          definicao: "A replicação do DNA é semiconservativa, catalisada pela DNA polimerase no sentido 5' → 3'. A transcrição sintetiza RNA mensageiro pela RNA polimerase a partir da fita molde de DNA (com uracila em vez de timina); em eucariontes ocorre o splicing (remoção de íntrons e união de éxons) e o splicing alternativo. A tradução ocorre nos ribossomos: trincas de nucleotídeos do RNAm (códons) pareiam com o anticódon do RNAt correspondente, montando cadeias polipeptídicas de aminoácidos segundo o código genético (universal, degenerado e sem sobreposição, iniciado pelo códon AUG de metionina)."
        },
        {
          termo: "Ciclo Celular: Mitose e Meiose",
          definicao: "A intérfase compreende as fases G1, S (duplicação semiconservativa do DNA) e G2. A mitose (Prófase, Metáfase, Anáfase, Telófase) é uma divisão equacional que gera 2 células-filhas geneticamente idênticas à célula-mãe. A meiose compreende duas divisões sucessivas: Meiose I (reducional, onde ocorre o pareamento de cromossomos homólogos e o crossing-over/permutação gênica na Prófase I - Paquíteno) e Meiose II (equacional, com separação das cromátides-irmãs), gerando 4 células haploides geneticamente diversas."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico em genética: confundir 'código genético' com 'genoma'. O genoma é a sequência de nucleotídeos específica de um indivíduo; o código genético é a tabela de correspondência universal códon-aminoácido. Outro erro comum é achar que mutações silenciosas alteram a proteína; devido à redundância/degeneração do código, códons sinônimos codificam o mesmíssimo aminoácido."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Herança Ligada ao Sexo (Daltonismo)",
      enunciado: "O daltonismo é uma anomalia visual de herança recessiva ligada ao cromossomo X (alelo d). Um homem de visão normal casa-se com uma mulher de visão normal cuja mãe era daltônica. Determine a probabilidade de esse casal ter: (a) um filho homem daltônico; (b) uma criança daltônica independente do sexo.",
      resolucao_passo_a_passo: "1. Determinação dos genótipos dos pais:\n- Pai: Visão normal => XᴰY.\n- Mãe: Tem visão normal, mas sua mãe era daltônica (XᵈXᵈ). Portanto, ela herdou obrigatoriamente um alelo recessivo da mãe, sendo portadora heterozigota => XᴰXᵈ.\n2. Cruzamento XᴰY × XᴰXᵈ:\n- Gametas masculinos: 1/2 Xᴰ e 1/2 Y.\n- Gametas femininos: 1/2 Xᴰ e 1/2 Xᵈ.\n- Descendência esperada: 1/4 XᴰXᴰ (menina normal homozigota), 1/4 XᴰXᵈ (menina normal portadora), 1/4 XᴰY (menino normal) e 1/4 XᵈY (menino daltônico).\n3. Respostas:\n(a) Entre os filhos homens (XᴰY e XᵈY), a probabilidade de ser daltônico é 1/2 (50%). Se a pergunta considerar o evento conjunto 'nascer homem e ser daltônico': P = 1/4 (25%).\n(b) Criança daltônica independente do sexo: Somente o menino XᵈY manifesta daltonismo (pois as meninas recebem o Xᴰ normal do pai). Portanto, a probabilidade é exatamente 1/4 (25%)."
    }
  },
  questoes: [
    {
      id: "BIO_CIT_01",
      origem: "ENEM",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Osmose em Células Animais e Vegetais",
      tipo: "fechada",
      enunciado: "Ao colocar hemácias humanas em um tubo de ensaio contendo água destilada pura (meio fortemente hipotônico em relação ao citoplasma celular), observa-se que as hemácias incham e sofrem lise osmótica (hemólise). Se células de folha vegetal forem submetidas ao mesmo meio, elas:",
      alternativas: [
        { letra: "A", texto: "Ficam túrgidas sem romper, porque a rígida parede celular de celulose exerce contrapressão mecânica impedindo a lise." },
        { letra: "B", texto: "Sofrem plasmólise imediata murchando o citoplasma." },
        { letra: "C", texto: "Rompem-se mais rapidamente que as hemácias por terem vacúolos gigantes." },
        { letra: "D", texto: "Perdem água ativamente por exocitose para manter a salinidade." },
        { letra: "E", texto: "Transformam a água destilada em seiva bruta sem alterar seu volume." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A parede celular celulósica das plantas fornece suporte mecânico contra a pressão de turgor osmótica.",
        porque: "Nas hemácias (desprovidas de parede), o influxo maciço de água rompe a membrana plasmática delicada. Na célula vegetal, a entrada de água expande o vacúolo até que a pressão de parede (turgidez máxima) iguale o potencial hídrico, impedindo a lise."
      }
    },
    {
      id: "BIO_CIT_02",
      origem: "FUVEST",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Transcrição e Tradução no Dogma Central",
      tipo: "fechada",
      enunciado: "Um segmento da fita-molde de DNA que codifica um peptídeo apresenta a seguinte sequência de bases nitrogenadas: 3'-TAC TTA CCG ATT-5'. A sequência de códons do RNA mensageiro transcrito a partir dessa fita é:",
      alternativas: [
        { letra: "A", texto: "5'-AUG AAU GGC UAA-3'" },
        { letra: "B", texto: "5'-ATG AAT GGC TAA-3'" },
        { letra: "C", texto: "5'-UAC UUA CCG AUU-3'" },
        { letra: "D", texto: "5'-AUG UUA GGC UAA-3'" },
        { letra: "E", texto: "5'-ATC TTA CCG ATT-3'" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Pareamento complementar de bases na transcrição de DNA para RNA: T pareia com A, A pareia com U (uracila no RNA), C pareia com G e G pareia com C; extremidades antiparalelas 5' → 3'.",
        porque: "3'-TAC-5' → 5'-AUG-3' (códon de início); 3'-TTA-5' → 5'-AAU-3'; 3'-CCG-5' → 5'-GGC-3'; 3'-ATT-5' → 5'-UAA-3' (códon de parada/stop)."
      }
    },
    {
      id: "BIO_CIT_03",
      origem: "UNICAMP",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Mitose: Fases e Separação de Cromátides",
      tipo: "fechada",
      enunciado: "O quimioterápico vimblastina é um fármaco utilizado no tratamento oncológico que atua impedindo a polimerização das tubulinas e a consequente formação dos microtúbulos do fuso mitótico. Em células cancerosas tratadas com vimblastina, a divisão celular será bloqueada especificamente na transição de:",
      alternativas: [
        { letra: "A", texto: "Metáfase para a anáfase, impedindo a migração das cromátides-irmãs para os polos celulares." },
        { letra: "B", texto: "Fase G1 para a fase S da intérfase." },
        { letra: "C", texto: "Telófase para a citocinese terminal." },
        { letra: "D", texto: "Prófase inicial antes do desaparecimento do nucléolo." },
        { letra: "E", texto: "Crossing-over na meiose II." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O fuso acromático é responsável pelo alinhamento dos cromossomos na placa metafásica e pela tração das cromátides para os polos na anáfase.",
        porque: "Sem microtúbulos funcionais, as fibras cinetocóricas não conseguem tracionar as cromátides-irmãs na anáfase, disparando o ponto de checagem do fuso (spindle assembly checkpoint) e paralisando a mitose em metáfase com posterior indução de apoptose."
      }
    },
    {
      id: "BIO_CIT_04",
      origem: "UERJ",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Genética do Sistema ABO e Transfusões",
      tipo: "fechada",
      enunciado: "Uma pessoa do grupo sanguíneo O possui aglutininas (anticorpos) anti-A e anti-B no plasma e ausência de aglutinogênios (antígenos) na membrana das hemácias. Em caso de necessidade emergencial de transfusão de hemácias concentradas, essa pessoa poderá doar e receber hemácias, respectivamente, de:",
      alternativas: [
        { letra: "A", texto: "Pode doar para todos os grupos (A, B, AB e O - doador universal de hemácias) e receber exclusivamente do grupo O." },
        { letra: "B", texto: "Pode doar apenas para o grupo O e receber de todos os grupos." },
        { letra: "C", texto: "Pode doar e receber de qualquer grupo indistintamente." },
        { letra: "D", texto: "Pode doar para A e B apenas e receber de AB." },
        { letra: "E", texto: "Pode doar exclusivamente para AB e receber de A e B." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Como as hemácias do tipo O não possuem antígenos A nem B, não são atacadas pelos anticorpos dos receptores. Porém, seu plasma possui anticorpos anti-A e anti-B, rejeitando qualquer hemácia estranha que não seja O.",
        porque: "O tipo O atua como doador universal de concentrado de hemácias e só pode receber hemácias de outro indivíduo O."
      }
    },
    {
      id: "BIO_CIT_05",
      origem: "UNESP",
      ano_escolar: "1º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Respiração Celular: Glicólise, Ciclo de Krebs e Cadeia Respiratória",
      tipo: "fechada",
      enunciado: "Na respiração celular aeróbia dos eucariontes, a etapa metabólica responsável pelo maior rendimento energético na síntese de ATP acoplada ao transporte de elétrons e que consome diretamente gás oxigênio é a:",
      alternativas: [
        { letra: "A", texto: "Fosforilação oxidativa (cadeia respiratória), que ocorre nas cristas mitocondriais." },
        { letra: "B", texto: "Glicólise anaeróbia no citosol." },
        { letra: "C", texto: "Ciclo do ácido cítrico (Krebs) na matriz mitocondrial." },
        { letra: "D", texto: "Fermentação lática nos lisossomos." },
        { letra: "E", texto: "Fase clara da fotossíntese nos tilacoides." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O oxigênio atua como aceptor final de elétrons na cadeia respiratória mitocondrial, unindo-se a prótons H⁺ para formar água metabólica.",
        porque: "O gradiente quimiosmótico de prótons acumulados no espaço intermembranas aciona a ATP sintase nas cristas mitocondriais, gerando a maior fração de ATP de todo o ciclo aeróbio."
      }
    },
    {
      id: "BIO_CIT_06",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Biotecnologia: Transgênicos vs Clonagem",
      tipo: "fechada",
      enunciado: "A soja transgênica 'Roundup Ready' foi desenvolvida pela introdução de um gene de uma bactéria do solo que confere tolerância ao herbicida glifosato. Esse organismo é classificado como transgênico porque:",
      alternativas: [
        { letra: "A", texto: "Recebeu e incorporou de forma estável um gene exógeno proveniente de outra espécie biológica." },
        { letra: "B", texto: "Foi gerado por clonagem celular a partir de óvulo enucleado." },
        { letra: "C", texto: "Sofreu mutação espontânea sem intervenção humana." },
        { letra: "D", texto: "Resulta de hibridização natural entre plantas da mesma família." },
        { letra: "E", texto: "Possui seu DNA nativo totalmente substituído por RNA viral." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Organismo Geneticamente Modificado (OGM) que recebe material genético funcional de outra espécie através de técnicas de DNA recombinante é denominado transgênico.",
        porque: "A inserção heteróloga do gene bacteriano permite à planta sintetizar a enzima resistente, possibilitando a aplicação do defensivo sobre a lavoura sem destruição da cultura de interesse econômico."
      }
    },
    {
      id: "BIO_CIT_07",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Segunda Lei de Mendel e Segregação Independente",
      tipo: "fechada",
      enunciado: "Em ervilhas (Pisum sativum), a cor amarela da semente é dominante (V) sobre a verde (v), e a textura lisa é dominante (R) sobre a rugosa (r). Sabendo que esses dois pares de alelos segregam independentemente (não estão ligados), o cruzamento entre indivíduos duplo-heterozigotos (VvRr × VvRr) produz descendentes amarelos e rugosos na proporção esperada de:",
      alternativas: [
        { letra: "A", texto: "3/16" },
        { letra: "B", texto: "9/16" },
        { letra: "C", texto: "1/16" },
        { letra: "D", texto: "3/8" },
        { letra: "E", texto: "1/4" }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Proporção fenotípica mendeliana clássica para di-hibridismo independente: 9 amarelas lisas : 3 amarelas rugosas : 3 verdes lisas : 1 verde rugosa.",
        porque: "P(Amarela) = 3/4 e P(Rugosa) = 1/4. Pela regra do produto para loci independentes: P(Amarela e Rugosa) = (3/4) × (1/4) = 3/16."
      }
    },
    {
      id: "BIO_CIT_08",
      origem: "EsPCEx",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Meiose e Recombinação Gênica (Crossing-over)",
      tipo: "fechada",
      enunciado: "A recombinação genética (crossing-over ou permutação) é um evento meiótico fundamental que aumenta a variabilidade biológica dos gametas. Ela ocorre especificamente durante qual subfase da divisão celular?",
      alternativas: [
        { letra: "A", texto: "Paquíteno da Prófase I da Meiose." },
        { letra: "B", texto: "Metáfase II da Meiose." },
        { letra: "C", texto: "Anáfase I da Meiose." },
        { letra: "D", texto: "Diplóteno da Prófase II." },
        { letra: "E", texto: "Leptóteno da Mitose." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Subfases da Prófase I meiótica: Leptóteno, Zigóteno (sinapse), Paquíteno (crossing-over com quebra e troca de segmentos de cromátides não-irmãs), Diplóteno (quiasmas visíveis) e Diacinese.",
        porque: "É no paquíteno que o complexo sinaptonêmico estabiliza o pareamento dos cromossomos homólogos, permitindo a quebra e recombinação física de fragmentos de DNA entre cromátides não-irmãs."
      }
    },
    {
      id: "BIO_CIT_09",
      origem: "AFA",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Ligação Gênica (Linkage) e Taxa de Recombinação",
      tipo: "fechada",
      enunciado: "Considere dois genes ligados A e B em um indivíduo de genótipo cis (AB / ab). Ao analisar os gametas produzidos por esse indivíduo, constatou-se a seguinte distribuição: 42% AB, 42% ab, 8% Ab e 8% aB. A distância genética entre os dois loci e a taxa de recombinação são:",
      alternativas: [
        { letra: "A", texto: "16 centimorgans (cM) ou unidades de recombinação (UR) e taxa de 16%." },
        { letra: "B", texto: "8 cM e taxa de 8%." },
        { letra: "C", texto: "42 cM e taxa de 42%." },
        { letra: "D", texto: "84 cM e taxa de 84%." },
        { letra: "E", texto: "32 cM e taxa de 32%." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Gametas recombinantes são os de menor frequência: Ab (8%) + aB (8%) = 16%.",
        porque: "A frequência de recombinação é a soma das frequências dos gametas recombinantes: 8% + 8% = 16%. Por convenção de Morgan, 1% de recombinação equivale a 1 unidade de mapa ou centimorgan (cM), totalizando 16 cM."
      }
    },
    {
      id: "BIO_CIT_10",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Epigenética e Expressão Gênica",
      tipo: "fechada",
      enunciado: "Gêmeos monozigóticos (univitelinos) possuem rigorosamente a mesma sequência nucleotídica de DNA ao nascer. No entanto, ao longo da vida adulta, podem manifestar diferenças notáveis de saúde e fenótipo devido a fatores ambientais, alimentação e estresse. Esse fenômeno é estudado pela:",
      alternativas: [
        { letra: "A", texto: "Epigenética, que analisa modificações químicas no DNA e nas histonas (como metilação e acetilação) que alteram a expressão gênica sem modificar a sequência de bases do genoma." },
        { letra: "B", texto: "Engenharia genética reversa com mutação somática massiva." },
        { letra: "C", texto: "Deriva genética aleatória em tecidos somáticos." },
        { letra: "D", texto: "Clonagem terapêutica espontânea intrauterina." },
        { letra: "E", texto: "Troca cromossômica por transdução bacteriana." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A epigenética estuda modificações herdáveis na expressão dos genes que não decorrem de alterações na sequência primária de nucleotídeos.",
        porque: "A metilação do DNA geralmente silencia a transcrição, enquanto a acetilação de histonas descondensa a cromatina facilitando a transcrição, regulando quais genes serão ativados ou silenciados pelo estilo de vida."
      }
    },
    {
      id: "BIO_CIT_11",
      origem: "OBB Fase Nacional",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Reação em Cadeia da Polimerase (PCR) e Eletroforese",
      tipo: "fechada",
      enunciado: "Na técnica de PCR (Reação em Cadeia da Polimerase) para amplificação de DNA in vitro, utiliza-se a enzima DNA polimerase Taq, isolada da bactéria termófila Thermus aquaticus. A escolha dessa enzima em vez de uma DNA polimerase humana comum deve-se ao fato de que:",
      alternativas: [
        { letra: "A", texto: "A enzima Taq é termoestável e suporta repetidos ciclos de desnaturação a 95 °C sem perder sua atividade catalítica." },
        { letra: "B", texto: "A enzima Taq não necessita de primers de RNA para iniciar a síntese." },
        { letra: "C", texto: "A polimerase humana não reconhece nucleotídeos de DNA sintético." },
        { letra: "D", texto: "A Taq polimerase transcreve DNA em RNA diretamente sem necessidade de dNTPs." },
        { letra: "E", texto: "A Taq impede mutações com fidelidade absoluta de 100%." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Os ciclos térmicos do termociclador exigem desnaturação da dupla hélice a ~95 °C, o que desnatura instantaneamente polimerases mesófilas humanas.",
        porque: "Por ser oriunda de microrganismos de fontes termais, a Taq polimerase permanece funcional após dezenas de ciclos a alta temperatura, viabilizando a amplificação exponencial automatizada do DNA alvo."
      }
    },
    {
      id: "BIO_CIT_12",
      origem: "ITA / IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Regulação da Expressão Gênica: Operon Lac",
      tipo: "fechada",
      enunciado: "No modelo clássico do Operon Lac de Escherichia coli (Jacob e Monod), na ausência de glicose e na presença de lactose no meio de cultura celular, o estado funcional do sistema é caracterizado por:",
      alternativas: [
        { letra: "A", texto: "A alolactose liga-se à proteína repressora inativando-a (desprendendo-a do operador) e altos níveis de AMPc ativam o complexo CAP-AMPc, promovendo máxima transcrição dos genes estruturais (lacZ, lacY e lacA)." },
        { letra: "B", texto: "O repressor permanece firmemente ligado ao operador bloqueando a RNA polimerase." },
        { letra: "C", texto: "A glicose liga-se ao operador acelerando a hidrólise de RNA." },
        { letra: "D", texto: "O operon é desmantelado por splicing alternativo citoplasmático." },
        { letra: "E", texto: "Ocorre silenciamento gênico por metilação em citosinas do promotor." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Controle duplo no operon lac: indução pelo substrato (lactose inativa o repressor) e ativação catabólica por carência de glicose (CAP-cAMP estimula a RNA polimerase).",
        porque: "Com lactose presente, o repressor perde afinidade pelo operador. Sem glicose, a adenilato ciclase eleva a concentração de AMPc, que se une à proteína ativadora CAP, atraindo a RNA polimerase para o promotor e gerando transcrição plena das enzimas de consumo de lactose."
      }
    },
    {
      id: "BIO_CIT_13",
      origem: "UNICAMP 2ª Fase",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Mutação Gênica Pontual e Anemia Falciforme",
      tipo: "aberta",
      enunciado: "A anemia falciforme é uma hemoglobinopatia hereditária clássica causada por uma mutação de ponto no gene da cadeia beta da hemoglobina humana, na qual a trinca GAG (que codifica ácido glutâmico polar) é substituída por GTG (que codifica valina apolar). Explique a consequência dessa substituição na estrutura tridimensional da hemoglobina sob baixa tensão de oxigênio e no formato das hemácias nos capilares periféricos.",
      resposta: "Polimerização da hemoglobina em fibras insolúveis e deformação das hemácias em foice (drepanócitos).",
      gabarito: {
        letra: "Aberta",
        ancora: "A valina apolar introduzida na superfície da proteína gera um ponto hidrofóbico que se associa com moléculas vizinhas.",
        espera_se: "Sob baixa concentração de oxigênio, o resíduo de valina apolar causa a polimerização anômala das moléculas de desoxi-hemoglobina S, formando longas fibras helicoidais rígidas insolúveis. Essas fibras distorcem mecanicamente a membrana da hemácia, que perde a flexibilidade bicôncava e adquire o formato de foice (falcização). As hemácias afoiçadas ocluem os capilares sanguíneos (microtrombose e crises vaso-oclusivas dolorosas) e são precocemente destruídas no baço (anemia hemolítica crônica)."
      }
    },
    {
      id: "BIO_CIT_14",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Edição Gênica por CRISPR-Cas9",
      tipo: "aberta",
      enunciado: "O sistema bacteriano CRISPR-Cas9 revolucionou a biologia molecular moderna como uma ferramenta de edição genômica de altíssima precisão. (a) Qual a função natural original do sistema CRISPR nas bactérias? (b) Quais são os dois componentes moleculares essenciais necessários para direcionar e executar o corte na sequência de DNA desejada em laboratório?",
      resposta: "(a) Sistema imunológico adaptativo bacteriano antiviral; (b) RNA-guia (sgRNA) e endonuclease Cas9.",
      gabarito: {
        letra: "Aberta",
        ancora: "O CRISPR é um mecanismo bacteriano de defesa imunológica contra vírus bacteriófagos.",
        espera_se: "(a) Função original: O sistema CRISPR-Cas atua como um sistema imune adaptativo procariótico que armazena fragmentos de DNA de vírus invasores anteriores (espaçadores) e os utiliza para reconhecer e clivar o genoma de novos fagos infectantes.\n(b) Componentes laboratoriais: (1) O RNA guia sintético (sgRNA), cuja sequência de ~20 nucleotídeos é desenhada para hibridizar por pareamento complementar de bases com o local exato do genoma que se quer editar; (2) A enzima endonuclease Cas9, que atua como uma 'tesoura molecular' executando a quebra da dupla fita (DSB) de DNA na posição sinalizada pelo guia."
      }
    },
    {
      id: "BIO_CIT_15",
      origem: "OBB Fase Final / IBO",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Degeneração do Código Genético e Hipótese do Wobble (Oscilação de Crick)",
      tipo: "aberta",
      enunciado: "Existem 61 códons que especificam aminoácidos no código genético, mas a maioria das células possui muito menos de 61 espécies distintas de RNA transportador (RNAt). Explique a Hipótese da Oscilação (Wobble Hypothesis) proposta por Francis Crick para explicar como um mesmo RNAt pode reconhecer múltiplos códons sinônimos na terceira base do códon do RNAm.",
      resposta: "Flexibilidade conformacional no pareamento estéreo da 3ª base do códon com a 1ª base do anticódon (presença de inosina e pareamento não-Watson-Crick).",
      gabarito: {
        letra: "Aberta",
        ancora: "A Hipótese de Crick postula que a terceira posição do códon possui menor restrição geométrica no sítio ribossômico.",
        espera_se: "As duas primeiras bases do códon do RNAm obedecem a pareamentos de Watson-Crick rigorosos com o anticódon do RNAt (A=U e G≡C). Contudo, a terceira base do códon pareia com a primeira base do anticódon (sentido 5' do anticódon) sob menor restrição estérica e espacial, permitindo pareamentos não-canônicos ('oscilação' ou wobble), como G pareando com U, ou a base modificada Inosina (I) pareando com A, U ou C. Isso possibilita que uma única espécie de RNAt decodifique dois ou três códons sinônimos que diferem apenas na terceira letra, economizando recursos biológicos da célula."
      }
    }
  ]
};

// -------------------------------------------------------------
// 3. BIOLOGIA - CADEIAS ALIMENTARES, BIOMAS E DARWINISMO (ECOLOGIA E EVOLUÇÃO)
// -------------------------------------------------------------
const biologiaEcologia = {
  disciplina: "Biologia",
  modulo: "Cadeias_Alimentares_Biomas_e_Darwinismo",
  subpasta: "Ecologia_e_Evolucao",
  arquivo_origem: "Questoes_Cadeias_Alimentares_Biomas_e_Darwinismo.json",
  benchmark_didatico: {
    capitulo: "Ecologia Geral, Biomas Brasileiros e Teoria da Evolução",
    objetivos_aprendizagem: [
      "Compreender os conceitos ecológicos fundamentais: habitat, nicho ecológico, ecótono, população e comunidade.",
      "Analisar as relações ecológicas harmônicas e desarmônicas (intra e interespecíficas) e a dinâmica populacional (curvas de crescimento e capacidade de suporte).",
      "Caracterizar os grandes biomas mundiais e os biomas brasileiros (Amazônia, Cerrado, Caatinga, Mata Atlântica, Pantanal e Pampa) quanto ao clima, solo, fauna e flora.",
      "Compreender os mecanismos evolutivos da Teoria Sintética: mutação, recombinação gênica, seleção natural, deriva genética e especiação (alopátrica e simpátrica)."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Conceitos Ecológicos e Relações Ecológicas",
          definicao: "Habitat é o endereço biológico da espécie; Nicho Ecológico é o papel funcional, hábitos e modo de vida da espécie no ecossistema (Princípio de Gause: duas espécies com nichos rigorosamente idênticos não podem coexistir no mesmo habitat). Relações harmônicas interespecíficas: Mutualismo (+/+, obrigatório), Protocooperação (+/+, facultativo), Comensalismo (+/0) e Inquilinismo (+/0). Relações desarmônicas interespecíficas: Competição (-/-), Predatismo (+/-), Parasitismo (+/-), Amensalismo/Antibiose (-/0) e Esclavagismo (+/-). Relações intraespecíficas: Sociedades e Colônias (harmônicas); Canibalismo e Competição intraespecífica (desarmônicas)."
        },
        {
          termo: "Biomas Brasileiros e Adaptações da Flora",
          definicao: "Amazônia: floresta pluvial tropical latifoliada e estratificada, clima quente e úmido, solo pobre e lixiviado nutrido pela ciclagem da serapilheira. Mata Atlântica: hotspot mundial de alta biodiversidade e endemismo sob ameaça histórica de antropização. Cerrado: savana brasileira de solo ácido e rico em alumínio, árvores tortuosas de casca grossa suberosa, raízes pivotantes profundas para alcançar o lençol freático e ciclo dependente do fogo natural. Caatinga: semiárido, flora xerófita (cactáceas suculentas, folhas reduzidas em espinhos, cutícula cerosa grossa e caducifólia). Pantanal: maior planície inundável continental do planeta. Pampas: pradarias/campos limpos dominados por gramíneas sob clima subtropical com geadas ocasionais."
        },
        {
          termo: "Mecanismos Evolutivos e Especiação",
          definicao: "A Teoria Sintética da Evolução uniu a Seleção Natural de Darwin aos fundamentos genéticos de Mendel. Fatores que introduzem variabilidade: Mutação (fonte primária original) e Recombinação Gênica (meios meióticos). Fatores que atuam sobre a variabilidade: Seleção Natural (direcional, estabilizadora ou disruptiva) e Deriva Genética (mudanças aleatórias nas frequências alélicas, notadamente em populações pequenas por efeito gargalo ou efeito fundador). A especiação alopátrica inicia-se com isolamento geográfico seguido de diferenciação genética adaptativa e culmina com o isolamento reprodutivo."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico em evolução: teleologia e lamarckismo involuntário. Dizer que 'o animal se adaptou para sobreviver' ou 'a bactéria desenvolveu resistência para combater o antibiótico' está errado. O antibiótico não induz a resistência; ele atua como agente de seleção natural eliminando as sensíveis e selecionando aquelas raras cepas que já possuíam mutações prévias de resistência."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Teorema de Hardy-Weinberg em População Genética",
      enunciado: "Em uma população em equilíbrio genético de Hardy-Weinberg de 10.000 indivíduos, 16% manifestam um fenótipo recessivo determinado por um par de alelos autossômicos (genótipo aa). Calcule: (a) a frequência do alelo recessivo q e do alelo dominante p; (b) o número de indivíduos heterozigotos (Aa) esperado nessa população.",
      resolucao_passo_a_passo: "1. Frequência dos indivíduos homozigotos recessivos: q² = 16% = 0,16.\n2. Frequência alélica recessiva (q): q = √0,16 = 0,4 (40%).\n3. Frequência alélica dominante (p): Como p + q = 1 => p = 1 - 0,4 = 0,6 (60%).\n4. Frequência de heterozigotos (2pq): 2pq = 2 · 0,6 · 0,4 = 0,48 (48%).\n5. Número de indivíduos heterozigotos na população: N = 0,48 · 10.000 = 4.800 indivíduos heterozigotos."
    }
  },
  questoes: [
    {
      id: "BIO_ECO_01",
      origem: "ENEM",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 1,
      dificuldade_rotulo: "Fácil",
      topico: "Ciclo do Nitrogênio e Leguminosas",
      tipo: "fechada",
      enunciado: "Agricultores costumam realizar a rotação de culturas intercalando o plantio de milho com o de leguminosas (como feijão e soja) ou adubação verde. Essa prática enriquece o solo naturalmente com compostos nitrogenados devido à:",
      alternativas: [
        { letra: "A", texto: "Associação mutualística nas raízes das leguminosas com bactérias fixadoras do gênero Rhizobium, que convertem o N₂ atmosférico em amônia assimilável." },
        { letra: "B", texto: "Capacidade das folhas das leguminosas de absorver nitrato diretamente da chuva ácida." },
        { letra: "C", texto: "Ação de fungos patogênicos que desnitrificam o solo enriquecendo-o em oxigênio." },
        { letra: "D", texto: "Produção de urina nitrogenada pelos tecidos foliares das plantas." },
        { letra: "E", texto: "Eliminação espontânea de insetos pragas por compostos fosfatados." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Bactérias simbióticas Rhizobium alojadas nos nódulos radiculares de leguminosas fixam biologicamente o N₂ gasoso atmosférico.",
        porque: "O nitrogênio molecular (N₂) não é assimilável pela maioria das plantas. As bactérias convertem o N₂ em íons amônio/nitrato que nutrem a planta hospedeira, deixando o solo enriquecido após a colheita ou incorporação da biomassa vegetal."
      }
    },
    {
      id: "BIO_ECO_02",
      origem: "FUVEST",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Princípio da Exclusão Competitiva de Gause",
      tipo: "fechada",
      enunciado: "O biólogo russo G. F. Gause cultivou duas espécies de protozoários ciliados (Paramecium aurelia e Paramecium caudatum) em tubos de ensaio. Quando cultivadas isoladamente com suprimento diário constante de bactérias, ambas cresciam bem. Quando colocadas juntas no mesmo tubo com a mesma fonte alimentar, P. aurelia proliferou enquanto P. caudatum entrou em declínio até a extinção local. Esse experimento ilustra classicamente:",
      alternativas: [
        { letra: "A", texto: "O Princípio da Exclusão Competitiva, demonstrando que espécies com nichos ecológicos idênticos não podem coexistir estavelmente no mesmo habitat." },
        { letra: "B", texto: "Uma relação de mutualismo obrigatório que falhou por falta de espaço." },
        { letra: "C", texto: "A predação direta de P. aurelia sobre P. caudatum." },
        { letra: "D", texto: "A sucessão ecológica primária em meio aquático." },
        { letra: "E", texto: "O comensalismo metabólico entre micro-organismos aquáticos." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Se duas espécies competem pelo mesmo recurso limitante no mesmo nicho ecológico, a mais eficiente levará a outra à exclusão competitiva ou à diferenciação de nicho.",
        porque: "P. aurelia tinha taxa intrínseca de crescimento ligeiramente maior e capturava alimento mais rapidamente, privando P. caudatum de nutrientes até seu completo desaparecimento."
      }
    },
    {
      id: "BIO_ECO_03",
      origem: "UNICAMP",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Bioma Cerrado e Adaptações ao Fogo",
      tipo: "fechada",
      enunciado: "O Cerrado brasileiro é considerado uma savana tropical adaptada a queimadas naturais periódicas decorrentes de descargas atmosféricas no final da estação seca. A vegetação lenhosa do bioma possui adaptações morfofisiológicas contra o fogo, tais como:",
      alternativas: [
        { letra: "A", texto: "Gemas apicais protegidas por densa pilosidade, troncos com casca espessa de cortiça (súber isolante térmico) e raízes subterrâneas profundas com órgãos de reserva (xilopódios)." },
        { letra: "B", texto: "Folhas gigantescas e delgadas que transpiram intensamente para apagar as chamas." },
        { letra: "C", texto: "Casca fina e transparente que queima com facilidade acelerando a combustão." },
        { letra: "D", texto: "Raízes exclusivamente tabulares e aéreas sobre o solo." },
        { letra: "E", texto: "Ausência total de sementes dormentes no estrato do solo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A cortiça espessa protege os tecidos condutores vivos de câmbio vascular contra o calor fulgaz da queima superficial das gramíneas.",
        porque: "Os xilopódios e raízes profundas armazenam amido e água, permitindo uma rebrota vigorosa poucos dias após a passagem do fogo natural."
      }
    },
    {
      id: "BIO_ECO_04",
      origem: "UERJ",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Eutrofização Cultural de Ambientes Aquáticos",
      tipo: "fechada",
      enunciado: "O despejo descontrolado de esgoto doméstico não tratado em lagoas urbanas deflagra o processo de eutrofização cultural. A sequência cronológica correta dos eventos ecológicos que culmina na mortandade em massa de peixes é:",
      alternativas: [
        { letra: "A", texto: "Aumento de nutrientes (N e P) → proliferação exponencial de algas superficiais ('bloom') → bloqueio da luz solar → morte da vegetação submersa → explosão de bactérias decompositoras aeróbias → esgotamento do oxigênio dissolvido (anóxia) → asfixia dos peixes." },
        { letra: "B", texto: "Morte imediata das algas por toxicidade → aumento súbito do oxigênio → superpopulação de peixes herbívoros." },
        { letra: "C", texto: "Bloqueio do CO₂ atmosférico → acidificação instantânea do leito → congelamento do espelho d'água." },
        { letra: "D", texto: "Aumento de oxigênio pelas algas superficiais → envenenamento gasoso dos peixes." },
        { letra: "E", texto: "Consumo direto de fezes humanas pelos peixes levando à obesidade letal." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O excesso de fósforo e nitrogênio causa o florescimento de algas; ao morrerem, a decomposição aeróbia massiva consome todo o oxigênio dissolvido na água.",
        porque: "A queda drástica da concentração de oxigênio dissolvido (OD) gera anóxia aquática generalizada, asfixiando os peixes e favorecendo a decomposição anaeróbia que produz gases fétidos (como sulfeto de hidrogênio e metano)."
      }
    },
    {
      id: "BIO_ECO_05",
      origem: "UNESP",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Espécies Exóticas Invasoras",
      tipo: "fechada",
      enunciado: "O mexilhão-dourado (Limnoperna fortunei), molusco bivalve nativo da Ásia introduzido acidentalmente na bacia do Rio da Prata pela água de lastro de navios de carga, proliferou descontroladamente nos rios brasileiros. Sua proliferação massiva como espécie exótica invasora decorre principalmente da:",
      alternativas: [
        { letra: "A", texto: "Ausência de predadores naturais e parasitas específicos no novo habitat, associada a alta taxa de fecundidade e ampla tolerância ambiental." },
        { letra: "B", texto: "Incapacidade de se fixar em superfícies rígidas como turbinas hidrelétricas." },
        { letra: "C", texto: "Alimentação exclusiva de peixes carnívoros de grande porte." },
        { letra: "D", texto: "Mutação que o tornou um animal fotossintetizante." },
        { letra: "E", texto: "Interrupção do ciclo reprodutivo na estação das cheias." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Espécies exóticas tornam-se invasoras quando encontram nicho favorável desprovido de predadores e competidores eficientes (liberação de inimigos naturais).",
        porque: "Sem controle populacional biológico, o mexilhão-dourado compete agressivamente com espécies nativas de moluscos e causa sérios prejuízos econômicos ao entupir tubulações de captação de usinas hidrelétricas."
      }
    },
    {
      id: "BIO_ECO_06",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Seleção Natural vs Resistência a Antibióticos",
      tipo: "fechada",
      enunciado: "O uso indiscriminado e frequente de antibióticos para tratar infecções bacterianas leves contribui para o surgimento das chamadas 'superbactérias' multirresistentes em ambientes hospitalares. A explicação biológica correta para esse fenômeno à luz do neodarwinismo é que:",
      alternativas: [
        { letra: "A", texto: "O antibiótico atua como um agente seletivo, eliminando as bactérias sensíveis e selecionando os raros indivíduos que já possuíam mutações prévias de resistência, que sobrevivem e proliferam." },
        { letra: "B", texto: "As bactérias aprendem a degradar o antibiótico em resposta ao contato com a droga e transmitem essa nova habilidade adquirida aos descendentes." },
        { letra: "C", texto: "O antibiótico induz mutações genéticas direcionadas para tornar as bactérias imunes." },
        { letra: "D", texto: "O fármaco enfraquece o sistema imune tornando os vírus mais perigosos." },
        { letra: "E", texto: "As bactérias se fundem formando organismos multicelulares imunes." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A resistência resulta de seleção natural de variações preexistentes na população bacteriana.",
        porque: "Mutações aleatórias ou transferência horizontal de plasmídeos de resistência (plasmídeos R) ocorrem espontaneamente. O antibiótico remove a concorrência das bactérias sensíveis, permitindo que a linhagem resistente ocupe o espaço ecológico deixado vago."
      }
    },
    {
      id: "BIO_ECO_07",
      origem: "FUVEST",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Tipos de Seleção Natural: Estabilizadora, Direcional e Disruptiva",
      tipo: "fechada",
      enunciado: "Em uma espécie de ave canora que habita uma ilha, os indivíduos com bicos intermediários têm dificuldade em quebrar sementes muito duras (consumidas por aves de bicos muito robustos) e também não conseguem capturar insetos em frestas estreitas (capturados com facilidade por aves de bicos muito finos). Com o passar do tempo, a distribuição fenotípica bimodal dessa população é um clássico exemplo de seleção:",
      alternativas: [
        { letra: "A", texto: "Disruptiva (ou diversificadora), que favorece ambos os extremos fenotípicos em detrimento dos fenótipos intermediários." },
        { letra: "B", texto: "Estabilizadora, que favorece a média e elimina os extremos." },
        { letra: "C", texto: "Direcional, que favorece apenas um único extremo da curva." },
        { letra: "D", texto: "Sexual intersexual por escolha de plumagem." },
        { letra: "E", texto: "Artificial guiada por intervenção agronômica." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A seleção disruptiva divide a população em duas subpopulações morfológicas distintas, podendo pavimentar o caminho para a especiação simpátrica.",
        porque: "Quando os fenótipos médios/intermediários possuem menor aptidão biológica (fitness) do que os fenótipos extremos de bico fino e bico grosso, a curva de densidade populacional original unimodal transforma-se em bimodal."
      }
    },
    {
      id: "BIO_ECO_08",
      origem: "EsPCEx",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Especiação Alopátrica e Mecanismos de Isolamento",
      tipo: "fechada",
      enunciado: "O surgimento de novas espécies a partir de uma população ancestral única pode ocorrer por diferentes vias. No modelo clássico de especiação alopátrica, a sequência necessária e fundamental de etapas biológicas é:",
      alternativas: [
        { letra: "A", texto: "Isolamento geográfico → interrupção do fluxo gênico → acúmulo de mutações e pressões seletivas diferenciais → isolamento reprodutivo." },
        { letra: "B", texto: "Isolamento reprodutivo súbito → migração forçada → isolamento geográfico." },
        { letra: "C", texto: "Cruzamentos aleatórios livres → fusão gênica → extinção em massa de uma subespécie." },
        { letra: "D", texto: "Polipoidia em plantas cultivadas no mesmo canteiro sem barreiras físicas." },
        { letra: "E", texto: "Deriva genética eliminando todos os indivíduos dominantes em habitat contínuo." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O isolamento geográfico (rio, cordilheira, fragmentação florestal) impede o fluxo gênico, permitindo que as duas populações acumulem divergências genéticas até que o cruzamento fértil entre elas não seja mais viável.",
        porque: "O isolamento reprodutivo (pré-zigótico ou pós-zigótico) é o marco definitivo de que as duas populações tornaram-se espécies biológicas distintas segundo o conceito de Ernst Mayr."
      }
    },
    {
      id: "BIO_ECO_09",
      origem: "AFA",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Deriva Genética: Efeito Fundador e Gargalo Populacional",
      tipo: "fechada",
      enunciado: "O guepardo africano (Acinonyx jubatus) apresenta altíssima uniformidade genética entre seus indivíduos atuais, com taxa de rejeição de enxertos de pele praticamente nula entre animais não-aparentados e alta incidência de espermatozoides anormais. Esse quadro ecológico-evolutivo foi provocado historicamente por:",
      alternativas: [
        { letra: "A", texto: "Um severo efeito gargalo populacional durante o final da última era glacial, que reduziu drasticamente o tamanho efetivo da população aumentando a homozigose por endogamia." },
        { letra: "B", texto: "Seleção natural disruptiva contínua em savana aberta." },
        { letra: "C", texto: "Superalimentação por presas altamente ricas em mutagênicos." },
        { letra: "D", texto: "Fluxo gênico irrestrito com outras espécies de grandes felinos como leões." },
        { letra: "E", texto: "Hibridação artificial produzida pelo homem no século XIX." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O efeito gargalo (bottleneck effect) é uma forma dramática de deriva genética que reduz bruscamente a variabilidade alélica por catástrofes ou declínio demográfico.",
        porque: "A população sobreviveu a partir de um punhado reduzido de indivíduos reprodutores, fixando alelos por consanguinidade e perdendo a diversidade genética protetora contra patógenos."
      }
    },
    {
      id: "BIO_ECO_10",
      origem: "ENEM",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 2,
      dificuldade_rotulo: "Média",
      topico: "Efeito Estufa e Aquecimento Global",
      tipo: "fechada",
      enunciado: "O efeito estufa é um fenômeno natural benéfico que retém calor na baixa atmosfera mantendo a Terra em temperatura propícia à vida. No entanto, sua intensificação antrópica decorre da queima em larga escala de combustíveis fósseis e desmatamento, liberando na atmosfera gases que absorvem fortemente a radiação:",
      alternativas: [
        { letra: "A", texto: "Infravermelha (térmica) reemitida pela superfície do planeta." },
        { letra: "B", texto: "Ultravioleta direta emitida pelas tempestades solares." },
        { letra: "C", texto: "Gama cósmica que destrói o ozônio estratosférico." },
        { letra: "D", texto: "Luminosa visível convertendo-a em raios X." },
        { letra: "E", texto: "Ondas de rádio terrestres de telecomunicações." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A superfície da Terra absorve luz solar de ondas curtas e reirradia energia térmica na forma de radiação infravermelha de ondas longas.",
        porque: "Gases de efeito estufa (CO₂, CH₄, N₂O, vapor de água) possuem modos vibracionais que aprisionam essa radiação infravermelha, reirradiando parte dela de volta ao solo e aumentando o forçamento radiativo global."
      }
    },
    {
      id: "BIO_ECO_11",
      origem: "OBB Fase Nacional",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Teoria da Seleção de Parentesco e Regra de Hamilton",
      tipo: "fechada",
      enunciado: "Em insetos eussociais da ordem Hymenoptera (formigas, abelhas e vespas), as operárias estéreis abrem mão da sua própria reprodução direta para cuidar das crias de sua mãe (a rainha). De acordo com a Regra de Hamilton para a evolução do comportamento altruísta (r · B > C), esse comportamento altruísta é favorecido porque:",
      alternativas: [
        { letra: "A", texto: "Devido ao sistema haploide-diploide de determinação sexual, as irmãs operárias compartilham um coeficiente de parentesco genético (r = 0,75) maior do que compartilhariam com suas próprias filhas (r = 0,50)." },
        { letra: "B", texto: "As operárias são geneticamente idênticas à rainha (r = 1,00)." },
        { letra: "C", texto: "O benefício do altruísmo anula totalmente os custos biológicos das operárias." },
        { letra: "D", texto: "Os machos zangões possuem dois pares de cromossomos homólogos." },
        { letra: "E", texto: "As operárias não possuem DNA nuclear próprio." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Na haplodiploidia: machos nascem de óvulos não fertilizados (haploides, n) e fêmeas de ovos fertilizados (diploides, 2n).",
        porque: "As irmãs herdam exatamente 100% dos genes do pai e 50% dos genes da mãe: r = (0,5 × 1,0) + (0,5 × 0,5) = 0,5 + 0,25 = 0,75 (75% de parentesco compartilhado entre si). Ao cuidar de suas irmãs reprodutoras, a operária propaga mais de seus próprios genes indiretamente (aptidão inclusiva) do que se tivesse filhas diretas (50%)."
      }
    },
    {
      id: "BIO_ECO_12",
      origem: "ITA / IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Homologia vs Analogia e Convergência Evolutiva",
      tipo: "fechada",
      enunciado: "A asa de um morcego (mamífero) e a asa de uma ave apresentam a mesma organização óssea interna (úmero, rádio, ulna, carpos e falanges herdados de um ancestral comum tetrápode), configurando órgãos homólogos. Já a asa de uma borboleta (inseto artrópode) e a asa de uma ave desempenham a mesma função de voo, mas possuem origens embrionárias e anatômicas totalmente distintas, configurando órgãos análogos resultantes de:",
      alternativas: [
        { letra: "A", texto: "Convergência evolutiva (ou evolução convergente), gerada por pressões seletivas similares em ambientes análogos." },
        { letra: "B", texto: "Irradiação adaptativa divergente a partir de um mesmo ancestral imediato." },
        { letra: "C", texto: "Deriva genética catastrófica que fundiu genes de insetos e aves." },
        { letra: "D", texto: "Evolução reticulada por transferência horizontal de cromossomos." },
        { letra: "E", texto: "Seleção estabilizadora em populações consanguíneas fechadas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Órgãos análogos possuem mesma função mas origens evolutivas distintas; órgãos homólogos compartilham a mesma origem evolutiva ancestral.",
        porque: "A convergência evolutiva modela estruturas morfologicamente semelhantes em linhagens filogeneticamente distantes que enfrentam o mesmo desafio adaptativo físico (como a locomoção aérea ou a hidrodinâmica em golfinhos e tubarões)."
      }
    },
    {
      id: "BIO_ECO_13",
      origem: "UNICAMP 2ª Fase",
      ano_escolar: "2º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Sucessão Ecológica Primária e Comunidade Clímax",
      tipo: "aberta",
      enunciado: "Após a erupção de um vulcão submarino que forma uma nova ilha estéril de rocha basáltica nua, inicia-se um processo de sucessão ecológica primária. Descreva: (a) Quais são os primeiros organismos pioneiros a colonizar a rocha e qual o seu papel ecológico na formação do solo? (b) O que acontece com a biomassa total, a biodiversidade de espécies e a taxa de respiração da comunidade (R) em relação à produtividade primária bruta (P) ao longo do tempo até atingir o estágio clímax?",
      resposta: "(a) Liquens e musgos pioneiros intemperizam a rocha e acumulam matéria orgânica; (b) Biomassa, biodiversidade e complexidade das teias aumentam; no clímax, P/R ≈ 1.",
      gabarito: {
        letra: "Aberta",
        ancora: "Sucessão primária em substrato inorgânico desprovido de vida preexistente.",
        espera_se: "(a) Organismos pioneiros: Liquens (associação simbiótica entre fungo e alga/cianobactéria) e briófitas. Eles secretam ácidos orgânicos que intemperizam quimicamente a rocha matriz, acelerando a pedogênese e retendo poeira e umidade, criando a primeira camada de solo fértil para que pteridófitas e gramíneas possam se estabelecer.\n(b) Evolução dos parâmetros ecológicos: Ao longo das fases serais até o clímax, a biomassa total aumenta exponencialmente, a diversidade de espécies e a estabilidade da teia trófica crescem. Nos estágios iniciais, a produtividade primária bruta supera em muito a respiração (P/R > 1, acumulação líquida de biomassa). No clímax, quase toda a matéria orgânica produzida pela fotossíntese é consumida pela respiração celular da comunidade (P/R ≈ 1 e produtividade líquida próxima de zero)."
      }
    },
    {
      id: "BIO_ECO_14",
      origem: "FUVEST 2ª Fase",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 3,
      dificuldade_rotulo: "Difícil",
      topico: "Curvas de Crescimento Populacional e Capacidade de Carga",
      tipo: "aberta",
      enunciado: "O crescimento real de uma população natural em um ambiente finito é descrito por uma curva logística sigmoide (curva em S), que difere da curva teórica exponencial (curva em J do potencial biótico). (a) Defina o conceito ecológico de 'capacidade de suporte' (ou capacidade de carga do meio, K). (b) Cite três fatores bióticos ou abióticos que compõem a resistência ambiental e impedem o crescimento exponencial indefinido da população.",
      resposta: "(a) Capacidade de carga K é o número máximo sustentável de indivíduos suportado pelos recursos do meio; (b) Competição por alimento/espaço, predação, parasitismo/epidemias e acúmulo de dejetos.",
      gabarito: {
        letra: "Aberta",
        ancora: "A resistência do meio modula o potencial biótico transformando o crescimento exponencial em curva sigmoide estabilizada em torno de K.",
        espera_se: "(a) Capacidade de suporte (K): É o limite populacional máximo que um determinado ecossistema consegue sustentar de forma contínua e estável, dado o suprimento limitado de recursos essenciais (alimento, água, abrigo e território).\n(b) Fatores de resistência ambiental: (1) Escassez de alimento e aumento da competição intraespecífica e interespecífica; (2) Aumento da pressão de predação e parasitismo favorecido pelo adensamento demográfico populacional; (3) Acúmulo de resíduos metabólicos tóxicos ou falta de espaço físico para nidificação/reprodução."
      }
    },
    {
      id: "BIO_ECO_15",
      origem: "OBB Fase Final / IBO",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Biogeografia de Ilhas de MacArthur e Wilson",
      tipo: "aberta",
      enunciado: "A Teoria da Biogeografia de Ilhas de Robert MacArthur e E. O. Wilson estabelece que a riqueza de espécies em equilíbrio dinâmico numa ilha depende de duas variáveis fundamentais: a distância da ilha em relação ao continente e a área superficial da ilha. Explique detalhadamente: (a) De que modo a distância da ilha ao continente afeta a taxa de imigração/colonização; (b) De que modo o tamanho da ilha afeta a taxa de extinção de espécies; (c) Qual tipo de ilha terá a maior riqueza em equilíbrio de espécies: uma ilha grande e próxima ou uma ilha pequena e distante?",
      resposta: "(a) Ilhas mais próximas têm maior taxa de imigração; (b) Ilhas maiores têm populações maiores e menor taxa de extinção; (c) Uma ilha grande e próxima abriga o maior número de espécies.",
      gabarito: {
        letra: "Aberta",
        ancora: "Modelo de equilíbrio dinâmico da biogeografia insular entre imigração de novas espécies e extinção das residentes.",
        espera_se: "(a) Taxa de imigração: É inversamente proporcional à distância do continente fonte. Ilhas próximas recebem um fluxo contínuo e volumoso de propágulos, esporos e animais dispersores, apresentando curva de imigração muito mais alta do que ilhas isoladas distantes.\n(b) Taxa de extinção: É inversamente proporcional à área da ilha. Ilhas maiores abrigam maior diversidade de habitats, maiores recursos e sustentam populações numericamente robustas, tornando-as muito menos vulneráveis a flutuações demográficas estocásticas e extinções locais do que ilhas diminutas.\n(c) Conclusão: Uma ilha Grande e Próxima do continente apresentará o ponto de equilíbrio dinâmico mais elevado, sustentando a maior riqueza global de espécies da biosfera insular (princípio basilar para o desenho moderno de Unidades de Conservação e corredores ecológicos)."
      }
    }
  ]
};

// -------------------------------------------------------------
// 4. BIOLOGIA - MILITARES E OLIMPÍADAS (OBB, FUVEST, ENEM, IME/ITA)
// -------------------------------------------------------------
const biologiaMilitares = {
  disciplina: "Biologia",
  modulo: "Biologia_OBB_FUVEST_ENEM_IME_ITA",
  subpasta: "Militares_e_Olimpiadas",
  arquivo_origem: "Questoes_Biologia_OBB_FUVEST_ENEM_IME_ITA.json",
  benchmark_didatico: {
    capitulo: "Biologia Avançada: Bioquímica Estrutural, Sinalização Celular, Fisiologia Comparada e Evolução Molecular",
    objetivos_aprendizagem: [
      "Compreender a cinética enzimática de Michaelis-Menten e os mecanismos de inibição reversível (competitiva, não-competitiva e incompetitiva) e alosterismo.",
      "Analisar as vias de transdução de sinal intracelular (receptores acoplados à proteína G, tirosina-quinases e segundos mensageiros como AMPc, IP3 e Ca²⁺).",
      "Examinar a evolução comparada dos sistemas circulatório, respiratório e excretor nos vertebrados (peixes, anfíbios, répteis, aves e mamíferos).",
      "Aplicar conceitos de filogenia cladística (grupos monofiléticos, parafiléticos e polifiléticos; sinapomorfias e plesiomorfias) e biologia do desenvolvimento embrionário."
    ],
    resumo_teorico: {
      conceitos_chave: [
        {
          termo: "Cinética Enzimática e Vias de Transdução de Sinal",
          definicao: "A equação de Michaelis-Menten v = (Vmax · [S]) / (Km + [S]) modela a catálise. A constante de Michaelis Km é a concentração de substrato na qual a velocidade é metade de Vmax (inversamente proporcional à afinidade da enzima pelo substrato). Na inibição competitiva: o inibidor disputa o sítio ativo, aumentando o Km aparente sem alterar Vmax. Na inibição não-competitiva pura: o inibidor liga-se a sítio alostérico, diminuindo Vmax sem alterar Km. Na transdução de sinal: receptores acoplados à proteína G ativam a adenilato ciclase (que sintetiza AMPc ativando a PKA) ou a fosfolipase C (que cliva PIP2 em IP3 e DAG, liberando Ca²⁺ do retículo endoplasmático)."
        },
        {
          termo: "Fisiologia e Anatomia Comparada dos Cordados",
          definicao: "Circulação: Peixes (simples e completa, coração com 1 átrio e 1 ventrículo por onde passa apenas sangue venoso); Anfíbios (dupla e incompleta, coração tricameral com 2 átrios e 1 ventrículo com mistura parcial de sangue); Répteis não-crocodilianos (coração tricameral com septo interventricular incompleto de Sabatier); Aves e Mamíferos (dupla e completa, coração tetracameral com septo completo sem mistura, arco aórtico curvado para a direita em aves e para a esquerda em mamíferos). Excreção: Amônia (animais aquáticos amoniotélicos, altamente tóxica e solúvel); Ureia (mamíferos e anfíbios adultos ureotélicos, toxicidade intermediária); Ácido Úrico (répteis, aves e insetos uricotélicos, quase insolúvel, ideal para economia hídrica e desenvolvimento em ovo amniótico cleidoico)."
        },
        {
          termo: "Cladística Filogenética e Sistemática Moderna",
          definicao: "A sistemática filogenética (Hennig) classifica os táxons estritamente por ancestralidade comum. Um grupo Monofilético (clado verdadeiro) inclui o ancestral comum mais recente e TODOS os seus descendentes. Um grupo Parafilético inclui o ancestral comum mas exclui alguns descendentes (ex.: o agrupamento tradicional de 'Répteis' sem incluir as Aves). Um grupo Polifilético reúne organismos com origens evolutivas independentes sem incluir seu ancestral comum imediato. Sinapomorfia é uma novidade evolutiva compartilhada derivada que diagnostica e sustenta um clado monofilético."
        }
      ],
      atencao_ponto_cego: "Ponto cego clássico em cladística de olimpíadas: considerar aves e dinossauros como classes separadas. Pela filogenia moderna, as aves são dinossauros terópodes bípedes viventes; portanto, 'Reptilia' só é monofilético se incluir a classe Aves."
    },
    exemplo_resolvido: {
      titulo: "Exemplo Resolvido: Gráfico de Lineweaver-Burk e Inibição Enzimática",
      enunciado: "Em um ensaio enzimático, a reação na ausência de inibidor apresenta intercepto no eixo das ordenadas (1/V) igual a 0,05 (μmol/min)⁻¹ e intercepto no eixo das abscissas (1/[S]) igual a -0,2 mM⁻¹. Na presença de uma substância X, o intercepto no eixo 1/V permanece rigorosamente em 0,05 (μmol/min)⁻¹, mas o intercepto no eixo 1/[S] desloca-se para -0,05 mM⁻¹. Identifique o tipo de inibição promovido pela substância X e calcule os valores de Vmax e Km na presença do inibidor.",
      resolucao_passo_a_passo: "1. No gráfico de Lineweaver-Burk (duplo-recíproco):\n- O intercepto em y fornece 1 / Vmax.\n- O intercepto em x fornece -1 / Km.\n2. Como o intercepto no eixo y não se alterou com a adição de X (permaneceu 0,05), a velocidade máxima não sofreu alteração: 1 / Vmax = 0,05 => Vmax = 1 / 0,05 = 20 μmol/min.\n3. Como o intercepto em x deslocou-se de -0,2 para -0,05 (aproximou-se do zero):\n- Km inicial = -1 / (-0,2) = 5 mM.\n- Km aparente com inibidor = -1 / (-0,05) = 20 mM (o Km quadruplicou, indicando perda aparente de afinidade).\n4. Conclusão: Uma inibição que eleva o Km aparente sem alterar a Vmax é por definição uma Inibição Competitiva clássica (onde o inibidor pode ser superado aumentando-se saturantemente a concentração de substrato)."
    }
  },
  questoes: [
    {
      id: "BIO_MIL_01",
      origem: "OBB Fase Nacional",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Cinética Enzimática e Inibição Alostérica",
      tipo: "fechada",
      enunciado: "Um inibidor não-competitivo clássico (puro) que se liga com igual afinidade tanto à enzima livre quanto ao complexo enzima-substrato (E-S) em um sítio alostérico distinto do sítio catalítico produz qual efeito sobre os parâmetros cinéticos de Michaelis-Menten?",
      alternativas: [
        { letra: "A", texto: "Diminui a velocidade máxima Vmax sem alterar a constante Km." },
        { letra: "B", texto: "Aumenta o valor de Km sem alterar Vmax." },
        { letra: "C", texto: "Diminui tanto Vmax quanto Km na mesma proporção." },
        { letra: "D", texto: "Aumenta Vmax e diminui Km simultaneamente." },
        { letra: "E", texto: "Converte a curva hiperbólica em sigmoide sem alterar nenhum parâmetro." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Inibidores não-competitivos não disputam o sítio ativo com o substrato, inativando uma fração das enzimas funcionais.",
        porque: "Como o inibidor não afeta a ligação do substrato ao sítio ativo, o Km permanece invariável. No entanto, reduz a capacidade turnover do complexo catalítico, provocando redução inescapável da Vmax teórica mesmo com excesso saturante de substrato."
      }
    },
    {
      id: "BIO_MIL_02",
      origem: "FUVEST 2ª Fase / Medicina",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Embriologia Comparada e Destino do Blastóporo",
      tipo: "fechada",
      enunciado: "No desenvolvimento embrionário animal, os animais triblásticos dividem-se em protostômios e deuterostômios com base no destino ontogenético do blastóporo formado durante a gastrulação. São exemplos de filos de animais deuterostômios:",
      alternativas: [
        { letra: "A", texto: "Equinodermos (estrelas-do-mar) e Cordados (humanos)." },
        { letra: "B", texto: "Artrópodes (insetos) e Moluscos (polvos)." },
        { letra: "C", texto: "Anelídeos (minhocas) e Nematódeos (lombrigas)." },
        { letra: "D", texto: "Cnidários (águas-vivas) e Platelmintos (tênias)." },
        { letra: "E", texto: "Poríferos (esponjas) e Artrópodes." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Em deuterostômios, o blastóporo origina o ânus, e a boca forma-se secundariamente na extremidade oposta.",
        porque: "Equinodermos e Cordados compartilham essa sinapomorfia ontogenética profunda de desenvolvimento embrionário (deuterostomia e clivagem radial indeterminada), comprovando seu parentesco filogenético basal próximo."
      }
    },
    {
      id: "BIO_MIL_03",
      origem: "OBB Fase Seletiva Internacional",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Sinalização Celular e Proteína G heterotrimérica",
      tipo: "fechada",
      enunciado: "A toxina colérica produzida pela bactéria Vibrio cholerae modifica covalentemente a subunidade alfa da proteína G estimuladora (Gs) por ADP-ribosilação, impedindo a sua atividade intrínseca de hidrólise de GTP em GDP. O efeito intracelular dessa toxina nos enterócitos intestinais é:",
      alternativas: [
        { letra: "A", texto: "Manter a adenilato ciclase permanentemente ativada, gerando acúmulo massivo de AMPc que estimula a saída maciça de cloreto e água para a luz intestinal (diarreia secretória profusa)." },
        { letra: "B", texto: "Bloquear totalmente a síntese de AMPc inibindo a permeabilidade celular." },
        { letra: "C", texto: "Inibir os canais de sódio gerando retenção hídrica generalizada." },
        { letra: "D", texto: "Degradar os ribossomos impedindo a tradução de enzimas digestivas." },
        { letra: "E", texto: "Despolarizar a membrana plasmática por influxo contínuo de potássio." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A proteína Gs-alfa ligada a GTP permanece em estado ativo contínuo incapaz de se 'desligar'.",
        porque: "Essa hiperativação crônica da adenilato ciclase satura os níveis de AMP cíclico (AMPc), hiperfosforilando os canais CFTR de cloro via PKA. O cloreto é ejetado massivamente na luz intestinal acompanhado osmoticamente por íons sódio e enormes volumes de água, gerando desidratação letal em poucas horas se não for tratada."
      }
    },
    {
      id: "BIO_MIL_04",
      origem: "ITA / IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Cladística e Grupos Parafiléticos",
      tipo: "fechada",
      enunciado: "Na sistemática filogenética de Willi Hennig, a classificação zoológica tradicional que agrupava jacarés, tartarugas, cobras e lagartos na classe 'Reptilia', excluindo as aves (classe 'Aves'), é formalmente rejeitada porque o táxon 'Reptilia' assim delimitado constitui um grupo:",
      alternativas: [
        { letra: "A", texto: "Parafilético, pois não inclui todos os descendentes do ancestral comum amniota mais recente (as aves descendem diretamente dos dinossauros terópodes)." },
        { letra: "B", texto: "Polifilético, pois agrupa animais que não possuem ancestral comum celular." },
        { letra: "C", texto: "Monofilético estrito com caracteres análogos." },
        { letra: "D", texto: "Artificial baseado exclusivamente em convergência de asas." },
        { letra: "E", texto: "Homoplásico sem qualquer sustentação genética." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Um grupo é parafilético quando engloba o ancestral comum mas exclui intencionalmente um ou mais ramos descendentes.",
        porque: "Os crocodilianos são filogeneticamente mais aparentados com as aves (ambos formam o clado monofilético Archosauria) do que com tartarugas ou lagartos. Excluir as aves torna o grupo 'répteis tradicional' parafilético."
      }
    },
    {
      id: "BIO_MIL_05",
      origem: "OBB Fase Nacional",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Fisiologia Renal: Sistema Renina-Angiotensina-Aldosterona (SRAA)",
      tipo: "fechada",
      enunciado: "Em situações de hemorragia aguda com queda acentuada da pressão arterial média e do fluxo renal, o aparelho justaglomerular nos rins detecta a hipoperfusão e deflagra uma cascata hormonal compensatória. A sequência correta de ativação hormonal do eixo SRAA é:",
      alternativas: [
        { letra: "A", texto: "Secreção de renina pelos rins → clivagem de angiotensinogênio hepático em angiotensina I → conversão em angiotensina II pela ECA pulmonar → secreção de aldosterona pelo córtex adrenal (promovendo reabsorção de Na⁺ e água e vasoconstrição)." },
        { letra: "B", texto: "Secreção de aldosterona pelos rins → clivagem de renina em angiotensina II." },
        { letra: "C", texto: "Liberação de peptídeo natriurético atrial → bloqueio da vasopressina no fígado." },
        { letra: "D", texto: "Secreção direta de angiotensina II pela medula da adrenal sem enzimas pulmonares." },
        { letra: "E", texto: "Conversão de aldosterona em cortisol para retenção imediata de potássio." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O eixo SRAA é o principal regulador sistêmico a médio prazo do volume plasmático e da pressão hidrostática arterial.",
        porque: "A angiotensina II é um potente vasoconstritor arteriolar e estimula a aldosterona nas adrenais (que poupa sódio e água nos túbulos coletores) e o ADH no hipotálamo, restaurando a volemia e a pressão arterial normal."
      }
    },
    {
      id: "BIO_MIL_06",
      origem: "FUVEST 2ª Fase / Medicina",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Potencial de Ação Neuronal e Canais Iônicos Voltagem-Dependentes",
      tipo: "fechada",
      enunciado: "Durante o disparo de um potencial de ação ao longo do axônio de um neurônio motor, a fase de despolarização abrupta e a subsequente fase de repolarização ocorrem, respectivamente, devido à:",
      alternativas: [
        { letra: "A", texto: "Abertura rápida de canais de sódio (Na⁺) voltagem-dependentes com influxo de Na⁺; e fechamento dos canais de Na⁺ com abertura de canais de potássio (K⁺) voltagem-dependentes com efluxo de K⁺." },
        { letra: "B", texto: "Ativação exclusiva da bomba de sódio e potássio consumindo ATP em alta velocidade." },
        { letra: "C", texto: "Entrada maciça de ânions cloreto (Cl⁻) seguida de saída de cálcio (Ca²⁺)." },
        { letra: "D", texto: "Abertura de canais de potássio com influxo de K⁺ para o citoplasma." },
        { letra: "E", texto: "Inativação completa da membrana celular impedindo a circulação de correntes elétricas." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Ao atingir o potencial limiar (~-55 mV), canais de Na⁺ voltagem-dependentes abrem-se em cascata despolarizando a célula até ~+30 mV; os canais de K⁺ abrem-se retardadamente restabelecendo o potencial de repouso.",
        porque: "O influxo de cargas positivas de sódio inverte transitoriamente a polaridade da membrana (despolarização). A inativação dos canais de Na⁺ combinada ao efluxo de K⁺ restaura a negatividade interna axonal (repolarização)."
      }
    },
    {
      id: "BIO_MIL_07",
      origem: "OBB Fase Nacional",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Excreção de Nitrogênio e Adaptação ao Voo e Deserto",
      tipo: "fechada",
      enunciado: "A evolução da excreção de ácido úrico (uricotelismo) em insetos, répteis e aves representou uma extraordinária adaptação evolutiva ao ambiente terrestre e ao voo. Essa vantagem adaptativa do ácido úrico em relação à amônia e à ureia decorre de:",
      alternativas: [
        { letra: "A", texto: "Sua quase total insolubilidade em água e baixíssima toxicidade, permitindo sua eliminação como pasta semissólida com mínima perda de água e viabilizando o desenvolvimento embrionário no interior de ovos amnióticos com casca rígida." },
        { letra: "B", texto: "Ser o composto de menor custo energético de biossíntese celular comparado à ureia." },
        { letra: "C", texto: "Ser eliminado exclusivamente por difusão gasosa através das penas e espiráculos." },
        { letra: "D", texto: "Armazenar grandes reservas de ATP que são reabsorvidas pela bexiga natatória." },
        { letra: "E", texto: "Eliminar simultaneamente o excesso de glicose circulante no sangue arterial." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O ácido úrico precipita facilmente sem exercer pressão osmótica nem intoxicar o embrião aprisionado no ovo amniótico.",
        porque: "Se o embrião amniota excretasse amônia ou ureia solúvel, os dejetos se acumulariam no líquido alantoideano atingindo concentrações letais. O ácido úrico insolúvel precipita no alantoide de forma inerte e semissólida, além de reduzir drasticamente o peso corporal para o voo das aves."
      }
    },
    {
      id: "BIO_MIL_08",
      origem: "ITA / IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Curva de Dissociação da Hemoglobina e Efeito Bohr",
      tipo: "fechada",
      enunciado: "Em tecidos metabolicamente hiperativos (como na musculatura esquelética durante exercício físico extenuante), ocorrem aumento da concentração de CO₂, aumento da acidez tecidual (queda de pH) e elevação da temperatura. Essas alterações provocam sobre a curva de dissociação da oxi-hemoglobina:",
      alternativas: [
        { letra: "A", texto: "Um desvio da curva para a direita (Efeito Bohr), diminuindo a afinidade da hemoglobina pelo oxigênio e facilitando a sua liberação para as células em atividade." },
        { letra: "B", texto: "Um desvio da curva para a esquerda, aumentando a retenção de oxigênio na hemácia." },
        { letra: "C", texto: "Uma desnaturação imediata e irreversível da hemoglobina." },
        { letra: "D", texto: "O bloqueio completo do transporte de CO₂ na forma de íons bicarbonato." },
        { letra: "E", texto: "A conversão da hemoglobina em mioglobina mononuclear." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "O Efeito Bohr descreve a modulação alostérica negativa da hemoglobina por prótons H⁺ e CO₂.",
        porque: "O excesso de prótons estabiliza a conformação Tensa (T) desoxigenada da hemoglobina, reduzindo sua afinidade pelo O₂ e promovendo a entrega abundante de oxigênio exatamente nos tecidos que mais necessitam de respiração celular."
      }
    },
    {
      id: "BIO_MIL_09",
      origem: "OBB Fase Nacional",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Imunologia Celular: Linfócitos T CD4+ e CD8+ e MHC",
      tipo: "fechada",
      enunciado: "Os linfócitos T citotóxicos (CD8⁺) e os linfócitos T auxiliares (CD4⁺ / T helper) desempenham funções coordenadas na imunidade celular adaptativa. Eles reconhecem antígenos peptídicos estranhos apenas quando apresentados na superfície celular complexados, respectivamente, às moléculas de:",
      alternativas: [
        { letra: "A", texto: "MHC de classe I (presente em todas as células nucleadas) e MHC de classe II (presente em células apresentadoras profissionais como macrófagos, células dendríticas e linfócitos B)." },
        { letra: "B", texto: "MHC de classe II e MHC de classe I inversamente." },
        { letra: "C", texto: "Imunoglobulina E e histamina mastocitária." },
        { letra: "D", texto: "Interleucina-2 livre e interferon alfa plasmático." },
        { letra: "E", texto: "Fosfolipídios de membrana sem necessidade de proteínas carreadoras." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Regra mnemônica do produto 8: CD8 liga-se ao MHC-I (8 × 1 = 8); CD4 liga-se ao MHC-II (4 × 2 = 8).",
        porque: "O MHC de classe I apresenta peptídeos endógenos (como antígenos virais ou tumorais) aos linfócitos T citotóxicos CD8⁺, que induzem apoptose da célula infectada via perforinas e granzimas. O MHC de classe II apresenta antígenos fagocitados exógenos aos linfócitos T auxiliares CD4⁺, que secretam citocinas orquestrando a resposta imune."
      }
    },
    {
      id: "BIO_MIL_10",
      origem: "FUVEST 2ª Fase / Medicina",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Fisiologia Vegetal: Transpiração e Teoria da Coesão-Tensão de Dixon",
      tipo: "fechada",
      enunciado: "A ascensão da seiva bruta (água e sais minerais) das raízes até a copa de árvores gigantes como as sequoias (que ultrapassam 100 metros de altura) é explicada cientificamente pela Teoria da Coesão-Tensão de Dixon. De acordo com essa teoria física, a força motriz preponderante que traciona a coluna d'água contínua é gerada:",
      alternativas: [
        { letra: "A", texto: "Pela perda de vapor de água na transpiração estomática foliar, que cria uma acentuada tensão (pressão negativa) nos vasos do xilema mantida pela coesão por ligações de hidrogênio entre as moléculas de água." },
        { letra: "B", texto: "Pela pressão positiva contínua de raiz impulsionada por bombas de ATP no parênquima." },
        { letra: "C", texto: "Pela gravidade que atrai a água para os tecidos aéreos." },
        { letra: "D", texto: "Pela contração muscular de vasos pulsares presentes no floema." },
        { letra: "E", texto: "Pela capilaridade pura, suficiente por si só para elevar água acima de 100 metros." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "A evapotranspiração nas folhas reduz o potencial hídrico foliar, transferindo uma enorme tensão negativa ao xilema.",
        porque: "A forte coesão entre moléculas de H₂O (ligações de hidrogênio) e a adesão às paredes de lignina dos vasos xilemáticos formam um fio ininterrupto de água capaz de suportar tensões mecânicas extremas sem cavitação (sem formação de bolhas de ar)."
      }
    },
    {
      id: "BIO_MIL_11",
      origem: "OBB Fase Nacional",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Fotossíntese: Vias C3, C4 e CAM",
      tipo: "fechada",
      enunciado: "Plantas adaptadas a climas áridos e quentes, como as gramíneas tropicais (via C4: milho e cana-de-açúcar) e as cactáceas/abacaxis (via CAM: Metabolismo Ácido das Crassuláceas), desenvolveram adaptações para contornar o desperdício energético da fotorrespiração catalisada pela enzima Rubisco. A diferença estratégica fundamental entre as vias C4 e CAM é que:",
      alternativas: [
        { letra: "A", texto: "A via C4 realiza a separação espacial da fixação inicial do CO₂ (células do mesofilo via PEP-carboxilase e bainha do feixe vascular via Rubisco), enquanto a via CAM realiza a separação temporal (abre estômatos à noite fixando CO₂ em malato e fecha-os de dia para o ciclo de Calvin)." },
        { letra: "B", texto: "A via C4 não utiliza a enzima Rubisco em nenhuma etapa." },
        { letra: "C", texto: "A via CAM realiza fotossíntese sem presença de luz solar." },
        { letra: "D", texto: "A via C4 ocorre exclusivamente em bactérias marinhas anaeróbias." },
        { letra: "E", texto: "As plantas C3 são mais eficientes termicamente em ambientes tórridos do que C4." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "C4 separa a fixação no espaço (anatomia Kranz); CAM separa no tempo (dia/noite).",
        porque: "Nas plantas C4, o CO₂ é fixado pela PEP-carboxilase (que não tem afinidade por O₂) no mesofilo e transportado como malato para a bainha perivascular onde a Rubisco atua saturada de CO₂. As plantas CAM abrem estômatos à noite (minimizando a perda de água) e realizam o ciclo de Calvin de dia com estômatos hermeticamente fechados."
      }
    },
    {
      id: "BIO_MIL_12",
      origem: "ITA / IME",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Imprinting Genômico e Epigenética Germinativa",
      tipo: "fechada",
      enunciado: "O imprinting genômico parental é um fenômeno epigenético no qual certos genes autossômicos são expressos exclusivamente a partir do alelo herdado de um dos progenitores, estando o alelo do outro progenitor silenciado por metilação. Um exemplo humano clássico de imprinting envolve as síndromes de Prader-Willi e Angelman causadas por deleções na mesma região do cromossomo 15 (15q11-q13). Se a deleção cromossômica for herdada do pai ou da mãe, a criança manifestará, respectivamente:",
      alternativas: [
        { letra: "A", texto: "Síndrome de Prader-Willi (deleção no alelo paterno) ou Síndrome de Angelman (deleção no alelo materno)." },
        { letra: "B", texto: "Síndrome de Angelman no alelo paterno e Prader-Willi no materno." },
        { letra: "C", texto: "Ambas as síndromes concomitantemente." },
        { letra: "D", texto: "Nenhuma patologia, pois o alelo remanescente é duplicado somaticamente." },
        { letra: "E", texto: "Daltonismo ligado ao sexo e hemofilia A." }
      ],
      resposta: "A",
      gabarito: {
        letra: "A",
        ancora: "Genes distintos no mesmo locus são expressos unicamente pelo pai (genes SNRPN) ou unicamente pela mãe (gene UBE3A).",
        porque: "Se a deleção de 15q11-q13 ocorre no cromossomo de origem paterna, a criança carece dos genes paternos ativos, desenvolvendo a síndrome de Prader-Willi (hiperfagia, obesidade e deficiência intelectual). Se a deleção ocorre no cromossomo materno, carece do gene UBE3A ativo, manifestando a síndrome de Angelman (ataxia, riso frequente e ausência de fala)."
      }
    },
    {
      id: "BIO_MIL_13",
      origem: "OBB Fase Final / IBO",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Mecanismo Quimiosmótico de Mitchell e Desacopladores Mitocondriais",
      tipo: "aberta",
      enunciado: "O 2,4-dinitrofenol (DNP) é uma substância lipofílica sintética que atua como um desacoplador da fosforilação oxidativa mitocondrial, transportando prótons H⁺ através da membrana mitocondrial interna sem passar pela enzima ATP sintase. Explique detalhadamente: (a) Qual o impacto do DNP sobre a velocidade do consumo de oxigênio e da oxidação de NADH na cadeia transportadora; (b) Qual o impacto sobre a síntese líquida de ATP celular; (c) Por que o DNP provoca hipertermia severa potencialmente letal.",
      resposta: "(a) Consumo de oxigênio e oxidação de NADH aumentam ao máximo; (b) Síntese de ATP é drasticamente inibida; (c) A energia do gradiente eletroquímico é dissipada integralmente na forma de calor térmico incontrolável.",
      gabarito: {
        letra: "Aberta",
        ancora: "Desacoplamento dissipa o gradiente de prótons sem aproveitamento mecânico pela ATP sintase.",
        espera_se: "(a) Cadeia de elétrons e consumo de O₂: Com o colapso do gradiente de prótons imposto pelo DNP, a cadeia transportadora de elétrons perde a contra-pressão do gradiente quimiosmótico (controle respiratório por aceptor nulo), passando a funcionar em velocidade máxima acelerada, oxidando NADH e FADH₂ freneticamente e consumindo O₂ no nível máximo possível.\n(b) Síntese de ATP: Como os prótons retornam à matriz mitocondrial através do DNP contornando o canal da F₀F₁-ATP sintase, a síntese de ATP colapsa drasticamente, privando a célula de energia útil utilizável.\n(c) Hipertermia: Pela Primeira Lei da Termodinâmica, a enorme energia liberada pela combustão acelerada dos substratos respiratórios, não podendo ser aprisionada nas ligações fosfoanidro do ATP, dissipa-se exclusivamente como energia térmica (calor metabólico), elevando a temperatura corpórea a níveis extremos e provocando desnaturação proteica e choque térmico fatal."
      }
    },
    {
      id: "BIO_MIL_14",
      origem: "FUVEST 2ª Fase / Medicina",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Imunização e Produção de Anticorpos Monoclonais",
      tipo: "aberta",
      enunciado: "A tecnologia dos anticorpos monoclonais desenvolvida por Köhler e Milstein (Prêmio Nobel de 1984) permitiu a produção de anticorpos idênticos em larga escala voltados para terapias-alvo contra o câncer e testes diagnósticos de precisão. Explique: (a) O que são 'hibridomas' e quais dois tipos celulares distintos são fundidos para formá-los; (b) Por que essa fusão celular é indispensável para viabilizar a produção contínua do anticorpo in vitro.",
      resposta: "(a) Hibridomas são células híbridas resultantes da fusão de linfócitos B imunizados com células tumorais de mieloma; (b) Une a capacidade de produzir um anticorpo específico único do linfócito B à imortalidade proliferativa in vitro do mieloma.",
      gabarito: {
        letra: "Aberta",
        ancora: "Células normais senescem após algumas divisões (Limite de Hayflick), exigindo fusão com células imortais neoplásicas.",
        espera_se: "(a) Células fundidas: (1) Linfócitos B isolados do baço de um animal imunizado contra o antígeno de interesse (que produzem o anticorpo desejado com alta afinidade e especificidade); (2) Células de mieloma múltiplo (linhagem de células de câncer de medula óssea imortais que não produzem suas próprias imunoglobulinas).\n(b) Razão da fusão: Linfócitos B normais têm vida útil curta e morrem após poucos ciclos de divisão em placas de cultura, sendo inviáveis para produção comercial contínua. As células tumorais de mieloma proliferam indefinidamente (são imortais), mas não produzem o anticorpo alvo. O hibridoma resultante combina a imortalidade proliferativa do mieloma com o maquinário genético de síntese do anticorpo específico do linfócito B, gerando clones estáveis que secretam quantidades ilimitadas de um único anticorpo monoclonal puro."
      }
    },
    {
      id: "BIO_MIL_15",
      origem: "OBB Fase Final / IBO",
      ano_escolar: "3º Ano EM",
      dificuldade_nivel: 4,
      dificuldade_rotulo: "Olimpíada/Militar",
      topico: "Origem da Vida e Teoria da Endossimbiose Seriada (SET)",
      tipo: "aberta",
      enunciado: "A Teoria da Endossimbiose Seriada (SET), proposta e consolidada por Lynn Margulis na década de 1960, explica a origem evolutiva das organelas bioenergéticas das células eucarióticas (mitocôndrias e cloroplastos). (a) De quais tipos de procariontes ancestrais primitivos derivaram as mitocôndrias e os cloroplastos? (b) Apresente três evidências biológicas, morfológicas ou moleculares independentes e irrefutáveis que comprovam a ancestralidade procariótica dessas organelas nas células atuais.",
      resposta: "(a) Mitocôndrias de alfa-proteobactérias aeróbias; Cloroplastos de cianobactérias fotossintetizantes; (b) DNA circular próprio sem histonas, ribossomos 70S bacterianos e membrana dupla com divisão independente por fissão binária.",
      gabarito: {
        letra: "Aberta",
        ancora: "Mitocôndrias e cloroplastos foram bactérias de vida livre fagocitadas por um eucarionte ancestral que escaparam da digestão e estabeleceram endossimbiose mutualística permanente.",
        espera_se: "(a) Origem filogenética: As mitocôndrias evoluíram a partir de ancestrais de alfa-proteobactérias aeróbias ancestrais; os cloroplastos derivaram de procariontes fotossintetizantes ancestrais filogeneticamente aparentados com as cianobactérias.\n(b) Três evidências fundamentais:\n1. Genoma próprio: Possuem molécula de DNA própria, circular, desprovida de histonas e com replicação autônoma idêntica à das bactérias;\n2. Maquinário de tradução 70S: Possuem ribossomos próprios de coeficiente de sedimentação 70S (típico de procariotos, e não 80S eucariótico) sensíveis aos mesmos antibióticos que inibem a síntese proteica bacteriana (como cloranfenicol);\n3. Membrana dupla e fissão binária: Apresentam membrana dupla (a membrana interna preserva composição lipídica bacteriana como a cardiolipina) e dividem-se de forma independente do núcleo celular por fissão binária (bipartição simples) semelhante à das bactérias."
      }
    }
  ]
};

salvar('Biologia/Anos_Iniciais_e_Finais_2to9EF/Questoes_Seres_Vivos_e_Corpo_Humano.json', biologiaEF);
salvar('Biologia/Citologia_e_Genetica/Questoes_Biologia_Celular_DNA_e_Hereditariedade.json', biologiaCitologia);
salvar('Biologia/Ecologia_e_Evolucao/Questoes_Cadeias_Alimentares_Biomas_e_Darwinismo.json', biologiaEcologia);
salvar('Biologia/Militares_e_Olimpiadas/Questoes_Biologia_OBB_FUVEST_ENEM_IME_ITA.json', biologiaMilitares);

console.log('--- LOTE 4 (BIOLOGIA) CONCLUÍDO COM SUCESSO ---');
