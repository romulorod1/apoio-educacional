const fs = require('fs');
const path = require('path');

const BASE_DIR = 'H:/My Drive/Vida Pessoal/Família/Material pra Nath/Aplicativo/Base de Dados/Matematica';

// ---------------------------------------------------------------------------------
// 1. ENRIQUECIMENTO DE GEOMETRIA COM FIGURAS EM TODAS AS QUESTÕES E PASSOS KUMON
// ---------------------------------------------------------------------------------
function enriquecerGeometria() {
  const p = path.join(BASE_DIR, 'Geometria/Questoes_Geometria_Plana_e_Espacial.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf-8'));

  const novasDescricoes = {
    "MAT_GEO_01": "[Figura: Triângulo retângulo ABC, com ângulo reto em B. O cateto horizontal AB mede 6 cm e o cateto vertical BC mede 8 cm. A hipotenusa AC é a rampa inclinada indicada com 'x'.]",
    "MAT_GEO_02": "[Figura: Círculo de centro O e raio r = 7 cm sobre fundo quadriculado. O raio parte do centro até a borda circular, com uma seta dupla indicando a área interna colorida de azul.]",
    "MAT_GEO_03": "[Figura: Paralelepípedo reto-retângulo transparente representando uma caixa d'água. As três dimensões estão cotadas: comprimento na base = 2 m, largura = 1,5 m e altura vertical = 1 m. O nível de água interna está preenchido até a borda.]",
    "MAT_GEO_04": "[Figura: Cilindro circular reto em perspectiva isométrica. A base circular superior tem raio r = 3 m e a geratriz/altura vertical h = 10 m conecta as duas bases circulares paralelas.]",
    "MAT_GEO_05": "[Figura: Esfera tridimensional perfeita de centro O e raio R = 6 cm. Um grande círculo equatorial está delineado com linha tracejada na parte posterior, evidenciando o volume esférico.]",
    "MAT_GEO_06": "[Figura: Dois cilindros retos comparados lado a lado: Cilindro A com altura h e raio da base r; Cilindro B com o dobro da altura (2h) e metade do raio da base (r/2).]",
    "MAT_GEO_07": "[Figura: Relógio analógico circular de raio 12 cm. O setor circular sombreado compreende o ângulo central formado entre os ponteiros das 12h e das 4h, correspondendo a um arco de 120°.]",
    "MAT_GEO_08": "[Figura: Reservatório em formato de tronco de pirâmide quadrangular regular invertido. A base maior superior é um quadrado de lado 4 m, a base menor inferior é um quadrado de lado 2 m, e a altura do tronco é de 3 m.]",
    "MAT_GEO_09": "[Figura: Dois postes verticais perpendiculares ao solo plano: um poste menor de 3 m e um poste maior de 9 m. Um cabo retilíneo esticado parte do topo do poste maior até a base do menor, intersectando o cabo que parte do topo do menor ao solo.]",
    "MAT_GEO_10": "[Figura: Hexágono regular ABCDEF de lado 4 cm dividido a partir do seu centro O em seis triângulos equiláteros congruentes coloridos de amarelo.]",
    "MAT_GEO_11": "[Figura: Pirâmide quadrangular regular com base quadrada ABCD de lado 6 cm e altura V-O = 4 cm. O apótema da pirâmide (altura da face lateral triangular) está demarcado em vermelho formando um triângulo retângulo com o apótema da base e a altura.]",
    "MAT_GEO_12": "[Figura: Círculo de centro O inscrito em um triângulo retângulo de catetos 6 cm e 8 cm e hipotenusa 10 cm. Os pontos de tangência com os três lados do triângulo delimitam o raio r perpendicular a cada cateto.]",
    "MAT_GEO_13": "[Figura: Esfera de raio R dentro da qual está inscrito um cilindro equilátero reto (cuja altura é igual ao diâmetro da base). As extremidades circulares do cilindro tocam a superfície interna da esfera.]",
    "MAT_GEO_14": "[Figura: Cone circular reto de vértice V e ângulo de abertura 60°. Uma esfera tangencia internamente a superfície lateral cônica e a base do cone, com corte meridiano exibindo um triângulo equilátero circunscrito a uma circunferência.]",
    "MAT_GEO_15": "[Figura: Tetraedro regular ABCD de aresta 'a'. Um plano secante passa pelo ponto médio da aresta AB, pelo ponto médio de CD e é paralelo a BC, delimitando uma seção poligonal plana no interior do sólido.]"
  };

  d.questoes.forEach(q => {
    if (novasDescricoes[q.id]) {
      q.imagem_descricao = novasDescricoes[q.id];
    }
  });

  fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');
  console.log("Geometria atualizada com figuras completas!");
}

// ---------------------------------------------------------------------------------
// 2. ENRIQUECIMENTO DE ÁLGEBRA COM GRÁFICOS CARTESIANOS E BANCAS COMPLETAS
// ---------------------------------------------------------------------------------
function enriquecerAlgebra() {
  const p = path.join(BASE_DIR, 'Algebra/Questoes_Funcoes_e_Equacoes.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf-8'));

  const novasDescricoes = {
    "MAT_ALG_01": "[Gráfico Cartesiano: Eixos x e y ortogonais. Uma reta crescente passa pelo ponto (0, 3) no eixo vertical y e pelo ponto (-1.5, 0) no eixo horizontal x, ilustrando a função afim f(x) = 2x + 3.]",
    "MAT_ALG_02": "[Gráfico Cartesiano: Parábola com concavidade voltada para cima cortando o eixo x nas raízes x = 1 e x = 3. O ponto de mínimo local (vértice V) está demarcado nas coordenadas (2, -1).]",
    "MAT_ALG_03": "[Diagrama de Potenciação: Reta numérica comparativa mostrando a escala exponencial 2^x (para x = 1, 2, 3, 4 resultando em 2, 4, 8, 16) e a identificação da igualdade de bases 2^(x+1) = 2^4.]",
    "MAT_ALG_04": "[Diagrama Visual da Regra do Giro: Esquema mnemônico em arco circular mostrando a base 2 elevando o resultado 'y' para igualar o logaritmando 32: log_2(32) = y <=> 2^y = 32.]",
    "MAT_ALG_05": "[Quadro Resumo das Propriedades de Logaritmos: Tabela com setas conectando 'Produto vira Soma' [log(a·b) = log a + log b], 'Divisão vira Subtração' e 'Expoente tomba para a frente multiplicando'.]",
    "MAT_ALG_06": "[Gráfico Cartesiano do ENEM: Eixo vertical 'Custo da Corrida (R$)' e eixo horizontal 'Distância percorrida (km)'. A reta inicia em R$ 5,00 no km 0 e sobe linearmente com taxa de R$ 2,50/km.]",
    "MAT_ALG_07": "[Gráfico Cartesiano Parabólico do ENEM: Trajetória balística de um projétil h(t) = -5t² + 20t. O projétil parte da origem (0, 0), atinge a altura máxima de 20 metros em t = 2 segundos e retorna ao solo em t = 4 segundos.]",
    "MAT_ALG_08": "[Gráfico Exponencial da UERJ: Curva exponencial assintótica ascendente P(t) = P0 · 2^(t/3), com t em anos no eixo das abscissas e a população dobrando a cada intervalo regular de 3 anos.]",
    "MAT_ALG_09": "[Quadro de Estudo de Sinais da FUVEST: Varal de sinais para a inequação (x - 2)(x - 5) ≤ 0, exibindo os intervalos negativo entre 2 e 5 e positivo fora das raízes.]",
    "MAT_ALG_10": "[Diagrama de Mudança de Base da UNICAMP: Esquema de conversão fracionária mostrando log_b(a) = log_c(a) / log_c(b), com destaque para a aplicação com potências de 2 e 3.]",
    "MAT_ALG_11": "[Gráfico Cartesiano UERJ Discursiva: Curvas de logaritmos reais e a reta de condição de existência x > 1 delimitando a região de validade no semiplano direito.]",
    "MAT_ALG_12": "[Diagrama Algébrico da EsPCEx: Substituição de variável y = 2^x convertendo uma equação exponencial de 2º grau numa equação quadrática equivalente com raízes y1 e y2.]",
    "MAT_ALG_13": "[Diagrama de Funções Compostas da FUVEST 2ª Fase: Três conjuntos (A -> B -> C) com flechas mapeando x -> f(x) -> g(f(x)), demonstrando a inversão de funções bjetoras.]",
    "MAT_ALG_14": "[Gráfico Comparativo AFA/EFOMM: Interseção entre a curva logarítmica f(x) = ln(x) e a reta g(x) = 2 - x, evidenciando a existência de solução única no intervalo (1, 2).]",
    "MAT_ALG_15": "[Diagrama IME/ITA: Matriz de coeficientes e hiperfícies de nível para sistemas não lineares envolvendo logaritmos e identidades simétricas elementares.]"
  };

  d.questoes.forEach(q => {
    if (novasDescricoes[q.id]) {
      q.imagem_descricao = novasDescricoes[q.id];
    }
  });

  fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');
  console.log("Álgebra atualizada com gráficos e diagramas cartesianos!");
}

// ---------------------------------------------------------------------------------
// 3. ENRIQUECIMENTO DE IME/ITA COM DIAGRAMAS COMPLEXOS E GIRARD
// ---------------------------------------------------------------------------------
function enriquecerImeIta() {
  const p = path.join(BASE_DIR, 'IME_ITA/Questoes_Numeros_Complexos_e_Polinomios_IME_ITA.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf-8'));

  const novasDescricoes = {
    "MAT_IME_01": "[Diagrama do Ciclo das Potências de 'i': Círculo com 4 nós correspondendo a i^0 = 1 (Leste), i^1 = i (Norte), i^2 = -1 (Oeste) e i^3 = -i (Sul), com setas de rotação horária demonstrando a periodicidade de período 4.]",
    "MAT_IME_02": "[Plano de Argand-Gauss: O vetor z = 3 + 4i está desenhado partindo da origem O(0,0) até o afixo P(3,4). O módulo |z| = 5 é a hipotenusa do triângulo retângulo de catetos 3 e 4. O conjugado z* = 3 - 4i é a imagem espelhada simétrica em relação ao eixo real.]",
    "MAT_IME_03": "[Plano Complexo: Representação vetorial do número z = 1 + i, mostrando o argumento θ = 45° (π/4 radianos) e o módulo √2, com a rotação de 90° resultante da multiplicação por i.]",
    "MAT_IME_04": "[Diagrama da Divisão Polinomial de D'Alembert: Estrutura em chave mostrando P(x) dividido por (x - a) com quociente Q(x) e resto numérico constante R = P(a).]",
    "MAT_IME_05": "[Tabela das Relações de Girard: Quadro das relações entre coeficientes e raízes para P(x) = ax³ + bx² + cx + d = 0: Soma (r1+r2+r3 = -b/a), Soma dos Produtos 2 a 2 (c/a) e Produto das três raízes (-d/a).]",
    "MAT_IME_06": "[Plano de Argand-Gauss: Círculo trigonométrico unitário exibindo a rotação do vetor ao ser elevado a n pela 1ª Fórmula de De Moivre: z^n = |z|^n · cis(nθ).]",
    "MAT_IME_07": "[Diagrama de Raízes Conjugadas: Plano complexo exibindo as raízes complexas r1 = 2 + 3i e r2 = 2 - 3i simétricas em relação ao eixo horizontal dos reais para um polinômio com coeficientes em R.]",
    "MAT_IME_08": "[Tabela do Algoritmo de Briot-Ruffini: Grade de duas linhas mostrando a raiz 'a' à esquerda, os coeficientes originais do polinômio na linha superior e os coeficientes do quociente obtidos por multiplicações e adições sucessivas na linha inferior.]",
    "MAT_IME_09": "[Plano de Argand-Gauss: Círculo trigonométrico com os quatro quadrantes delimitados. Um número complexo no 3º quadrante (-a - bi) com o argumento principal θ = π + arctan(b/a) medido no sentido anti-horário.]",
    "MAT_IME_10": "[Diagrama de Raízes em Progressão Geométrica (PG): Três pontos na reta real q^-1 · r, r e q · r satisfazendo simultaneamente o produto r³ = -d/a das Relações de Girard.]",
    "MAT_IME_11": "[Plano Complexo do IME: Lugar geométrico dos pontos z tais que |z - z0| = R, exibindo uma circunferência centrada em z0 com raio R no plano de Argand-Gauss.]",
    "MAT_IME_12": "[Polígono Regular das Raízes da Unidade do ITA: Círculo unitário no plano complexo exibindo as n raízes da equação z^n = 1 como os vértices de um polígono regular de n lados inscrito na circunferência unitária.]",
    "MAT_IME_13": "[Gráfico Cartesiano da Derivada de Polinômios no IME: Curva de P(x) tangenciando o eixo das abscissas em x = r, onde r é raiz dupla de P(x) e portanto raiz de P'(x) = 0.]",
    "MAT_IME_14": "[Diagrama Trigonométrico ITA: Relações de Euler e identidades cos(z) = (e^(iz) + e^(-iz))/2 e sen(z) = (e^(iz) - e^(-iz))/(2i) no corpo dos números complexos.]",
    "MAT_IME_15": "[Diagrama da Olimpíada de Matemática/IME: Fatoração ciclotômica e soma de Newton para potências simétricas de raízes polinomiais S_k = r1^k + r2^k + r3^k.]"
  };

  d.questoes.forEach(q => {
    if (novasDescricoes[q.id]) {
      q.imagem_descricao = novasDescricoes[q.id];
    }
  });

  fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8');
  console.log("IME/ITA atualizado com diagramas de Argand-Gauss e Briot-Ruffini!");
}

enriquecerGeometria();
enriquecerAlgebra();
enriquecerImeIta();
console.log("--- TODAS AS QUESTÕES DE MATEMÁTICA ENRIQUECIDAS COM FIGURAS! ---");
