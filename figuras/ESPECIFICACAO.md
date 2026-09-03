# Especificacao das figuras

Levantada por 17 agentes: 5 de benchmark contra livro didatico e 11 de inventario do banco.
Numeros: 622 figuras distintas, 140 temas afetados, 25 primitivas.

## A marcacao

### Sintaxe

Uma linha que comeca na coluna zero com "@fig ", seguida do nome da receita e de pares chave=valor separados por espaco. Gramatica completa:

  @fig <receita> <chave>=<valor> <chave>=<valor> ...

  receita: letras e digitos, sem acento (triangulo, retanumerica, solido, barra)
  chave:   letras, sem acento
  valor:   qualquer sequencia sem espaco, proibidos os caracteres , # | { } ^ _
  lista:   itens de um mesmo valor juntam-se com ponto e virgula (vertices=A;B;C)
  decimal: sempre ponto, nas duas linguas (0.4, nunca 0,4)

Chaves reservadas, validas em qualquer receita: id (nomeia a figura dentro do arquivo), fase (enunciado ou gabarito), escala (fiel ou fora), legenda.

Posicao. Na explicacao a diretiva e um bloco: linha em branco antes e depois. Dentro de um exercicio ou de uma resposta, e uma linha propria dentro do item, depois do texto. Uma diretiva por linha, sempre, e nunca no meio de uma frase.

Camada de gabarito. A resposta nao repete os dados: ela chama a mesma figura pelo id, so trocando a fase.

  enunciado:  @fig triangulo id=t1 angulo=52 angulo=61 incognita=C vertices=A;B;C
  gabarito:   @fig id=t1 fase=gabarito

O gerador reexecuta a MESMA receita com os MESMOS argumentos e desenha por cima a camada de resposta em COR.teal tracejada. E a materializacao em codigo da convencao de que a figura do gabarito nao e um desenho novo: como a construcao dos vertices e uma funcao pura chamada duas vezes, redesenhar diferente deixa de ser possivel.

Dois acrescimos ao pdf.js, os dois obrigatorios e faceis de esquecer: (1) um ramo para @fig no Doc.prototype.markdown, antes do ramo de paragrafo; (2) o laco que junta paragrafo (a condicao das linhas 1191 a 1195) precisa parar tambem em @fig. Sem o segundo, a diretiva e colada dentro do paragrafo anterior e sai impressa como texto no meio da folha, em silencio.

Tres travas novas no verificar.py, no mesmo padrao que ele ja usa com o pdf.js para caracteres ("este arquivo NAO mantem lista propria: ele pergunta"): receita inexistente, chave nao declarada pela receita, e sequencia de receitas diferente entre PT e EN item a item. Uma quarta, mais forte e que vale a pena: renderizar a figura em node durante a verificacao e reprovar o tema quando o conferirFigura acusar rotulo sobreposto, marca em excesso ou traco abaixo do piso.

### Por que assim

A diretiva precisa sobreviver, sem nenhuma excecao, ao itens_numerados do verificar.py, que e o que decide o formato.

Uma linha, sempre. O itens_numerados le um exercicio como ^(\d+)\.\s+(.*)$ e depois cola cada linha seguinte no mesmo item com um espaco (atual += ' ' + linha.strip()). Bloco cercado por crases, YAML indentado ou qualquer coisa de varias linhas e achatado numa string unica com as crases dentro. Uma linha e a unica forma que fica identica na explicacao e dentro do exercicio, e por isso a unica que permite uma receita servir aos dois lugares.

Nada de crase. O numeros_de apaga o conteudo entre crases antes de comparar as duas linguas (re.sub(r'`[^`]*`', ' ', texto)). Se os dados da figura fossem para dentro de crases, o banco perderia exatamente a trava que mais importa aqui: como a convencao manda o dado morar na figura e nao no texto, os numeros migram do enunciado para a diretiva, e sem essa trava a folha em ingles pode sair com 52 onde a portuguesa tem 62 sem ninguem ver. Escrita fora das crases, a diretiva faz o verificador conferir a figura das duas linguas de graca, sem uma linha de codigo nova.

Virgula proibida. O numeros_de casa -?\d+(?:[.,]\d+)? e trata a virgula como separador decimal: angulos=52,61 vira o numero 52.61 e some do relatorio como dois valores. Com ponto e virgula, cada numero fica inteiro e comparavel. A mesma regra resolve o decimal bilingue: a diretiva sempre escreve ponto e quem imprime a folha decide a virgula, o que impede um 0.4 aparecer numa folha em portugues.

O arroba, e nao outro caractere. Testei no proprio pdf.js: @ = e ; desenham, entao a diretiva passa pelo caracteres_indesenhaveis, que varre o arquivo inteiro. Nenhum ramo do Doc.prototype.markdown comeca por @, ao contrario de | (tabela), - e * (lista), digito com ponto (lista numerada) e # (subtitulo). E linha iniciada por # e a unica que o itens_numerados descarta da continuacao, o que faria a figura sumir dentro do exercicio sem aviso.

Sem chaves e sem reticencias. O marcacao_quebrada reprova ^{ ou _{ mal fechados, e o RASCUNHO_ERRO reprova ... e colchete com as palavras inserir, colocar, revisar ou conferir. Uma sintaxe de chave=valor plana nao encosta em nenhum dos dois.

Sem numero de figura. A referencia e sempre por adjacencia (na figura, a figura mostra, observe a figura), porque o gerarMaterialTema renumera os exercicios com String(i + 1) sobre op.escolhidos: qualquer Figura 3 fica errada assim que a professora tira um exercicio da lista. O id da diretiva vive so no fonte e nunca e impresso. O referencias_cruzadas ja reprova item \d+ e questao \d+, entao o id nao pode ter essa forma.

A chave escala fecha o conflito entre duas convencoes que se contradizem: desenhar fiel aos numeros, e avisar quando o desenho nao pode ser medido. A regra sai automatica da propria diretiva: se algum valor metrico nao e numero (3x+10, x, alfa), a figura recebe fora de escala sem o autor precisar lembrar; se todos sao numeros, ela sai fiel e o aluno que conferir com transferidor e recompensado.

### Exemplos

Explicacao (bloco, entre linhas em branco):

  Num triangulo, a soma dos tres angulos internos vale 180 graus.

  @fig triangulo angulo=52 angulo=61 angulo=67 vertices=A;B;C

  Repare que o maior angulo fica em frente ao maior lado.

Exercicio (linha propria dentro do item, depois do texto):

  7. Determine o valor de x na figura.
  @fig triangulo id=t7 angulo=52 angulo=61 incognita=C vertices=A;B;C

Gabarito da mesma questao, sem repetir dado nenhum:

  7. O terceiro angulo mede 67 graus.
  @fig id=t7 fase=gabarito

O triangulo impossivel, em que a receita devolve null e o null e o resultado didatico:

  6. Existe triangulo de lados 4, 7 e 12? Justifique.
  @fig triangulo id=t6 lado=4 lado=7 lado=12

Um exercicio que precisa de duas figuras pequenas em vez de uma cheia, pelo teto de cinco marcas ativas:

  3. Na figura a seguir, calcule h.
  @fig retangulotriangulo id=r3 projecao=4 projecao=9 incognita=h
  @fig retangulotriangulo id=r3b semelhantes=sim

A glosa da hachura, que e uma das duas unicas legendas permitidas:

  @fig composta id=c12 externo=quadrado;12 interno=circulo;5 hachurar=entre legenda=A parte hachurada e a regiao pedida.

Rotulo com palavra, que muda de lingua e por isso e escrito na diretiva de cada secao:

  PT:  @fig triangulo id=t9 base=10 altura=6 rotuloaltura=altura
  EN:  @fig triangulo id=t9 base=10 altura=6 rotuloaltura=height

As duas passam no numeros_de com o mesmo conjunto (10 e 6) e na trava de paridade de receita, e nenhuma palavra portuguesa fica presa dentro do desenhador.

### A equacao de bloco: @eq

Uma linha propria, separada do paragrafo por linha em branco, com o resto da linha em
LaTeX: `@eq x = \frac{-b \pm \sqrt{b^{2} - 4ac}}{2a}`. O renderizador (figuras/formula.js)
cobre fracao, raiz com indice, expoente e indice, delimitadores que crescem, somatorio,
produtorio, integral e limite com limites em cima e embaixo, matrizes, `\text{}` e o
espacamento por classe do TeX. Comando malformado vira selo visivel na folha e aviso no
registro, nunca LaTeX cru como texto. O delimitador e `@eq` e nao `$...$` porque o banco
tem 135 cifroes e todos sao `R$`. O nome de funcao segue a lingua da folha: `\sin` sai
"sen" em portugues e "sin" em ingles, inclusive dentro de fracao, raiz e expoente.

### As receitas de circulo, conicas e poligono regular

Chegaram em 02/09/2026, com um caso por chave em `_prova_receitas_circulo.js` e um
auditor independente em MuPDF (`_audita_receitas_curvas.py`):

- `circulo`: raio, diametro, corda, centro, arco, setor, coroa, inscrito, circunscrito,
  fatias, aneis, incognita, giro. Medida com rotulo no formato `valor;rotulo` (`raio=5;r`
  constroi com 5 e escreve r). Ex.: `@fig circulo id=c8 fatias=8 diametro=40 incognita=x`.
- `conica`: tipo (elipse, hiperbole, parabola), a, b, p, c, focos, vertices, diretriz,
  assintotas, retangulo, ponto (`ponto=P;7` poe P a 7 do primeiro foco), eixos, centro.
  Ex.: `@fig conica tipo=hiperbole a=3 b=2 focos=F1;F2 vertices=A1;A2 retangulo=c assintotas=sim`.
- `poligonoregular`: lados, lado, raio, apotema, decomposto, centro, incognita.
  Ex.: `@fig poligonoRegular lados=6 lado=L decomposto=sim centro=O apotema=a`.
- `pidesenrolado` (`diametro=d sobra=0.14·d`), `pista` (`comprimento=84 largura=60`) e
  `rodando` (`raio=r comprimento=C`), as tres compostas do tema do circulo.

O que ainda NAO existe: painel de excentricidade (tres elipses lado a lado), a chave
`cheio` (circunferencia contra circulo), a semielipse apoiada e a demonstracao da area por
doze setores.

### As receitas de espaco: solido e painelsolidos

Chegaram em 02/09/2026, com 122 conferencias em `_prova_receitas_solidos.js` e um render
de auditoria em MuPDF (`_prova_receitas_solidos_render.py`). As duas sao a ponte entre a
diretiva e o `figuras/solidos.js`, e nenhum solido e desenhado dentro delas. Medida com
rotulo no mesmo formato do `circulo`, `valor;rotulo`: o primeiro valor CONSTROI e a letra
so rotula (`raio=5 altura=12 geratriz=g` desenha o cone de 5 por 12 e escreve g na
geratriz). Palavra nenhuma nasce no desenhador: `altura=h` escreve h e `altura=height`
escreve height. O que a diretiva deixou em letra a conta fecha, e a camada de gabarito
escreve o valor resolvido em teal; numero dado que contradiz a conta recusa a figura com
aviso, em vez de desenhar uma que mente.

- `solido`: tipo, aresta, lado, profundidade, altura, raio, geratriz, apotema,
  apotemabase, triangulo, esfera, planificacao, angulo, setor, arco, centro. O `tipo`
  aceita prisma, cilindro, piramide, cone, esfera e prismatriangular; `lado` e sinonimo de
  `aresta`; sem `profundidade` a base do prisma e quadrada. Chave que so faz sentido num
  tipo avisa nos outros e e ignorada, em vez de trocar o tipo por baixo do pano:
  `geratriz` so no cone, `apotema` e `apotemabase` so na piramide com `triangulo=sim`,
  `setor` e `arco` so com `planificacao=sim`. As tres composicoes sao `triangulo=sim` (o
  triangulo retangulo interno do cone e da piramide), `esfera=inscrita` (a esfera que toca
  as duas bases do cilindro) e `planificacao=sim` (o setor plano do cone, com `angulo` em
  graus, 180 por padrao). `centro` e a letra do centro e so tem onde sair na esfera, no
  cilindro com esfera e no cone ou piramide com triangulo. Nao ha chave de giro: a fuga e
  uma constante da folha inteira.
  Ex.: `@fig solido id=s8 tipo=cone triangulo=sim raio=5 altura=12 geratriz=g`.
- `painelsolidos`: nome, ordem, aresta, lado, raio, altura. Os cinco solidos lado a lado,
  cada celula com fundo branco e teto de cinco marcas proprios. `nome` traz o nome de cada
  celula pelo tema, nas duas linguas, e `ordem` escolhe quais celulas e em que sequencia,
  entre prisma, cilindro, piramide, cone e esfera.
  Ex.: `@fig painelsolidos id=p1 nome=prisma;cilindro;pirâmide;cone;esfera aresta=a raio=r altura=h`.

### Dentro do exercicio

Dentro do enunciado a diretiva nao e vista pelo gerador como texto. O itens_numerados do verificador cola a linha no fim da string do item, e o ex.enunciado que chega ao gerarMaterialTema fica com a diretiva pendurada no fim. Antes de escrever qualquer coisa, o gerador parte esse enunciado em pedacos de texto e diretivas de figura, e monta o exercicio nesta ordem fixa: numero, enunciado completo, figura centrada na faixa de MARG_E + 20 ate MARG_D, legenda opcional em 7,5 pt COR.muted, espaco de resposta.

A ordem e fixa por dois motivos. A figura depois do texto porque o aluno precisa saber o que procurar antes de olhar, senao ele trava no desenho; e a figura antes do op.espacoParaResposta porque, se vier depois, ela se descola da pergunta e aparece flutuando sobre a linha de resposta.

A figura e bloco, nunca inline. O texto do exercicio e escrito em coluna unica de MARG_E + 20 ate MARG_D e nao ha reflow em torno de objeto. Um float lateral exigiria quebrar so as primeiras linhas numa largura menor, o que o quebrarRico ate permite, e para leitor com dificuldade de atencao coluna estreita e pior do que bloco.

Quebra de pagina. A reserva acontece antes do primeiro traco: o figura() chama garanteEspaco com a altura total ja incluindo rotulos externos e legenda, e recalcula as coordenadas quando o garanteEspaco devolve que houve quebra, porque nesse caso o doc.y voltou para o topo. Sem isso, metade do triangulo cai na folha seguinte ou por cima do rodape, que e desenhado em outro momento do fluxo.

Quando um exercicio traz mais de uma figura, elas recebem letra de item no proprio desenho (a, b) ou algarismo romano (I, II) e o comando fica no plural. Duas diretivas seguidas no mesmo item saem lado a lado quando cabem na largura util, e empilhadas quando nao cabem.

No gabarito vale a mesma mecanica, com uma regra a mais: a figura so volta quando a resposta E uma construcao ou uma decomposicao. Quando a resposta e uma conta, o gabarito e texto, e escrever @fig ali gasta meia folha e ensina a conferir por semelhanca visual em vez de por argumento.

## O repertorio

### figura

    figura(doc, {largura, altura, unidades, legenda, foraDeEscala, fase, id}, desenhar)

Unico ponto de entrada: nada desenha fora dele. Reserva o bloco vertical com garanteEspaco antes do primeiro traco e recalcula as coordenadas se houve quebra de pagina, pinta o retangulo branco cobrindo a caixa mais a folga dos rotulos externos, instala um sistema de coordenadas local isotropico e entrega ao callback a funcao que leva ponto do problema em ponto da pagina, impoe a ordem de pintura (fundo, preenchimento, hachura, contorno, marcas, rotulos), escreve a legenda em 7,5 pt COR.muted e devolve o novo doc.y. Absorve o que cinco pesquisadores propuseram como cinco funcoes: limparFundo, enquadrar, ajustar, legendaFigura e avisoForaDeEscala.

Destrava 1007 figuras.
- Retangulo branco antes do primeiro traco, e antes do titulo
- Escala igual em x e em y, sempre, por enquadramento com preservacao de proporcao
- Ordem de desenho fixa: fundo, preenchimento, hachura, contorno, marcas, rotulos
- Figura nao racha na quebra de pagina
- Legenda restrita a dois casos: aviso de escala e glosa da hachura
- O eixo y do PDF cresce para cima e o doc.y desce conforme a pagina avanca

### rotulo

    rotulo(doc, texto, ancora, {direcao, afastamento, tam, cor, halo, chamada, giro, align})

Coloca texto empurrado para fora na direcao dada por um vetor calculado da geometria, nunca por deslocamento literal. Corrige a linha de base (o y do Td e o baseline, nao o centro optico do glifo, entao um rotulo centrado sem descontar cerca de 0,35 do corpo fica visivelmente alto), escolhe o align pelo sinal da componente horizontal para o texto nunca invadir a figura, dimensiona o halo branco por medir(), e liga fio de chamada de 0,6 pt quando o rotulo nao cabe onde deveria. Com giro, emite a matriz de texto Tm, normalizada para o intervalo de menos 90 a mais 90 graus para nunca sair de cabeca para baixo, e abaixo de 20 graus de inclinacao nao gira. Absorve rotuloVertice, rotularVertices, rotuloLado, medidaLado, textoGirado, textoRotacionado, chamada e legenda.

Destrava 880 figuras.
- Vertice em maiuscula, fora do poligono, na bissetriz externa
- Lado em minuscula ou medida, no ponto medio, na normal externa
- Rotulo de angulo na bissetriz, do lado de fora do arco
- Rotulos da figura e do texto sao os mesmos simbolos
- Corpo minimo de 7,5 pt, e 8,5 pt para o dado que resolve a questao
- Halo branco por baixo, para hachura e malha nao cortarem o rotulo
- Nada de grego em negrito
- Texto girado so em latino e com parcimonia

### comEstado

    comEstado(doc, {tracejado, recorte, cor, espessura}, desenhar)

Envelope unico de estado grafico. Emite q, aplica o padrao de tracejado, o caminho de recorte (W n) e as cores de traco e de preenchimento, executa o bloco de desenho e restaura tudo com Q, inclusive quando o bloco falha no meio. Nomeia tres estilos de tracejado que nao podem se confundir entre si: auxiliar [3 2] para construcao do gabarito, oculta [2 2] para aresta escondida de solido, guia [1 2] para linha de leitura. Absorve tracejado, tracejar mais solido, linhaTracejada e clipPoligono.

Destrava 540 figuras.
- Tracejado significa uma coisa so: o que nao esta la ou o que e construcao
- Diagonal que e objeto do exercicio vai continua e fina, nunca tracejada
- Cor de traco e de preenchimento sao operadores diferentes e todo caminho novo declara as duas
- Estado grafico nunca vaza para o resto da pagina

### poligono

    poligono(doc, pontos, {cor, espessura, preenche, furos, fechado, tracejado})

Desenha o contorno como um caminho PDF unico (m, sequencia de l, h) com 1 J 1 j nas juncoes, e finaliza com S, f, B ou f* conforme o caso. Aceita lista de furos para preencher por regra par e impar, o que da coroa circular, moldura e regiao entre duas figuras sem nenhuma conta de intersecao. Absorve poligono, caminho, preencherPoligono e preencherComFuro.

Destrava 430 figuras.
- Contorno da figura em 1,2 pt COR.navy, continuo
- Poligono e caminho unico, nunca sequencia de doc.linha, senao aparece entalhe em cada vertice
- Regiao pedida em cinza chapado proprio, nunca COR.soft
- Vertices em uma volta unica, sem cruzar

### geo

    geo.trianguloPorAngulos(A, B, base) | geo.trianguloPorLados(a, b, c) | geo.poligonoRegular(centro, raio, n, giro) | geo.girar / transladar / escalar / espelhar(pontos, ...) | geo.centroide / caixa / pe / pontoNoSegmento / enquadrar

Kit puro de matematica: recebe os numeros do enunciado e devolve pontos, sem desenhar nada. O triangulo sai por lei dos senos ou dos cossenos, com os angulos e lados de verdade, e devolve null quando a desigualdade triangular falha ou quando os angulos passam de 180: o null e tratado como resultado didatico, nao como erro. As transformacoes agem sobre a lista de pontos antes de desenhar, e nao por cm no PDF, o que preserva a espessura das linhas e mantem os rotulos na horizontal. Absorve trianguloPorLados, trianguloPorAngulos, poligonoRegular, girar, transladar, escalarPontos, espelhar, centroide, caixa, peDaPerpendicular, pontoNoSegmento, enquadrar e ajustar.

Destrava 400 figuras.
- A figura fecha com os numeros do enunciado: 52 graus sai com 52 graus de verdade
- Orientacao prototipica na explicacao, girada nos exercicios, sempre com a propriedade marcada
- Aumentar ou diminuir angulo muda o desenho de verdade e gera exercicio novo sem redesenhar
- Nao desenhar configuracao que nao existe: o null e a resposta
- Uma escala so, a sobra vai para margem

### arco

    arco(doc, centro, rx, ry, grau0, grau1, {cor, espessura, tracejado, setor, corda, giro})

Motor unico de curva circular e eliptica, por Bezier cubica quebrada em trechos de no maximo 90 graus com k igual a quatro tercos da tangente de um quarto do trecho. Raios independentes em x e em y dao a elipse dos solidos em perspectiva com uma constante de achatamento unica para a folha inteira. Com setor, fecha ate o centro para poder preencher ou hachurar; com corda, fecha pela reta. Absorve arco, arcoElipse, elipse, circunferencia, setorCircular, hachurarSetor, hachurarCoroa e discoFracionado. Existe porque o doc.circulo so faz circunferencia inteira, de raio igual nos dois sentidos, e trava a espessura em 1.6 quando nao preenche.

Destrava 250 figuras.
- Um Bezier nao aproxima meia circunferencia: trechos de ate 90 graus
- Achatamento decidido pela folha e nao por figura, senao um cilindro parece visto de cima e o vizinho de lado
- Metade de tras da base tracejada, metade da frente cheia
- Arco destacado sobre a propria circunferencia em traco grosso, para amarrar o angulo ao arco que ele enxerga
- Circunferencia em perspectiva vira elipse; planificacao nao tem perspectiva nenhuma

### ponto

    ponto(doc, P, {rotulo, direcao, aberto, guias, raio, cor})

Bolinha de 2,2 pt no ponto, cheia ou vazada, com o rotulo colado na direcao pedida e opcionalmente as duas guias tracejadas ate os eixos. A bolinha vazada e a unica notacao disponivel para extremo que nao entra num intervalo, para buraco de descontinuidade removivel e para valor que a funcao nao assume, e por isso e opcao explicita e nao detalhe. Absorve pontoRotulado, marcarPonto, marcaCanto, bolinhaGrafico, pontoAberto e guiaLeitura.

Destrava 250 figuras.
- Centro de circunferencia como ponto cheio com a letra O
- Par de coordenadas colado ao ponto, nunca em legenda separada
- Rotulo sobre o eixo empurra para o lado de dentro ou apaga o numero do tick, para nao virar borrao
- Anos iniciais: ponto cheio nos cantos que se quer contar, sem letra nenhuma

### seta

    seta(doc, P, Q, {tam, cor, espessura, dupla, preenchida})

Segmento com uma ou duas cabecas triangulares preenchidas, calculadas pelo versor. Nao existe nada parecido hoje no pdf.js.

Destrava 240 figuras.
- Eixo leva seta so na ponta positiva, com o nome do eixo logo depois
- Reta indefinida leva ponta nos dois lados; semirreta, em uma so
- Prolongamento de lado para mostrar o angulo externo
- Sentido de giro, que e a fonte declarada de erro em horario contra anti-horario

### cota

    cota(doc, P, Q, texto, {afastamento, estilo, cor, lado})

Mede um vao por fora da figura: linha paralela ao segmento, afastada, com duas linhas de chamada finas nos extremos e o texto no meio com halo, sempre na horizontal. O estilo escolhe entre ponta de seta (cota de desenho tecnico) e chave (agrupamento de partes, que e o que os anos iniciais usam). Absorve cota, chave, chaveMedida e as varias cotas de barra e de reta numerica.

Destrava 230 figuras.
- Medida que nao se refere a um lado desenhado vai em cota, nunca escrita sobre o traco
- Medida na figura entra no quarto ano, sempre com a unidade escrita ao lado do numero
- Quando o lado ja carrega outra marca, a medida sai para a cota e nao empilha sobre a aresta

### marcaAngulo

    marcaAngulo(doc, V, A, B, {voltas, rotulo, raio, passo, cor})

De um a tres arcos concentricos no vertice, entre as semirretas VA e VB, sempre pelo lado do angulo menor que 180 graus, com o rotulo na bissetriz por fora do arco. O raio e fracao da menor distancia do vertice aos vizinhos, com piso de 12 pt, e diminui sozinho quando o angulo e agudo; abaixo de 15 graus o valor sai para fora ligado por fio fino. O numero de voltas e a notacao de angulos congruentes, que substitui o simbolo de congruencia que nao existe na fonte. Absorve marcaAngulo, arcoAngulo e marcaAnguloIgual.

Destrava 210 figuras.
- Angulo generico recebe arco com o valor na bissetriz, fora do arco
- Angulos congruentes recebem o mesmo numero de arcos, com folga entre eles
- Angulo desconhecido recebe arco com incognita, nunca arco vazio
- Raio nunca fixo: em vertice agudo o arco encostaria nos dois lados
- O arco nunca sai no lado errado, que e o erro mais silencioso da lista: a figura fica bonita e diz outra coisa

### retaNumerica

    retaNumerica(doc, {de, ate, passo, niveis, marcas, saltos, faixas, rotulos, vertical})

Regua de uma dimensao com hierarquia de marcas (miuda, media e alta numerada), pontos cheios e vazados, saltos em arco rotulados por cima, faixas preenchidas com extremo aberto ou fechado, cotas de distancia e seta na ponta. Aceita orientacao vertical (nivel do mar, altura, temperatura) e reta dupla alinhada para proporcao. Absorve retaNumerica, regua, marcarNaReta, saltoNaReta, faixaNaReta, retaNumericaDupla, escalaDeChance e pontosEmpilhados.

Destrava 185 figuras.
- Quem esta mais a direita e maior: a regra deixa de ser decorada e passa a ser lida
- Modulo e distancia, e distancia se ve
- Extremo que entra e bolinha cheia, extremo que fica de fora e bolinha vazada
- Contam-se os intervalos e nao as marcas: os saltos numerados corrigem o erro de contar um a mais
- Arredondar e escolher a marca mais proxima, nao aplicar regra sobre algarismo

### marcaAnguloReto

    marcaAnguloReto(doc, V, A, B, {lado, cor})

O quadradinho de dois segmentos encaixado no vertice, construido com os versores de VA e VB para acompanhar qualquer rotacao da figura, nunca um retangulo alinhado aos eixos. Avisa em vez de desenhar quando os dois lados sao quase colineares.

Destrava 150 figuras.
- Angulo reto e o quadradinho, nunca arco e nunca o texto 90 graus
- E a unica forma de dizer perpendicular, porque o glifo nao desenha
- Entra no quarto ano junto com a palavra angulo reto e a partir dai e obrigatorio em toda figura que tenha um
- Um quadradinho por cruzamento, nao quatro, para nao poluir

### plano

    plano(doc, {xMin, xMax, yMin, yMax, passo, malha, quadrantes, rotulos}) -> {px, py, u}

Moldura cartesiana com origem em qualquer lugar, quatro quadrantes, seta so na ponta positiva com o nome do eixo depois dela, o zero escrito uma vez no cruzamento, numeros por fora e malha opcional em 0,3 pt. Calcula a altura a partir da largura para forcar escala igual nos dois eixos, e devolve os conversores mais o tamanho da unidade em pontos. Difere do eixos() do graficos.js em tres pontos que importam: isotropia, origem no meio e nao no canto, e seta na ponta.

Destrava 150 figuras.
- Escala igual sempre que houver circunferencia, angulo, distancia ou ciclo trigonometrico
- Seta nos dois sentidos do mesmo eixo e erro classico: a seta diz para onde cresce
- Zero escrito uma vez so, na origem
- Grade so em geometria analitica, e mesmo la so nas linhas inteiras

### marcaLado

    marcaLado(doc, P, Q, {n, tipo, tamanho, folga, cor})

De um a tres tracinhos perpendiculares ao segmento, centrados no ponto medio e espacados de 2,5 pt, ou de uma a tres pontas de seta apontando ao longo dele. As duas marcas sao a mesma primitiva com tipos diferentes porque fazem o mesmo trabalho: dizer uma hipotese sem gastar numero. Absorve marcaLado, ticksLado, marcaParalelas, marcaParalela e marcarParalelas.

Destrava 145 figuras.
- Elementos congruentes recebem a mesma marca; marcas diferentes significam medidas diferentes
- O tracinho e perpendicular ao lado, nao vertical na pagina, senao num lado obliquo parece um lado a mais
- Paralelismo se diz com setinha, porque o glifo de paralelo nao desenha
- A igualdade se marca, nao se escreve: comparar dois tracinhos e percepcao, comparar AB igual a 5 com BC igual a 5 e leitura e memoria

### curva

    curva(doc, e, amostras, {de, ate, passo, cor, espessura, tracejado, aparar})

Amostra uma funcao ou recebe pontos, liga por poligonal fina o bastante para parecer curva e apara o que sai da moldura, inclusive perto de assintota vertical, onde a curva nao pode virar um espeto ate o infinito. Uma reta atravessa a moldura inteira, resolvida nos quatro lados do quadro, e nunca para nos dois pontos dados, senao ela vira segmento e o aluno acha que a solucao so pode estar entre eles. Absorve curvaFuncao, retaNoPlano, curvaParametrica e assintota.

Destrava 120 figuras.
- Reta atravessa a moldura, ponto dado e bolinha cheia com nome ao lado
- Assintota em tracejado COR.muted, e a curva pode cruzar a assintota horizontal (ela nao e barreira)
- Poligonal fina o bastante, nunca circunferencia aproximada por poligono de muitos lados

### hachurar

    hachurar(doc, caminhos, {angulo, espacamento, cor, espessura})

Recorta a regiao como caminho de clipe dentro de um comEstado e varre a caixa envolvente com paralelas na inclinacao pedida. Como o recorte aceita caminho com curva, hachura setor circular, coroa e regiao entre duas figuras sem nenhuma conta de intersecao de reta com poligono, que da errado em regiao com furo e em poligono nao convexo. Aplica pisos duros: espacamento minimo de 4 pt, espessura maxima de 0,5 pt, recusa espacamento menor que seis vezes a espessura e recusa inclinacao paralela a qualquer lado da figura.

Destrava 120 figuras.
- Hachura e excecao nomeada; regiao unica vai em cinza chapado
- Hachura paralela a um lado desaparece contra o contorno
- Espacamento denso vira mancha e bate com a trama da fotocopiadora
- Toda regiao marcada tem glosa por escrito no enunciado ou na legenda

### grade

    grade(doc, {linhas, colunas, passo, celulas, cabecalhos, delimitador, alinhamento, peso})

Grade de celulas com conteudo opcional, cabecalho de linha e de coluna, celulas pintadas ou hachuradas, alinhamento por coluna e delimitador (colchete de matriz, fio vertical de chave de fatoracao, traco de conta armada). Com celulas vazias e peso 0,3 pt, e a malha quadriculada de fundo. E a consolidacao mais rentavel do repertorio: matriz, quadro posicional, conta armada, tabela de frequencias, calendario, quadro de sinais, grade 6 por 6 dos dois dados e malha de area sao a mesma primitiva com opcoes diferentes.

Destrava 90 figuras.
- Malha em COR.fio a 0,3 pt e figura por cima em navy 1,2 pt: quatro vezes mais grossa, para a figura nunca se confundir com o fundo
- Malha quadriculada de lado 1 e suporte legitimo de enunciado, nao decoracao
- Malha so onde a tarefa e contar; nunca atras de figura geometrica
- Alinhamento pela direita na conta armada, e pela virgula em decimais

### barra

    barra(doc, {total, partes, escala, rotulos, orientacao, sobra})

Modelo de barra proporcional: um todo dividido em partes rotuladas, com cortes, preenchimentos distintos por parte, sobra em branco e cotas por cima e por baixo. Varias barras alinhadas pela esquerda na mesma escala dao a comparacao, e barras de larguras diferentes dao o peso da media ponderada. Absorve barraDePartes, barraFracionada, barraSegmentada, barraModelo, barrasComparativas e barraRepartida.

Destrava 90 figuras.
- Alinhar pela esquerda na mesma escala, senao a comparacao nao existe
- Parte e todo aparecem juntos: a resposta e o pedaco que falta para fechar
- Reducao sucessiva incide sobre a barra ja encurtada, e isso se ve no comprimento
- Largura proporcional ao peso, que e o que explica a media ponderada sem formula

### ceviana

    ceviana(doc, V, A, B, {tipo, prolongamento, rotulo, projecoes})

Traca altura, mediana, bissetriz ou mediatriz a partir do vertice pedido, calcula o pe e o marca conforme o tipo (quadradinho para altura, tracinhos iguais para mediana, arquinhos iguais para bissetriz). Quando o pe cai fora do segmento, desenha antes o prolongamento tracejado mais claro em COR.muted ate ele. Devolve o pe, para o chamador rotular as projecoes. Absorve altura, alturaRelativa e cevianaComPe.

Destrava 70 figuras.
- Altura sempre vem com o quadradinho no pe, senao vira ceviana qualquer e confunde com mediana e bissetriz
- No obtusangulo, prolongar o lado em tracejado ate o pe, senao a altura flutua fora da figura
- O caso do pe externo e onde a literatura de figura prototipica diz que o aluno erra, porque so viu altura vertical caindo dentro
- Construcao acrescentada em COR.teal, 0,6 pt e tracejado, contorno original em navy continuo

### serie

    serie(doc, e, dados, {tipo, linhaDaMedia, rotulos, larguras})

Plota dados sobre uma moldura: colunas, barras horizontais, linha com pontos marcados, e dot plot empilhado sobre reta numerica. Aceita largura por categoria (para a media ponderada), linha de media atravessando em tracejado e destaque de excesso e de falta em relacao a ela. Grafico de setores sai do arco com setor, e nao daqui. Absorve graficoBarras, graficoColunas, graficoLinhas, histograma e linhaDaMedia.

Destrava 55 figuras.
- Eixo comeca em zero, salvo quando o proprio exercicio for sobre o eixo cortado
- O par honesto contra enganoso e o unico caso em que se desenha algo enganoso de proposito, e ai o rotulo tem que ser inequivoco e o honesto fica a direita, para ser o ultimo olhado
- Cada tipo de grafico serve a uma pergunta: categoria em colunas, tempo em linhas, repartição de um todo em setores

### diagrama

    diagrama(doc, {nos, arestas, layout, rotulos})

Motor unico de nos e arestas com tres layouts: arvore (ramificacao por niveis, com rotulo na aresta), cadeia (sequencia horizontal de caixas ligadas por seta rotulada) e flechas (dois conjuntos lado a lado com setas de um para o outro). A linha do tempo de fluxo de caixa e a cadeia com regua embaixo e setas para cima e para baixo. Absorve arvore, arvorePossibilidades, diagramaFlechas, esquemaFluxo, cadeiaDeFatores, caixasDeEtapas, fluxoDeCaixa, escada e escadaUnidades.

Destrava 55 figuras.
- Etapas em sequencia multiplicam, casos alternativos somam: em sequencia ou em paralelo e a diferenca desenhada
- Cada caminho tem o seu fator escrito na aresta, e o produto se le ao longo do caminho
- A seta de volta em tracejado e o que mostra a operacao inversa desfazendo a de ida

### solido

    solido(doc, {tipo, dims, ocultas, medidas, cortes, hachurarBase}) -> mapa de vertices

Projecao cavaleira com uma constante unica de fuga (45 graus, reducao a metade) e uma constante unica de achatamento de elipse para a folha inteira. Cobre caixa, cubo, prisma de base qualquer, piramide, cilindro, cone e esfera, com arestas visiveis em navy 1,1 pt e ocultas em muted tracejado 0,7 pt. Devolve o mapa de vertices (A a H na caixa) para o enunciado poder citar a diagonal AG e para as medidas opcionais da camada de gabarito (altura tracejada com quadradinho no pe, raio, geratriz, apotema). Absorve solidoCavaleira, caixa, piramide, cilindro, cone, esfera, cavaleira e solidoEmPerspectiva.

Destrava 52 figuras.
- Face da frente em verdadeira grandeza, profundidade a 45 graus e em meia escala
- Aresta escondida e desenhada, nunca omitida, senao o cubo vira hexagono riscado e some a informacao de que o solido e fechado
- Qual vertice fica escondido depende do sinal da fuga: trocar um sem trocar o outro produz solido de dentro para fora
- Achatamento da elipse mora num lugar so e vale para cilindro, cone e esfera
- Solido apoiado tem altura vertical do apice ao centro da base, com quadradinho no pe
- Secao ou area pedida vai hachurada, nunca preenchida em cor cheia, senao esconde as arestas por baixo

### itens

    itens(doc, {n, colunas, forma, grupos, riscados, valor, legenda})

Colecao contavel arrumada em fileiras: bolinhas, palitos, quadrados, discos de moeda e retangulos de cedula, com agrupamento por cerco, itens riscados (o que saiu) e itens de segundo preenchimento (a outra cor, distinguida por chapado, hachurado e vazio, e nao por cor, porque a paleta nao tem verde nem amarelo e a folha sai em cinza). O material dourado e o mesmo com tres formas encaixadas: placa, barra e cubinho. Absorve colecaoDeItens, itensEmGrade, arranjoDePontos, dezenasEUnidades, blocoBaseDez, agruparItens, moeda, cedula, dado e pictograma.

Destrava 45 figuras.
- O resto e literalmente o que fica fora dos cercos, e ai se ve que ele e menor que o divisor
- Cada tipo se distingue por preenchimento mais legenda, nunca por cor sozinha
- Anos iniciais: figura grande, traco grosso, uma ideia por figura, espaco em branco em volta e parte da figura
- O espaco amostral desenhado transforma contagem em coisa que se conta, e nao em formula

### diagonais

    diagonais(doc, pontos, {quais, deVertice, cor, tracejado, encontro})

Gera os pares de vertices nao adjacentes e desenha os selecionados, todos ou so os que partem de um vertice, no peso de linha auxiliar (0,6 pt, continua, COR.teal). Opcionalmente marca o ponto de encontro com bolinha e rotulo. Pedido explicito do dono do projeto.

Destrava 45 figuras.
- Diagonal que e objeto do exercicio vai continua e fina, nunca tracejada: ela existe de verdade dentro da figura
- As tres que saem de um vertice em destaque e as demais em cinza e o que torna contavel o n menos 3 e a divisao por 2
- A diagonal e o que cria os dois triangulos da decomposicao, e o argumento da soma 360 nao existe sem ela

### conferirFigura

    conferirFigura(registro, {maxMarcas, minCorpo, minEspessura, minContraste})

Trava de sanidade rodada na geracao, analoga ao caracteresQueNaoDesenha que o pdf.js ja tem para texto. Conta as marcas ativas e falha acima de cinco, detecta caixa de rotulo sobreposta a outra ou cruzando uma aresta, ponto fora da caixa da figura, arco maior que a menor distancia do vertice aos lados, hachura com espacamento abaixo do piso ou paralela a um lado, mais de tres niveis de espessura na mesma figura, corpo abaixo de 7,5 pt, traco abaixo de 0,6 pt e cor com contraste abaixo de 3:1 contra o branco (o que reprova fio, soft, softEsc, marca e gold como portadores de informacao). Chamado tambem pelo verificar.py, que renderiza a figura em node e reprova o tema.

Destrava 1007 figuras.
- O teto de cinco marcas so sobrevive ao decimo tema se for restricao e nao intencao
- Nenhuma informacao depende so da cor
- Nada abaixo do piso de corpo e de espessura
- Impede que 29 temas ganhem figura e tres saiam com rotulo em cima da linha sem ninguem ver antes da impressao

Tres travas mudaram em 02/09/2026, cada uma com prova nos dois sentidos em
`_prova_base_travas_hoje.js`:

- **Letra sozinha so e valor de angulo no alfabeto de angulo** (x, alfa, beta, theta).
  r, d, a, b, c, p e h sao comprimento e parametro; a regra antiga (qualquer minuscula)
  acusava as oito de "valor solto sem arco" e um eixo chamado x reprovava o tema. O x
  sozinho so conta quando a diretiva declarou `incognita=`; sem isso e nome de eixo.
- **A distancia entre arcos e analitica** (centro, raio, inicio e varrido), nao entre as
  ancoras de Bezier registradas: onde a ancora caia decidia o veredito (arco de 60 graus a
  partir de 85, com a ancora da circunferencia a 90, media 3,21 pt e reprovava; a partir
  de 80 media 6,42 e passava). Arco destacado SOBRE a circunferencia (mesmo centro, mesmo
  raio, um deles inteiro) e a convencao de setor e angulo central, nao "dois arcos no mesmo
  vertice"; dois arcos PARCIAIS de mesmo raio continuam medidos, porque emendar num
  semicirculo e exatamente o defeito.
- **Cruzamento nomeado e traco que PASSA pelo ponto, nao que TERMINA nele.** As
  bissetrizes passam pelo incentro e as diagonais pelo centro; o raio focal termina em P e
  o semieixo em F1, e um ponto em que dois tracos so terminam nao tem quatro angulos
  nascendo. O traco conta quando o ponto esta a mais de 2 pt de cada extremidade.

## O que NAO fazer

- Nao escrever COR.vermelho. Ele nao existe: a tabela COR tem navy, teal, gold, muted, fio, soft, softEsc, branco, texto e marca. Testei o comportamento e ele e pior do que um erro: o doc.linha faz c || COR.fio, entao a linha sai desenhada em COR.fio, que mede 1,53 de contraste contra o branco. O traco do gabarito nao quebra nada, apenas desaparece na folha impressa. Varias das convencoes levantadas e o proprio briefing supoem que COR.vermelho existe. O destaque e COR.teal, e a camada de resposta vem sempre em teal MAIS tracejado.

- Nao usar doc.circulo para desenhar circunferencia. Quando preenche e falso a espessura esta cravada em 1.6 dentro do proprio operador, sem parametro, e ele so faz circunferencia inteira, de raio igual nos dois sentidos e sem tracejado. Toda a familia de MAT08-13, MAT09-11, MATEM2-01 e MATEM2-12 depende de arco de verdade. O doc.circulo fica so para bolinha de ponto preenchida.

- Nao usar doc.retangulo para contorno. Ele emite re f, ou seja, so preenche, e so aceita retangulo alinhado aos eixos. Quadrado com contorno, face de solido em perspectiva, retangulo fundamental de hiperbole e moldura de figura saem todos de poligono. E nao desenhar poligono como quatro chamadas de doc.linha: cada uma reemite cor e espessura e faz um S proprio, entao nao ha juncao de canto e em 1,2 pt aparece um entalhe visivel em cada vertice.

- Nao ligar tracejado nem recorte fora de um envelope. O padrao de traco e o clip sao estado global do fluxo de conteudo: um [2 2] 0 d sem o [] 0 d tracejou o rodape e a figura seguinte, e um W n sem o Q correspondente recorta o resto da pagina inteira. O sintoma aparece na pagina 3 e quem desenhou nao ve. Todo op de estado passa pelo comEstado, que restaura mesmo quando o bloco falha no meio.

- Nao desenhar figura antes de pintar o fundo branco. A marca d'agua e um circulo de raio 96 com um NW de 82 pt em COR.marca, que tem 1,14 de contraste, quase a mesma cor de COR.fio: onde as duas se cruzam a malha some. Ja aconteceu neste projeto, no grafico de ebulicao, e a faixa que sumiu era justamente a de 100 a 120 graus que a questao mandava ler. A folga do retangulo branco cobre tambem os rotulos que saem para fora do poligono, e o retangulo vem antes do titulo, nunca depois, senao apaga o titulo.

- Nao posicionar rotulo por deslocamento fixo em x e y. Funciona na primeira figura e quebra na segunda: em triangulo obtuso a letra cai dentro da figura, e em poligono girado cai em cima de um lado. O proprio graficos.js confessa duas correcoes desse tipo nos comentarios das linhas 100 e 112, e la eram dois rotulos numa folha feita uma vez. Vertice sai na bissetriz externa, lado sai na normal externa, angulo sai na bissetriz, todos com folga calculada por medir(), que o pdf.js ja exporta.

- Nao escalar as marcas junto com a figura. A figura e descrita em unidades do problema e ajustada a caixa, mas o raio do arco de angulo, o lado do quadradinho, o comprimento do tracinho de congruencia e o afastamento do rotulo ficam em pontos, fixos. Escalados, um triangulo pequeno ganha um quadradinho de angulo reto do tamanho dele.

- Nao usar escala diferente em x e em y. E o defeito herdado direto do graficos.js, que constroi px e py com fatores independentes nas linhas 15 e 16. La esta certo, porque temperatura contra calor nao tem proporcao. Em geometria o quadrado vira retangulo, o angulo reto deixa de medir 90 graus na folha e o quadradinho passa a mentir. Uma escala so, k igual ao menor dos dois, e a sobra vai para margem e nao para esticamento.

- Nao passar de cinco marcas ativas por figura. Marca ativa e todo elemento que o aluno precisa ler: numero, letra de vertice, arco, quadradinho, tracinho, seta de paralelismo, rotulo de regiao. O contorno nao conta. Com cerca de quatro itens simultaneos de memoria de trabalho, uma figura com nove numeros nao e dificil, e inutilizavel: ele le os quatro primeiros, os tres seguintes empurram os primeiros para fora e ele recomeca. Exercicio que precisa de sete dados vira duas figuras pequenas na mesma posicao e na mesma escala, nunca uma figura cheia.

- Nao repetir o dado no texto e na figura. O dado aparece uma vez, e esse lugar e a figura; o enunciado remete. Repetir cria duas fontes de verdade que divergem na primeira revisao do tema, e obriga o aluno a conferir se as duas versoes dizem a mesma coisa, que e trabalho puro sem aprendizado. O contrario tambem vale: redundancia ENTRE canais, texto e desenho carregando a mesma configuracao, e boa e necessaria para quem le com dificuldade; o que custa e redundancia DENTRO do canal.

- Nao dar figura a todo exercicio. O dado de pesquisa e forte: em 104 atividades de um livro didatico o registro figural apareceu no enunciado de apenas 8, contra 42 nas resolucoes. O livro desenha muito mais para explicar do que para perguntar, e se toda questao ganhar figura o aluno perde o treino de traduzir texto em desenho, que e o que a prova cobra. Regra pratica: figura no enunciado quando o texto precisaria de mais de uma oracao subordinada para posicionar os elementos. Dos 1007 pedidos, construir primeiro so os que o proprio levantamento marca como alta, e deixar os de prioridade baixa fora do escopo do primeiro ano.

- Nao resolver o conflito entre as duas convencoes de enunciado fingindo que ele nao existe. Uma diz que a figura no enunciado e excecao, para nao entregar a configuracao de graca; a outra diz que a incognita mora na figura, no lugar exato onde e medida. As duas estao certas e otimizam coisas diferentes. Para esta aluna a dificuldade de leitura vence, entao a figura entra e o TEXTO ENCOLHE (o dado migra, nao duplica), mas cada tema de geometria mantem ao menos um terco dos exercicios sem figura nenhuma, para o treino de traduzir texto em desenho continuar existindo.

- Nao hachurar como preenchimento padrao. Regiao unica pedida vai em cinza chapado e o enunciado diz regiao sombreada, que e a convencao dos bancos brasileiros e do ENEM. Hachura entra so quando duas regioes distintas da mesma figura precisam ser diferenciadas entre si, e ainda assim com glosa de uma palavra ao lado de cada. Hachura foi pedida pelo dono e deve existir, mas como excecao nomeada: ela acrescenta dezenas de linhas paralelas que competem com os lados, com as diagonais e com o arco, e para dificuldade visual vira textura que o olho tenta ler como conteudo. Pisos duros: espacamento minimo de 4 pt, espessura maxima de 0,5 pt, nunca espacamento menor que seis vezes a espessura, nunca paralela a um lado da figura, e nunca sobre malha quadriculada (da moire na fotocopia).

- Nao usar COR.soft como o cinza da regiao sombreada. Medido: soft da 1,12 de contraste e cerca de 5 por cento de tinta, softEsc 1,17, marca 1,14, fio 1,53 e gold 2,25. A WCAG pede 3:1 para objeto grafico que carrega significado, e nenhum dos cinco chega la. Eles servem para apoio (fundo de faixa, malha de eixo) e nunca para contorno, seta, aresta oculta ou area destacada. Falta na paleta uma constante propria de area, em torno de 25 a 30 por cento de tinta, e ela precisa ser criada, nao improvisada.

- Nao deixar a distincao depender so de cor. Navy contra teal da 2,33 de contraste, ou seja, os dois quase nao se distinguem por luminosidade, so por matiz, e em preto e branco viram 79 e 61 por cento de tinta, indistinguiveis numa fotocopia de terceira geracao. Toda diferenca vem codificada duas vezes: contorno em navy cheio 1,2 pt, construcao do gabarito em teal tracejado 0,6 pt, auxiliar em muted tracejado fino. Custa nada e sobrevive a fotocopia.

- Nao usar mais de tres niveis de espessura, e nenhum abaixo do piso. Contorno 1,2 pt, marca de congruencia 0,9 pt, auxiliar 0,6 pt, hachura 0,5 pt. A NBR 8403 exige que a linha larga seja no minimo o dobro da estreita justamente para uma informacao nao ser confundida com outra, e 1,2 contra 0,6 e exatamente dois. O unico traco autorizado abaixo do piso e a malha do plano cartesiano em 0,3 pt, e so porque a figura por cima e quatro vezes mais grossa. Corpo minimo de 7,5 pt dentro da figura e 8,5 pt para o dado que resolve a questao.

- Nao escrever simbolo que a fonte nao tem. Testei um a um no pdf.js: gama, fi, o sinal de congruente, o de perpendicular, o de paralelo, o de angulo, o menos tipografico e o circunflexo sobre B, C ou G saem como interrogacao silenciosa na folha impressa. Desenham: alfa, beta, teta, pi, raiz, Delta, Sigma, o grau, o circunflexo sobre A, E, I, O e U, e os sinais de vezes, dividido e ponto medio. Consequencia de projeto, e nao detalhe: perpendicular se diz com o quadradinho e congruencia se diz com tracinhos, porque os simbolos correspondentes simplesmente nao existem. E nada de grego em negrito: a base-14 nao tem Symbol em negrito, entao teta dentro de asteriscos sai fino ao lado de uma Helvetica grossa, como o proprio comentario do pdf.js avisa nas linhas 94 a 99.

- Nao desenhar uma configuracao que nao existe. O trianguloPorLados(4, 7, 12) e o trianguloPorAngulos(100, 95) precisam devolver null, e o chamador trata o null como resultado didatico: desenha os dois lados que nao se alcancam com o vao aberto e cotado. O banco tem exatamente esse exercicio em MAT07-12, e uma figura fechada ali ensinaria o contrario da resposta com aparencia de verdade.

- Nao desenhar a figura no olho, com os angulos errados. Se o enunciado diz 52 graus e o desenho mostra uns 70, o aluno que confere com transferidor conclui que o material esta errado, e a partir dai ele para de usar figura como ferramenta em todas as questoes seguintes. Numa aluna com dificuldade de atencao esse e o pior estrago possivel, porque a figura era justamente o atalho que ia economizar leitura. Pior do que figura feia e figura que mente: a construcao sai dos numeros, por lei dos senos ou dos cossenos, e quando a proporcao real nao couber o aviso vai impresso.

- Nao pintar depois de contornar. A ordem e imposta pelo proprio figura(), e nao pela disciplina de quem escreve: fundo branco, preenchimento, hachura, contorno, marcas geometricas, rotulos com halo. Invertida, o preenchimento apaga o contorno e o quadradinho, e a hachura risca as letras. E o erro mais barato de cometer e o mais caro de diagnosticar, porque a figura sai quase certa e ninguem repara que sumiu exatamente a marca que carregava a informacao.

- Nao pôr grade quadriculada atras de figura geometrica. A grade e o caso raro e nao o padrao: sao 99 ocorrencias de plano cartesiano contra 387 de triangulo no banco. Em grafico a tarefa e ler um valor no eixo e a grade ajuda; em figura geometrica a tarefa e ver a forma, e a grade acrescenta dezenas de linhas concorrentes com os lados. Malha so nos anos iniciais para contagem de area, simetria e localizacao, e em geometria analitica, e mesmo la so nas linhas inteiras.

- Nao redesenhar a figura no gabarito, nem repeti-la sem acrescentar nada. Redesenhada com outra escala ou outro enquadramento, o aluno gasta a atencao reconhecendo que e a mesma figura antes de comparar. Repetida identica, gasta meia folha e ensina a conferir por semelhanca visual em vez de por argumento. A figura do gabarito e a do enunciado mais a construcao, em segunda camada, e so entra quando a resposta E uma construcao ou uma decomposicao.

- Nao prender palavra portuguesa dentro do desenhador. O banco e bilingue e a verificacao com sympy so confere conta: um altura escrito dentro da funcao de desenho quebra a folha em ingles em silencio, e a quebra nunca aparece. Letra de vertice, numero e unidade sao neutros e podem ficar no codigo; toda palavra entra por parametro, vinda do tema.

- Nao poluir para mostrar servico. Tres alturas, tres medianas, duas diagonais e cinco arcos na mesma figura e o resultado mais provavel de quem tem primitiva boa e nenhum criterio: tecnicamente correto e ilegivel. O criterio pratico e um so: cada elemento da figura precisa ser usado pela pergunta ou pela resposta. Malha em figura que nao pede contagem, medida que o enunciado ja deu, letra em vertice que ninguem cita e cor que nao distingue nada sao carga a mais, e o custo cai justamente sobre quem le com dificuldade. Para essa aluna, figura poluida atrapalha mais do que a descricao por escrito que existe hoje.

## A ordem

1. **O bloco e a guarda de estado, com a marcacao ligada de ponta a ponta numa receita so. Escrever figura(), comEstado() e o ramo de @fig no Doc.prototype.markdown, mais a extracao da diretiva do ex.enunciado no gerarMaterialTema, mais a correcao do laco que junta paragrafo para ele parar em @fig. Uma unica receita, triangulo, desenhada com doc.linha cru. Sair com um PDF impresso.**

   Nada mais pode ser confiado antes disto. Sem o comEstado, um tracejado ou um recorte esquecido contamina o resto da pagina e o sintoma aparece tres folhas adiante, longe de onde o erro foi cometido. Sem o figura(), a marca d'agua come o desenho e a figura racha na quebra de pagina. E a marcacao precisa estar provada de ponta a ponta antes de 1007 diretivas serem escritas: mudar a sintaxe depois significa reescrever o banco inteiro. O gate desta etapa e uma folha impressa em laser domestico, nao um PDF na tela.

2. **O nucleo de desenho: poligono, arco, rotulo, ponto, seta e cota, mais o kit geo (trianguloPorAngulos e trianguloPorLados com null, poligonoRegular, girar, transladar, escalar, espelhar, centroide, caixa, pe da perpendicular, enquadrar isotropico).**

   Sao as unicas primitivas sem dependencia, e todas as outras dezenove sao escritas em termos delas. O poligono e o arco tapam os dois buracos reais do pdf.js: o retangulo() so preenche e o circulo() trava a espessura em 1.6 quando nao preenche, entao hoje nao existe nem circunferencia fina nem quadrado com contorno. E o rotulo e onde mora o erro mais visivel de figura gerada por codigo: posicionado por vetor a partir da geometria em vez de por coordenada ajustada a olho, ele deixa de ser 29 casos particulares.

3. **As marcas de geometria: marcaAngulo, marcaAnguloReto, marcaLado, hachurar, ceviana e diagonais. Junto, criar a constante de cinza de area (25 a 30 por cento de tinta) que falta na paleta.**

   E o pedido explicito do dono (vetores padroes, diagonais internas, hachurar areas, aumentar ou diminuir angulos) e e o que fecha o buraco de notacao dos 29 temas de geometria. Como congruente, perpendicular e paralelo saem como interrogacao na base-14, a marca grafica deixa de ser reforco e passa a ser o unico canal: sem estas seis, congruencia, semelhanca, paralelas e altura nao tem como ser ditas. Sao tambem as que mais reduzem carga: um tracinho substitui dois rotulos de texto e libera um item da memoria de trabalho, que e o maior ganho por linha de codigo do repertorio inteiro.

4. **Piloto de um tema inteiro no papel. MAT07-12, Triangulos e quadrilateros, 18 exercicios: escrever todas as diretivas, gerar material, lista e gabarito, e ler impresso em laser domestico e numa fotocopia de segunda geracao antes de escrever mais uma linha de codigo.**

   E o unico tema que exercita quase tudo de uma vez: classificacao por lados e por angulos, soma 180 por decomposicao, angulo externo com prolongamento, desigualdade triangular com o triangulo que nao fecha, familia dos quadrilateros com paralelismo, bissetrizes internas, e a camada de gabarito. Se o teto de cinco marcas, a hierarquia de espessura e o par navy contra teal nao sobreviverem a fotocopia aqui, eles nao vao sobreviver em lugar nenhum, e e muito mais barato descobrir isso agora do que depois de 600 diretivas escritas.

5. **As travas. conferirFigura rodando em toda geracao, e o verificar.py ganhando as tres checagens de @fig (receita inexistente, chave nao declarada, sequencia de receitas diferente entre PT e EN) mais a renderizacao headless que reprova o tema quando o lint acusa.**

   Sem verificacao automatica, o limite de cinco marcas vira intencao e nao restricao, e ele nao sobrevive ao decimo tema. E a trava tem que existir antes da producao em massa, nao depois: o banco ja mostrou que 38 letras pi entraram e sairam como interrogacao porque a trava veio tarde. As checagens seguem o padrao que o verificar.py ja usa com o pdf.js, perguntando em vez de manter lista propria, porque lista repetida em dois lugares diverge no dia em que alguem mexe em um so.

6. **retaNumerica e barra, com todas as variantes (regua graduada com niveis de marca, saltos em arco, faixa com extremo aberto e fechado, reta dupla, dot plot; barra de partes, barras comparativas, cortes sucessivos).**

   Aqui eu discordo de uma ordenacao puramente geometrica. Sao as duas figuras de maior cobertura de todo o banco fora da geometria, cerca de 275 dos 1007 pedidos, e destravam de uma vez os 48 temas dos anos iniciais mais numeros, fracoes, decimais, porcentagem, razao e estatistica, que somam 49 mais 16 mais 17 temas contra 29 de geometria. A reta numerica tambem e o unico lugar onde a bolinha cheia contra a bolinha vazia existe, que e a notacao de intervalo aberto e fechado do ensino medio inteiro e da descontinuidade removivel.

7. **plano, curva, serie e grade. Plano cartesiano isotropico de quatro quadrantes com seta so na ponta positiva, curva amostrada e aparada na moldura, graficos de coluna, linha, setor e dot plot, e a grade de celulas.**

   Fecha geometria analitica, funcoes e estatistica, cerca de 295 pedidos. O eixos() do graficos.js nao serve: ele ancora a origem no canto inferior esquerdo, so aceita valores positivos e usa escala independente nos dois eixos, o que transforma circunferencia em ovo e o ciclo trigonometrico em elipse. A grade e a maior consolidacao do repertorio: matriz, quadro posicional, conta armada, tabela de frequencias, calendario, quadro de sinais e a grade 6 por 6 dos dois dados sao a mesma primitiva com opcoes diferentes, e sozinha ela resolve o pior deficit do banco, que sao os temas de matriz e determinante escritos em prosa porque nao havia como desenhar colchete.

8. **solido: projecao cavaleira com uma constante unica de fuga e uma unica de achatamento para a folha inteira, arestas ocultas tracejadas, caixa, prisma, piramide, cilindro, cone e esfera, mais planificacao como receita.**

   Vem depois porque depende de poligono, arco, comEstado e cota, e porque sao 52 pedidos em 9 temas, cobertura menor que as etapas anteriores. Mas nao pode ficar de fora: solido e o conteudo do banco que menos sobrevive a descricao, e hoje cinco temas inteiros so existem em texto. Duas armadilhas proprias: qual vertice fica escondido depende do sinal da fuga, e trocar o sinal sem trocar a lista de arestas ocultas produz um solido de dentro para fora que parece certo de relance; e a planificacao nao tem perspectiva nenhuma, entao desenhar a base do cilindro como elipse e uma contradicao dentro da propria figura.

9. **diagrama e itens. Arvore de possibilidades, cadeia de fatores, diagrama de flechas, linha do tempo financeira e fluxograma num motor so de nos e arestas; e a colecao contavel de bolinhas, palitos, material dourado e moedas.**

   Sao os dois que faltam para cobrir os 140 temas, cerca de 100 pedidos. Ficam por ultimo entre as primitivas porque nenhum outro depende deles e porque as duas familias sao homogeneas: uma vez que o motor de nos e arestas existe, arvore de dois niveis, cadeia de tres etapas e linha do tempo de fluxo de caixa sao a mesma chamada com outro layout.

10. **Varredura dos 140 temas escrevendo as diretivas, em ordem de dano: primeiro os cerca de 250 pedidos em que o exercicio hoje e ambiguo ou impossivel de responder sem a figura, depois o resto da prioridade alta, e nunca os de prioridade baixa.**

   Porque agora todo o custo e de autoria e nao de codigo, e porque a ordem correta nao e por serie nem por unidade: e pelo estrago. Ha exercicio no banco que diz um grafico de barras mostra e entrega tres numeros em prosa, e ha enunciado que descreve dois triangulos sobrepostos em palavras, que e a forma mais eficiente de produzir o erro que a questao queria evitar. Esses vem primeiro. Os de prioridade baixa nunca entram: figura que so confirma o que o texto ja disse triplica o custo de manutencao e nao triplica o aprendizado.

## Convencoes de desenho do livro didatico

- **Angulo reto e marcado com quadradinho no vertice, nunca com arco, e nunca acompanhado do valor 90 graus.** O quadradinho e um simbolo, nao uma medida: ele diz que aquele angulo e reto por hipotese ou por construcao. Se voce usa arco com 90 escrito, o aluno le como mais um dado numerico entre os outros e perde a distincao entre o que e dado da figura e o que ele tem que calcular. Escrever 90 dentro do quadradinho e redundancia que polui a figura, e para um aluno com dificuldade de atencao redundancia visual custa caro. Exemplo: anguloReto(V, A, B, 7) desenha o quadradinho de lado 7 pt encostado no vertice V, com os dois lados paralelos a VA e a VB. No triangulo retangulo do Teorema de Pitagoras (MAT09-07) o quadradinho e a unica marca no vertice reto, e as medidas 3, 4 e 5 ficam nos lados.

- **Angulo generico recebe arco simples com o valor escrito na bissetriz, do lado de fora do arco, no mesmo tamanho de corpo do resto da figura.** O arco delimita qual angulo esta sendo medido. Sem ele, um numero solto perto de um vertice de quadrilatero fica ambiguo entre o angulo interno, o externo e o do triangulo formado pela diagonal. O valor na bissetriz e a unica posicao que nao encosta em nenhum dos dois lados. Exemplo: arcoAngulo(B, A, C, {raio: 17, rotulo: '52 graus'}) para o enunciado do MAT07-12 que hoje descreve tudo por escrito. Se o angulo for menor que uns 25 graus, o rotulo sai do arco e vai para fora com linha de chamada de 0.6 pt.

- **Angulos congruentes recebem o mesmo numero de arcos concentricos: um arco para o primeiro par, dois para o segundo, tres para o terceiro. Angulo desconhecido recebe arco com incognita (x, alfa ou teta), nunca arco vazio.** E a forma de a figura carregar a hipotese sem escrever medida nenhuma, que e exatamente o que o PNLD faz nos casos de congruencia e semelhanca. Arco vazio nao significa nada e o aluno inventa um significado. Os arcos empilhados precisam de folga entre si; encostados viram um borrao. Exemplo: arcoAngulo(B, A, C, {n: 2, raio: 16, passo: 3.5}) desenha dois arcos de raios 16 e 19.5. No MAT08-12 (congruencia de triangulos) o par de triangulos sai com arco simples num par de angulos e dois tracinhos num par de lados, e o enunciado so pergunta qual caso e.

- **Lados congruentes recebem tracinhos curtos perpendiculares ao lado, no ponto medio: um tracinho, dois, tres, conforme o grupo de congruencia. Dois tracinhos sao paralelos entre si e separados por poucos pontos.** Mesma logica do arco: a figura diz que dois lados sao iguais sem gastar numero. O tracinho tem que ser perpendicular ao lado, nao vertical na pagina, senao num lado obliquo ele parece um lado a mais saindo do poligono. E precisa ficar no meio do lado, longe dos vertices, para nao competir com o rotulo do vertice. Exemplo: marcaLado(A, B, 2, {tamanho: 6, folga: 2.5}) no triangulo isosceles do MAT07-12: dois tracinhos em AB e dois em AC dizem isosceles, e o exercicio pergunta os angulos da base.

- **Vertice recebe letra maiuscula, colocada fora do poligono, na direcao que sai do centro da figura passando pelo vertice, afastada de 8 a 10 pt. Lado recebe letra minuscula ou a medida, tambem por fora, no ponto medio.** Maiuscula para ponto e minuscula para reta e a convencao brasileira padrao (UEL, Matematica Essencial), e ela e o que sustenta a leitura da lei dos senos e dos cossenos no MATEM2-03, onde o lado a e o oposto ao vertice A. Empurrar o rotulo para fora pelo raio do centro resolve o posicionamento automaticamente para qualquer poligono convexo, sem tabela de casos. Rotulo por dentro colide com diagonal, altura e hachura. Exemplo: rotuloVertice(P, 'A', {centro: centroide(pontos), afastamento: 9}) e rotuloLado(B, C, '5 cm', {centro: centroide(pontos), afastamento: 8}).

- **A espessura tem tres niveis fixos e so tres. Contorno da figura em 1.2 pt, linha auxiliar e diagonal e altura e raio em 0.6 pt, hachura e grade em 0.4 pt. Marca de congruencia (tracinho, arco, quadradinho) acompanha o contorno, em 0.9 pt.** A NBR 8403 exige que a linha larga tenha no minimo o dobro da estreita, justamente para que uma informacao nao seja confundida com outra. 1.2 contra 0.6 e exatamente 2. Trazendo para a pagina do material: em 1.2 pt a figura ainda le impressa em laser domestico, e o auxiliar em 0.6 pt some para segundo plano sem sumir de vez. Mais de tres niveis o olho nao distingue e vira ruido. As marcas ficam em 0.9 porque sao parte do enunciado, nao construcao: precisam pesar quase como o contorno. Exemplo: doc.linha(x1, y1, x2, y2, COR.texto, 1.2) para lado do poligono; doc.linha(..., COR.teal, 0.6) para a diagonal; doc.linha(..., COR.fio, 0.4) para a hachura.

- **Tracejado significa uma coisa so: o que nao esta la ou o que e construcao. Altura, prolongamento de lado, aresta escondida do solido, eixo de simetria. Diagonal que e objeto do exercicio vai em linha continua fina, nao tracejada.** Na NBR o tracejado e reservado a aresta nao visivel, e na cavaleira do livro didatico e assim que o cubo e o prisma sao desenhados. Se o tracejado tambem virar estilo decorativo para diagonal, o aluno do MATEM2-11 perde a leitura de profundidade do solido. A diagonal do retangulo no MAT07-12 existe de verdade dentro da figura, entao ela e continua, so mais fina e em outra cor. Exemplo: segmentoTracejado(V, pe, {padrao: '[2.5 2] 0'}) para a altura, com anguloReto no pe; diagonal(A, C, {espessura: 0.6, cor: COR.teal}) continua para a diagonal do quadrilatero.

- **Altura sempre vem com o quadradinho no pe. Se o triangulo for obtusangulo, desenhar o prolongamento do lado em tracejado ate o pe, e o quadradinho vai sobre o prolongamento.** A definicao e segmento perpendicular do vertice ao lado oposto ou ao seu prolongamento. Sem o quadradinho a altura vira uma ceviana qualquer e o aluno confunde com mediana e bissetriz, que e o erro classico dessa serie. Sem o prolongamento desenhado, a altura do obtusangulo aparece flutuando fora da figura e nao se sustenta visualmente. Exemplo: altura(V, A, B) devolve o pe e ja desenha o tracejado, o quadradinho e, quando o pe cai fora do segmento AB, o prolongamento tracejado mais fino em COR.muted.

- **Area destacada usa hachura de linhas paralelas finas, equidistantes, inclinadas a 45 graus em relacao ao contorno, com espacamento nunca menor que 3 pt. Se algum lado da figura tambem estiver a 45 graus, girar a hachura para 30 ou 60. Cinza claro chapado (COR.soft) so quando a regiao e grande e nao ha figura por baixo.** E a hachura generica do desenho tecnico, e e o que o enunciado brasileiro chama de area hachurada. Hachura paralela a um lado desaparece contra o contorno. O piso de espacamento vem da NBR: distancia minima entre paralelas de 0,7 mm, cerca de 2 pt, e para um aluno com dificuldade de leitura vale abrir para 4 ou 5 pt, porque hachura densa vira mancha e mancha esconde o contorno da regiao que era o assunto. Exemplo: hachurarPoligono(pontos, 45, 4.5, COR.fio, 0.4) na coroa circular ou na regiao entre o quadrado e o circulo inscrito, que e o formato classico de MATEM3-12.

- **Desenhar em escala sempre que possivel, e escrever a legenda 'Figura fora de escala' em 7 pt, COR.muted, abaixo e a direita da figura, apenas quando a proporcao real for impossivel ou enganosa de proposito.** Sao duas regras que puxam para lados opostos e a ordem entre elas importa. O aluno com dificuldade de atencao usa o desenho para conferir se a conta fechou: se o triangulo 3, 4, 5 sair com o cateto maior parecendo menor, a figura passa a atrapalhar. Por outro lado, quando um lado mede 2 e o outro 400, ou quando o exercicio quer que o aluno nao meca com regua, o aviso e obrigatorio, e e assim que ENEM, vestibulares e livro didatico fazem. Exemplo: avisoForaDeEscala(x, y) so no exercicio de semelhanca do MAT09-08 em que a sombra tem 24 m e o bastao 1,5 m. No triangulo pitagorico 3, 4, 5, sem aviso e com escala fiel.

- **A cor nunca carrega significado sozinha. Contorno em COR.texto, elemento acrescentado pelo enunciado ou pela resposta em COR.teal, e o teal sempre vem junto de uma diferenca de espessura ou de tracejado.** O material e impresso, e muita impressao domestica sai em cinza. Se a unica diferenca entre o lado dado e o lado procurado for navy contra teal, a figura morre no preto e branco. Codificar duas vezes (cor mais forma) custa nada e sobrevive a fotocopia. Exemplo: No gabarito do MAT09-06, a altura relativa a hipotenusa sai em COR.teal e tracejada; na versao do enunciado ela sai em COR.muted e tracejada mais clara, ou nao sai.

- **A figura carrega o simbolo que a fonte nao tem. Congruente, angulo, perpendicular e paralelo nao existem na base-14 deste gerador, entao a marca grafica e a notacao, e nao um enfeite dela.** Verificado no proprio pdf.js: o sinal de congruente, o de angulo, o de perpendicular, o de paralelo, gama, fi e Omega saem como interrogacao, e o circunflexo sobre B e sobre C tambem. Ou seja, escrever a hipotese em simbolos nao e uma alternativa disponivel. O tracinho, o arco, o quadradinho e a setinha dupla na reta paralela deixam de ser reforco e passam a ser o unico canal. Angulo pode ser nomeado por A com circunflexo, alfa, beta ou teta, que esses desenham. Exemplo: Em MAT08-11 (angulos em retas paralelas), as duas retas levam a marca de paralelismo (uma setinha em cada, duas setinhas no segundo par) porque nao ha como escrever r paralela a s. Os angulos correspondentes ganham arco simples nos dois.

- **Uma ideia por figura. Se o exercicio tem dois passos, sao duas figuras pequenas lado a lado, e nao uma figura com todas as marcas.** Essa e a regra que separa padrao didatico superior de figura que apenas existe. Um triangulo com tres alturas, tres medianas, duas diagonais e quatro arcos e tecnicamente correto e ilegivel. Para o aluno alvo deste material, cada linha a mais na figura e uma decisao a mais que ele precisa tomar antes de comecar a pensar no problema. Exemplo: No MAT09-06 (relacoes metricas), figura 1 e o triangulo retangulo com a altura e o pe; figura 2 repete o mesmo triangulo ja separado nos dois triangulos semelhantes, com os arcos mostrando os angulos iguais. Nunca as duas coisas no mesmo desenho.

- **A figura nunca substitui o texto do enunciado: ela repete visualmente o que o texto ja diz. Nenhum dado numerico existe apenas no desenho.** O banco tem versao em portugues e em ingles e um aluno com dificuldade de leitura precisa poder atacar o problema pelos dois canais. Se a medida de 52 graus so aparece no arco, quem esta lendo em voz alta ou usando leitor de tela perde o exercicio inteiro. Redundancia entre texto e figura e o oposto de poluicao dentro da figura: uma esta entre canais, a outra e dentro do canal. Exemplo: O enunciado do MAT07-12 continua dizendo 'dois angulos medem 52 graus e 61 graus', e a figura mostra os mesmos 52 e 61 nos arcos, com um ponto de interrogacao ou x no terceiro.

- **Circunferencia: centro marcado por ponto cheio pequeno com a letra O, raio e diametro em linha fina continua, arco destacado em linha grossa sobre a circunferencia, corda em linha fina. Angulo central com vertice em O e angulo inscrito com vertice sobre a circunferencia recebem arcos de numeros diferentes.** MAT09-11 e MATEM2-01 vivem da distincao entre angulo central e inscrito, e essa distincao e posicional, nao numerica: e onde esta o vertice. Engrossar o arco correspondente sobre a propria circunferencia e o que o livro faz para amarrar o angulo ao arco que ele enxerga, e e o passo que faz a relacao de metade ficar visivel em vez de decorada. Exemplo: arco(cx, cy, r, angIni, angFim, COR.teal, 1.8) por cima da circunferencia desenhada em COR.texto 1.2, mais arcoAngulo no vertice inscrito com n igual a 1 e no centro com n igual a 2.

- **A figura no enunciado e excecao, nao regra. O padrao do livro brasileiro e descrever por escrito; a figura entra quando a configuracao nao cabe numa frase, ou quando ler a configuracao E a habilidade avaliada.** Se toda questao de geometria ganhar figura, a lista vira poluicao visual e o aluno perde justamente o treino de traduzir texto em desenho, que e o que a prova cobra. O dado de pesquisa e forte: em 104 atividades de um livro didatico, o registro figural apareceu no enunciado de apenas 8, contra 42 nas resolucoes. O livro desenha muito mais para explicar do que para perguntar. E o INEP e explicito em que o suporte e opcional em Matematica. Exemplo: MAT07-12 exercicio 1 ('Num triangulo, dois angulos medem 52 graus e 61 graus. Quanto mede o terceiro?') deve continuar SEM figura: desenhar ali entrega a configuracao de graca. Ja o exercicio 17 ('as bissetrizes de B e C se encontram em I, quanto mede o angulo BIC') precisa de figura, porque a frase sozinha custa mais atencao do que o desenho. Regra pratica: figura no enunciado quando o texto precisaria de mais de uma oracao subordinada para posicionar os elementos.

- **Enunciado e figura, juntos, carregam todos os dados; e cada dado aparece em UM lugar so.** Regra literal do guia do INEP: o enunciado, com ou sem suporte, precisa apresentar todos os dados necessarios, sem omitir e sem excesso. Dado repetido nos dois lugares gera contradicao na primeira revisao do tema (alguem corrige o numero no texto e esquece do desenho) e obriga o aluno a conferir duas fontes. Exemplo: Em 'Um angulo externo de um triangulo mede 115 graus e um dos internos nao adjacentes mede 40 graus', ou os dois numeros vao para a figura e o texto so diz 'Na figura, determine x', ou o texto mantem os numeros e a figura fica sem medidas, so com o formato e a letra x. Nunca 115 no texto e 115 tambem no desenho.

- **Toda marcacao visual e glosada por escrito no proprio enunciado. Cor, hachura, tracejado e sombreado nunca sao o unico portador da informacao.** E o que a OBMEP faz sistematicamente, e e a diferenca entre uma figura que funciona e uma que exclui: a folha pode sair impressa em cinza, e o aluno com dificuldade de atencao precisa da ancora verbal para saber onde olhar. Sem a glosa, uma regiao hachurada e so ruido. Exemplo: Formulas colhidas da OBMEP, para copiar: 'qual e o perimetro (medida do contorno em vermelho) da figura', 'A regiao cinza na figura e um quadrado de area 36 cm2', 'Qual e a area da regiao sombreada?', 'o trapezio destacado tem vertices sobre os lados do retangulo', 'dobrado ao longo das linhas pontilhadas, como na figura'. O par certo e sempre marcacao no desenho mais substantivo no texto.

- **Figura nunca e numerada. A referencia e sempre por adjacencia, num conjunto fechado e curto de expressoes.** Nao ha 'Figura 1' em lista escolar brasileira, e no nosso caso a numeracao seria ativamente errada: em pdf.js, gerarMaterialTema renumera os exercicios com String(i + 1) sobre o subconjunto escolhido pela professora (op.escolhidos), entao qualquer numero fixo de figura sai fora de ordem assim que ela tira um exercicio da lista. Exemplo: Repertorio autorizado, em ordem de frequencia no material que li: 'Na figura, ...', 'Na figura a seguir, ...', 'A figura mostra ...', 'Observe a figura.', 'conforme a figura', 'como na figura ao lado'. Quando um exercicio traz mais de uma figura, elas recebem letra de item, a), b), c), ou algarismo romano I, II, III, e o comando fica no plural: 'Determine o valor de x nas figuras abaixo'. Nunca 'veja a Figura 3'.

- **A incognita mora na figura, no lugar exato onde ela e medida, e o comando so a nomeia. O rotulo e x a partir do 7o ano; e ponto de interrogacao do 2o ao 5o.** Se a incognita so aparece no texto, o aluno tem que descobrir sozinho de qual angulo ou lado se fala, e essa e uma segunda tarefa que a questao nao queria cobrar. Com dificuldade de leitura, e a tarefa que faz desistir. Nas fichas de escola publica que li, a figura carrega inclusive a expressao algebrica inteira no lugar do angulo (9x, 50 - x, 6b + 140, 2b + 150). Exemplo: Figura: um triangulo com 52 graus em A, 61 graus em B e x em C. Comando: 'Determine o valor de x.' A letra x fica dentro do arco do angulo C, na bissetriz, no mesmo corpo e na mesma cor dos outros dois rotulos, para nao virar destaque; quem destaca a incognita e o comando, nao a tipografia.

- **No gabarito, a figura so volta quando a resposta E uma construcao ou uma decomposicao. Quando a resposta e uma conta, o gabarito e texto.** Esta e a diferenca observada entre as duas fontes: as resolucoes do Toda Materia sobre paralelas e transversal nao reproduzem nenhuma figura, argumentam por escrito, e so desenham quando precisam tracar uma paralela auxiliar; ja a OBMEP redesenha sempre que a solucao e cortar a figura em pedacos. Repetir a figura sem acrescentar nada gasta meia folha e ensina a olhar em vez de justificar. Exemplo: MAT07-12 exercicio 8 (angulo externo) fecha em uma linha de texto, sem figura. MAT07-12 exercicio 17 (bissetrizes internas) merece a figura de volta com as duas bissetrizes e o ponto I. Nos temas de area, decomposicao e Pitagoras, o gabarito quase sempre desenha.

- **A figura do gabarito e a MESMA figura do enunciado, com a construcao acrescentada por cima numa camada distinta, e nao um desenho novo.** O aluno precisa reconhecer o proprio problema para aceitar a solucao; um desenho redesenhado do zero, com outra escala ou outra rotacao, quebra o reconhecimento e ele nao enxerga que e o mesmo objeto. A OBMEP explicita o par antes/depois: 'como esta indicado na figura a seguir e a direita'. Em codigo isso exige que a construcao dos vertices seja uma funcao pura chamada duas vezes, nao coordenadas digitadas a mao duas vezes. Exemplo: camadaResposta(doc, fig, function () { linhaAuxiliar(...); marcaAngulo(...); }): mesma lista de pontos, cor COR.teal, tracejado nos elementos acrescentados, rotulos dos valores encontrados. E o gabarito escreve 'A figura a seguir repete a do enunciado, com a paralela auxiliar tracejada.'

- **Figura de exercicio e bloco, alinhado ao recuo do enunciado, nao inline no meio da frase.** Em pdf.js o texto do exercicio e escrito em coluna unica de MARG_E + 20 ate MARG_D; nao ha reflow em torno de um objeto. Um float lateral ('figura ao lado') exigiria quebrar so as primeiras linhas numa largura menor, o que quebrarRico ate permite, mas para leitor com dificuldade de atencao a coluna estreita e pior. O bloco tambem sobrevive melhor a op.espacoParaResposta. Exemplo: Ordem fixa: numero do exercicio, enunciado completo, figura centrada na faixa [MARG_E + 20, MARG_D], legenda opcional, espaco de resposta. A figura vem DEPOIS do texto, nunca antes: o aluno le o que tem que fazer e so entao olha, senao fica preso no desenho.

- **Rotulos da figura e rotulos do texto sao literalmente os mesmos simbolos, com as mesmas convencoes: vertice em maiuscula, lado pelas duas extremidades, angulo interno em minuscula.** Convencao declarada no Matematica Essencial da UEL e seguida por toda a OBMEP ('os pontos P, Q, R e S sao pontos medios dos lados do quadrado'). Se o texto diz ABCD e a figura diz ABDC, ou se o texto fala 'o lado maior' e a figura so tem letras, o aluno perde a questao por leitura. Exemplo: 'Na figura, o quadrado ABCD tem area 40 cm2' exige que A, B, C, D estejam desenhados na ordem do contorno, no sentido anti-horario, com o rotulo empurrado para fora do poligono.

- **Elementos congruentes recebem a MESMA marca, e marcas diferentes significam medidas diferentes. Um tracinho, dois tracinhos, tres tracinhos para lados; um arco, dois arcos, tres arcos para angulos; quadradinho para o angulo reto.** Regra explicita nas fontes de congruencia do MEC e da UEL: 'os elementos congruentes tem a mesma marca'. E o unico jeito de dizer 'isosceles' ou 'paralelogramo' na figura sem escrever nada, e e o que permite fazer figura de congruencia (MAT08-12) e de semelhanca (MAT09-08) sem encher o desenho de numeros. Exemplo: Triangulo isosceles de MAT07-12 exercicio 9: um tracinho em cada lado igual, um arco em cada angulo da base, 40 graus escrito so no vertice. Nao escrever 'lados iguais' nem repetir a medida nos dois lados.

- **Lados paralelos levam a marca de seta simples e seta dupla; retas paralelas no texto vao como r//s.** Paralelogramo, trapezio e o tema inteiro de MAT08-11 dependem de dizer quais lados sao paralelos. Sem a marca, o desenho de um paralelogramo generico e indistinguivel de um quadrilatero qualquer levemente torto, e a propriedade que a questao usa fica invisivel. Exemplo: Trapezio de MAT07-12 exercicio 12: seta simples nas duas bases paralelas, tracinho nos dois lados nao paralelos iguais, 72 graus nos dois angulos da base maior, x nos outros dois.

- **A figura deve estar EM escala sempre que os dados permitirem; quando nao permitirem, o aviso vai dentro do enunciado, entre virgulas, e nunca como legenda solta.** O aviso existe para impedir que o aluno meca com regua ou transferidor em vez de calcular. Mas o inverso tambem vale, e e onde ganhamos do livro impresso: como desenhamos por codigo a partir dos numeros do proprio tema, um angulo de 52 graus pode sair com 52 graus de verdade, e ai o aluno que confere com transferidor e recompensado em vez de enganado. Figura fora de escala por preguica de calcular e defeito, nao convencao. Exemplo: Formas colhidas: 'A figura a seguir, fora de escala, representa um terreno.' e 'A figura nao esta desenhada em escala.' Casos em que somos obrigados a sair de escala: MAT07-12 exercicio 6 (lados 4, 7 e 12 nao fecham triangulo, o desenho tem que mostrar o vao) e razoes muito grandes que nao cabem na largura util.

- **Malha quadriculada de lado 1 e um suporte legitimo de enunciado, e nao decoracao.** A OBMEP usa 'desenhadas em uma malha de quadrados de lado 1' como o proprio enunciado de area, e a colecao Apis concentra 93 por cento das atividades com malha na malha quadriculada. A malha da ao aluno um instrumento de medida dentro da figura e tira dele a carga de ler numeros, o que e exatamente o que se quer para quem tem dificuldade de leitura. Exemplo: MAT02-06, MAT03-07, MAT05-11, MAT06-13 e todo tema de area ganham muito com malha. A malha vai em COR.fio a 0,3 pt, o contorno da figura em COR.navy a 1,2 pt: quatro vezes mais grossa, para a figura nunca se confundir com o fundo.

- **Na explicacao a figura aparece na posicao prototipica; no exercicio ela aparece girada.** Sintese de duas exigencias opostas. A literatura registra como defeito de livro didatico as figuras sempre na mesma posicao, o que produz o aluno que nao reconhece um quadrado girado; a apreensao operatoria de Duval inclui exatamente a modificacao posicional. Mas para quem tem dificuldade de atencao, a primeira apresentacao de um conceito tem que ser a mais legivel possivel. Entao: base horizontal na explicacao, giro no bloco B e no bloco C. Exemplo: Triangulo retangulo de MAT09-07 desenhado com os catetos horizontal e vertical na explicacao, e girado 20 ou 35 graus nos exercicios, para o aluno nao aprender que hipotenusa e o lado inclinado da direita.

- **Legenda de figura, quando existe, e uma linha unica, em COR.muted, corpo 7,5, abaixo da figura, e serve para duas coisas so: o aviso de escala e a glosa da hachura.** O item do INEP nao tem legenda descritiva de figura, e legenda longa vira segundo texto para ler. Mantendo o uso restrito a esses dois casos, a legenda nunca compete com o enunciado. Exemplo: 'A parte hachurada e a regiao pedida.' ou 'Figura fora de escala.' Nunca 'Triangulo ABC com os angulos indicados', que so repete o desenho.

- **Anos iniciais (2o ao 5o): nenhuma letra em vertice. A figura e identificada por palavra no enunciado ou por cor, nunca por codigo ABC.** No nivel de visualizacao de van Hiele a crianca reconhece pela forma global e ainda nao le a figura por propriedades. Letra em vertice e um codigo do nivel seguinte: entra como ruido e rouba a atencao do que se quer contar, que sao lados e cantos. O proprio banco confirma o registro da faixa: MAT02-06 pergunta quantos lados e quantos cantos, nao quantos vertices tem o poligono ABC. Exemplo: MAT02-06 exercicio 3, 'uma figura tem 4 cantos e todos os lados do mesmo tamanho': desenhar o quadrado com contorno navy de 1.5 pt, um ponto cheio de 2 pt em cada canto e um traco de congruencia em cada lado. Nenhuma letra, nenhum numero.

- **Anos iniciais: a primeira aparicao de uma forma vai na posicao prototipica (base paralela a margem), e pelo menos uma aparicao seguinte vai girada de proposito, entre 15 e 40 graus.** A literatura de van Hiele em portugues registra que nessa fase o aluno so compara figuras na posicao prototipica, e por isso o triangulo apoiado no bico deixa de ser triangulo para ele. Se todo desenho do material sair com a base paralela a margem, o material ensina o preconceito visual em vez de corrigi-lo. A ordem importa: reconhecer primeiro, desestabilizar depois. Exemplo: MAT02-06 exercicio 6, 'um quadrado foi girado e ficou apoiado num canto, ele virou outra figura?': a explicacao mostra o quadrado apoiado no lado, o exercicio mostra o mesmo quadrado girado 45 graus, com os mesmos 4 pontos de canto e os mesmos 4 tracos de lado, para o aluno contar e ver que nada mudou.

- **Anos iniciais: traco grosso e figura grande. Contorno de 1.4 a 1.6 pt, menor dimensao da figura nunca abaixo de 80 pt, uma figura por ideia.** Traco de 0.7 pt, que e o padrao do linha() do pdf.js, e o peso de fio de tabela: some ao lado do texto de corpo 10 e desaparece de vez na impressora de casa. Figura pequena com marca pequena obriga o aluno a aproximar o olho, e o aluno da casa tem dificuldade de atencao. Espaco em branco em volta e parte da figura, nao desperdicio. Exemplo: Na explicacao de MAT03-07 (Figuras planas e seus lados), quatro figuras em duas linhas de duas, cada uma numa caixa de 110 por 110 pt, e nao seis figuras espremidas numa faixa.

- **Medida na figura entra no 4o ano, e sempre com a unidade escrita por extenso ao lado do numero. Antes disso, nenhum numero sobre a figura.** Ate o 3o ano a figura serve para contar (lados, cantos, faces), e numero solto sobre o desenho e lido como contagem, nao como medida. Do 4o ano em diante o banco ja pede giro e classificacao de angulo em graus (MAT04-07), entao o numero passa a ter significado de medida e precisa da unidade para nao virar rotulo ambiguo. Exemplo: MAT04-08 (Poligonos e simetria): retangulo com '6 cm' centrado abaixo do lado de baixo e '4 cm' a esquerda do lado esquerdo, cada rotulo com halo branco por baixo. Nunca '6' e '4' soltos.

- **O quadradinho de angulo reto entra no 4o ano, junto com a palavra angulo reto, e a partir dai e obrigatorio em toda figura que tenha um.** E a convencao universal do material brasileiro (o angulo reto e identificado por um pequeno quadrado encaixado dentro dele) e, no nosso caso, e a unica forma de dizer perpendicular: o glifo de perpendicular nao existe no repertorio do pdf.js, o teste confirma que sai interrogacao. Se o quadradinho falta, o aluno precisa deduzir do desenho, e o desenho pode estar fora de escala. Exemplo: MAT04-07 exercicio 3, duas retas que se cruzam formando quatro angulos retos: o quadradinho vai num dos quatro angulos, nao nos quatro, para nao poluir. Ja em MAT09-07 (Pitagoras) o quadradinho no vertice do angulo reto e o que define qual lado e a hipotenusa.

- **Malha quadriculada e o fundo padrao dos anos iniciais para simetria, deslocamento, ampliacao e localizacao. Malha em COR.fio a 0.3 pt, figura por cima em navy a 1.5 pt.** A BNCC ancora essas habilidades na malha (EF04MA16 para deslocamento e localizacao, EF04MA19 para simetria de reflexao). A malha da a unidade de medida sem exigir regua e da ao aluno com dificuldade motora um trilho para contar. A diferenca de peso entre malha e figura tem que ser de pelo menos 4 vezes, senao a malha compete com a figura. Exemplo: MAT05-11 (Localizacao e plano cartesiano) e MAT04-08 (simetria): malha de passo 14 pt, eixo de simetria tracejado em teal, figura original em navy cheia e a refletida em navy tracejada.

- **Anos finais (6o ao 9o): letra maiuscula em cada vertice, colocada FORA do poligono, sobre a bissetriz externa do angulo, e as letras percorrem o contorno numa unica volta, sem cruzar.** E a convencao do material brasileiro e a condicao para o enunciado poder falar de lado AB e de angulo B sem desenhar de novo. Colocar a letra por deslocamento fixo em x e y e o erro classico: em triangulo obtuso a letra cai dentro da figura. Sobre a bissetriz externa ela sempre sai. E ordem no contorno importa: ABDC nomeia um quadrilatero cruzado e o aluno ve outra figura. Exemplo: MAT07-12 exercicio 1, dois angulos medem 52 e 61 graus: triangulo ABC desenhado com os angulos verdadeiros, arco em A com '52 graus', arco em B com '61 graus', arco em C com 'x'. O enunciado passa a ser 'quanto mede o angulo C', que e a pergunta que a prova do colegio faz.

- **Anos finais: a igualdade se marca no desenho, nao no texto. Lados congruentes ganham 1, 2 ou 3 tracinhos; angulos congruentes ganham 1, 2 ou 3 arcos concentricos; paralelas ganham 1 ou 2 pontas de seta no meio do segmento.** Convencao consolidada no material brasileiro (lados correspondentes congruentes marcados com simbolos graficos iguais) e, aqui, obrigatoria por limitacao tecnica verificada: o sinal de congruencia, o de paralelo e o de perpendicular nao sao desenhaveis pelo pdf.js. A marca grafica tambem e mais barata cognitivamente do que uma frase: o aluno ve a igualdade em vez de ler que ela existe. Exemplo: MAT08-12 (Congruencia de triangulos): os dois triangulos lado a lado, um tracinho em AB e em A'B', dois tracinhos em BC e em B'C', um arco em B e em B', o que mostra o caso LAL sem escrever uma palavra. Em MAT08-11 (angulos em retas paralelas), duas setas em cada uma das paralelas e arco simples nos angulos iguais.

- **Anos finais: a figura carrega os dados do enunciado e nada mais. O que se pergunta aparece como x na figura, nao como valor.** E a virada de funcao da figura na faixa. No 6o e 7o ela ainda ilustra o texto; do 8o em diante ela e a fonte dos dados, e o enunciado passa a dizer apenas o que se quer. Se a figura mostrar tambem a resposta, o exercicio deixa de existir. Se mostrar dado que o enunciado ja deu por escrito, dobra a carga de leitura de quem le com dificuldade. Exemplo: MAT09-06 exercicio 3, projecoes 4 e 9: a figura traz o triangulo retangulo com a altura, m igual a 4, n igual a 9 e h marcado como x. O enunciado encolhe para 'calcule h', e o aluno le a relacao na figura em vez de montar o desenho de cabeca.

- **Do 9o ano em diante, o que foi acrescentado a figura (altura, projecao, diagonal, mediana, reta auxiliar) tem peso visual proprio: teal, 0.7 pt e tracejado. O contorno original fica navy, 1.1 pt e continuo.** O aluno precisa distinguir o que estava dado do que ele mesmo construiu, e essa distincao e metade da resolucao em relacoes metricas, semelhanca e geometria espacial. Nao pode ficar so na cor: navy e teal tem luminancia parecida e viram o mesmo cinza na impressora de casa, entao a diferenca precisa ser carregada tambem pela espessura e pelo tracejado. Exemplo: MAT09-06: o triangulo retangulo em navy continuo, a altura relativa a hipotenusa em teal tracejado, o quadradinho no pe da altura, e m e n rotulados sobre a hipotenusa. No gabarito, a mesma figura com o valor calculado em vermelho no lugar do x.

- **Nomear angulo por escrito so quando o vertice for A, E, I, O ou U. Nos demais casos, o rotulo do angulo e o arco mais o valor, ou uma letra grega do repertorio (alfa, beta, teta), ou simplesmente x.** Restricao tecnica confirmada por teste: o pdf.js desenha A, E, I, O e U com circunflexo, mas nao desenha o C com circunflexo nem circunflexo combinante sobre outra letra, e nao desenha gama. Escrever a notacao classica com o vertice acentuado quebra em B, C, D. Alem disso o comentario do proprio pdf.js proibe simbolo grego dentro de negrito, porque a base-14 nao tem Symbol em negrito e o peso sai misturado. Exemplo: Em vez de tentar o angulo B com circunflexo, escrever 'angulo B' no texto e marcar o arco em B na figura. No ensino medio, alfa e teta nos arcos, nunca gama, e nunca em negrito.

- **Ensino medio: a figura fica minima e portadora. So o contorno, as letras dos vertices e as duas ou tres grandezas em jogo. Nada de grade, nada de sombra, nada de rotulo redundante.** No nivel de deducao a figura vira instrumento de raciocinio, e cada elemento extra e uma hipotese falsa que o aluno pode assumir sem perceber (o classico e supor que um triangulo desenhado quase isosceles e isosceles). Menos tinta tambem e o unico jeito de caber tres ou quatro figuras numa folha de lista de 19 exercicios. Exemplo: MATEM2-03 (lei dos senos e dos cossenos): triangulo ABC com a, b e c junto aos lados opostos aos respectivos vertices, um arco em A com alfa, e nada mais. Sem malha, sem eixo, sem marca de congruencia.

- **Ensino medio: desenhar sempre fiel aos numeros dados quando a construcao for possivel, e declarar 'figura fora de escala' no rodape da figura quando nao for.** E a convencao dos enunciados de vestibular e do ENEM, onde 'esquema sem escala' aparece escrito quando o desenho nao pode ser medido. Para o aluno da casa vale mais o lado positivo da regra: quando a figura e fiel, ele pode conferir a resposta olhando, o que e um apoio real para quem se perde no meio de uma conta longa. Fidelidade e barata, basta resolver o triangulo por lei dos cossenos antes de desenhar. Exemplo: MAT07-12 exercicio 6, existe triangulo de lados 4, 7 e 12? Nao existe: aqui a figura nao pode ser desenhada, e a resposta certa e o material mostrar as tres varetas de 4, 7 e 12 alinhadas, com 4 mais 7 medindo 11 e faltando 1 para fechar. Ja no exercicio 2, lados 7, 7 e 10, o triangulo sai fiel, com os dois tracinhos nos lados de 7.

- **Ensino medio, espacial: perspectiva cavaleira, profundidade a 45 graus e reduzida a metade, arestas visiveis continuas e arestas ocultas tracejadas. Secao ou area pedida vai hachurada, nunca preenchida em cor cheia.** E a representacao que o livro didatico e o professor usam no quadro, por ser simples de construir e por preservar as propriedades que interessam. As arestas ocultas tracejadas sao o que permite contar arestas e vertices sem ambiguidade, que e literalmente o que MAT05-08 e MATEM2-11 pedem. Hachura em vez de preenchimento porque preenchimento cheio esconde as arestas que passam por baixo e mata a leitura da figura. Exemplo: MATEM2-11 exercicio 5, diagonal do paralelepipedo 3 por 4 por 12: caixa em cavaleira, tres arestas ocultas tracejadas, a diagonal da face em teal tracejado, a diagonal do solido em teal continuo e o quadradinho no vertice onde as duas se encontram.

- **Ensino medio, analitica e trigonometria: o plano cartesiano e a figura. Quatro quadrantes quando houver valor negativo, ponto rotulado com o par de coordenadas colado no ponto, e projecoes tracejadas ate os dois eixos.** Em MATEM3-01 a MATEM3-04 e em MATEM2-01 o objeto de estudo e a posicao, nao a forma, entao esconder o eixo negativo muda o problema. O par de coordenadas junto ao ponto, e nao numa legenda, e aplicacao direta do efeito de divisao da atencao: rotulo separado do elemento obriga o leitor a costurar duas fontes de informacao, que e exatamente o custo que um aluno com dificuldade de leitura nao pode pagar. Exemplo: MATEM3-02 exercicio 1, reta por (1, 2) e (3, 8): plano com os dois pontos marcados e rotulados A(1, 2) e B(3, 8), a reta prolongada ate a borda da caixa, e o triangulo de inclinacao desenhado em teal com '2' na horizontal e '6' na vertical, que e de onde sai o coeficiente angular 3.

- **Toda figura e bilingue por construcao: nenhuma palavra fica presa no codigo do desenho, todo texto da figura vem do tema nas duas linguas.** O banco mantem PT e EN no mesmo tema justamente para poder conferir que as duas versoes usam os mesmos numeros. Uma figura com 'altura' embutido no desenhador quebra silenciosamente a folha em ingles, e a quebra nao aparece na verificacao, porque a verificacao olha as contas, nao o desenho. Exemplo: marcaLado(doc, A, B, rot.altura) onde rot vem do tema: 'altura' em portugues, 'height' em ingles. Letra de vertice, numero e unidade sao neutros e podem ficar no desenho.

- **Poliedro sai em perspectiva cavaleira: profundidade fugindo a 45 graus para cima e para a direita, com as medidas de profundidade reduzidas a metade. A face da frente fica em verdadeira grandeza.** E a projecao dos livros de geometria espacial brasileiros, e a unica em que a base quadrada continua parecendo um quadrado na face frontal. Sem a reducao de 1/2 o solido parece esticado para tras e o aluno le a profundidade como se fosse maior que a largura, o que estraga qualquer questao de volume. Isometrica deforma as tres faces por igual e so vale quando nenhuma face precisa ser reconhecida. Exemplo: cavaleira({angulo: 45, reducao: 0.5, escala: 3.4, x: 70, y: 620}) devolve p(x, y, z). Cubo de aresta 22: caixa(doc, pr, 22, 22, 22). Rodado, saiu como cubo de livro.

- **Aresta escondida e desenhada, nunca omitida, e vai em tracejado curto e fino na cor auxiliar (COR.muted, 0.7 pt, padrao '2 2'). Aresta visivel vai cheia em COR.navy, 1.1 pt.** A aresta oculta e o que informa que o solido e fechado e tem volume. Apagar as tres arestas do vertice de tras transforma o cubo num hexagono riscado, e a criança com dificuldade de leitura perde justamente a informacao de profundidade. Deixa-las cheias produz ambiguidade de qual face esta na frente. Exemplo: Na caixa desenhada com profundidade subindo para a direita, o vertice escondido e o de tras, embaixo e a esquerda: as tres arestas que morrem nele (E-F, E-H e A-E) saem tracejadas, as outras nove saem cheias.

- **Circunferencia vista em perspectiva vira elipse com um unico achatamento em toda a folha (ry = 0.40 * rx), e a metade de tras da base vai tracejada enquanto a da frente vai cheia. Isso vale para cilindro, cone e para o equador da esfera.** Achatamento diferente entre duas figuras da mesma folha faz um cilindro parecer visto de cima e o outro visto de lado, e o aluno acha que sao solidos diferentes. A metade de tras tracejada e o que separa 'vejo um solido' de 'vejo dois riscos'; sem ela o cilindro vira um retangulo com dois cantos redondos. Exemplo: cilindro(doc, 100, 450, 30, 80): tampa de cima como elipse inteira cheia, base com arco de 180 a 360 cheio e arco de 0 a 180 tracejado em muted. A constante ACHATAMENTO = 0.40 mora num lugar so (figuras/solidos.js).
  Era 0,34 e passou a 0,40 em 02/09/2026, medido no painel dos cinco solidos: a projecao
  exata da base circular e uma elipse inclinada 7,0 graus (1,068 r por 0,331 r) e, alinhada
  aos eixos, daria 0,354; a 0,40 os dois arcos da menor base do painel ficam a 11,2 pt no
  eixo e 6,9 pt a 3 pt do vertice, contra 9,9 e 6,1 a 0,34. E uma constante so
  (ACHATAMENTO no solidos.js); quem preferir 0,34 muda um numero.

- **Planificacao NAO tem perspectiva: nela circunferencia e circunferencia, quadrado e quadrado. Linha de dobra vai tracejada e fina; contorno de corte vai cheio. As pecas encostam umas nas outras exatamente onde o molde dobra.** O molde esta deitado na mesa, entao desenhar a base do cilindro como elipse e uma contradicao dentro da propria figura e desmonta a ideia que a planificacao existe para ensinar, que e 'isto aqui e o mesmo objeto aberto'. Peca solta no espaco nao mostra onde dobra, e sem a diferenca entre dobra e corte o molde vira um amontoado de retangulos. Exemplo: planificacaoCilindro(doc, x, y, r, h): retangulo de largura 2*pi*r com as duas circunferencias de raio r tangentes ao lado de cima e ao de baixo, tocando no ponto medio. Foi exatamente o erro que o primeiro render cometeu, e corrigi-lo mudou a leitura da figura.

- **Eixo do plano cartesiano leva seta so na ponta positiva, com o nome do eixo (x e y) logo depois da seta, e o 0 escrito uma vez no cruzamento. Numero em cada unidade, do lado de fora do eixo.** Seta nos dois sentidos do mesmo eixo e erro classico de material didatico: a seta significa 'e para ca que cresce', nao 'a reta continua'. Escrever 0 nos dois eixos duplica o zero da origem. Numero por dentro do quadro se mistura com a figura. Exemplo: planoCartesiano com triangulinho preenchido em (x0 + largura + 9, oy), rotulo 'x' logo a direita dele, e '0' unico alinhado a direita e abaixo da origem.

- **Escala igual nos dois eixos sempre que a figura contiver circunferencia, angulo medido, distancia ou o ciclo trigonometrico. A altura da moldura passa a ser calculada a partir da largura, nao escolhida.** Com unidade diferente em x e em y a circunferencia de raio 3 sai ovalada, o ciclo trigonometrico deixa de ter raio 1 visualmente, o angulo reto sai torto e a hipotenusa mente sobre o Pitagoras. O aluno mede a figura com o olho antes de ler a conta, e uma figura que mente e pior que nenhuma figura. Exemplo: altura = largura * (yMax - yMin) / (xMax - xMin). No primeiro render, x indo de -1,4 a 1,4 em 160 pt e y de -1,3 a 1,3 em 130 pt deixou o ciclo trigonometrico visivelmente ovalado; com a regra, ficou redondo.

- **Ciclo trigonometrico: raio 1, centro na origem, origem dos arcos no ponto (1, 0), giro no sentido anti-horario, quadrantes I a IV nessa ordem. Seno lido na vertical e cosseno na horizontal, cada um com sua guia tracejada saindo do ponto ate o eixo correspondente.** E a convencao unanime do material brasileiro, e o sentido anti-horario e o unico jeito de o sinal do seno e do cosseno por quadrante fazer sentido. As duas guias tracejadas sao o que transforma a figura em instrumento de leitura, e nao em enfeite: e delas que sai a resposta de 'em que quadrante o cosseno e negativo'. Exemplo: elipse do ciclo em navy 1,2 pt, raio em teal do centro ate P, marcaAngulo(doc, ox, oy, 0, 50, {raio: 20, rotulo: 'x'}), guias tracejadas em muted de P ate os dois eixos, rotulos 'sen x' e 'cos x' encostados no eixo certo.

- **Conica leva sempre os elementos rotulados sobre a figura: elipse com F1 e F2 no eixo dos focos e a e b marcados; hiperbole com V1, V2, F1, F2, o retangulo fundamental tracejado e as assintotas como as diagonais desse retangulo prolongadas; parabola com foco, vertice e diretriz tracejada.** A pergunta do exercicio e sempre sobre esses elementos (achar c, achar a excentricidade, achar a assintota), entao a figura sem eles nao serve nem ao enunciado nem ao gabarito. O retangulo fundamental e o unico jeito de a assintota deixar de ser formula decorada: ela passa a ser a diagonal de um retangulo que o aluno ve. Exemplo: Hiperbole x^2/9 - y^2/16 = 1: retangulo tracejado de -3 a 3 e de -4 a 4, duas retas auxiliares pelas diagonais prolongadas ate a moldura, ramos desenhados por pontos, V1 e V2 marcados. Rodado, e a figura do livro.

- **Reta no plano atravessa a moldura inteira, cortada nos limites do quadro, e nunca para nos dois pontos dados. Ponto dado e bolinha cheia com o nome ao lado.** Reta que comeca e acaba nos dois pontos vira segmento, e o aluno passa a achar que a solucao de um sistema so pode estar entre os dois pontos. Cortar na moldura tambem e o que deixa a intersecao de duas retas cair dentro do desenho. Exemplo: retaNoPlano(doc, e, 1, -1, 1, {limites: [-4, 5, -3, 4]}) resolve a*x + b*y + c = 0 nos quatro lados do quadro e liga os dois cortes validos.

- **Retangulo branco cobrindo toda a area da figura, com folga para os rotulos, antes do primeiro traco. Depois disso o titulo da figura, nunca antes.** A marca d'agua e um circulo de 96 pt com um NW de 82 pt no centro da pagina, em COR.marca, quase a mesma cor da malha: onde as duas se cruzam a malha some, e foi exatamente isso que aconteceu no grafico de fisica. No render de teste, uma folga curta deixou o NW aparecer atras do ciclo trigonometrico e atras da planificacao do cone. E o retangulo branco apaga o que ja foi desenhado, entao ele precisa vir antes do titulo, nao depois. Exemplo: limparFundo(doc, x0 - 26, y0 - 24, largura + 44, altura + 38) dentro do proprio planoCartesiano, e chamada explicita com folga maior nos blocos de solido.

- **Tres niveis de tinta e nada mais: COR.navy para o contorno da figura, COR.teal para o que a questao pergunta ou o que o gabarito acrescenta, COR.muted para o auxiliar (aresta oculta, assintota, diretriz, guia de leitura). Preenchimento so como hachura leve, nunca como area chapada.** O material serve a um aluno com dificuldade de atencao: cada cor a mais e uma decisao a mais antes de comecar a pensar. Com tres niveis fixos o aluno aprende a ler a folha uma vez e vale para todas. Area chapada escurece a folha impressa em preto e branco e come o rotulo por cima. Nao existe COR.vermelho na identidade, ao contrario do que o briefing supoe: o destaque e o teal. Exemplo: Cubo em navy, diagonal interna pedida em teal tracejado, arestas ocultas em muted tracejado fino, base hachurada em teal 0,45 pt com espacamento de 4,5 pt.

- **Rotulo de figura usa so o repertorio que o pdf.js sabe desenhar: letra latina acentuada, o grau (simbolo de grau do WinAnsi) e as gregas de SIMBOLOS (pi, Delta, Sigma, alfa, beta, teta). Nada de gama, lambda ou fi, e nenhuma grega dentro de negrito.** Fonte fora da base-14 significa embutir arquivo de fonte. Caractere que a fonte nao tem sai como interrogacao na folha impressa, o que e pior do que nao rotular. E a Symbol nao tem versao negrito: um 'teta' em bold ao lado de um 'x' em bold sai com dois pesos diferentes na mesma palavra. Exemplo: Angulo escrito como 'x' ou 'alfa' sem negrito, medida escrita como '52°'. Vertice como A, B, C, D em negrito, que sao latinos e podem.

- **A mesma figura serve a explicacao, ao enunciado e ao gabarito, por camadas: o gabarito acrescenta traco sobre a figura do enunciado, nunca desenha outra figura.** E o padrao que ja existe em graficos.js, com a opcao comLeitura. Redesenhar produz duas figuras ligeiramente diferentes, e o aluno gasta atencao comparando desenho em vez de conferir a conta. Por camadas, o gabarito literalmente mostra o que faltava enxergar. Exemplo: cone(doc, cx, cyBase, r, h) no enunciado; cone(doc, cx, cyBase, r, h, {medidas: true}) no gabarito, acrescentando altura tracejada, raio, geratriz e o quadradinho do angulo reto na base.

- **Solido apoiado: base na horizontal, altura na vertical, e a altura marcada com tracejado do apice ate o centro da base mais o quadradinho de angulo reto no pe.** Altura oblíqua obriga o aluno a girar a cabeça e faz confundir altura com aresta lateral ou com geratriz, que e o erro comum de piramide e de cone. O quadradinho no pe da altura e a afirmacao visual de que aquela e a altura, e nao um segmento qualquer. Exemplo: piramideQuadrada(doc, pr, 22, 26, {altura: true}) desenha do apice ate o centro da base em teal tracejado, marca o pe com bolinha e poe anguloReto(doc, pe, 90, 0, {tam: 5}).

- **Vertices nomeados em sentido anti-horario a partir do canto inferior esquerdo da face da frente, e o solido segue A, B, C, D na base e E, F, G, H no topo ou na face de tras.** O enunciado escrito precisa poder dizer 'a diagonal AG' sem ambiguidade, e a nomeacao estavel permite que o gerador escreva o texto do exercicio a partir da mesma estrutura que desenhou a figura. Nomeacao ad hoc por figura garante contradicao entre desenho e enunciado assim que forem gerados em momentos diferentes. Exemplo: caixa() devolve o mapa {A, B, C, D, E, F, G, H} com o ponto de pagina de cada vertice, e quem escreve o rotulo ou a diagonal usa esse mapa.

- **Angulo reto e o quadradinho no vertice, nunca o texto '90 graus'. Angulo qualquer e o arco com o numero por fora do arco, do lado de fora da figura.** Sao 1299 ocorrencias de angulo nos 29 temas. Escrever '90' custa dois caracteres de leitura e um salto de atencao; o quadradinho e reconhecido sem ler. Se o quadradinho nao existir como primitiva, todo triangulo retangulo, toda altura e todo Pitagoras vao precisar de um rotulo de texto a mais, e o teto de marcas por figura estoura antes de a figura ficar pronta. Exemplo: No triangulo retangulo de MAT09 com catetos 3 e 4, o vertice reto leva marcaAnguloReto(B, A, C) e nenhum texto; os catetos levam medidaLado com '3 cm' e '4 cm'. Total de rotulos de texto na figura: dois, mais a incognita x na hipotenusa.

- **Igualdade se marca, nao se escreve. Lados congruentes levam um, dois ou tres tracinhos transversais; angulos congruentes levam um, dois ou tres arcos concentricos.** E a unica forma de dizer 'estes dois sao iguais' sem gastar dois rotulos de texto e sem obrigar o aluno a comparar duas strings. Para um aluno com dificuldade de leitura, comparar dois tracinhos e percepcao imediata; comparar 'AB = 5' com 'BC = 5' e leitura, decodificacao e memoria de trabalho. Cowan da cerca de 4 itens simultaneos: cada rotulo de texto evitado e um item liberado. Exemplo: Triangulo isosceles de MAT07-12: ticksLado(A, B, 1) e ticksLado(A, C, 1) nos dois lados iguais, marcaAnguloIgual nos dois angulos da base tambem com um arco. Nenhum numero aparece, e a figura ja diz o teorema.

- **Vertice em maiuscula, lado oposto na minuscula do mesmo nome, angulo pela letra do vertice. Rotulo de vertice sempre fora do contorno, deslocado na direcao da bissetriz externa do angulo.** E a notacao dos livros do PNLD e do proprio banco, que ja escreve 'A + B + C = 180' em MAT07-12. Se a figura usar outra letra, o aluno tem que traduzir entre o texto e o desenho, que e exatamente o efeito de atencao dividida de Sweller. Rotulo por dentro da figura colide com hachura, com diagonal e com o arco de angulo; por fora, na bissetriz externa, nunca colide, porque a bissetriz externa aponta para o unico setor vazio ao redor do vertice. Exemplo: rotularVertices(pts, ['A','B','C'], {folga: 9}) calcula, em cada vertice, a soma normalizada dos dois versores dos lados, inverte o sinal e desloca 9pt nessa direcao. Nao ha coordenada literal ajustada na mao, ao contrario das linhas 103 a 118 do graficos.js.

- **Escala igual em x e em y, sempre. Enquadramento por caixa com preservacao de proporcao, nunca por esticamento.** O graficos.js tem px e py com escalas independentes (linhas 15 e 16), o que e correto num grafico de temperatura contra calor e destroi geometria: um quadrado vira retangulo, um angulo de 45 graus vira 30, e a marca de angulo reto passa a mentir. Pior, o aluno que confere a figura com regua ou com o olho descobre que a figura discorda do enunciado, e a partir daí ele para de confiar em todas as figuras do material. Exemplo: enquadrar(pts, {x, y, largura, altura}) devolve uma unica escala s = min(largura/larguraPts, altura/alturaPts) e centraliza a sobra. Uma escala, nao duas.

- **A figura tem que fechar com os numeros do enunciado. Triangulo se constroi a partir dos dados, nao a partir de coordenadas bonitas.** O banco escreve 'dois angulos medem 52 e 61 graus' em MAT07-12. Se o desenho mostrar um triangulo qualquer, a figura vira decoracao e ensina ao aluno que figura nao vale conferir. Numa turma com dificuldade de atencao isso e caro: ele ja tende a resolver pelo desenho em vez do enunciado, e o desenho precisa merecer. Exemplo: trianguloPorAngulos(52, 61, {base: 120}) devolve os tres pontos com os angulos de verdade. trianguloPorLados(3, 4, 5) devolve o retangulo de verdade, com o angulo reto caindo onde deve, sem ninguem ter que posicionar o vertice na mao.

- **Aresta visivel em traco cheio, aresta oculta em tracejado curto. Solido em projecao cavaleira: face da frente em verdadeira grandeza, profundidade a 45 graus e em meia escala.** Sao 259 ocorrencias de solido nos temas. E a projecao que todo livro brasileiro de fundamental e medio usa, e a unica em que o aluno consegue ler a face da frente direto, sem corrigir mentalmente. Aresta oculta em cheio faz o cubo oscilar entre duas leituras (o efeito Necker), e um aluno com dificuldade de atencao perde tempo real nessa oscilacao. Aresta oculta apagada e pior: some a informacao de que o solido e fechado. Exemplo: caixa3D(4, 3, 2, {ocultas: 'tracejado'}) desenha as nove arestas visiveis em COR.navy 1.1pt e as tres ocultas em COR.muted 0.7pt com padrao [2 2].

- **Regiao pedida em cinza claro uniforme, e o enunciado diz 'regiao sombreada'. Hachura so quando existem duas regioes distintas na mesma figura que precisam ser diferenciadas entre si.** A convencao brasileira dos bancos de questao e do ENEM e 'regiao sombreada' em cinza, e a conta e quase sempre uma subtracao. Cinza uniforme tem borda unica, entao a figura continua com o mesmo numero de linhas que tinha; hachura acrescenta dezenas de linhas paralelas que competem com os lados, com as diagonais e com o arco de angulo. Para dificuldade visual e de atencao, hachura densa vira textura que o olho tenta ler como conteudo. O dono pediu hachura, e ela deve existir, mas como excecao nomeada, nao como preenchimento padrao. Exemplo: preencherPoligono(quadrado, CINZA_AREA) para 'calcule a area sombreada'. hachurarPoligono somente no caso de dois setores diferentes do mesmo circulo, um a 45 graus e outro a 135 graus, e ainda assim com legenda de uma palavra ao lado de cada um.

- **Teto de marcas ativas por figura: cinco. Marca ativa e todo elemento que o aluno precisa ler ou interpretar (numero, letra de vertice, arco de angulo, quadradinho, tracinho de congruencia, seta de paralelismo, rotulo de regiao). O contorno nao conta.** Cowan da cerca de 4 mais ou menos 1 itens simultaneos na memoria de trabalho, e a informacao evapora em 10 a 15 segundos se nao for ensaiada. Uma figura com nove numeros nao e uma figura dificil, e uma figura impossivel: o aluno le os quatro primeiros, os tres seguintes empurram os primeiros para fora, e ele recomeca. O sintoma tipico e o aluno que volta ao desenho cinco vezes na mesma questao. Exemplo: Um exercicio que precisa de sete dados vira duas figuras: figuraA com o triangulo e os tres dados de entrada, figuraB com o mesmo triangulo, na mesma posicao e na mesma escala, ja com a construcao auxiliar e a incognita. Nunca uma figura so com sete dados.

- **Cada dado aparece uma vez so, e aparece dentro da figura. O enunciado remete ('na figura'), nao repete.** Efeito de atencao dividida, Sweller e Chandler: com o dado longe do desenho, o aluno guarda um dos dois na memoria de trabalho para integrar depois, e integrar diagrama e dado fisicamente melhorou o desempenho em exemplos resolvidos de geometria. Repetir o numero no texto e na figura e o outro extremo, o efeito de redundancia, que tambem custa. Uma vez, dentro. Exemplo: Em vez de 'Num triangulo, dois angulos medem 52 graus e 61 graus. Quanto mede o terceiro?' com uma figura muda ao lado, o enunciado passa a ser 'Quanto mede o angulo x da figura?' e a figura carrega 52, 61 e x. Cai de tres leituras para uma.

- **A figura do gabarito e a mesma figura do enunciado, na mesma posicao, na mesma escala e com o mesmo enquadramento, acrescida apenas do que a resolucao construiu, em segunda cor e com o dado novo destacado.** Se a figura do gabarito for redesenhada, o aluno gasta a atencao reconhecendo que e a mesma figura antes de comparar. Mesma moldura significa que a diferenca entre as duas e literalmente a resolucao, e nada mais. Isso e o que transforma o gabarito em explicacao em vez de resposta. Exemplo: A mesma chamada de figura recebe {fase: 'enunciado'} ou {fase: 'gabarito'}. Na segunda, a altura tracejada, o pe com quadradinho e o '67 graus' entram em COR.teal por cima do desenho identico.

- **Nenhuma informacao pode depender so da cor. Cor e reforco, forma e tracejado sao o portador.** Calculei os pares da paleta: navy contra teal da 2.33 de contraste, ou seja, os dois quase nao se distinguem por luminosidade, so por matiz. Em preto e branco viram 79% e 61% de tinta, distinguiveis no papel bom e indistinguiveis na fotocopia de terceira geracao. O material sai impresso em preto e branco muitas vezes: quem confiar na cor perde a figura inteira. Exemplo: Construcao auxiliar do gabarito e COR.teal E tracejado [3 2]. Se a folha sair em cinza, o tracejado ainda separa. O contorno original e COR.navy E cheio.

- **Sem grade quadriculada atras da figura geometrica. Grade so no plano cartesiano, e mesmo la so nas linhas inteiras.** O graficos.js acerta ao pôr grade num grafico de leitura, porque ali a tarefa e justamente ler um valor no eixo. Em figura geometrica a tarefa e ver a forma, e a grade acrescenta dezenas de linhas concorrentes com os lados. Sao 99 ocorrencias de plano cartesiano contra 387 de triangulo: a grade e o caso raro, nao o padrao. Exemplo: eixosCartesianos com {grade: true} so nos temas de geometria analitica (MATEM3-01 a MATEM3-04). Poligono avulso desenha em fundo branco limpo.

- **Orientacao prototipica na explicacao, orientacao variada nos exercicios, e sempre com a propriedade marcada explicitamente na figura.** Hershkowitz: aluno que so viu triangulo e quadrado apoiados na base deixa de reconhecer a figura girada, e passa a achar que altura e sempre vertical e sempre cai dentro. Mas girar a figura logo na explicacao acrescenta carga exatamente quando ele esta formando o conceito. A saida e a ordem: primeiro na posicao canonica, depois girada, e a girada tem que trazer o quadradinho e os tracinhos, para que a propriedade seja lida na marca e nao na aparencia. Exemplo: MAT07-12: o isosceles da explicacao vem com a base na horizontal. O primeiro exercicio repete essa posicao. O terceiro traz o mesmo isosceles deitado 90 graus, com os mesmos dois tracinhos, para forcar a leitura pela marca.

- **Corpo minimo de 7.5pt dentro de figura, e 8.5pt para o dado que resolve a questao. Traco de contorno em 1.1pt, traco auxiliar em 0.7pt, e nada abaixo de 0.6pt.** O graficos.js ja opera no piso: 7.5pt na faixa de estado e 0.35pt na grade. Numa impressao caseira em preto e branco 0.35pt ja e uma linha que aparece e some entre copias. Contorno de figura nao pode ser opcional. E o proprio graficos.js documenta o motivo estrutural nas linhas 18 a 22: a marca d'agua NW de 82pt em COR.marca comia a grade, que usava a mesma cor. Traco fino demais na figura desaparece pelo mesmo caminho. Exemplo: Todo bloco de figura comeca por doc.retangulo(x, y, largura, altura, COR.branco) antes de qualquer traco, como o eixos() ja faz na linha 22, e so entao desenha.

- **Ordem de desenho fixa: fundo branco, preenchimento, hachura, contorno, marcas geometricas, rotulos. Nunca preencher depois de contornar.** Preenchimento e area opaca: desenhado por ultimo, ele apaga o contorno e as marcas. E o erro mais barato de cometer e o mais caro de diagnosticar, porque a figura sai quase certa e ninguem repara que sumiu justamente o quadradinho do angulo reto. Exemplo: figura(doc, {altura: 140}, function (ctx) { preencherPoligono(...); hachurarPoligono(...); poligono(...); marcaAnguloReto(...); rotularVertices(...); }) com a ordem imposta pelo proprio helper, nao pela disciplina de quem escreve.

