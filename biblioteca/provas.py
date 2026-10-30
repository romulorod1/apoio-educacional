"""Tipo de fonte "provas" do gerador da biblioteca: OBMEP Mirim (com o Nivel A
antigo) e ENEM.

    python biblioteca/gerar_pacote.py --fonte mirim --serie m1 --pdfs <PDF/matematica/obmep-mirim> ...
    python biblioteca/gerar_pacote.py --fonte mirim --serie m2 --pdfs <PDF/matematica/obmep-mirim> ...
    python biblioteca/gerar_pacote.py --fonte enem --serie 3em --pdfs <PDF/provas/enem> ...

Nao e um script a parte: o gerar_pacote.py escolhe o tipo de fonte pela
--fonte (TIPOS_DE_FONTE la) e este modulo so sabe ACHAR a questao e a
resposta nas provas. O recorte em SVG, o empilhamento, a busca, a curadoria, o
manifest e o zip deterministico sao os do gerador do Portal, chamados daqui.

O pacote e o do CONTRATO_pacote_biblioteca.md, esquema 1, como o Banco (8b):
- Mirim: um pacote por NIVEL, porque o nivel e a unidade de serie da prova
  (Mirim 1 e a prova do 2o e do 3o ano, Mirim 2 a do 4o e do 5o, e o Nivel A
  de 2018 a 2021 a do 4o e do 5o; conferido na capa de cada PDF). serie "m1"
  ou "m2", com series_equivalentes, como o "n1" do Banco.
- ENEM: um pacote so, serie "3em", so o caderno de Matematica (questoes 136 a
  180 do caderno azul do 2o dia), com a resposta do gabarito oficial e sem
  solucao (a fonte nao tem): assets.solucao null e sem_solucao true.
- modulo = o ASSUNTO do aplicativo (banco/topicos/matematica.json) achado por
  palavra-chave (ASSUNTOS, abaixo), ou "Diversos" quando nenhuma casa;
  tema_app = o id do assunto. aula = a prova ("OBMEP Mirim 2023, 1a fase").
- id: mirim:<ano>:f<fase>:m<nivel>:<numero>, mirim:<ano>:a:<numero> (Nivel A)
  e enem:<ano>:<numero>. Nao dependem do assunto: reclassificar nao muda id.
- origem.arquivo e o PDF da prova; a solucao da Mirim vem de outro PDF, e
  origem.solucao.arquivo diz qual (campo aditivo).

Como a questao e achada:
- marcador: linha que comeca pelo numero ("7.", "7" sozinho em negrito, ou
  "QUESTAO 137" no ENEM), na margem de uma coluna. A capa tem instrucoes
  numeradas do mesmo jeito; por isso a cadeia 1..N e lida de tras para frente
  (cadeia_de_tras): o ultimo "1." antes do ultimo "2." e assim por diante.
- colunas: duas quando algum marcador fica na metade direita da pagina (Nivel
  A e ENEM), com a divisa no meio; uma nas outras.
- cabecalho e rodape corridos: o que se repete na mesma altura em metade das
  paginas ou mais, no alto ou no pe (decoracoes). Nao entra no recorte, nem
  a aba lateral do ENEM, que fica fora da margem do texto.
- a questao vai do topo do seu marcador ate o topo do proximo marcador, na
  ordem de leitura (coluna da esquerda, depois a da direita, depois a pagina
  seguinte); o recorte e apertado pela tinta, como no Banco.
- solucao da Mirim: "QUESTAO N - ALTERNATIVA X", ou "QUESTAO N" com
  "ALTERNATIVA X" na linha de baixo, ou "N. ALTERNATIVA X"; a letra e a
  resposta. Gabarito do ENEM: o numero e a letra na mesma linha da tabela;
  questao anulada sai com motivo.
"""
import collections
import datetime
import json
import math
import os
import re
import sys
import time
import unicodedata

import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)
import gerar_pacote  # noqa: E402
import portal  # noqa: E402

FOLGA = 3.0              # pt em volta da tinta do recorte
ACIMA_DO_MARCADOR = 2.0  # o recorte comeca um pouco acima da caixa do numero
# a solucao de cima acaba so 0,5 pt acima da caixa do cabecalho seguinte: o
# cabecalho da solucao e texto sem caixa nem barra, e a figura da solucao 9 do
# Nivel A de 2021 desce ate 1,9 pt da caixa do "10. ALTERNATIVA D"
FOLGA_FIM_SOLUCAO = 0.5
ALTURA_MIN = 9.0
BANDA_TOPO = 0.15        # fracao da altura onde mora o cabecalho corrido
# distancia entre a faixa util e a decoracao DO ALTO: o retangulo do fio nao conta a
# espessura do traco (o fio de 2 pt do cabecalho do ENEM 2023 passava 1 pt dele)
FOLGA_DECORACAO = 2.5
BANDA_PE = 0.10          # e o rodape
REPETE_MIN = 0.6         # decoracao: na mesma altura em ao menos 60% das paginas (3 de 4)
DESENHO_MIN = 20.0       # desenho com os dois lados abaixo disto nunca e decoracao
CORPO_MIN_MARCADOR = 11.5  # marcador "N." sem negrito (fonte sem nome de negrito) so com corpo grande
MARGEM_MARCADOR = 14.0   # o marcador fica a ate 14 pt da margem esquerda da sua coluna
SEPARADOR_LARGO = 0.6    # fio horizontal de mais de 60% da coluna, no fim do recorte, e separador
SEPARADOR_ACIMA = 30.0   # o fio separador fica ate 30 pt acima do numero da questao seguinte

# regras que a prova desliga uma a uma (venenos)
CADEIA_DE_TRAS = True    # a cadeia 1..N e lida de tras para frente; False so no veneno
TIRA_DECORACAO = True    # cabecalho, rodape e aba corridos fora do recorte; False so no veneno
TIRA_SEPARADOR = True    # o fio entre questoes fica fora do recorte; False so no veneno
CONFERE_DIVISA = True    # tinta que atravessa a divisa das colunas exclui a questao; False so no veneno
CONFERE_BORDA = True     # recorte que corta tinta na borda exclui a questao; False so no veneno
FIM_DA_PROVA = True      #"Atividade Extra" e "Obrigado por participar" fecham a ultima questao; False so no veneno

NOME_SERIE = {'2ano': '2º ano', '3ano': '3º ano', '4ano': '4º ano', '5ano': '5º ano', '3em': '3ª série do médio'}

COLECOES = {
    'm1': {'fonte': 'mirim', 'pacote': 'matematica-obmep-mirim-m1', 'equivalentes': ['2ano', '3ano'],
           'temas': ('02', '03'), 'nivel': 1},
    'm2': {'fonte': 'mirim', 'pacote': 'matematica-obmep-mirim-m2', 'equivalentes': ['4ano', '5ano'],
           'temas': ('04', '05'), 'nivel': 2},
    '3em': {'fonte': 'enem', 'pacote': 'matematica-enem-3em', 'equivalentes': None, 'temas': ('em3',), 'nivel': None},
}

FONTES = {
    'mirim': {'id': 'obmep-mirim', 'nome': 'OBMEP Mirim',
              'url': 'https://olimpiadamirim.obmep.org.br/',
              'licenca': 'material de distribuição gratuita para uso educacional; conteúdo do IMPA/OBMEP'},
    'enem': {'id': 'enem', 'nome': 'ENEM',
             'url': 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos',
             'licenca': 'prova e gabarito oficiais publicados pelo Inep'},
}

# O ano do Nivel A vem do proprio PDF ("OBMEP 2018", "OBMEP 2019"). A prova 3
# so escreve o ano na capa desenhada ("DATA DE REALIZACAO DA PROVA: 26 DE
# OUTUBRO DE 2021", lida na imagem da capa em 30/10/2026): fica aqui, com a
# origem, e o gerador confere que o texto nao diz outro ano.
ANO_NIVEL_A = {1: 2018, 2: 2019, 3: 2021}

# A serie que a capa da prova declara (o regulamento da propria prova). A
# prova sem essa frase no texto, ou com outra, sai inteira com motivo.
CAPA_SERIES = {
    'm1': re.compile(r'\b2\s*\.?\s*[ºo°]?\s*\.?\s*E\s+3\s*\.?\s*[ºo°]?\s*\.?\s*ANOS', re.I),
    'm2': re.compile(r'\b4\s*\.?\s*[ºo°]?\s*\.?\s*E\s+5\s*\.?\s*[ºo°]?\s*\.?\s*ANOS', re.I),
}
# O Nivel A de 2021 escreve "4o e 5o anos" so na capa desenhada (em curvas,
# conferido na imagem em 30/10/2026); no texto, so "NIVEL A". O Nivel A e o
# mesmo nivel nas tres provas, e as de 2018 e 2019 dizem 4o e 5o no texto.
CAPA_NIVEL_A = re.compile(r'N[ÍI]VEL\s+A\b', re.I)

# ------------------------------------------------------------------ assuntos
#
# Palavras-chave por assunto do aplicativo (banco/topicos/matematica.json).
# O Banco nao tem regra de tema (tema_app nulo), entao a regra nasce aqui, e e
# so palavra: radical de palavra do enunciado e da solucao, sem acento e em
# minusculas, casado no comeco da palavra. Peso 2 para a palavra que diz o
# assunto sozinha, 1 para a que so ajuda. Vence o assunto de maior soma, com
# pelo menos 2; empate fica com o que vem primeiro nesta tabela (os mais
# especificos primeiro). Sem soma 2, a questao vai para "Diversos": a regra
# nao inventa assunto.

# a conta escrita na solucao ("9 + 9 = 18", "6 x 3 = 18", "20 dividido por 4 = 5"); o
# sinal de menos da fonte e a meia-risca (lida aqui, e nunca escrita em texto do pacote)
SOMA_NA_CONTA = r're:\d\s*\+\s*\d'
MENOS_NA_CONTA = 're:\\d\\s*[-\u2013\u2212]\\s*\\d'
VEZES_NA_CONTA = r're:\d\s*[x\u00d7]\s*\d'
DIVIDE_NA_CONTA = 're:\\d\\s*\u00f7\\s*\\d'
LOGARITMO = r're:(?<![a-z])log\s*\d|(?<![a-z])log\('
NOME_DA_EXPRESSAO = {SOMA_NA_CONTA: 'conta de mais', MENOS_NA_CONTA: 'conta de menos', VEZES_NA_CONTA: 'conta de vezes',
                     DIVIDE_NA_CONTA: 'conta de dividir', LOGARITMO: 'log'}

ASSUNTOS = {
    # 2o ano
    'MAT02-01': ({'dezena': 2, 'unidade': 1, 'maior numero': 2, 'menor numero': 2, 'algarismo': 1, 'ordem crescente': 2,
                  'ordem decrescente': 2}, None),
    'MAT02-02': ({'adicao': 2, 'adicion': 2, 'soma': 2, 'somar': 2, 'juntos': 1, 'ao todo': 1, 'no total': 1,
                  'contas': 1, SOMA_NA_CONTA: 1}, 100),
    'MAT02-03': ({'subtra': 2, 'subtrai': 2, 'diferenca': 2, 'sobrar': 1, 'sobrou': 1, 'restou': 1, 'restaram': 1,
                  'quantos faltam': 2, 'a mais que': 1, 'a menos que': 1, 'a menos do que': 1, 'perdeu': 1, 'gastou': 1,
                  MENOS_NA_CONTA: 1}, 100),
    'MAT02-04': ({'dobro': 2, 'metade': 2, 'triplo': 2}, None),
    'MAT02-05': ({'sequencia': 2, 'padrao': 2, 'seguinte': 1, 'proxima figura': 2, 'continua': 1, 'segue a regra': 2}, None),
    'MAT02-06': ({'triangul': 2, 'quadrado': 2, 'retangul': 2, 'circulo': 2, 'figura plana': 2, 'figuras planas': 2}, None),
    'MAT02-07': ({'cubo': 2, 'cubinho': 2, 'esfera': 2, 'cilindro': 2, 'cone': 2, 'piramide': 2, 'bloco': 1,
                  'dado': 1, 'faces': 2, 'face': 1, 'solido': 2}, None),
    'MAT02-08': ({'centimetro': 2, 'comprimento': 2, 'regua': 2, 'mede ': 1, 'medir': 1, 'altura': 1, 'palmo': 2,
                  'mais compri': 2, 'mais curt': 2, 'metro': 2, 'mais alt': 1}, None),
    'MAT02-09': ({'hora': 2, 'minuto': 2, 'relogio': 2, 'calendario': 2, 'semana': 2, 'mes ': 1, 'meses': 1,
                  'janeiro': 1, 'domingo': 1, 'segunda-feira': 1, 'aniversario': 1, 'dias depois': 2, 'datas': 2,
                  'ontem': 1, 'amanha': 1, 'feira': 1}, None),
    'MAT02-10': ({'real': 1, 'reais': 2, 'moeda': 2, 'cedula': 2, 'nota de': 2, 'centavo': 2, 'dinheiro': 2,
                  'troco': 2, 'preco': 2, 'custa': 2, 'pagou': 2}, None),
    'MAT02-11': ({'tabela': 2, 'grafico': 2, 'pesquisa': 1, 'votos': 1, 'legenda': 2}, None),
    # 3o ano
    'MAT03-01': ({'centena': 2, 'valor posicional': 2, 'algarismo das': 2, 'algarismos': 1, 'tres algarismos': 2}, None),
    'MAT03-04': ({'multiplica': 2, 'tabuada': 2, 'vezes': 2, 'cada um tem': 1, 'grupos de': 1, 'fileira': 2,
                  VEZES_NA_CONTA: 2}, None),
    'MAT03-05': ({'divid': 2, 'divisao': 2, 'repart': 2, 'igualmente': 2, 'partes iguais': 2, 'mesma quantidade': 1,
                  'sobra': 1, DIVIDE_NA_CONTA: 2}, None),
    'MAT03-06': ({'terco': 2, 'quarto de': 2, 'quarta parte': 2, 'terca parte': 2, 'metade': 1}, None),
    'MAT03-07': ({'lados': 2, 'vertice': 2, 'pentagono': 2, 'hexagono': 2, 'quadrilatero': 2, 'poligono': 2}, None),
    'MAT03-09': ({'quilo': 2, 'grama': 2, 'litro': 2, 'balanca': 2, 'pesa': 2, 'peso': 2, 'massa': 2, 'capacidade': 1,
                  'copo': 1, 'jarra': 1}, None),
    'MAT03-12': ({'grafico de barras': 2, 'barras': 2}, None),
    # 4o ano
    'MAT04-01': ({'milhar': 2, 'valor posicional': 2, 'algarismo das': 2, 'centena': 1, 'abaco': 2, 'dezena': 1,
                  'unidade': 1}, None),
    'MAT04-04': ({'resto': 2, 'divid': 2, 'divisao': 2, 'igualmente': 2, 'grupos de': 1, DIVIDE_NA_CONTA: 2}, None),
    'MAT04-03': ({'multiplica': 2, 'vezes': 2, 'produto': 2, 'cada um custa': 1, VEZES_NA_CONTA: 2}, None),
    'MAT04-05': ({'fracao': 2, 'fracoes': 2, 'metade': 1, 'terco': 2, 'quarto': 1, 'equivalente': 2}, None),
    'MAT04-06': ({'decimal': 2, 'virgula': 2, 'centavo': 1, 'reais': 1}, None),
    'MAT04-07': ({'angulo': 2, 'giro': 2, 'gira': 2, 'volta': 1, 'reta': 1, 'paralel': 2, 'perpendicular': 2,
                  'direita': 1, 'esquerda': 1}, None),
    'MAT04-08': ({'simetri': 2, 'espelho': 2, 'poligono': 2, 'lados': 1, 'triangul': 1, 'quadrilatero': 2,
                  'pentagono': 2, 'hexagono': 2}, None),
    'MAT04-09': ({'perimetro': 2, 'area': 2, 'quadradinho': 2, 'contorno': 2, 'quadriculad': 1}, None),
    'MAT04-10': ({'quilo': 2, 'grama': 2, 'litro': 2, 'metro': 2, 'centimetro': 2, 'balanca': 2, 'pesa': 2,
                  'peso': 2, 'hora': 2, 'minuto': 2, 'relogio': 2, 'calendario': 2, 'semana': 1, 'dias': 1,
                  'ontem': 1, 'amanha': 1, 'feira': 1, 'dia do mes': 2}, None),
    'MAT04-11': ({'provavel': 2, 'possivel': 1, 'impossivel': 2, 'chance': 2, 'sorte': 2, 'ao acaso': 2}, None),
    'MAT04-12': ({'grafico': 2, 'tabela': 2, 'media': 2, 'pesquisa': 1, 'votos': 1}, None),
    'MAT04-02': ({'soma': 2, 'somar': 2, 'adicao': 2, 'subtra': 2, 'diferenca': 2, 'total': 1, 'reais': 1, 'restou': 1,
                  'sobrou': 1, SOMA_NA_CONTA: 1, MENOS_NA_CONTA: 1}, None),
    # 5o ano
    'MAT05-07': ({'multiplo': 2, 'divisor': 2, 'divisivel': 2, 'primo': 2, 'par': 1, 'impar': 1}, None),
    'MAT05-06': ({'porcent': 2, 'por cento': 2, '%': 2}, None),
    'MAT05-08': ({'planifica': 2, 'cubo': 2, 'cubinho': 2, 'faces': 2, 'face': 1, 'dado': 1, 'aresta': 2,
                  'prisma': 2, 'piramide': 2, 'montar': 1}, None),
    'MAT05-09': ({'volume': 2, 'area': 1, 'perimetro': 1, 'cubinhos': 1}, None),
    'MAT05-11': ({'coordenada': 2, 'mapa': 2, 'caminho': 1, 'norte': 2, 'sul': 1, 'quadra': 1, 'casa da': 1,
                  'linha e coluna': 2, 'tabuleiro': 1}, None),
    'MAT05-02': ({'quanto': 0, 'operac': 2, 'conta': 1, 'resultado': 1}, None),
    # 3a serie do medio (ENEM)
    'MATEM3-11': ({'probabilidade': 2, 'chance': 2, 'sorte': 1, 'sortead': 2, 'ao acaso': 2, 'aleatori': 2,
                   'maneiras': 2, 'modos': 1, 'possibilidades': 2, 'combinac': 2, 'permuta': 2, 'anagrama': 2,
                   'senha': 2, 'formas diferentes': 2}, None),
    'MATEM3-13': ({'juros': 2, 'montante': 2, 'taxa de': 1, 'parcela': 2, 'prestac': 2, 'financiamento': 2,
                   'emprestimo': 2, 'desconto': 2, 'lucro': 2, 'aplicac': 1, 'investi': 2, 'reais': 1, 'r$': 1,
                   'porcent': 1, '%': 1, 'salario': 1, 'imposto': 2}, None),
    'MATEM3-14': ({'grafico': 2, 'tabela': 1, 'media': 2, 'mediana': 2, 'moda': 2, 'desvio padrao': 2, 'variancia': 2,
                   'pesquisa': 1, 'dados': 1, 'frequencia': 2, 'infografico': 2}, None),
    'MATEM3-12': ({'area': 2, 'volume': 2, 'perimetro': 2, 'cilindr': 2, 'cubo': 2, 'prisma': 2, 'piramide': 2,
                   'esfera': 2, 'cone': 2, 'paralelepiped': 2, 'triangul': 1, 'angulo': 2, 'raio': 1, 'diametro': 1,
                   'circunferencia': 1, 'poligono': 2, 'hexagon': 2, 'retangul': 1, 'quadrado': 1, 'litros': 1,
                   'metros quadrados': 2, 'm2': 1, 'm3': 1, 'cm3': 1, 'semelhan': 2, 'escala': 1, 'planifica': 2,
                   'vista superior': 2, 'vista lateral': 2, 'projecao': 2, 'aresta': 2, 'esferic': 2}, None),
    'MATEM3-10': ({'funcao': 2, 'f(x)': 2, 'grafico que': 1, 'crescente': 1, 'decrescente': 1, 'exponencial': 2,
                   'logaritm': 2, LOGARITMO: 2, 'quadratica': 2, 'parabol': 1,
                   'senoide': 2, 'seno': 1, 'cosseno': 1, 'progressao': 2, 'assim sucessivamente': 1,
                   'expressao algebrica': 2}, None),
    'MATEM3-01': ({'plano cartesiano': 2, 'coordenadas': 2, 'eixo das abscissas': 2, 'ponto medio': 2}, None),
    'MATEM3-02': ({'equacao da reta': 2, 'coeficiente angular': 2}, None),
    'MATEM3-03': ({'equacao da circunferencia': 2}, None),
    'MATEM3-04': ({'elipse': 2, 'hiperbole': 2, 'conica': 2}, None),
    'MATEM3-05': ({'numero complexo': 2, 'numeros complexos': 2, 'unidade imaginaria': 2}, None),
    'MATEM3-07': ({'polinomio': 2}, None),
    'MATEM3-08': ({'raizes da equacao': 2, 'equacao polinomial': 2}, None),
    # MATEM3-09 (limite e continuidade) fica sem palavra: no ENEM "limite" e o
    # do sentido comum ("limite de velocidade"), e a regra inventaria o assunto
    # (o LACUNAS de 22/09 ja registrava isso nos PDFs gratuitos)
}
SOMA_MIN = 2

# Adicao e subtracao tem um assunto "ate 100" no 2o ano e um "com
# reagrupamento" no 3o: com algum numero acima de 100 no enunciado, vai o do 3o.
PAR_DA_MAGNITUDE = {'MAT02-02': 'MAT03-02', 'MAT02-03': 'MAT03-03'}


def sem_acento(t):
    t = unicodedata.normalize('NFD', t)
    return ''.join(c for c in t if unicodedata.category(c) != 'Mn').lower()


def carregar_temas():
    """{id: {serie, titulo}} do indice de assuntos de matematica do aplicativo."""
    d = json.load(open(os.path.join(RAIZ, 'banco', 'topicos', 'matematica.json'), encoding='utf-8'))
    return {t['id']: {'serie': t['serie'], 'titulo': t['pt']['titulo']} for t in d['temas']}


def pontos_por_assunto(texto, candidatos):
    t = ' ' + re.sub(r'\s+', ' ', sem_acento(texto)) + ' '
    out = {}
    for tid in candidatos:
        soma, achou = 0, []
        for chave, peso in ASSUNTOS[tid][0].items():
            if not peso:
                continue
            if chave.startswith('re:'):
                padrao = chave[3:]
            else:
                padrao = re.escape(chave) if not chave[0].isalnum() else r'(?<![a-z0-9])' + re.escape(chave)
            if re.search(padrao, t):
                soma += peso
                # a expressao vai para o pacote pelo nome (tema_chaves), e nao
                # crua: ela tem a meia-risca do sinal de menos
                achou.append(NOME_DA_EXPRESSAO.get(chave, chave.strip()))
        if soma:
            out[tid] = (soma, achou)
    return out


def assunto_por_palavra(texto, temas, series_temas):
    """(id do assunto, palavras que decidiram) ou (None, []) para Diversos."""
    candidatos = [tid for tid in ASSUNTOS if tid in temas and temas[tid]['serie'] in series_temas]
    pts = pontos_por_assunto(texto, candidatos)
    if not pts:
        return None, []
    ordem = {tid: k for k, tid in enumerate(candidatos)}
    tid = max(pts, key=lambda k: (pts[k][0], -ordem[k]))
    if pts[tid][0] < SOMA_MIN:
        return None, []
    par = PAR_DA_MAGNITUDE.get(tid)
    if par and par in temas and temas[par]['serie'] in series_temas:
        numeros = [int(n.replace('.', '')) for n in re.findall(r'(?<![\d,])\d{1,3}(?:\.\d{3})+(?![\d,])|(?<![\d,.])\d+(?![\d,.])', texto)]
        if any(n > 100 for n in numeros if n < 3000):
            return par, pts[tid][1] + ['numero acima de 100']
    return tid, pts[tid][1]


# ------------------------------------------------------------------ pagina

def norm(t):
    return re.sub(r'\s+', ' ', sem_acento(t)).strip()


def negrito(sp):
    return bool(sp['flags'] & 16) or 'Bold' in sp['font'] or 'Black' in sp['font']


def linhas(pg):
    out = []
    for b in pg.get_text('dict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            t = ''.join(s['text'] for s in l['spans']).strip()
            if not t:
                continue
            sp = next((s for s in l['spans'] if s['text'].strip()), l['spans'][0])
            out.append({'bb': tuple(l['bbox']), 'texto': t, 'tam': sp['size'], 'neg': negrito(sp),
                        'span0': sp['text'].strip()})
    return out


MARCADOR_NUM = re.compile(r'^(\d{1,2})\s*([.)])?(?=\s|$)')
MARCADOR_QUESTAO = re.compile(r'^QUEST[ÃA]O\s*(\d{1,3})\b', re.I)
SOL_NUM_ALT = re.compile(r'^(\d{1,2})\s*\.\s*ALTERNATIVA\s+\(?([A-E])\)?(?![A-Za-z])', re.I)
INSTRUCAO = re.compile(r'alternativa|questao|questoes|prova|cartao|rascunho|caneta|lapis|nome completo|duracao'
                       r'|celular|instrumentos|folha de respostas|caderno')
ALTERNATIVA = re.compile(r'ALTERNATIVA\s*\(?([A-E])\)?(?![A-Za-z])', re.I)


def candidato_prova(l):
    """Numero do marcador de questao na linha, ou None."""
    m = MARCADOR_QUESTAO.match(l['texto'])
    if m:
        return int(m.group(1))
    m = MARCADOR_NUM.match(l['texto'])
    if not m:
        return None
    if m.group(2):
        return int(m.group(1)) if (l['neg'] or l['tam'] >= CORPO_MIN_MARCADOR) else None
    # "11" num span proprio em negrito, sem ponto (Nivel A de 2021), e no corpo
    # do texto: os numeros em negrito das figuras sao menores (7 a 11,2 pt)
    return int(m.group(1)) if (l['neg'] and l['span0'] == m.group(1) and l['tam'] >= CORPO_MIN_MARCADOR) else None


def candidato_solucao(l):
    """(numero, letra ou None) do cabecalho de solucao na linha, ou None."""
    m = MARCADOR_QUESTAO.match(l['texto'])
    if m:
        a = ALTERNATIVA.search(l['texto'])
        return int(m.group(1)), (a.group(1).upper() if a else None)
    m = SOL_NUM_ALT.match(l['texto'])
    if m:
        return int(m.group(1)), m.group(2).upper()
    return None


def chave_decoracao(tipo, r, texto=''):
    t = norm(texto)
    # a linha com o numero da pagina conta pela posicao: o rodape do ENEM diz
    # "CN - 2o dia ... Pagina 9" numas paginas e "MT - 2o dia ... Pagina 17" noutras
    if tipo == 't' and (re.search(r'\bpagina\s*\d+', t) or re.match(r'^\d+$', t)):
        t = '#pagina'
    return (tipo, int(round(r[1] / 2.0)), int(round((r[3] - r[1]) / 2.0)), re.sub(r'\d+', '#', t))


def decoracoes(doc, ignorar):
    """Retangulos de cabecalho, rodape e aba corridos, por pagina.

    Corrido e o que se repete na mesma altura (e mesmo texto, com os numeros
    trocados por #) em ao menos metade das paginas. So conta no alto
    (BANDA_TOPO), no pe (BANDA_PE) ou fora da margem do texto: o que se repete
    no meio do texto (um rotulo de alternativa na mesma altura em duas
    paginas) e conteudo. `ignorar(pno, linha)` diz quais linhas sao marcadores.
    """
    por_pagina, contagem = [], collections.Counter()
    xs0, xs1 = [], []
    marcadores = []
    for pno, pg in enumerate(doc):
        els = []
        marcadores.append([])
        for l in linhas(pg):
            if ignorar(pno, l):
                # o marcador e corpo: o cabecalho fica acima dele (ENEM 2015,
                # "QUESTAO 137" no alto da coluna, com a barra hachurada ao lado)
                marcadores[pno].append(l['bb'])
                continue
            els.append((chave_decoracao('t', l['bb'], l['texto']), l['bb']))
            xs0.append(l['bb'][0])
            xs1.append(l['bb'][2])
        for b in pg.get_text('dict')['blocks']:
            if b['type'] == 1:
                els.append((chave_decoracao('i', b['bbox'], '%d' % round(b['bbox'][2] - b['bbox'][0])), tuple(b['bbox'])))
        for d in pg.get_drawings():
            r = d['rect']
            # desenho miudo nao e decoracao: e letra em curva ou o circulo de uma
            # alternativa, que se repetem na mesma altura de duas paginas por acaso
            # (Mirim 2024, 2a fase: as bolinhas do pe cortavam a alternativa E)
            # No alto e no pe ele conta (os tracinhos nas pontas do fio do rodape
            # do ENEM 2022 sobem 2 pt e entravam no recorte); o circulo da
            # alternativa no pe nunca fica abaixo de todo o texto, e a regra do
            # corpo, adiante, o deixa de fora
            # So traco fino: o desenho miudo de area (as plaquinhas das
            # alternativas no pe da Mirim 2 de 2022, 2a fase) continua de fora
            H_ = pg.rect.height
            na_borda = (r.y1 <= H_ * BANDA_TOPO or r.y0 >= H_ * (1 - BANDA_PE)) and min(r.width, r.height) < 1.5
            if r.x1 <= r.x0 and r.y1 <= r.y0 or (r.width < DESENHO_MIN and r.height < DESENHO_MIN and not na_borda):
                continue
            els.append((chave_decoracao('d', r, '%d' % round(r.width)), (r.x0, r.y0, r.x1, r.y1)))
        por_pagina.append(els)
        for k in set(k for k, _ in els):
            contagem[k] += 1
    n = doc.page_count
    xs0.sort()
    xs1.sort()
    # margem do texto: percentis, para um rotulo solto nao mover a margem
    margem0 = xs0[len(xs0) // 50] if xs0 else 0
    margem1 = xs1[-1 - len(xs1) // 50] if xs1 else 1e9
    corrido = lambda k: n >= 2 and contagem[k] >= max(2, REPETE_MIN * n)
    out = []
    for pno, els in enumerate(por_pagina):
        H = doc[pno].rect.height
        # o texto do corpo (o que nao se repete): cabecalho fica ACIMA de todo ele
        # e rodape ABAIXO. Sem isto, a barra ao lado de "QUESTAO 137", na mesma
        # altura no alto de muitas paginas do ENEM, virava cabecalho e cortava
        # as questoes que comecam no alto da coluna
        na_banda = lambda r: r[3] <= H * BANDA_TOPO or r[1] >= H * (1 - BANDA_PE)
        rep = [r for k, r in els if corrido(k) and na_banda(r)]
        # na mesma linha de um corrido do alto ou do pe e companheiro dele: o
        # rodape do ENEM e "21" (corrido) e "MT, 2o DIA, CADERNO 7" (que muda de
        # area para area e nao se repete o bastante)
        mesma_linha = lambda r: any(min(r[3], q[3]) - max(r[1], q[1]) >= 0.5 * min(r[3] - r[1], q[3] - q[1]) for q in rep)
        # e o fio de largura inteira no alto, acima de todo o corpo, e fio de
        # cabecalho mesmo sem se repetir em 60% das paginas (o Nivel A de 2021
        # tem 4 paginas e a capa sem ele)
        W = doc[pno].rect.width
        fio_alto = lambda k, r: k[0] == 'd' and r[2] - r[0] >= 0.7 * W and r[3] - r[1] < 3 and r[3] <= H * BANDA_TOPO
        deco = [corrido(k) or (na_banda(r) and mesma_linha(r)) or fio_alto(k, r) for k, r in els]
        corpo = [r for (k, r), d in zip(els, deco) if k[0] == 't' and not d] + marcadores[pno]
        topo_corpo = min([r[1] for r in corpo] + [H])
        pe_corpo = max([r[3] for r in corpo] + [0.0])
        rs = []
        for (k, r), d in zip(els, deco):
            if not d:
                continue
            # o quinto campo diz se e decoracao do lado (fora da margem do texto):
            # essa sai da tinta, mas nao mexe no topo nem no pe (a marca de corte
            # no canto do ENEM 2024 desce ate y 108 e cortava a questao 136)
            lado = r[0] >= margem1 or r[2] <= margem0
            # o fio do alto basta estar acima da primeira questao da pagina: o
            # titulo "NIVEL A" acima dele e cabecalho, e fica fora pelo topo
            acima_das_questoes = fio_alto(k, r) and r[3] <= min([m[1] for m in marcadores[pno]] + [H]) + 1
            if lado or (r[3] <= H * BANDA_TOPO and (r[3] <= topo_corpo + 1 or acima_das_questoes)) or \
                    (r[1] >= H * (1 - BANDA_PE) and r[1] >= pe_corpo - 1):
                rs.append(tuple(r[:4]) + (lado,))
        out.append(rs)
    return out


def faixa_util(doc, decos):
    """(topo, pe) de cada pagina, pelas decoracoes do alto e do pe."""
    out = []
    for pno, pg in enumerate(doc):
        H = pg.rect.height
        topo = max([r[3] for r in decos[pno] if r[3] <= H * BANDA_TOPO and not r[4]] + [-FOLGA_DECORACAO]) + FOLGA_DECORACAO
        pe = min([r[1] for r in decos[pno] if r[1] >= H * (1 - BANDA_PE) and not r[4]] + [H + 1.0]) - 1.0
        out.append((topo, pe))
    return out


def cadeia_de_tras(cands, numeros):
    """Escolhe, para cada numero de `numeros` (em ordem), um candidato, da direita para a esquerda.

    cands: [(numero, chave_de_ordem, dados)] em ordem de leitura. O ultimo N,
    depois o ultimo N-1 antes dele, e assim por diante: as instrucoes da capa
    ("1. Preencha...") ficam antes do "1." da primeira questao e nunca sao
    escolhidas. Numero que falta nao interrompe: os outros seguem.
    """
    escolhidos = {}
    limite = len(cands)
    for n in sorted(numeros, reverse=True):
        for k in range(limite - 1, -1, -1):
            if cands[k][0] == n:
                escolhidos[n] = cands[k]
                limite = k
                break
    return [escolhidos[n] for n in sorted(escolhidos)]


def cadeia_da_frente(cands, numeros):
    """O veneno da cadeia_de_tras: o primeiro de cada numero, da esquerda para a direita."""
    escolhidos, ini = {}, 0
    for n in sorted(numeros):
        for k in range(ini, len(cands)):
            if cands[k][0] == n:
                escolhidos[n] = cands[k]
                ini = k + 1
                break
    return [escolhidos[n] for n in sorted(escolhidos)]


def colunas_de_fio(tinta, a, b):
    """As colunas de pixel entre a e b que sao fio vertical: tinta em mais da
    metade da altura util da pagina. O fio do ENEM de 2024 vem dentro de um
    desenho do tamanho da pagina, e nao como desenho proprio."""
    h = tinta.shape[0]
    meio = tinta[int(h * 0.1):int(h * 0.9), a:b]
    frac = meio.sum(axis=0) / float(max(1, meio.shape[0]))
    return [a + int(i) for i, v in enumerate(frac) if v > 0.5]


def calha(doc, paginas, so_fio=False):
    """O x do meio da calha entre as colunas: o trecho mais branco perto do meio.

    Nao e a metade da pagina: no ENEM de 2025 a calha tem 5 pt, e o texto da
    coluna da esquerda chega a 2 pt da metade. Mede a tinta das paginas com
    questoes (fio vertical da divisa fora), coluna de pixel a coluna de pixel,
    entre 40% e 60% da largura, e fica com o centro do trecho de menos tinta.
    """
    import numpy as np
    W = doc[0].rect.width
    a, b = int(W * 0.4), int(W * 0.6)
    soma, fios = None, []
    for pno in sorted(set(paginas))[:12] or [0]:
        tmp = pymupdf.open()
        tmp.insert_pdf(doc, from_page=pno, to_page=pno)
        pix = tmp[0].get_pixmap(dpi=72, colorspace=pymupdf.csGRAY)
        tmp.close()
        t = (np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width) < gerar_pacote.LIMIAR_TINTA)
        f = colunas_de_fio(t, a, b)
        fios.extend(f)
        t = t.copy()
        t[:, f] = False
        c = t.sum(axis=0).astype(float)
        soma = c if soma is None else soma[:len(c)] + c[:len(soma)]
    # com fio vertical entre as colunas (ENEM), a divisa e o fio. Fio em
    # metade das colunas de pixel vizinhas (o fio de texto miudo do ENEM 2025
    # tem 3 px): o do meio
    if fios:
        x = collections.Counter(fios).most_common(1)[0][0]
        vizinhos = sorted(f for f in set(fios) if abs(f - x) <= 3)
        return (vizinhos[0] + vizinhos[-1]) / 2.0 + 0.5
    if so_fio:
        return None
    faixa = soma[a:b]
    menor = faixa.min()
    xs = [a + i for i, v in enumerate(faixa) if v <= menor]
    # o trecho continuo de menos tinta mais perto do meio da pagina
    trechos_ = []
    for x in xs:
        if trechos_ and x == trechos_[-1][1] + 1:
            trechos_[-1][1] = x
        else:
            trechos_.append([x, x])
    t0, t1 = min(trechos_, key=lambda r: abs((r[0] + r[1]) / 2.0 - W / 2.0))
    return (t0 + t1 + 1) / 2.0


def agrupar_x(xs, tol=4.0):
    """[(menor x, quantos)] dos grupos de x a menos de `tol` um do outro."""
    grupos = []
    for x in sorted(xs):
        if grupos and x - grupos[-1][1] <= tol:
            grupos[-1][1] = x
            grupos[-1][2] += 1
        else:
            grupos.append([x, x, 1])
    return [(g[0], g[2]) for g in grupos]


class Geometria:
    """Colunas, divisa, faixa util e decoracoes de um PDF."""

    def __init__(self, doc, marcadores_x, eh_marcador, paginas=()):
        self.doc = doc
        W = doc[0].rect.width
        # duas colunas quando ao menos tres marcadores comecam na mesma margem,
        # perto do meio da pagina (um "3." solto numa figura da direita nao faz
        # coluna, nem o numero da pagina no canto)
        meio = [x0 for x0 in marcadores_x if W * 0.45 < x0 < W * 0.62]
        grupos = agrupar_x(meio)
        self.duas = max([c for _, c in grupos] + [0]) >= 3
        self.divisa = calha(doc, paginas) if self.duas else None
        # as paginas com marcador na margem da coluna da direita: essas tem duas
        # colunas mesmo com texto de largura inteira acima (a capa do Nivel A,
        # com as instrucoes em cima e as questoes 1 a 4 em duas colunas)
        margem_dir = max(grupos, key=lambda g: g[1])[0] if self.duas else None
        self._com_marca_a_direita = set(p for p, x0 in zip(paginas, marcadores_x)
                                        if self.duas and abs(x0 - margem_dir) <= 12)
        # pagina a pagina: o ENEM de 2025 poe questoes de largura inteira em
        # algumas paginas (a 16, com as questoes 136 e 137) e duas colunas noutras,
        # e a margem anda 7 pt entre pagina par e impar (a calha vai junto)
        self._duas_em = {}
        self._divisa_em = {}
        self.inicio_colunas = {}  # preenchido por marcadores_da_prova
        # o marcador nao e decoracao, mesmo repetido na mesma altura ("QUESTAO
        # 139" e "QUESTAO 152" no alto de duas paginas do ENEM)
        self.decos = decoracoes(doc, lambda pno, l: eh_marcador(l)) if TIRA_DECORACAO else [[] for _ in doc]
        self.faixa = faixa_util(doc, self.decos)

    def divisa_em(self, pno):
        """A divisa da pagina: o fio ou a calha DESTA pagina, e na falta dela a do documento."""
        if pno not in self._divisa_em:
            d = calha(self.doc, [pno], so_fio=True)
            # so o FIO da pagina muda a divisa (o ENEM alterna a margem entre
            # pagina par e impar); a calha mais branca de uma pagina so engana
            # quando uma figura chega perto do meio (Nivel A 2018, p. 4)
            self._divisa_em[pno] = d if d is not None and abs(d - self.divisa) <= 12 else self.divisa
        return self._divisa_em[pno]

    def duas_em(self, pno):
        if not self.duas:
            return False
        if pno not in self._duas_em and pno in self._com_marca_a_direita:
            self._duas_em[pno] = True
        if pno not in self._duas_em:
            d = self.divisa_em(pno)
            longas = [l for l in linhas(self.doc[pno]) if l['bb'][2] - l['bb'][0] > 60]
            cruzam = [l for l in longas if l['bb'][0] < d - 3 and l['bb'][2] > d + 3]
            self._duas_em[pno] = not (len(cruzam) >= 3 and len(cruzam) > 0.2 * len(longas))
        return self._duas_em[pno]

    def inicio_das_colunas(self, pno, primeiro_marcador_y):
        """Onde comecam as duas colunas na pagina: abaixo do texto de largura
        inteira que fica acima da primeira questao dela (as instrucoes da capa
        do Nivel A). Sem esse texto, o topo util."""
        if not self.duas_em(pno) or primeiro_marcador_y is None:
            return 0.0
        d = self.divisa_em(pno)
        decos = self.decos[pno]
        pg = self.doc[pno]
        # texto, imagem e desenho de largura inteira (os logotipos da capa do
        # Nivel A sao imagens, logo abaixo das instrucoes)
        caixas = [l['bb'] for l in linhas(pg)]
        caixas += [tuple(b['bbox']) for b in pg.get_text('dict')['blocks'] if b['type'] == 1]
        caixas += [tuple(dr['rect']) for dr in pg.get_drawings() if dr['rect'].width > 20]
        largas = [r[3] for r in caixas
                  if r[0] < d - 3 and r[2] > d + 3 and r[3] <= primeiro_marcador_y
                  and not any(abs(r[1] - q[1]) < 1 and abs(r[3] - q[3]) < 1 for q in decos)]
        return max(largas) + 1.0 if largas else 0.0

    def coluna_de(self, pno, x0):
        return 1 if (self.duas_em(pno) and x0 >= self.divisa_em(pno)) else 0

    def colunas(self, pno):
        return (0, 1) if self.duas_em(pno) else (0,)

    def x_da_coluna(self, pno, col):
        W = self.doc[pno].rect.width
        if not self.duas_em(pno):
            return 0.0, W
        d = self.divisa_em(pno)
        # 1,5 pt de cada lado da divisa: o fio do ENEM 2023 tem 2 px, e a coluna
        # que comecava 1 pt depois do meio dele encostava no fio
        return (0.0, d - 1.5) if col == 0 else (d + 1.5, W)


# ------------------------------------------------------------------ recorte

def _tinta_da_pagina(doc, pno, cache, decos):
    import numpy as np
    if pno not in cache:
        tmp = pymupdf.open()
        tmp.insert_pdf(doc, from_page=pno, to_page=pno)
        pix = tmp[0].get_pixmap(dpi=72, colorspace=pymupdf.csGRAY)
        tmp.close()
        tinta = (np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width) < gerar_pacote.LIMIAR_TINTA).copy()
        for r in decos:
            tinta[max(0, int(math.floor(r[1])) - 1):int(math.ceil(r[3])) + 1,
                  max(0, int(math.floor(r[0])) - 1):int(math.ceil(r[2])) + 1] = False
        # fio vertical da divisa (ENEM): nao e tinta de questao nenhuma
        fios = [d['rect'] for d in doc[pno].get_drawings() if d['rect'].width < 2.5 and d['rect'].height > 0.4 * doc[pno].rect.height]
        cache[pno] = (tinta, gerar_pacote.objetos_claros(doc[pno]), fios,
                      [r for r in fios_horizontais(doc[pno]) if r.height < 2.0 and r.width > 20])
    return cache[pno]


def caixa_pela_tinta(doc, geo, pno, col, y0, y1, cache):
    """(retangulo apertado pela tinta com folga, motivo de exclusao ou None)."""
    import numpy as np
    tinta, claros, fios, horizontais = _tinta_da_pagina(doc, pno, cache, geo.decos[pno])
    h, w = tinta.shape
    xa, xb = geo.x_da_coluna(pno, col)
    t = tinta.copy()
    if geo.duas_em(pno):
        for f in fios:
            if abs((f.x0 + f.x1) / 2 - geo.divisa_em(pno)) < 10:
                t[:, max(0, int(f.x0) - 2):int(math.ceil(f.x1)) + 2] = False
        # e o fio que nao vem como desenho proprio (ENEM 2024)
        for x in colunas_de_fio(tinta, int(geo.divisa_em(pno)) - 4, int(geo.divisa_em(pno)) + 5):
            t[:, max(0, x - 1):x + 2] = False
    ya, yb = max(0, int(math.floor(y0))), min(h, int(math.ceil(y1)))
    ixa, ixb = max(0, int(math.floor(xa))), min(w, int(math.ceil(xb)))
    faixa = t[ya:yb, ixa:ixb]
    motivo = None
    if geo.duas_em(pno) and CONFERE_DIVISA:
        # tinta em cima da divisa (no meio da calha branca): figura ou tabela que
        # atravessa as duas colunas e seria cortada. Com fio, o fio sai da tinta,
        # e o que atravessa e tinta dos dois lados dele na mesma linha
        d = int(math.floor(geo.divisa_em(pno)))
        # o fio claro do Nivel A so desce pela parte de duas colunas da pagina:
        # coluna de pixel perto da divisa com tinta em 60% das linhas do trecho
        # e fio, e sai da tinta como o fio desenhado
        fio_aqui = [x for x in range(max(0, d - 3), min(w, d + 4))
                    if yb - ya > 30 and t[ya:yb, x].mean() > 0.6]
        if fio_aqui:
            t[:, fio_aqui] = False
        if fio_aqui or (tinta[ya:yb, d] & ~t[ya:yb, d]).any():
            a_ = t[ya:yb, max(0, d - 4):d - 1].any(axis=1)
            b_ = t[ya:yb, d + 2:min(w, d + 5)].any(axis=1)
            cruza = (a_ & b_).any()
        else:
            cruza = t[ya:yb, max(0, d - 1):min(w, d + 2)].any()
        if cruza:
            motivo = 'tinta atravessa a divisa das colunas na p%d' % (pno + 1)
    linhas_t = [ya + int(y) for y in np.nonzero(faixa.any(axis=1))[0]]
    if TIRA_SEPARADOR and linhas_t:
        # fio horizontal largo no fim do recorte, com folga acima dele: separador
        # entre questoes (Mirim), e nao parte da questao
        largura = xb - xa
        fios_aqui = [f for f in horizontais if f.width >= SEPARADOR_LARGO * largura and xa - 2 <= f.x0 and f.x1 <= xb + 2
                     and f.y0 >= ya and f.y1 <= yb + 1]
        if fios_aqui:
            f = max(fios_aqui, key=lambda r: r.y0)
            if max(linhas_t) <= f.y1 + 1.5:
                resto = [y for y in linhas_t if y < f.y0 - 1]
                if resto and f.y0 - max(resto) >= 3:
                    linhas_t = resto
                    faixa = t[ya:max(resto) + 1, ixa:ixb]
    xs = np.nonzero(faixa.any(axis=0))[0]
    colunas = [ixa + int(xs[0]), ixa + int(xs[-1])] if len(xs) else []
    for cy0, cy1, cx in claros:
        if cy0 >= ya and cy1 <= yb and xa <= cx <= xb:
            linhas_t.extend((int(cy0), int(math.ceil(cy1))))
            colunas.append(int(cx))
    if not linhas_t or not colunas:
        return None, motivo
    W = doc[pno].rect.width
    x0 = max(xa, math.floor(min(colunas) - FOLGA), 0.0)
    x1 = min(xb, math.ceil(max(colunas) + 1 + FOLGA), math.floor(W))
    top = max(math.floor(y0), math.floor(min(linhas_t) - FOLGA))
    bot = min(math.floor(y1), math.ceil(max(linhas_t) + 1 + FOLGA))
    return (float(x0), float(top), float(x1), float(bot)), motivo


def fatias(geo, ini, fim):
    """As fatias (pagina, coluna, y0, y1) de um trecho, em ordem de leitura."""
    (p0, c0, y0), (p1, c1, y1) = ini, fim
    out = []
    p, c = p0, c0
    while (p, c) <= (p1, c1):
        topo, pe = geo.faixa[p]
        a = y0 if (p, c) == (p0, c0) else max(topo, geo.inicio_colunas.get(p, 0.0))
        b = (y1 - 0.5) if (p, c) == (p1, c1) else pe
        if b - a >= 2:
            out.append((p, c, a, b))
        if geo.duas_em(p) and c == 0:
            c = 1
        else:
            p, c = p + 1, 0
    return out


def separador_acima(geo, m):
    """O fio separador logo acima do marcador (ate SEPARADOR_ACIMA pt), ou None.

    Na Mirim um fio de pagina inteira separa uma questao da outra, e a figura
    da questao seguinte pode subir acima da linha do numero (2022, 1a fase,
    questao 5): a fronteira e o fio, e nao a linha do numero.
    """
    if not TIRA_SEPARADOR:
        return None
    xa, xb = geo.x_da_coluna(m['pno'], m['col'])
    y = m['bb'][1]
    fios = [r for r in fios_horizontais(geo.doc[m['pno']])
            if r.width >= SEPARADOR_LARGO * (xb - xa) and xa - 2 <= r.x0 and r.x1 <= xb + 2
            and y - SEPARADOR_ACIMA <= r.y1 <= y]
    return max(fios, key=lambda r: r.y0) if fios else None


def fios_horizontais(pg):
    """Os fios horizontais da pagina, item a item do desenho: a Mirim 1 de 2024
    (1a fase, p. 3) desenha os separadores de varias questoes como retangulos
    finos de UM desenho so, cujo retangulo total cobre a pagina."""
    out = []
    for d in pg.get_drawings():
        if d['rect'].height < 2.5:
            out.append(d['rect'])
            continue
        for it in d['items']:
            if it[0] == 're' and it[1].height < 2.5 and it[1].width > 20:
                out.append(pymupdf.Rect(it[1]))
            elif it[0] == 'l' and abs(it[1].y - it[2].y) < 0.5 and abs(it[2].x - it[1].x) > 20:
                out.append(pymupdf.Rect(min(it[1].x, it[2].x), it[1].y, max(it[1].x, it[2].x), it[1].y))
    return out


def trechos(geo, marcadores, ultimo_vai_ate=None, folga_fim=ACIMA_DO_MARCADOR):
    """{numero: [(pagina, coluna, y0, y1)]}: do topo de cada marcador ao topo do seguinte.

    Com um fio separador logo acima do marcador, a fronteira e o fio: a
    questao de cima acaba antes dele e a de baixo comeca depois. O ultimo vai
    ate o fim da sua coluna (ENEM: depois da questao 180 a prova acaba) ou ate
    o fim do documento (Mirim, uma coluna).
    """
    def inicio(m):
        f = separador_acima(geo, m)
        return f.y1 + 2.0 if f else m.get('topo', m['bb'][1]) - ACIMA_DO_MARCADOR

    def fim_antes(m):
        f = separador_acima(geo, m)
        return f.y0 - 1.5 if f else m.get('topo', m['bb'][1]) - folga_fim

    out = {}
    for k, m in enumerate(marcadores):
        n, pno, col, y = m['numero'], m['pno'], m['col'], inicio(m)
        if k + 1 < len(marcadores):
            q = marcadores[k + 1]
            fim = (q['pno'], q['col'], fim_antes(q))
        elif ultimo_vai_ate == 'coluna':
            fim = (pno, col, geo.faixa[pno][1] + 1)
        else:
            ult = geo.doc.page_count - 1
            fim = (ult, geo.colunas(ult)[-1], geo.faixa[ult][1] + 1)
            # o que fecha a prova antes do fim do arquivo ("Atividade Extra",
            # "Obrigado por participar", no Nivel A de 2019) nao e da ultima questao
            fecho = fim_da_prova(geo.doc, (pno, y))
            if fecho and fecho[0] > pno:
                # o fecho numa pagina adiante: a pagina dele inteira e do fecho
                # (o aviso "Atencao: a atividade desta pagina..." vem acima dele)
                anterior = fecho[0] - 1
                fim = (anterior, geo.colunas(anterior)[-1], geo.faixa[anterior][1] + 1)
            elif fecho:
                fim = (fecho[0], 0, fecho[1] - ACIMA_DO_MARCADOR)
        out[n] = fatias(geo, (pno, col, max(y, geo.faixa[pno][0])), fim)
    return out


FECHO = re.compile(r'^(atividade extra|obrigad[oa] por participar)')


def fim_da_prova(doc, depois_de):
    """(pagina, y) da primeira linha que fecha a prova depois de `depois_de`, ou None."""
    if not FIM_DA_PROVA:
        return None
    for pno in range(depois_de[0], doc.page_count):
        for l in sorted(linhas(doc[pno]), key=lambda l: l['bb'][1]):
            if (pno, l['bb'][1]) > depois_de and FECHO.match(norm(l['texto'])):
                return pno, l['bb'][1]
    return None


def recortar(doc, geo, fs, cache):
    """Pedacos {pno, col, rect} de um trecho, e o motivo de exclusao se houver."""
    out, motivo = [], None
    for p, c, a, b in fs:
        r, m = caixa_pela_tinta(doc, geo, p, c, a, b, cache)
        motivo = motivo or m
        # pedaco de continuacao menor que ALTURA_MIN nao e conteudo: e o ponto
        # solto no pe das paginas em branco depois da ultima solucao (Mirim 1
        # 2024, 2a fase, p. 7 e 8), que a ultima questao alcanca
        if r and r[3] - r[1] >= (2 if not out else ALTURA_MIN):
            out.append({'pno': p, 'col': c, 'rect': r})
            lado = borda_que_corta(doc, p, r, cache) if CONFERE_BORDA else None
            if lado and not motivo:
                motivo = 'o recorte corta tinta na borda %s (p%d): a questao encosta na vizinha na fonte' % (lado, p + 1)
    return out, motivo


def borda_que_corta(doc, pno, r, cache):
    """O lado do recorte que passa por cima de tinta (escura nos dois lados da borda), ou None.

    Quando duas questoes encostam na fonte (o denominador da alternativa E da
    171 do ENEM 2024 desce ate 1 pt da questao 172), nao ha linha horizontal
    que separe as duas, e o recorte de uma leva um pedaco da outra. A questao
    sai com motivo, em vez de entrar cortada.
    """
    chave = ('borda', pno)
    if chave not in cache:
        tmp = pymupdf.open()
        tmp.insert_pdf(doc, from_page=pno, to_page=pno)
        cache[chave] = tmp[0].get_pixmap(dpi=150, colorspace=pymupdf.csGRAY)
        tmp.close()
    pix = cache[chave]
    k = 150 / 72.0
    w, h, s = pix.width, pix.height, pix.samples
    x0, y0 = int(round(r[0] * k)), int(round(r[1] * k))
    x1, y1 = int(round(r[2] * k)) - 1, int(round(r[3] * k)) - 1
    esc = lambda x, y: 0 <= x < w and 0 <= y < h and s[y * w + x] < 128
    if any(esc(x, y0) and esc(x, y0 - 1) for x in range(x0, x1 + 1)):
        return 'de cima'
    if any(esc(x, y1) and esc(x, y1 + 1) for x in range(x0, x1 + 1)):
        return 'de baixo'
    if any(esc(x0, y) and esc(x0 - 1, y) for y in range(y0, y1 + 1)):
        return 'esquerda'
    if any(esc(x1, y) and esc(x1 + 1, y) for y in range(y0, y1 + 1)):
        return 'direita'
    return None


# ------------------------------------------------------------------ marcadores

def marcadores_da_prova(doc, numeros_esperados=None, so_questao=False):
    """Os marcadores das questoes, em ordem de leitura, mais a geometria."""
    brutos = []
    for pno, pg in enumerate(doc):
        ls = linhas(pg)
        # so na capa: uma questao do ENEM 2017 (p. 22) tem um quadro "Instrucoes"
        tem_instrucoes = pno == 0 and any(re.match(r'^INSTRU[ÇC][ÕO]ES', l['texto'], re.I) for l in ls)
        for l in ls:
            if so_questao and not MARCADOR_QUESTAO.match(l['texto']):
                continue
            # as instrucoes da capa sao numeradas como as questoes; sem a cadeia
            # de tras (prova sem texto nas questoes, Mirim 1 2025, 2a fase) elas
            # virariam as questoes 1 a 4
            if tem_instrucoes and INSTRUCAO.search(norm(l['texto'])):
                continue
            n = candidato_prova(l)
            if n is not None:
                brutos.append((pno, l, n))
    eh = (lambda l: bool(MARCADOR_QUESTAO.match(l['texto']))) if so_questao else (lambda l: candidato_prova(l) is not None)
    if not brutos:
        return [], Geometria(doc, [], eh)
    # colunas pela posicao dos candidatos, e cada um na margem da sua coluna
    geo = Geometria(doc, [l['bb'][0] for pno, l, n in brutos], eh, [pno for pno, l, n in brutos])
    # a margem de cada coluna e o x do maior grupo de candidatos dela: numero de
    # figura fica espalhado, e o marcador de questao se alinha
    margens = {}
    for pno, l, n in brutos:
        margens.setdefault(geo.coluna_de(pno, l["bb"][0]), []).append(l['bb'][0])
    margem = {c: max(agrupar_x(xs), key=lambda g: (g[1], -g[0]))[0] for c, xs in margens.items()}
    cands = []
    for pno, l, n in brutos:
        c = geo.coluna_de(pno, l["bb"][0])
        # "QUESTAO 137" nao se confunde com numero de figura; e o ENEM alterna a
        # margem entre paginas pares e impares, entao ali a margem nao filtra
        if not so_questao and not (-4.0 <= l['bb'][0] - margem[c] <= MARGEM_MARCADOR):
            continue
        cands.append((n, (pno, c, l['bb'][1]), {'numero': n, 'pno': pno, 'col': c, 'bb': l['bb'], 'texto': l['texto']}))
    cands.sort(key=lambda t: t[1])
    numeros = numeros_esperados or range(1, max(n for n, _, _ in cands) + 1)
    escolher = cadeia_de_tras if CADEIA_DE_TRAS else cadeia_da_frente
    marc = [d for _, _, d in escolher(cands, numeros)]
    # as decoracoes de novo, agora so com os marcadores ESCOLHIDOS como corpo: o
    # numero da pagina do Nivel A ("2" em negrito no alto) e candidato a
    # marcador, e contado como corpo ele punha o fio do cabecalho abaixo do corpo
    escolhidos = set((m['pno'], tuple(m['bb'])) for m in marc)
    if TIRA_DECORACAO:
        geo.decos = decoracoes(doc, lambda pno, l: (pno, tuple(l['bb'])) in escolhidos)
        geo.faixa = faixa_util(doc, geo.decos)
    primeiro = {}
    cache_tinta = {}
    for m in marc:
        m['topo'] = topo_da_tinta_do_marcador(doc, m, cache_tinta)
        primeiro[m['pno']] = min(primeiro.get(m['pno'], 1e9), m['bb'][1])
    geo.inicio_colunas = {pno: geo.inicio_das_colunas(pno, y) for pno, y in primeiro.items()}
    return marc, geo


def topo_da_tinta_do_marcador(doc, m, cache):
    """O topo da TINTA da linha do numero da questao, e nao da caixa do texto.

    A caixa do texto sobe uns 3 pt acima das maiusculas, e no ENEM a questao de
    cima chega perto: a alternativa E da 161 de 2020 ("16 R") desce ate 2 pt da
    caixa de "Questao 162", e o denominador da E da 171 de 2024 fica na mesma
    faixa da caixa de "QUESTAO 172". A fronteira entre as duas e o topo da
    tinta do numero, menos ACIMA_DO_MARCADOR.
    """
    import numpy as np
    pno = m['pno']
    if pno not in cache:
        tmp = pymupdf.open()
        tmp.insert_pdf(doc, from_page=pno, to_page=pno)
        pix = tmp[0].get_pixmap(dpi=144, colorspace=pymupdf.csGRAY)
        tmp.close()
        cache[pno] = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width) < gerar_pacote.LIMIAR_TINTA
    t = cache[pno]
    k = 2.0
    bb = m['bb']
    sub = t[int(bb[1] * k):int(math.ceil(bb[3] * k)), int(bb[0] * k):int(math.ceil(bb[2] * k))]
    linhas_t = np.nonzero(sub.any(axis=1))[0]
    if not len(linhas_t):
        return bb[1]
    return bb[1] + linhas_t[0] / k


def marcadores_da_solucao(doc):
    """[{numero, letra, pno, col, bb}] dos cabecalhos de solucao, em ordem de leitura."""
    out = []
    for pno, pg in enumerate(doc):
        ls = linhas(pg)
        for k, l in enumerate(ls):
            r = candidato_solucao(l)
            if not r:
                continue
            n, letra = r
            if letra is None:
                # "QUESTAO 1" e, na linha de baixo, "ALTERNATIVA C" (Nivel A de 2018 e 2019)
                for o in ls:
                    if 0 < o['bb'][1] - l['bb'][1] < 24 and abs(o['bb'][0] - l['bb'][0]) < 6:
                        a = re.match(r'^ALTERNATIVA\s*\(?([A-E])\)?(?![A-Za-z])', o['texto'], re.I)
                        if a:
                            letra = a.group(1).upper()
                            break
            out.append({'numero': n, 'letra': letra, 'pno': pno, 'col': 0, 'bb': l['bb'], 'texto': l['texto']})
    out.sort(key=lambda m: (m['pno'], m['bb'][1]))
    # numero repetido: fica o primeiro (a solucao nao reimprime o cabecalho)
    vistos, unicos = set(), []
    for m in out:
        if m['numero'] not in vistos:
            vistos.add(m['numero'])
            unicos.append(m)
    return unicos


def ler_gabarito(doc):
    """{numero: letra ou None (anulada)} pela tabela do gabarito: numero e letra na mesma linha."""
    ws = doc[0].get_text('words')
    numeros = [w for w in ws if re.match(r'^\d{2,3}$', w[4]) and 91 <= int(w[4]) <= 180]
    out = {}
    for w in numeros:
        cy = (w[1] + w[3]) / 2
        dir_ = sorted([v for v in ws if v[0] > w[2] - 1 and v[0] - w[2] < 60 and abs((v[1] + v[3]) / 2 - cy) < 4
                       and not re.match(r'^\d+$', v[4])], key=lambda v: v[0])
        letra = None
        if dir_:
            t = dir_[0][4].strip()
            if re.match(r'^[A-E]$', t):
                letra = t
        out[int(w[4])] = letra
    return out


# ------------------------------------------------------------------ provas da colecao

def provas_da_colecao(pasta, serie):
    """As provas da colecao, cada uma com os arquivos e os nomes, em ordem."""
    col = COLECOES[serie]
    out = []
    arqs = sorted(os.listdir(pasta))
    if col['fonte'] == 'mirim':
        nivel = col['nivel']
        for a in arqs:
            m = re.match(r'^(\d{4})_fase(\d)_mirim(\d)_prova\.pdf$', a)
            if m and int(m.group(3)) == nivel:
                ano, fase = int(m.group(1)), int(m.group(2))
                sol = a.replace('_prova.pdf', '_solucao.pdf')
                out.append({'chave': '%d-f%d' % (ano, fase), 'ano': ano, 'ordem': ano * 10 + fase,
                            'id': 'mirim:%d:f%d:m%d' % (ano, fase, nivel),
                            'aula': {'slug': 'mirim-%d-fase-%d' % (ano, fase),
                                     'titulo': 'OBMEP Mirim %d, %dª fase' % (ano, fase)},
                            'prova': a, 'solucao': sol if sol in arqs else None, 'gabarito': None})
        if nivel == 2:
            for a in arqs:
                m = re.match(r'^[\d-]+_obmep-nivel-a_(\d)_prova\.pdf$', a)
                if m:
                    k = int(m.group(1))
                    ano = ANO_NIVEL_A[k]
                    sol = a.replace('_prova.pdf', '_solucao.pdf')
                    out.append({'chave': 'a-%d' % ano, 'ano': ano, 'ordem': ano * 10, 'id': 'mirim:%d:a' % ano,
                                'aula': {'slug': 'nivel-a-%d' % ano, 'titulo': 'OBMEP %d, Nível A' % ano},
                                'prova': a, 'solucao': sol if sol in arqs else None, 'gabarito': None,
                                'ano_no_texto': True})
    else:
        for a in arqs:
            m = re.match(r'^(\d{4})_dia2_caderno-azul\.pdf$', a)
            if m:
                ano = int(m.group(1))
                gab = '%d_dia2_gabarito.pdf' % ano
                out.append({'chave': '%d' % ano, 'ano': ano, 'ordem': ano, 'id': 'enem:%d' % ano,
                            'aula': {'slug': 'enem-%d' % ano, 'titulo': 'ENEM %d' % ano},
                            'prova': a, 'solucao': None, 'gabarito': gab if gab in arqs else None})
    out.sort(key=lambda p: p['ordem'])
    for k, p in enumerate(out, 1):
        p['aula']['n'] = k
    return out


def conferir_capa(doc, serie, nivel_a=False):
    """Motivo de exclusao da prova inteira se a capa nao declara a serie da colecao, ou None."""
    padrao = CAPA_SERIES.get(serie)
    if not padrao:
        return None
    t = ' '.join(doc[p].get_text() for p in range(min(2, doc.page_count)))
    if not t.strip():
        return 'a prova nao tem camada de texto (texto em curvas)'
    if padrao.search(t) or (nivel_a and serie == 'm2' and CAPA_NIVEL_A.search(t)):
        return None
    return 'a capa da prova nao diz %s no texto' % ' e '.join(NOME_SERIE[s] for s in COLECOES[serie]['equivalentes'])


def detectar(pasta, prova, serie):
    """Questoes da prova: {numero: {enunciado: [fatias], solucao: [fatias] ou None, resposta, motivo}}."""
    col = COLECOES[serie]
    doc = pymupdf.open(os.path.join(pasta, prova['prova']))
    rel = {'prova': prova['prova'], 'solucao': prova['solucao'], 'gabarito': prova['gabarito'], 'notas': []}
    sem_texto = not any(doc[p].get_text().strip() for p in range(1, doc.page_count))
    capa = 'a prova nao tem camada de texto nas paginas das questoes (texto em curvas)' if sem_texto \
        else conferir_capa(doc, serie, prova.get('ano_no_texto', False))
    sol_doc = sol_geo = None
    if prova.get('ano_no_texto'):
        anos = set(int(a) for a in re.findall(r'OBMEP\s+(20\d\d)', ' '.join(p.get_text() for p in doc)))
        if anos and anos != {prova['ano']}:
            capa = capa or 'a prova diz OBMEP %s, e a tabela do gerador diz %d' % (sorted(anos), prova['ano'])
    if col['fonte'] == 'enem':
        numeros = list(range(136, 181))
        marc, geo = marcadores_da_prova(doc, numeros, so_questao=True)
        gab = ler_gabarito(pymupdf.open(os.path.join(pasta, prova['gabarito']))) if prova['gabarito'] else {}
        sol_marc = []
    else:
        sol_doc = pymupdf.open(os.path.join(pasta, prova['solucao'])) if prova['solucao'] else None
        sol_marc = marcadores_da_solucao(sol_doc) if sol_doc else []
        nums_sol = [m['numero'] for m in sol_marc]
        marc, geo = marcadores_da_prova(doc, range(1, max(nums_sol) + 1) if nums_sol else None)
        # a prova numera de 1 em diante: a questao sem marcador na prova nem na
        # solucao (2025, 2a fase) tambem e contada, como excluida
        vistos = set(m['numero'] for m in marc) | set(nums_sol)
        numeros = list(range(1, max(vistos) + 1)) if vistos else []
        gab = None
        if sol_doc:
            sol_geo = Geometria(sol_doc, [], lambda l: candidato_solucao(l) is not None)
    tr_e = trechos(geo, marc, 'coluna' if col['fonte'] == 'enem' else None)
    tr_s = trechos(sol_geo, sol_marc, folga_fim=FOLGA_FIM_SOLUCAO) if sol_marc else {}
    letra_sol = {m['numero']: m['letra'] for m in sol_marc}
    questoes = {}
    for n in numeros:
        q = {'numero': n, 'enunciado': tr_e.get(n), 'solucao': tr_s.get(n), 'motivo': None, 'resposta': None}
        if capa:
            q['motivo'] = capa
        elif n not in tr_e:
            q['motivo'] = 'marcador da questao %d nao achado na prova' % n
        elif col['fonte'] == 'enem':
            if n not in gab:
                q['motivo'] = 'questao %d fora do gabarito' % n
            elif gab[n] is None:
                q['motivo'] = 'questao anulada no gabarito oficial'
            else:
                q['resposta'] = gab[n]
        else:
            if n not in tr_s:
                q['motivo'] = 'cabecalho da solucao %d nao achado (texto em curvas na fonte)' % n
            elif not letra_sol.get(n):
                q['motivo'] = 'a solucao %d nao escreve a letra da alternativa' % n
            else:
                q['resposta'] = letra_sol[n]
        questoes[n] = q
    rel['numeros_prova'] = [m['numero'] for m in marc]
    rel['numeros_solucao'] = [m['numero'] for m in sol_marc]
    rel['duas_colunas'] = geo.duas
    return questoes, doc, geo, sol_doc, sol_geo, rel


# ------------------------------------------------------------------ pacote

def texto_dos_pedacos(doc, ps):
    return '\n'.join(gerar_pacote.texto_do_retangulo(doc, p['pno'], p['rect']) for p in ps)


def comeca_pelo_numero(doc, ps, n, fonte):
    """O texto do primeiro pedaco comeca pelo marcador da questao."""
    r = ps[0]['rect']
    ws = doc[ps[0]['pno']].get_text('words', clip=pymupdf.Rect(r))
    # a primeira linha que comeca na margem do recorte: a figura da direita pode
    # subir acima da linha do numero (Mirim 1 2023, 2a fase, questao 11)
    # so a palavra com o centro dentro do recorte: o clip do PyMuPDF devolve a
    # que so encosta ("Questoes de 136 a 180", logo acima da questao 136)
    ws = [w for w in ws if r[1] <= (w[1] + w[3]) / 2.0 <= r[3]]
    na_margem = [w for w in ws if w[0] <= r[0] + 30]
    if not na_margem:
        return False
    topo = min(na_margem, key=lambda w: (round(w[1]), w[0]))
    cy = (topo[1] + topo[3]) / 2.0
    lin = ' '.join(w[4] for w in sorted([w for w in ws if abs((w[1] + w[3]) / 2.0 - cy) < 5], key=lambda w: w[0]))
    if fonte == 'enem':
        return bool(re.match(r'^QUEST[ÃA]O\s*%d\b' % n, lin, re.I))
    return bool(re.match(r'^(QUEST[ÃA]O\s*)?%d(?!\d)' % n, lin, re.I))


def gerar(pdfs, serie, versao, saida, curadoria, trabalho=None, gerado_em=None, commit=None, gravar_zip=True,
          provas=None):
    if serie not in COLECOES:
        raise SystemExit('erro: a serie do tipo de fonte provas e m1, m2 ou 3em, e nao %r' % serie)
    t_ini = time.time()
    col = COLECOES[serie]
    fonte = FONTES[col['fonte']]
    nome = col['pacote']
    trabalho = trabalho or os.path.join(os.path.dirname(os.path.abspath(saida)), 'trabalho', '%s-v%d' % (nome, versao))
    dif_cur, apelidos, excl_cur, _excl_meta = gerar_pacote.ler_curadoria(curadoria)
    temas = carregar_temas()
    series_temas = col['temas']
    prefixo = 'PDF/provas/enem/' if col['fonte'] == 'enem' else 'PDF/matematica/obmep-mirim/'
    conteudo, itens, docs_busca = {}, [], []
    relatorio = {'pacote': nome, 'versao': versao, 'serie': serie, 'pymupdf': portal.versao_pymupdf(),
                 'provas': [], 'excluidos': [], 'assuntos': {}}
    modulos_vistos = {}
    for prova in (provas or provas_da_colecao(pdfs, serie)):
        t0 = time.time()
        questoes, doc, geo, sol_doc, sol_geo, rel = detectar(pdfs, prova, serie)
        rel.update({'chave': prova['chave'], 'aula': prova['aula']['titulo'], 'excluidos': [], 'itens': 0})
        relatorio['provas'].append(rel)
        cache_e, cache_s = {}, {}
        for n in sorted(questoes):
            q = questoes[n]
            iid = '%s:%d' % (prova['id'], n)
            motivo = 'curadoria: ' + excl_cur[iid] if iid in excl_cur else q['motivo']
            p_e, p_s = [], []
            if not motivo:
                p_e, m1 = recortar(doc, geo, q['enunciado'], cache_e)
                motivo = m1
                if not motivo and q['solucao'] is not None:
                    p_s, m2 = recortar(sol_doc, sol_geo, q['solucao'], cache_s)
                    motivo = m2
            if not motivo and (not p_e or (col['fonte'] == 'mirim' and not p_s)):
                motivo = 'recorte vazio'
            if not motivo:
                for tipo, d, ps in (('enunciado', doc, p_e), ('solucao', sol_doc, p_s)):
                    if not ps:
                        continue
                    if not comeca_pelo_numero(d, ps, n, col['fonte']):
                        motivo = 'o recorte do %s nao comeca pelo numero %d' % (tipo, n)
                    elif sum(p['rect'][3] - p['rect'][1] for p in ps) < ALTURA_MIN:
                        motivo = '%s com menos de %g pt de altura' % (tipo, ALTURA_MIN)
            if motivo:
                rel['excluidos'].append({'id': iid, 'numero': n, 'motivo': motivo})
                continue
            txt_e = texto_dos_pedacos(doc, p_e)
            txt_s = texto_dos_pedacos(sol_doc, p_s) if p_s else ''
            tid, chaves = assunto_por_palavra(portal.recompor(txt_e + '\n' + txt_s), temas, series_temas)
            if tid:
                modulo = {'slug': '%s-%s' % (col['fonte'], portal.slug_de(temas[tid]['titulo'])), 'titulo': temas[tid]['titulo']}
            else:
                modulo = {'slug': '%s-diversos' % col['fonte'], 'titulo': 'Diversos'}
            modulos_vistos[modulo['slug']] = modulo['titulo']
            relatorio['assuntos'].setdefault(tid or 'Diversos', []).append(iid)
            casas = 3 if n > 99 else 2
            base_a = 'assets/%s/%s/%s/ex-%0*d' % (serie, modulo['slug'], prova['aula']['slug'], casas, n)
            assets, medidas, origem, falhou = {}, {}, {}, None
            for tipo, d, ps, suf in (('enunciado', doc, p_e, '.svg'), ('solucao', sol_doc, p_s, '-sol.svg')):
                if not ps:
                    continue
                svgs, meds = [], []
                for p in ps:
                    svg, dif, obs = gerar_pacote.svg_redigido(d, p['pno'], p['rect'])
                    if dif > gerar_pacote.LIMITE_REDACAO:
                        falhou = '%s: apagar o de fora mudou %.2f%% dos pixels do recorte' % (tipo, 100 * dif)
                    if obs:
                        rel['notas'].append({'id': iid, 'nota': '%s p%d: %s' % (tipo, p['pno'] + 1, obs)})
                    svgs.append(svg)
                    meds.append((p['rect'][2] - p['rect'][0], p['rect'][3] - p['rect'][1]))
                svg, (w, h) = gerar_pacote.empilhar(svgs, meds)
                conteudo[base_a + suf] = svg.encode('utf-8')
                assets[tipo] = base_a + suf
                # sem caixa de rotulo: o numero da prova vem colado ao texto, e o app
                # escreve o numero novo numa linha acima (como no Banco)
                medidas[tipo] = {'largura_pt': round(w, 1), 'altura_pt': round(h, 1), 'rotulo': None}
                o = {'pagina': ps[0]['pno'] + 1, 'coluna': ps[0]['col'] + 1, 'bbox': list(ps[0]['rect'])}
                if len(ps) > 1:
                    o['pedacos'] = [{'pagina': p['pno'] + 1, 'coluna': p['col'] + 1, 'bbox': list(p['rect'])} for p in ps]
                if tipo == 'solucao':
                    o['arquivo'] = prefixo + prova['solucao']
                origem[tipo] = o
            if falhou:
                for c in assets.values():
                    conteudo.pop(c, None)
                rel['excluidos'].append({'id': iid, 'numero': n, 'motivo': falhou})
                continue
            if 'solucao' not in assets:
                assets['solucao'] = None
                medidas['solucao'] = None
            total = max(questoes)
            item = {
                'id': iid, 'fonte': fonte['id'], 'serie': serie,
            }
            if col['equivalentes']:
                item['series_equivalentes'] = col['equivalentes']
            item.update({
                'modulo': modulo, 'aula': dict(prova['aula']), 'numero': n, 'titulo': None,
                'formato': 'objetiva', 'alternativas': ['A', 'B', 'C', 'D', 'E'], 'resposta': q['resposta'],
                'subitens': [], 'texto': portal.para_busca(txt_e), 'origem_citada': None,
            })
            if iid in dif_cur:
                item.update({'dificuldade': dif_cur[iid], 'dificuldade_origem': 'curadoria'})
                item['proxy'] = None
            elif col['fonte'] == 'mirim':
                # como o Portal: o terco da posicao na prova (a prova da OBMEP vai
                # das mais faceis para as mais dificeis)
                pos = round(n / float(total), 2)
                item.update({'dificuldade': min(3, int(math.ceil(3 * n / float(total)))), 'dificuldade_origem': 'proxy',
                             'proxy': {'posicao': pos, 'terco': min(3, int(math.ceil(3 * n / float(total))))}})
            else:
                # o ENEM nao ordena por dificuldade: valor neutro, declarado
                item.update({'dificuldade': 2, 'dificuldade_origem': 'proxy', 'proxy': {'neutro': True}})
            item['tema_app'] = tid
            if tid:
                item['tema_chaves'] = chaves
            item['assets'] = assets
            item['medidas'] = medidas
            if assets['solucao'] is None:
                item['sem_solucao'] = True
            item['origem'] = dict({'arquivo': prefixo + prova['prova']}, **origem)
            itens.append(item)
            rel['itens'] += 1
            docs_busca.append({'id': iid, 'serie': serie, 'tipo': 'exercicio', 'titulo': '%s, questão %d' % (prova['aula']['titulo'], n),
                               'resumo': '%s %s' % (modulo['titulo'], prova['aula']['titulo']),
                               'texto': portal.sem_tracos(portal.recompor(txt_e)),
                               'explicacao': portal.sem_tracos(portal.recompor(txt_s))})
        rel['segundos'] = round(time.time() - t0, 1)
        relatorio['excluidos'].extend(rel['excluidos'])
        doc.close()
        if sol_doc:
            sol_doc.close()

    for slug in sorted(modulos_vistos):
        ids = [i for i in itens if i['modulo']['slug'] == slug]
        docs_busca.append({'id': '%s:%s' % (serie, slug), 'serie': serie, 'tipo': 'modulo', 'titulo': modulos_vistos[slug],
                           'resumo': ' '.join(sorted(set(i['aula']['titulo'] for i in ids))), 'texto': ''})
    itens.sort(key=lambda i: (i['modulo']['slug'], i['aula']['n'], i['numero']))
    docs_busca.sort(key=lambda d: d['id'])
    conteudo['itens.json'] = gerar_pacote.json_bytes(itens)
    conteudo['teoria.json'] = gerar_pacote.json_bytes([])
    conteudo['busca.json'] = gerar_pacote.json_bytes(gerar_pacote.montar_busca(docs_busca))
    conteudo['apelidos.json'] = gerar_pacote.json_bytes(apelidos)
    aulas = set((i['modulo']['slug'], i['aula']['slug']) for i in itens)
    contagens = {'modulos': len(modulos_vistos), 'aulas_teoria': 0, 'paginas_teoria': 0, 'aulas_exercicios': len(aulas),
                 'itens': len(itens), 'itens_com_solucao': sum(1 for i in itens if i['assets']['solucao']),
                 'itens_excluidos': len(relatorio['excluidos'])}
    manifest = {
        'esquema': 1, 'pacote': nome, 'versao': versao,
        'gerado_em': gerado_em or datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).replace(microsecond=0).isoformat(),
        'gerador': {'nome': 'biblioteca/gerar_pacote.py --fonte %s' % col['fonte'],
                    'commit': commit or gerar_pacote.commit_do_gerador(), 'pymupdf': pymupdf.VersionBind},
        'materia': 'matematica', 'fonte': fonte, 'series': [serie],
    }
    if col['equivalentes']:
        manifest['series_equivalentes'] = {serie: col['equivalentes']}
    manifest.update({'contagens': contagens, 'arquivos': {k: gerar_pacote.sha(conteudo[k]) for k in sorted(conteudo)}})
    manifest_b = (json.dumps(manifest, ensure_ascii=False, indent=1) + '\n').encode('utf-8')
    zip_caminho = gerar_pacote.gravar_pacote(conteudo, manifest_b, nome, versao, saida, trabalho, gravar_zip)
    ids = {i['id'] for i in itens}
    ids_excl = {e['id'] for e in relatorio['excluidos']}
    pref = 'enem:' if col['fonte'] == 'enem' else 'mirim:'
    relatorio['curadoria_sem_item'] = sorted(
        ['dificuldade.csv: ' + k for k in dif_cur if k.startswith(pref) and k not in ids | ids_excl
         and (pref == 'enem:' or provas_da_serie(k, serie))] +
        ['exclusoes.csv: ' + k for k in excl_cur if k.startswith(pref) and k not in ids_excl
         and (pref == 'enem:' or provas_da_serie(k, serie))])
    tam = collections.Counter()
    for k, v in conteudo.items():
        if k.startswith('assets/'):
            t = 'solucao' if k.endswith('-sol.svg') else 'enunciado'
            tam[t] += len(v)
            tam['n_' + t] += 1
        else:
            tam[k] += len(v)
    relatorio.update({
        'contagens': contagens, 'hash_manifest': gerar_pacote.sha(manifest_b),
        'zip': {'caminho': zip_caminho if gravar_zip else None,
                'bytes': os.path.getsize(zip_caminho) if gravar_zip else None},
        'bytes_por_tipo': dict(sorted(tam.items())), 'segundos': round(time.time() - t_ini, 1),
    })
    with open(os.path.join(trabalho, 'relatorio.json'), 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps(relatorio, ensure_ascii=False, indent=1) + '\n')
    return manifest, relatorio, trabalho


def provas_da_serie(iid, serie):
    """O id da Mirim e desta colecao? (mirim:<ano>:f<fase>:m<N>:<n> ou mirim:<ano>:a:<n> do m2)."""
    partes = iid.split(':')
    if len(partes) == 5:
        return partes[3] == serie
    return serie == 'm2' and len(partes) == 4 and partes[2] == 'a'
