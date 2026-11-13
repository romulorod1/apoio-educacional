"""Tipo de fonte "cadernos-sme-sp" do gerador da biblioteca: os Cadernos de
Apoio e Aprendizagem de Matematica da Secretaria Municipal de Educacao de Sao
Paulo (SME-SP), 2o ao 9o ano, edicao revisada de 2014 (item C5 da frente
"Listas de exercicios").

    python biblioteca/gerar_pacote.py --fonte cadernos-sme-sp --pdfs <PDF/matematica/cadernos-apoio-sme-sp>
        --vinculos <vinculos.csv> --versao 1 --saida <pasta> --curadoria <Biblioteca/curadoria>

Como o provas.py, este modulo so ACHA a atividade no caderno; o recorte em
SVG, o empilhamento, a busca, o manifest e o zip deterministico sao os do
gerador do Portal (gerar_pacote.py), e o recorte pela tinta e a conferencia de
borda sao os das provas (provas.py).

Licenca. O Decreto municipal 52.681/2011 (Sao Paulo), art. 1o, manda licenciar
as obras da SME para copia, distribuicao e obra derivada, com atribuicao, sem
fins comerciais e sob a mesma licenca: o equivalente da CC BY-NC-SA. Por isso
cada item leva `licenca`, `atribuicao` e `link` (o endereco do acervo da SME),
campos aditivos que o aplicativo junta no credito do cartao, da tela cheia e
da folha (L6). A atribuicao curta vai tambem em `origem_citada`, o texto de
origem que o aplicativo ja desenhava.

Fotos e ilustracoes de terceiros nao entram (decisao da orquestradora,
13/11/2026): so o texto e os desenhos proprios do caderno. O caderno credita
cada foto e cada reproducao com uma linha miuda, quase sempre girada ao lado
da imagem ("walter craveiro", "Delfim Martins/Pulsar Imagens",
"wikipedia.org", "(c) joao candido portinari"); os desenhos encomendados para
o caderno nao tem credito. A atividade com credito de imagem dentro do recorte
sai inteira, com o credito no motivo (a imagem nao e apagada do recorte: o
recorte e fiel ou nao entra). O que nao tem credito e e de terceiro (cedula
de dinheiro, por exemplo) sai pela curadoria (o csv de vinculos), com motivo.

Unidade do pacote (o "exercicio" do app):
- atividade: do titulo dela (lido no Indice do proprio caderno) ate o titulo
  seguinte; atravessa paginas, e os pedacos saem empilhados num SVG so;
- "Agora, e com voce" (a revisao do fim de cada unidade): uma questao por
  item, porque as questoes sao independentes e cada uma tem o seu assunto;
  questoes lado a lado na mesma faixa saem juntas, num item so.
A abertura de cada unidade (conversa de sala) e o que vem depois da ultima
atividade (paginas de anotacoes) nao sao atividades. A revisao com texto comum
antes da questao 1 sai inteira, e o item que remete a outra atividade, questao
ou pagina ("a tabela da atividade anterior") sai com motivo: separado, nao se
resolveria sozinho.

Campos (CONTRATO_pacote_biblioteca.md, esquema 1; os novos sao aditivos e o
aplicativo ignora o que nao conhece):
- id: sme:<serie>:p<pagina impressa, 3 casas>[b, c...] para a atividade e
  sme:<serie>:p<pagina>:q<numero> para a questao da revisao. Nao depende do
  assunto: reclassificar nao muda id.
- serie: a do caderno (2ano a 9ano). tema_app: o assunto do aplicativo, pelo
  csv de vinculos (feito por leitura). modulo: o assunto. aula: o caderno.
- tom: 'lúdico' no 2o e no 3o ano, 'escolar' do 4o ao 9o (TOM, abaixo), com
  uma excecao medida: a questao solta da revisao do 2o e do 3o ano e
  'escolar' (tom_do_item).
- dificuldade: o caderno nao da referencia de dificuldade; sai null, com
  dificuldade_origem null (o app ja trata dificuldade ausente).
- sem solucao: o caderno do aluno nao traz respostas; assets.solucao null,
  sem_solucao true, resposta null. Com --gabarito-externo, o item que tem
  entrada ganha `gabarito` {origem: 'agente-conferido', respostas: [{subitem,
  resposta}]}, a resposta de duas IAs que resolveram separadas e concordaram
  (gerar_pacote.aplicar_gabarito_externo); o resto do item nao muda. Com
  --so-com-resposta, o item que ficou sem gabarito sai do pacote
  (gerar_pacote.tirar_sem_resposta), e o que fica guarda o `numero` que teria
  sem a opção (a lista pode ficar com buraco: o aplicativo ordena por numero).
  A atividade de dinâmica de sala (em grupo, jogo, material, pesquisa com a
  turma) não é filtrada aqui: a curadoria a lê e julga item a item antes de
  as IAs resolverem, e só o item julgado ganha gabarito.
- origem_detalhe (aditivo): caderno, ano, volume, edicao, pagina(s), unidade,
  atividade e, na revisao, a questao.
"""
import collections
import csv
import datetime
import io
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
import provas  # noqa: E402

FONTE = {
    'id': 'cadernos-sme-sp',
    'nome': 'Cadernos de Apoio e Aprendizagem, SME-SP',
    'url': 'https://acervodigital.sme.prefeitura.sp.gov.br/',
    'licenca': ('licença livre para uso não comercial, com atribuição e compartilhamento pela mesma licença '
                '(Decreto municipal 52.681/2011 de São Paulo, art. 1º; equivale a CC BY-NC-SA)'),
}
PACOTE = 'matematica-cadernos-sme-sp'
ARQUIVO = re.compile(r'^CadernosApoioAprendizagemMatematicaAluno([2-9])Ano\.pdf$')
PREFIXO = 'PDF/matematica/cadernos-apoio-sme-sp/'
NOME_CADERNO = 'Cadernos de Apoio e Aprendizagem: Matemática'
EDICAO = '2ª edição revisada e atualizada, SME-SP, 2014'
LICENCA_ITEM = ('Uso não comercial, com atribuição e pela mesma licença (Decreto municipal 52.681/2011 de São Paulo; '
                'equivale a CC BY-NC-SA). Recorte fiel, sem alteração.')
TOM = {'2ano': 'lúdico', '3ano': 'lúdico', '4ano': 'escolar', '5ano': 'escolar', '6ano': 'escolar',
       '7ano': 'escolar', '8ano': 'escolar', '9ano': 'escolar'}
TOM_REVISAO_ESCOLAR = True  # a questao da revisao do 2o e do 3o ano e escolar; False so no veneno


def tom_do_item(serie, tipo):
    """O tom pelo ano, com uma excecao medida: a questao da revisao "Agora, e
    com voce" do 2o e do 3o ano e escolar (questao solta, no formato de prova,
    sem a historia da atividade). A lente "matematico rigoroso" leu 16 delas
    na amostra do C5 e deu escolar a 15."""
    if tipo == 'questao' and TOM[serie] == 'lúdico' and TOM_REVISAO_ESCOLAR:
        return 'escolar'
    return TOM[serie]


NOME_SERIE = {'2ano': '2º ano', '3ano': '3º ano', '4ano': '4º ano', '5ano': '5º ano', '6ano': '6º ano',
              '7ano': '7º ano', '8ano': '8º ano', '9ano': '9º ano'}

# Os 33 assuntos do estudo "FONTES ABERTAS e escadinha de tom" (12/11/2026) que
# esta fonte leva a ter uma lista: so eles entram nesta versao do pacote
# (decisao da orquestradora, 13/11). Atividade de outro assunto fica fora, e o
# relatorio conta quantas.
ALVO = (
    'MAT02-01', 'MAT02-02', 'MAT02-03', 'MAT02-06', 'MAT02-08', 'MAT02-09', 'MAT02-10', 'MAT02-11', 'MAT02-12',
    'MAT03-01', 'MAT03-02', 'MAT03-03', 'MAT03-04', 'MAT03-05', 'MAT03-07', 'MAT03-10', 'MAT03-11', 'MAT03-12',
    'MAT04-04', 'MAT04-12',
    'MAT05-01', 'MAT05-08', 'MAT05-11', 'MAT05-12',
    'MAT06-04', 'MAT06-13', 'MAT07-08', 'MAT08-02', 'MAT08-04', 'MAT08-11', 'MAT08-13', 'MAT08-14', 'MATEM1-12',
)

FOLGA = 3.0              # pt em volta da tinta
ACIMA_DO_TITULO = 4.0    # o recorte comeca um pouco acima da caixa do titulo
ANTES_DO_PROXIMO = 4.0   # e acaba um pouco antes do titulo (ou da questao) seguinte
ALTURA_MIN = 20.0        # recorte de enunciado mais baixo que isto nao e atividade
PEDACO_MIN = 9.0         # pedaco de continuacao mais baixo que isto nao e conteudo
BANDA = 0.12             # fracao da altura onde moram cabecalho e rodape corridos
REPETE_MIN = 0.3         # corrido: na mesma altura em ao menos 30% das paginas
CREDITO_GIRADO_MAX = 7.0  # texto girado ate este corpo, com letras, e credito de imagem
CREDITO_GIRADO_IMAGEM = 8.5  # ate este, quando encosta numa imagem (a capa de jornal do 6o ano, p. 22, credita em 8 pt)
CREDITO_MIUDO_MAX = 8.5   # texto miudo ate este corpo, com palavra de credito, tambem
MARGEM_QUESTAO = 14.0    # o numero da questao da revisao fica ate 14 pt da margem
MAX_PAGINAS = 5          # uma atividade nunca passa disto (salvaguarda contra fim nao achado)

# regras que a prova desliga uma a uma (venenos)
TIRA_CREDITO = True      # atividade com credito de imagem de terceiro sai com motivo; False so no veneno
SEPARA_REVISAO = True    # a revisao sai uma questao por item; False so no veneno
TIRA_CORRIDO = True      # cabecalho e rodape corridos ficam fora do recorte; False so no veneno
CONFERE_BORDA = True     # recorte que corta tinta na borda sai com motivo; False so no veneno
FIO_FINO = True          # o desenho vetorial claro ou fino (linha de resposta, quadro) entra no recorte; False so no veneno
IMAGEM_ACIMA_E_DA_SEGUINTE = True  # desenho no alto da pagina, acima do numero, e da questao seguinte; False so no veneno
TITULO_FORTE = True      # a linha do titulo cobre ao menos 10 letras dele; False so no veneno
PAGINA_SO_DE_DESENHO = True  # pagina so de desenho, sem texto, nao encerra a atividade; False so no veneno
SELO_DO_RODAPE = True    # o desenho que encosta no numero da pagina e do rodape; False so no veneno
TIRA_REFERENCIA = True   # o item que remete a outra atividade, questao ou pagina sai com motivo; False so no veneno
REVISAO_COM_ENUNCIADO_INTEIRA = True  # revisao com texto comum antes do "1." nao se separa; False so no veneno

# o item que remete a outra atividade ou pagina nao se resolve sozinho (achado
# da revisao do C5: "ordene os numeros da atividade anterior", "a tabela que
# voce montou na atividade anterior", "os prismas da pagina anterior")
REFERENCIA = re.compile(r'\b(?:atividades?|p[aá]ginas?)\s+anterior(?:es)?\b|\bp[aá]gina\s+\d+', re.I)
# so na questao solta: "a questao anterior" e outra questao; na atividade inteira
# ("os itens anteriores", "como vimos anteriormente") a referencia e interna
REFERENCIA_QUESTAO = re.compile(r'\b(?:quest[oõ](?:es)?|quest[aã]o|exerc[ií]cios?|itens?|problemas?)\s+anterior(?:es)?\b', re.I)
# a questao solta da revisao que cita "o quadro 1" ou "a tabela 2" sem traze-los
ROTULO = re.compile(r'\b(quadro|tabela|figura|grafico)(s?)\s+(\d+)((?:\s*(?:,|e)\s*\d+)*)(\s*:)?', re.I)

PALAVRA_DE_CREDITO = re.compile(
    r'\bfotos?\b|wiki(?:pedia|media)|getty|pulsar|folha\s*(?:press|imagem)|folhapress|\bafp\b|\bnasa\b|reprodu[cç][aã]o'
    r'|©|\bacervo\b|shutterstock|latin\s*stock|stockfood|thinkstock|\bimages?\b|\bimagens\b|projeto\s+portinari'
    r'|arquivo\s+\w+|\bae\b|agência|\bfolha\b|estad[aã]o|estado\s+de\s+s|\bveja\b|\brevista\b|\bjornal\b|stock', re.I)
ANEXO = re.compile(r'\banexos?\b', re.I)


def sem_acento(t):
    t = unicodedata.normalize('NFD', t)
    return ''.join(c for c in t if unicodedata.category(c) != 'Mn').lower()


def so_letras(t):
    """O texto so com letras e algarismos, sem acento: para casar titulo do indice com a pagina."""
    t = t.replace('º', 'o').replace('ª', 'a')  # 2º e 2o, 1ª e 1a
    return re.sub(r'[^a-z0-9]', '', sem_acento(t))


def carregar_temas():
    d = json.load(open(os.path.join(RAIZ, 'banco', 'topicos', 'matematica.json'), encoding='utf-8'))
    return {t['id']: {'serie': t['serie'], 'titulo': t['pt']['titulo']} for t in d['temas']}


# ------------------------------------------------------------------ linhas

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
            girada = abs(l['dir'][1]) > 0.05
            out.append({'bb': tuple(l['bbox']), 'texto': t, 'tam': sp['size'], 'fonte': sp['font'],
                        'neg': bool(sp['flags'] & 16) or bool(re.search(r'Bold|Black|Ultra|Heavy', sp['font'])),
                        'girada': girada})
    return out


def eh_credito(l, imagens=()):
    """A linha e credito de foto ou reproducao de terceiro?

    imagens: as caixas das imagens raster da pagina; o texto girado de ate
    CREDITO_GIRADO_IMAGEM pt a ate 6 pt de uma delas tambem e credito."""
    letras = sum(1 for c in l['texto'] if c.isalpha())
    if letras < 2:
        return False
    if l['girada'] and l['tam'] <= CREDITO_GIRADO_MAX:
        return True
    if l['girada'] and l['tam'] <= CREDITO_GIRADO_IMAGEM:
        # ao lado da imagem, e nao em cima dela: o rotulo do eixo de um grafico
        # feito como imagem ("Quantidade de alunos", 4o ano, p. 165) fica dentro
        bb = pymupdf.Rect(l['bb'])
        r = bb + (-6, -6, 6, 6)
        dentro = any(not (bb & pymupdf.Rect(i)).is_empty and (bb & pymupdf.Rect(i)).get_area() > 0.2 * bb.get_area()
                     for i in imagens)
        if not dentro and any(r.intersects(pymupdf.Rect(i)) for i in imagens):
            return True
    return l['tam'] <= CREDITO_MIUDO_MAX and bool(PALAVRA_DE_CREDITO.search(l['texto']))


def imagens_da_pagina(pg):
    return [tuple(b['bbox']) for b in pg.get_text('dict')['blocks'] if b['type'] == 1]


# ------------------------------------------------------------------ indice

# a guia de pontos pode ter um ponto so, quando o titulo e comprido
# ("Outras dicas para calcular multiplicacao. 103", 4o ano)
LIDER = re.compile(r'^(.*?)[\s.]*(?:(?:\.\s*){2,}|\.\s+)(\d{1,3})\s*$')


def ler_indice(doc):
    """[{titulo, pagina (impressa), tipo}] do Indice do caderno, em ordem.

    A entrada e uma linha com pontos de guia e o numero da pagina; linha sem
    eles e o comeco do titulo da linha seguinte ("O CARRO DE DONA AMELIA" e
    "E O RODIZIO . . . 34"). tipo: 'unidade' ("Unidade 3"), 'revisao' ("Agora,
    e com voce") ou 'atividade'.
    """
    out = []
    em_indice = False
    for pno in range(min(30, doc.page_count)):
        ls = linhas_do_indice(doc[pno])
        guias = [t for t in ls if LIDER.match(t)]
        if len(guias) < 5:
            if em_indice:
                break
            continue
        em_indice = True
        pend = ''
        for t in ls:
            # "Unidade 5 . . . 91": a linha da unidade as vezes traz pontos depois
            # do numero da pagina, e a guia nao casa; o numero da pagina e o
            # ultimo numero da linha que nao e o da unidade
            u = re.match(r'^unidade\s*(\d+)\b(.*)$', sem_acento(t))
            if u:
                nums = re.findall(r'(?<![\d])(\d{1,3})(?![\d])', u.group(2))
                if nums:
                    out.append({'titulo': 'Unidade %s' % u.group(1), 'pagina': int(nums[-1]), 'tipo': 'unidade'})
                    pend = ''
                    continue
            m = LIDER.match(t)
            if not m:
                # a sobra de pontos da linha da unidade nao e titulo
                if so_letras(t) not in ('indice', ''):
                    pend = (pend + ' ' + t).strip()
                continue
            titulo = re.sub(r'\s+', ' ', (pend + ' ' + m.group(1)).strip()).strip(' .')
            pend = ''
            n = so_letras(titulo)
            tipo = 'unidade' if re.match(r'^unidade\d+$', n) else 'revisao' if n.startswith('agoraecomvoce') else 'atividade'
            out.append({'titulo': titulo, 'pagina': int(m.group(2)), 'tipo': tipo})
    return out


def linhas_do_indice(pg):
    """As linhas da pagina como o Indice se le: coluna da esquerda de cima para
    baixo, depois a da direita, cada linha montada palavra a palavra.

    O Indice tem duas colunas, e o numero da pagina as vezes e um texto a parte
    na ponta da linha de pontos ("DE ADICOES . . ." e "97"): por isso a linha e
    montada pelas palavras da mesma altura, na mesma coluna, e nao pelas
    linhas do PDF (que intercalavam as duas colunas)."""
    W = pg.rect.width
    ws = [w for w in pg.get_text('words') if w[4].strip()]
    colunas = ([w for w in ws if (w[0] + w[2]) / 2 < W / 2], [w for w in ws if (w[0] + w[2]) / 2 >= W / 2])
    out = []
    for col in colunas:
        filas = []
        for w in sorted(col, key=lambda w: ((w[1] + w[3]) / 2, w[0])):
            cy = (w[1] + w[3]) / 2
            if filas and abs(filas[-1][0] - cy) <= 3.5:
                filas[-1][1].append(w)
            else:
                filas.append([cy, [w]])
        out.extend(' '.join(x[4] for x in sorted(f[1], key=lambda w: w[0])) for f in filas)
    return out


def deslocamento(doc):
    """Pagina do PDF (0..) menos pagina impressa: pelo numero no pe das paginas."""
    votos = collections.Counter()
    for pno, pg in enumerate(doc):
        H = pg.rect.height
        for l in linhas(pg):
            if l['bb'][1] >= H * (1 - BANDA) and re.match(r'^\d{1,3}$', l['texto']):
                votos[pno - int(l['texto'])] += 1
    return votos.most_common(1)[0][0] if votos else 0


# ------------------------------------------------------------------ cabecalho e rodape

def faixas(doc):
    """(topo, pe) util de cada pagina: abaixo do cabecalho e acima do rodape corridos.

    Corrido e a linha que se repete na mesma altura (com os numeros trocados
    por #) em ao menos REPETE_MIN das paginas, dentro da BANDA do alto ou do
    pe. O que esta na mesma faixa de altura de um corrido vai junto ("16" e
    "dezesseis", o numero por extenso, que muda de pagina a pagina).
    """
    n = doc.page_count
    por_pag, cont = [], collections.Counter()
    for pg in doc:
        H = pg.rect.height
        els = []
        for l in linhas(pg):
            y0, y1 = l['bb'][1], l['bb'][3]
            if y1 <= H * BANDA or y0 >= H * (1 - BANDA):
                k = ('a' if y1 <= H * BANDA else 'p', int(round(y0 / 3.0)), re.sub(r'\d+', '#', so_letras(l['texto'])))
                els.append((k, l['bb']))
        por_pag.append(els)
        for k in set(k for k, _ in els):
            cont[k] += 1
    out = []
    for pno, pg in enumerate(doc):
        H = pg.rect.height
        corr = [(k, bb) for k, bb in por_pag[pno] if TIRA_CORRIDO and cont[k] >= max(3, REPETE_MIN * n)]
        junto = lambda bb: any(min(bb[3], q[3]) - max(bb[1], q[1]) > 0 for _, q in corr)
        alto = [bb[3] for k, bb in por_pag[pno] if k[0] == 'a' and (junto(bb))]
        pe = [bb[1] for k, bb in por_pag[pno] if k[0] == 'p' and (junto(bb))]
        if SELO_DO_RODAPE and corr:
            # o desenho ou a imagem que encosta num corrido e dele: o circulo em
            # volta do numero da pagina sobe ate y 721, acima do texto "16"
            # (y 727), e o pe pelo texto deixava o topo do circulo no recorte
            # (achado da revisao do C5: 231 de 364 pedacos)
            caixas = [tuple(d['rect']) for d in pg.get_drawings()] + imagens_da_pagina(pg)
            for r in caixas:
                if r[3] - r[1] > H * BANDA * 1.5 or r[2] - r[0] > pg.rect.width * 0.9:
                    continue  # fundo ou moldura grande nao e selo de rodape
                if H * BANDA + 10 < r[1] < H * (1 - BANDA) - 10:
                    continue  # o selo comeca dentro da banda: o quadro do conteudo que so encosta no rodape fica
                for k, q in corr:
                    if k[0] == 'p' and pymupdf.Rect(r).intersects(pymupdf.Rect(q)):
                        pe.append(r[1])
                    if k[0] == 'a' and pymupdf.Rect(r).intersects(pymupdf.Rect(q)):
                        alto.append(r[3])
        out.append((max(alto) + 1.5 if alto else 0.0, min(pe) - 1.5 if pe else H - 1.0))
    return out


# ------------------------------------------------------------------ atividades

def achar_titulo(pg, titulo, topo, pe):
    """A caixa da linha do titulo na pagina, ou None: a linha mais alta cujo texto
    e o comeco do titulo (o titulo pode quebrar em duas linhas)."""
    ls = [l for l in linhas(pg) if topo - 1 <= l['bb'][1] <= pe and not l['girada']]
    cands = linhas_de_titulo(ls, titulo)
    if not cands:
        return None
    # a mais alta; o corpo so desempata (a regra "o de maior corpo" pegava
    # "calculo:" de 17 pt no lugar do titulo de 12 pt, 3o ano, p. 100)
    return min(cands, key=lambda l: (round(l['bb'][1]), -round(l['tam']), l['bb'][0]))['bb']


def linhas_de_titulo(ls, titulo):
    """As linhas de `ls` que comecam o titulo: a linha sozinha, ou somada as
    linhas logo abaixo dela, na mesma fonte e corpo, quando o titulo quebra
    numa primeira linha curta ("O JARDIM" e "DOS SENTIDOS", 2o ano, p. 116)."""
    out = []
    for l in ls:
        texto, ult = l['texto'], l
        if not casa_titulo(texto, titulo):
            alvo, n = so_letras(titulo), so_letras(texto)
            if not (len(n) >= 3 and alvo.startswith(n)):
                continue
            for o in sorted(ls, key=lambda o: o['bb'][1]):
                if o is l or o['fonte'] != l['fonte'] or abs(o['tam'] - l['tam']) > 0.5:
                    continue
                if 0 <= o['bb'][1] - ult['bb'][1] <= 1.6 * (ult['bb'][3] - ult['bb'][1]) and o['bb'][1] > ult['bb'][1]:
                    texto, ult = texto + ' ' + o['texto'], o
                    if casa_titulo(texto, titulo):
                        break
            if not casa_titulo(texto, titulo):
                continue
        out.append(l)
    return out


def casa_titulo(texto, titulo):
    """A linha e o titulo (ou o comeco dele, quando quebra em duas linhas)?
    Tem de cobrir uma parte real do titulo: ao menos 10 letras, ou ele todo.
    "calculo:" nao casa com "Calculos e decomposicoes", nem "piramide:" com
    "Piramides e superficies" (achado da segunda revisao)."""
    alvo, n = so_letras(titulo), so_letras(texto)
    if not n or not alvo:
        return False
    if TITULO_FORTE and len(n) < min(len(alvo), 10):
        return False
    return alvo.startswith(n) or n.startswith(alvo)


def texto_acima(pg, bb, topo):
    """Ha texto (nao girado e que nao e credito) acima da linha do titulo, na faixa util?"""
    return any(l['bb'][3] <= bb[1] + 1 and l['bb'][1] >= topo - 1 and not l['girada'] and not eh_credito(l)
               for l in linhas(pg))


def continua_acima(pg, bb, topo):
    """O texto acima do titulo e a continuacao da unidade anterior?

    Sim quando ha questao numerada ("3. ...") ou mais de duas linhas de texto
    acima do titulo. A legenda curta de uma foto ou de um desenho no alto da
    pagina ("Parque Estadual Carlos Botelho...", 4o ano, p. 130) e desta
    atividade, como o desenho: ela comeca no topo da pagina."""
    ims = imagens_da_pagina(pg)
    acima = [l for l in linhas(pg) if l['bb'][3] <= bb[1] + 1 and l['bb'][1] >= topo - 1 and not l['girada']
             and not eh_credito(l, ims)]
    return len(acima) > 2 or any(re.match(r'^\d{1,2}\s*[.)](?!\d)', l['texto']) for l in acima)


def pagina_vazia(pg, topo, pe):
    """Fim do caderno: a pagina de "ANOTACOES", ou sem texto E sem imagem nem
    desenho entre o topo e o pe. Pagina so de desenho (o tabuleiro de "A trilha
    do resto", 5o ano, p. 91) NAO e vazia: e da atividade (achado da revisao)."""
    ts = [so_letras(l['texto']) for l in linhas(pg) if topo <= l['bb'][1] and l['bb'][3] <= pe + 1]
    ts = [t for t in ts if t]
    if ts:
        return all(t in ('anotacoes',) for t in ts)
    if not PAGINA_SO_DE_DESENHO:
        return True
    caixas = [tuple(d['rect']) for d in pg.get_drawings()] + imagens_da_pagina(pg)
    return not any(r[1] >= topo - 1 and r[3] <= pe + 1 and (r[2] - r[0]) * (r[3] - r[1]) > 100 for r in caixas)


def unidades_do_caderno(doc, serie, cache):
    """As atividades e revisoes do caderno: [{tipo, titulo, unidade, pagina_impressa,
    ini: (pno, y), fim: (pno, y)}], com o fim ja no comeco da entrada seguinte."""
    indice = ler_indice(doc)
    desl = deslocamento(doc)
    fx = faixas(doc)
    entradas, unidade, notas = [], 0, []
    for e in indice:
        pno = e['pagina'] + desl
        if not (0 <= pno < doc.page_count):
            notas.append('indice aponta pagina fora do arquivo: %r p%d' % (e['titulo'], e['pagina']))
            continue
        if e['tipo'] == 'unidade':
            unidade = int(re.sub(r'\D', '', e['titulo']) or 0)
            entradas.append(dict(e, unidade=unidade, ini=(pno, fx[pno][0])))
            continue
        bb = achar_titulo(doc[pno], e['titulo'], *fx[pno])
        if bb is None:
            notas.append('titulo do indice nao achado na pagina: %r p%d' % (e['titulo'], e['pagina']))
            y = fx[pno][0]
        elif not continua_acima(doc[pno], bb, fx[pno][0]):
            # o titulo e o primeiro texto da pagina: o que estiver acima dele (o
            # desenho que abre a atividade) e desta atividade, e a anterior
            # acaba na pagina de antes
            y = fx[pno][0]
        else:
            y = fronteira_livre(doc, pno, bb[1] - ACIMA_DO_TITULO, fx[pno][0], cache)
        entradas.append(dict(e, unidade=unidade, ini=(pno, max(y, fx[pno][0])), titulo_bb=bb))
    entradas.sort(key=lambda e: e['ini'])
    out = []
    for k, e in enumerate(entradas):
        if e['tipo'] == 'unidade':
            continue
        p0 = e['ini'][0]
        if k + 1 < len(entradas) and entradas[k + 1]['tipo'] != 'unidade':
            # ate o titulo seguinte (ACIMA_DO_TITULO = ANTES_DO_PROXIMO: o inicio
            # dele ja e a fronteira); titulo no alto da pagina deixa a fatia
            # dessa pagina vazia, e fatias() a descarta
            q = entradas[k + 1]['ini']
            fim = (q[0], q[1] + ACIMA_DO_TITULO - ANTES_DO_PROXIMO)
        elif k + 1 < len(entradas):
            # a abertura da unidade seguinte ocupa a pagina inteira
            p = entradas[k + 1]['ini'][0] - 1
            fim = (p, fx[p][1] + 1)
        else:
            fim = (doc.page_count - 1, fx[-1][1] + 1)
        # o titulo seguinte no alto da pagina: esta acaba na pagina de antes
        if fim[0] > p0 and fim[1] <= fx[fim[0]][0] + 2:
            fim = (fim[0] - 1, fx[fim[0] - 1][1] + 1)
        # nunca passa de pagina vazia ou de anotacoes, nem de MAX_PAGINAS
        ult = p0
        while ult < fim[0] and ult + 1 - p0 < MAX_PAGINAS and not pagina_vazia(doc[ult + 1], *fx[ult + 1]):
            ult += 1
        truncada = None
        if ult < fim[0]:
            if ult + 1 - p0 >= MAX_PAGINAS and not pagina_vazia(doc[ult + 1], *fx[ult + 1]):
                truncada = 'a atividade passa de %d paginas sem achar o fim; sai, para nao entrar pela metade' % MAX_PAGINAS
                notas.append('%r passa de %d paginas; cortada na p%d' % (e['titulo'], MAX_PAGINAS, ult + 1))
            fim = (ult, fx[ult][1] + 1)
        out.append(dict(e, fim=fim, truncada=truncada))
    # titulo do Indice nao achado na pagina: o comeco desta e o fim da anterior
    # ficam incertos, e as duas saem com motivo
    for k, u in enumerate(out):
        if u['tipo'] != 'unidade' and u.get('titulo_bb') is None:
            u['truncada'] = u.get('truncada') or 'o titulo do Indice nao foi achado na pagina'
            if k and out[k - 1]['ini'][0] <= u['ini'][0]:
                out[k - 1]['truncada'] = out[k - 1].get('truncada') or 'a atividade seguinte nao tem titulo achado: o fim desta e incerto'
    return out, fx, desl, notas


FRONTEIRA_LIVRE = True   # a fronteira sobe ate uma faixa sem tinta; False so no veneno
SOBE_MAX = 60.0          # quanto a fronteira pode subir procurando a faixa sem tinta


def fronteira_livre(doc, pno, y, topo, cache):
    """A fronteira entre duas unidades na mesma pagina, subida ate uma faixa sem tinta.

    O titulo ou o numero da questao seguinte nem sempre e o que mais sobe: o
    quadro ao lado do "4." (3o ano, p. 127) comeca acima da linha do numero, e
    cortar na linha partia o quadro. A fronteira sobe (ate SOBE_MAX) ate duas
    fileiras de pixel sem tinta na largura da pagina; sem elas, fica onde
    estava, e a conferencia de borda tira a unidade que ficar cortada."""
    if not FRONTEIRA_LIVRE:
        return y
    tinta = provas._tinta_da_pagina(doc, pno, cache, [])[0]
    linha = tinta.any(axis=1).copy()
    if FIO_FINO:
        # o desenho claro conta como tinta aqui tambem (o quadro azul claro da
        # questao de cima nao pode ficar do lado de baixo da fronteira); o de
        # mais de 300 pt de altura (fio lateral da pagina) nao barra fronteira
        for fy0, fy1, _x0, _x1 in desenhos_visiveis(doc, pno, cache):
            if fy1 - fy0 <= 300:  # o mesmo limite do desenho_cortado
                a = max(0, int(math.floor(fy0)))
                linha[a:max(a + 1, int(math.ceil(fy1)))] = True
    r = int(math.floor(y))
    lim = max(int(math.ceil(topo)), int(math.floor(y - SOBE_MAX)))
    while r - 1 >= lim:
        if r < len(linha) and not linha[r] and not linha[r - 1]:
            return float(r)
        r -= 1
    return y


def fatias(fx, ini, fim):
    """[(pno, y0, y1)] de um trecho, pagina a pagina."""
    (p0, y0), (p1, y1) = ini, fim
    out = []
    for p in range(p0, p1 + 1):
        a = y0 if p == p0 else fx[p][0]
        b = y1 if p == p1 else fx[p][1]
        b = min(b, fx[p][1])
        a = max(a, fx[p][0])
        if b - a >= 2:
            out.append((p, a, b))
    return out


def marcadores_de_questao(doc, fs):
    """As questoes numeradas (1., 2., ...) num trecho, em ordem de leitura:
    [{numero, pno, bb, lado}] (lado: a questao esta na metade direita, ao lado
    de outra). O numero e a primeira coisa da linha, em negrito, na margem."""
    cands = []
    for p, a, b in fs:
        W = doc[p].rect.width
        for l in linhas(doc[p]):
            if l['girada'] or not (a - 1 <= l['bb'][1] < b):
                continue
            m = re.match(r'^(\d{1,2})\s*[.)](?!\d)', l['texto'])
            if m and l['neg']:
                cands.append({'numero': int(m.group(1)), 'pno': p, 'bb': l['bb'], 'direita': l['bb'][0] > W * 0.4})
    if not cands:
        return []
    # a margem e por pagina: a pagina par e a impar tem margens diferentes (102 e 118 pt no 3o ano)
    margem = {}
    for c in cands:
        if not c['direita']:
            margem[c['pno']] = min(margem.get(c['pno'], 1e9), c['bb'][0])
    out = []
    for c in sorted(cands, key=lambda c: (c['pno'], round(c['bb'][1]), c['bb'][0])):
        if not c['direita'] and c['bb'][0] - margem[c['pno']] > MARGEM_QUESTAO:
            continue  # numero recuado: e de dentro de uma questao (uma lista, uma tabela)
        out.append(c)
    return out


def cadeia(ms):
    """Os marcadores formam 1, 2, 3... sem buraco nem repeticao?"""
    return [m['numero'] for m in ms] == list(range(1, len(ms) + 1))


def questoes_da_revisao(doc, fx, e, cache):
    """[(numeros, ini, fim)] das questoes de uma revisao, ou None se a numeracao nao fecha.

    A questao vai do topo do seu numero ate o topo do numero seguinte que fica
    na margem; o numero na metade direita, lado a lado com outro, vai junto com
    o da esquerda (a questao 3 e a 4 lado a lado saem num item so)."""
    fs = fatias(fx, e['ini'], e['fim'])
    ms = marcadores_de_questao(doc, fs)
    if not ms or not cadeia(ms):
        return None
    if REVISAO_COM_ENUNCIADO_INTEIRA:
        # texto entre o titulo da revisao e o "1." e enunciado comum ("Resolva
        # as seguintes situacoes:", o "Quadro 1" do 7o ano, p. 229): separada,
        # cada questao perderia esse texto. A revisao sai inteira.
        tb = e.get('titulo_bb')
        p1, y1 = ms[0]['pno'], ms[0]['bb'][1]
        for p, a, b in fs:
            if p > p1:
                break
            ims = imagens_da_pagina(doc[p])
            for l in linhas(doc[p]):
                if l['girada'] or eh_credito(l, ims) or not (a - 1 <= l['bb'][1] < b):
                    continue
                if p == p1 and l['bb'][1] >= y1 - 1:
                    continue
                if tb and p == e['ini'][0] and l['bb'][1] < tb[3] and l['bb'][3] > tb[1] - 1:
                    continue  # a linha do proprio titulo
                if tb and p == e['ini'][0] and l['bb'][3] <= tb[1] + 1:
                    continue  # acima do titulo (fora da revisao)
                return 'enunciado'
    grupos = []
    for m in ms:
        if m['direita'] and grupos and grupos[-1][0]['pno'] == m['pno'] and \
                abs(grupos[-1][-1]['bb'][1] - m['bb'][1]) < 40:
            grupos[-1].append(m)
        else:
            grupos.append([m])
    topos = []
    for k, g in enumerate(grupos):
        p = g[0]['pno']
        y = min(x['bb'][1] for x in g)
        if IMAGEM_ACIMA_E_DA_SEGUINTE and k and grupos[k - 1][0]['pno'] < p and not texto_acima(doc[p], (0, y, 0, y), fx[p][0]):
            # a questao comeca numa pagina nova, e acima do numero dela so ha
            # desenho: o desenho e desta questao, e nao continuacao da anterior
            # (3o ano, p. 165: a tenda de circo no alto da pagina ia para a 3)
            topos.append((p, fx[p][0]))
        else:
            topos.append((p, fronteira_livre(doc, p, y - ACIMA_DO_TITULO, fx[p][0], cache)))
    out = []
    for k, g in enumerate(grupos):
        fim = topos[k + 1] if k + 1 < len(grupos) else e['fim']
        out.append(([x['numero'] for x in g], topos[k], fim))
    return out


# ------------------------------------------------------------------ recorte

def desenhos_visiveis(doc, pno, cache):
    """(y0, y1, x0, x1) dos desenhos vetoriais com cor visivel (nao branca, nao transparente)."""
    chave = ('desenhos_visiveis', pno)
    if chave not in cache:
        out = []
        for d in doc[pno].get_drawings():
            r = d['rect']
            cor = d.get('color') or d.get('fill')
            if not cor or max(r.width, r.height) < 3:
                continue
            if sum(cor[:3]) / 3.0 > 0.9:  # branco ou quase: nao aparece
                continue
            opac = [v for v in (d.get('stroke_opacity'), d.get('fill_opacity')) if v is not None]
            if opac and max(opac) < 0.05:
                continue
            out.append((r.y0, r.y1, r.x0, r.x1))
        cache[chave] = out
    return cache[chave]


def imagens_inteiras(doc, pno, cache):
    """(y0, y1, x0, x1) das imagens raster da pagina: a imagem clara (o quadro de
    resposta em imagem, 3o ano, p. 111) fica acima do limiar da tinta."""
    chave = ('imagens', pno)
    if chave not in cache:
        cache[chave] = [(b[1], b[3], b[0], b[2]) for b in imagens_da_pagina(doc[pno]) if (b[2] - b[0]) >= 3 and (b[3] - b[1]) >= 3]
    return cache[chave]


def caixa_pela_tinta(doc, pno, y0, y1, cache):
    """O retangulo da tinta entre y0 e y1, na largura da pagina, com folga; ou None."""
    import numpy as np
    tinta, claros, _fios, _hor = provas._tinta_da_pagina(doc, pno, cache, [])
    h, w = tinta.shape
    ya, yb = max(0, int(math.floor(y0))), min(h, int(math.ceil(y1)))
    faixa = tinta[ya:yb, :]
    ys = [ya + int(y) for y in np.nonzero(faixa.any(axis=1))[0]]
    xs = np.nonzero(faixa.any(axis=0))[0]
    cols = [int(xs[0]), int(xs[-1])] if len(xs) else []
    for cy0, cy1, cx in claros:
        if cy0 >= ya and cy1 <= yb:
            ys.extend((int(cy0), int(math.ceil(cy1))))
            cols.append(int(cx))
    # o desenho vetorial que a tinta de 72 dpi nao ve entra pelo proprio
    # retangulo: a linha de resposta de 0,5 pt (8o ano, p. 71) some no
    # antialias, e o quadro e as bolhas em azul claro translucido (2o ano,
    # p. 90) ficam acima do limiar da tinta. So o desenho INTEIRO dentro da
    # faixa: o fundo de pagina inteira e o desenho da unidade vizinha ficam fora
    for fy0, fy1, fx0, fx1 in ((desenhos_visiveis(doc, pno, cache) + imagens_inteiras(doc, pno, cache)) if FIO_FINO else []):
        if ya - 1 <= fy0 and fy1 <= yb + 1:
            ys.extend((int(math.floor(fy0)), int(math.ceil(fy1))))
            cols.extend((int(math.floor(fx0)), int(math.ceil(fx1))))
    if not ys or not cols:
        return None
    W = doc[pno].rect.width
    x0 = max(0.0, math.floor(min(cols) - FOLGA))
    x1 = min(math.floor(W), math.ceil(max(cols) + 1 + FOLGA))
    top = max(math.floor(y0), math.floor(min(ys) - FOLGA))
    bot = min(math.floor(y1), math.ceil(max(ys) + 1 + FOLGA))
    return (float(x0), float(top), float(x1), float(bot))


def recortar(doc, fs, cache):
    """Pedacos {pno, rect} de um trecho e o motivo de exclusao, se houver."""
    out, motivo = [], None
    for p, a, b in fs:
        r = caixa_pela_tinta(doc, p, a, b, cache)
        if not r or r[3] - r[1] < (2 if not out else PEDACO_MIN):
            continue
        out.append({'pno': p, 'rect': r})
        lado = provas.borda_que_corta(doc, p, r, cache) if CONFERE_BORDA else None
        # a imagem que sangra ate a beira da pagina nao e cortada pelo recorte que
        # vai ate a beira: o lado esquerdo ou direito na beira da pagina nao conta
        W = doc[p].rect.width
        if (lado == 'esquerda' and r[0] <= 1) or (lado == 'direita' and r[2] >= math.floor(W) - 1):
            lado = None
        if lado and not motivo:
            motivo = 'o recorte corta tinta na borda %s (p. %d do PDF): a atividade encosta na vizinha' % (lado, p + 1)
        corte = desenho_cortado(doc, p, r, cache) if CONFERE_BORDA else None
        if corte and not motivo:
            motivo = 'o recorte corta um desenho na borda %s (p. %d do PDF): %s' % (corte[0], p + 1, corte[1])
    return out, motivo


def desenho_cortado(doc, pno, r, cache):
    """(lado, explicacao) do desenho visivel que a borda de cima ou de baixo do
    recorte atravessa, ou None.

    A conferencia pela tinta (borda_que_corta) so ve o escuro: as bolhas de
    resposta em azul claro do 2o ano, p. 17, descem ate o rodape (y 729) e o
    recorte acabava na linha escura de y 691, cortando-as sem aviso (achado da
    prova de cobertura do C5). O desenho alto (fio lateral da pagina, mais de
    300 pt) nao conta: ele atravessa unidades de proposito."""
    H = doc[pno].rect.height
    for y0, y1, x0, x1 in desenhos_visiveis(doc, pno, cache) + imagens_inteiras(doc, pno, cache):
        if y1 - y0 > 300 or x1 <= r[0] or x0 >= r[2]:
            continue
        # na beira da pagina nao ha o que cortar (a imagem sangra para fora)
        if r[1] > 1 and y0 < r[1] - 1.5 and y1 > r[1] + 2:
            return 'de cima', 'desenho de y %.0f a %.0f' % (y0, y1)
        if r[3] < H - 1 and y0 < r[3] - 2 and y1 > r[3] + 1.5:
            return 'de baixo', 'desenho de y %.0f a %.0f' % (y0, y1)
    return None


def creditos(doc, ps):
    """Os creditos de imagem de terceiro dentro dos pedacos."""
    out = []
    for p in ps:
        r = pymupdf.Rect(p['rect'])
        ims = imagens_da_pagina(doc[p['pno']])
        for l in linhas(doc[p['pno']]):
            c = pymupdf.Point((l['bb'][0] + l['bb'][2]) / 2, (l['bb'][1] + l['bb'][3]) / 2)
            if r.contains(c) and eh_credito(l, ims):
                out.append(l['texto'])
    return out


def texto_dos_pedacos(doc, ps):
    return '\n'.join(gerar_pacote.texto_do_retangulo(doc, p['pno'], p['rect']) for p in ps)


def comeca_pelo_titulo(doc, ps, alvo):
    """A primeira linha de texto (nao girada) do primeiro pedaco comeca pelo alvo
    (o titulo da atividade ou o numero da questao)."""
    r = pymupdf.Rect(ps[0]['rect'])
    ls = [l for l in linhas(doc[ps[0]['pno']]) if not l['girada'] and r.contains(pymupdf.Point(
        (l['bb'][0] + l['bb'][2]) / 2, (l['bb'][1] + l['bb'][3]) / 2)) and not eh_credito(l)]
    if not ls:
        return False
    casa = linhas_de_titulo(ls, alvo)
    if not casa:
        return False
    t = min(casa, key=lambda l: (round(l['bb'][1]), l['bb'][0]))
    # acima da linha do titulo so pode haver texto A DIREITA dele (o balao de
    # fala do desenho que abre a atividade, 7o ano, p. 155): texto acima e na
    # margem seria o fim da unidade anterior dentro deste recorte
    return not any(l['bb'][3] <= t['bb'][1] + 1 and l['bb'][0] < t['bb'][0] + 20 for l in ls if l is not t)


# ------------------------------------------------------------------ vinculos

def ler_vinculos(caminho):
    """{id: {tema, curadoria (motivo de exclusao ou ''), quem}} do csv de vinculos.

    Colunas (separador ;): id;tema;exclusao;quem;justificativa. tema e o id do
    assunto do aplicativo, ou vazio quando nenhum serve; exclusao, quando
    preenchida, tira o item com esse motivo (imagem de terceiro sem credito,
    como cedula de dinheiro)."""
    out = {}
    with io.open(caminho, encoding='utf-8-sig', newline='') as f:
        for i, row in enumerate(csv.reader(f, delimiter=';')):
            if not row or not row[0].strip() or row[0].startswith('#') or row[0].strip() == 'id':
                continue
            row = row + [''] * (5 - len(row))
            iid = row[0].strip()
            if iid in out:
                raise SystemExit('vinculos: id repetido %s (linha %d)' % (iid, i + 1))
            out[iid] = {'tema': row[1].strip(), 'exclusao': row[2].strip(), 'quem': row[3].strip(),
                        'justificativa': row[4].strip()}
    return out


# ------------------------------------------------------------------ detectar

def cadernos(pasta):
    out = []
    for a in sorted(os.listdir(pasta)):
        m = ARQUIVO.match(a)
        if m:
            out.append({'arquivo': a, 'serie': '%sano' % m.group(1)})
    return out


def detectar(pasta, cad):
    """As unidades do pacote de um caderno: [{id, numero, titulo, ...}] e as notas."""
    doc = pymupdf.open(os.path.join(pasta, cad['arquivo']))
    serie = cad['serie']
    cache = {}
    ents, fx, desl, notas = unidades_do_caderno(doc, serie, cache)
    unidades = []
    vistos = collections.Counter()
    numero = 0
    for e in ents:
        pag = e['pagina']
        vistos[pag] += 1
        base = 'sme:%s:p%03d%s' % (serie, pag, '' if vistos[pag] == 1 else chr(ord('a') + vistos[pag] - 1))
        qs = questoes_da_revisao(doc, fx, e, cache) if (e['tipo'] == 'revisao' and SEPARA_REVISAO) else None
        if e['tipo'] == 'revisao' and SEPARA_REVISAO and qs is None:
            notas.append('revisao %s: a numeracao das questoes nao fecha; saiu inteira' % base)
        if qs == 'enunciado':
            notas.append('revisao %s: enunciado comum antes da questao 1; saiu inteira' % base)
            qs = None
        if qs:
            for nums, ini, fim in qs:
                numero += 1
                unidades.append({'id': '%s:q%d' % (base, nums[0]), 'numero': numero, 'tipo': 'questao',
                                 'titulo': '%s, questão %s' % (titulo_bonito(e['titulo']), ' e '.join(map(str, nums))),
                                 'atividade': titulo_bonito(e['titulo']), 'questoes': nums, 'unidade': e['unidade'],
                                 'pagina': pag, 'fatias': fatias(fx, ini, fim), 'alvo': '%d' % nums[0],
                                 'truncada': e.get('truncada')})
        else:
            numero += 1
            fs = fatias(fx, e['ini'], e['fim'])
            ms = marcadores_de_questao(doc, fs)
            unidades.append({'id': base, 'numero': numero, 'tipo': 'atividade', 'titulo': titulo_bonito(e['titulo']),
                             'atividade': titulo_bonito(e['titulo']), 'questoes': sorted(set(m['numero'] for m in ms)),
                             'unidade': e['unidade'], 'pagina': pag, 'fatias': fs,
                             'alvo': e['titulo'] if e.get('titulo_bb') else None, 'truncada': e.get('truncada')})
    return doc, unidades, fx, desl, notas, cache


def titulo_bonito(t):
    """O titulo como o caderno o desenha: a fonte do titulo e toda em maiusculas, e
    o texto vem com caixa misturada ("OUTROS PASTORES E suas OVELHAS"). Fica
    com a primeira letra maiuscula e o resto como frase, menos quando o texto ja
    e frase (tem minuscula e nenhuma palavra toda em maiuscula)."""
    t = re.sub(r'\s+', ' ', t.replace('’', ',').replace(',,', ',')).strip()
    t = re.sub(r'\s*,\s*', ', ', t)
    palavras = t.split(' ')
    # caixa misturada: palavra com maiusculas e minusculas e duas maiusculas ou
    # mais ("AGora", "RODíZIO"), metade das palavras toda em maiuscula
    # ("OUTROS PASTORES E suas OVELHAS"), ou nenhuma minuscula (menos a sigla
    # sozinha, "GPS"); a sigla no meio de frase fica ("Índice de massa corporal (IMC)")
    ps = [re.sub(r'[^\w]', '', p) for p in palavras]
    ps = [p for p in ps if len(p) > 1 and not p.isdigit()]
    misturada = any(sum(1 for c in p if c.isupper()) >= 2 and any(c.islower() for c in p) for p in ps)
    maiusculas = [p for p in ps if p.isupper()]
    sem_minuscula = not any(c.islower() for c in t)
    mista = misturada or (sem_minuscula and len(re.sub(r'\W', '', t)) > 4) or \
        (not sem_minuscula and ps and len(maiusculas) * 2 >= len(ps))
    if mista:
        t = t.lower()
    return portal.sem_tracos(t[:1].upper() + t[1:])


# ------------------------------------------------------------------ pacote

def atribuicao(serie, paginas, atividade, questao=None):
    pg = 'p. %d' % paginas[0] if len(paginas) == 1 else 'p. %d a %d' % (paginas[0], paginas[-1])
    q = ', questão %s' % questao if questao else ''
    return '%s, %s (SME-SP, 2014), %s, atividade "%s"%s.' % (NOME_CADERNO, NOME_SERIE[serie], pg, atividade, q)


def origem_curta(serie, paginas, atividade):
    """O que o aplicativo desenha no cartao, na tela cheia e na folha: a atribuicao
    curta com a licenca (nao comercial e pela mesma licenca)."""
    pg = 'p. %d' % paginas[0] if len(paginas) == 1 else 'p. %d a %d' % (paginas[0], paginas[-1])
    return ('Cadernos de Apoio e Aprendizagem, SME-SP, %s, %s, "%s". Licença não comercial e pela mesma licença '
            '(Decreto 52.681/2011)' % (NOME_SERIE[serie], pg, atividade))


def referencia_de_fora(texto, tipo):
    """O trecho que remete a algo fora do recorte, ou None.

    "atividade anterior", "pagina anterior", "pagina 12": sempre. Na questao
    solta da revisao, tambem "quadro 1", "tabela 2" quando o rotulo so aparece
    uma vez no recorte (a mencao, e nao o quadro)."""
    t = ' '.join(texto.split())
    m = REFERENCIA.search(t) or (REFERENCIA_QUESTAO.search(t) if tipo == 'questao' else None)
    if m:
        return m.group(0)
    if tipo == 'questao':
        # cada rotulo citado ("quadro 1", "quadros 1 e 2") tem de aparecer mais
        # de uma vez, ou como etiqueta ("Figura 1:"): senao e mencao a algo de fora
        vistos, etiquetas, texto_de = {}, set(), {}
        for r in ROTULO.finditer(sem_acento(t)):
            nums = [r.group(3)] + re.findall(r'\d+', r.group(4) or '')
            for n in nums:
                chave = (r.group(1), n)
                vistos[chave] = vistos.get(chave, 0) + 1
                texto_de.setdefault(chave, r.group(0).strip())
                if r.group(5):
                    etiquetas.add(chave)
        for chave in sorted(vistos):
            if vistos[chave] == 1 and chave not in etiquetas:
                return texto_de[chave]
    return None


def gerar(pdfs, vinculos, versao, saida, curadoria, trabalho=None, gerado_em=None, commit=None, gravar_zip=True,
          series=None, gabarito_externo=None, so_com_resposta=False):
    t_ini = time.time()
    # com --serie, o pacote parcial leva as series no nome: com o nome do completo,
    # importado no app ele substituiria o completo (achado da revisao do C5)
    nome = PACOTE if not series else '%s-%s' % (PACOTE, '-'.join(sorted(series, key=lambda s: int(s[0]))))
    trabalho = trabalho or os.path.join(os.path.dirname(os.path.abspath(saida)), 'trabalho', '%s-v%d' % (nome, versao))
    dif_cur, apelidos, excl_cur, _meta = gerar_pacote.ler_curadoria(curadoria)
    vinc = ler_vinculos(vinculos)
    temas = carregar_temas()
    conteudo, itens, docs_busca = {}, [], []
    relatorio = {'pacote': nome, 'versao': versao, 'pymupdf': portal.versao_pymupdf(), 'cadernos': [],
                 'excluidos': [], 'fora_do_alvo': [], 'sem_vinculo': [], 'assuntos': {}, 'notas': [], 'unidades': []}
    modulos_vistos = {}
    series_vistas = set()
    ids_vistos = set()
    for cad in cadernos(pdfs):
        if series and cad['serie'] not in series:
            continue
        t0 = time.time()
        serie = cad['serie']
        doc, unidades, fx, desl, notas, cache = detectar(pdfs, cad)
        rel = {'serie': serie, 'arquivo': cad['arquivo'], 'deslocamento': desl, 'unidades': len(unidades),
               'itens': 0, 'excluidos': 0, 'fora_do_alvo': 0, 'notas': notas}
        relatorio['cadernos'].append(rel)
        aula = {'slug': 'cadernos-sme-sp-%s' % serie, 'titulo': 'Cadernos de Apoio e Aprendizagem, %s' % NOME_SERIE[serie],
                'n': int(serie[0])}
        for u in unidades:
            iid = u['id']
            ids_vistos.add(iid)
            v = vinc.get(iid)
            ps, motivo = recortar(doc, u['fatias'], cache)
            paginas = sorted(set(p['pno'] - desl for p in ps)) or [u['pagina']]
            txt = texto_dos_pedacos(doc, ps) if ps else ''
            if not ps:
                motivo = motivo or 'recorte vazio'
            elif sum(p['rect'][3] - p['rect'][1] for p in ps) < ALTURA_MIN:
                motivo = motivo or 'recorte com menos de %g pt de altura' % ALTURA_MIN
            elif u['alvo'] and not comeca_pelo_titulo(doc, ps, u['alvo']):
                motivo = motivo or 'o recorte nao comeca pelo %s' % ('titulo' if u['tipo'] == 'atividade' else 'numero da questao')
            if not motivo and TIRA_CREDITO:
                cr = creditos(doc, ps)
                if cr:
                    motivo = 'foto ou ilustração de terceiro (crédito na página: %s)' % '; '.join(sorted(set(cr)))[:160]
            if not motivo and u.get('truncada'):
                motivo = u['truncada']
            if not motivo and ANEXO.search(txt):
                motivo = 'depende do anexo do caderno (material para recortar)'
            if not motivo and TIRA_REFERENCIA:
                ref = referencia_de_fora(txt, u['tipo'])
                if ref:
                    motivo = 'remete a %r, que nao vem no recorte (nao se resolve sozinho)' % ref
            if not motivo and iid in excl_cur:
                motivo = 'curadoria: ' + excl_cur[iid]
            if not motivo and v and v['exclusao']:
                motivo = 'curadoria: ' + v['exclusao']
            tid = v['tema'] if v else None
            linha = {'id': iid, 'serie': serie, 'tema': tid or None, 'paginas': paginas, 'titulo': u['titulo']}
            # toda unidade do caderno, com os pedacos e o destino: a prova confere
            # que nada fica entre duas unidades seguidas, fora dos dois recortes
            reg = {'id': iid, 'tipo': u['tipo'], 'questoes': u['questoes'],
                   'pedacos': [{'pagina': p['pno'] + 1, 'bbox': list(p['rect'])} for p in ps]}
            relatorio['unidades'].append(reg)
            if motivo:
                relatorio['excluidos'].append(dict(linha, motivo=portal.sem_tracos(motivo)))
                rel['excluidos'] += 1
                reg['destino'] = 'excluido'
                continue
            if v is None:
                relatorio['sem_vinculo'].append(linha)
                reg['destino'] = 'sem_vinculo'
                continue
            if tid not in ALVO:
                relatorio['fora_do_alvo'].append(linha)
                rel['fora_do_alvo'] += 1
                reg['destino'] = 'fora_do_alvo'
                continue
            reg['destino'] = 'item'
            if tid not in temas:
                raise SystemExit('vinculos: %s aponta para o assunto %s, que nao existe no matematica.json' % (iid, tid))
            modulo = {'slug': 'sme-%s' % portal.slug_de(temas[tid]['titulo']), 'titulo': temas[tid]['titulo']}
            casas = 3
            base_a = 'assets/%s/%s/%s/ex-%0*d' % (serie, modulo['slug'], aula['slug'], casas, u['numero'])
            svgs, meds, falhou = [], [], None
            for p in ps:
                svg, dif, obs = gerar_pacote.svg_redigido(doc, p['pno'], p['rect'], cmyk_para_rgb=True)
                if dif > gerar_pacote.LIMITE_REDACAO:
                    falhou = 'apagar o de fora mudou %.2f%% dos pixels do recorte' % (100 * dif)
                if obs:
                    rel['notas'].append('%s p%d: %s' % (iid, p['pno'] + 1, obs))
                svgs.append(svg)
                meds.append((p['rect'][2] - p['rect'][0], p['rect'][3] - p['rect'][1]))
            if falhou:
                relatorio['excluidos'].append(dict(linha, motivo=falhou))
                rel['excluidos'] += 1
                reg['destino'] = 'excluido'
                continue
            modulos_vistos[modulo['slug']] = modulo['titulo']
            series_vistas.add(serie)
            relatorio['assuntos'].setdefault(tid, []).append(iid)
            svg, (w, h) = gerar_pacote.empilhar(svgs, meds)
            conteudo[base_a + '.svg'] = svg.encode('utf-8')
            o = {'pagina': ps[0]['pno'] + 1, 'coluna': 1, 'bbox': list(ps[0]['rect'])}
            if len(ps) > 1:
                o['pedacos'] = [{'pagina': p['pno'] + 1, 'coluna': 1, 'bbox': list(p['rect'])} for p in ps]
            questao = ' e '.join(map(str, u['questoes'])) if u['tipo'] == 'questao' else None
            item = {
                'id': iid, 'fonte': FONTE['id'], 'serie': serie,
                'modulo': modulo, 'aula': dict(aula), 'numero': u['numero'], 'titulo': u['titulo'],
                'formato': 'aberta', 'alternativas': None, 'resposta': None,
                'subitens': [str(n) for n in u['questoes']] if u['tipo'] == 'atividade' else [],
                'texto': portal.para_busca(txt),
                'origem_citada': origem_curta(serie, paginas, u['atividade']),
                'dificuldade': None, 'dificuldade_origem': None, 'proxy': None,
                'tema_app': tid, 'tema_origem': 'leitura',
                'tom': tom_do_item(serie, u['tipo']),
                'licenca': LICENCA_ITEM,
                'atribuicao': atribuicao(serie, paginas, u['atividade'], questao),
                # o endereco do acervo, que o aplicativo poe no credito (L6, aditivo)
                'link': FONTE['url'],
                'origem_detalhe': {'caderno': NOME_CADERNO, 'ano': NOME_SERIE[serie], 'volume': 'único',
                                   'edicao': EDICAO, 'paginas': paginas, 'unidade': u['unidade'],
                                   'atividade': u['atividade'], 'questao': questao},
                'assets': {'enunciado': base_a + '.svg', 'solucao': None},
                'medidas': {'enunciado': {'largura_pt': round(w, 1), 'altura_pt': round(h, 1), 'rotulo': None},
                            'solucao': None},
                'sem_solucao': True,
                'origem': {'arquivo': PREFIXO + cad['arquivo'], 'enunciado': o},
            }
            if iid in dif_cur:
                item.update({'dificuldade': dif_cur[iid], 'dificuldade_origem': 'curadoria'})
            itens.append(item)
            rel['itens'] += 1
            docs_busca.append({'id': iid, 'serie': serie, 'tipo': 'exercicio',
                               'titulo': '%s, %s' % (aula['titulo'], u['titulo']),
                               'resumo': '%s %s' % (modulo['titulo'], aula['titulo']),
                               'texto': portal.sem_tracos(portal.recompor(txt)), 'explicacao': ''})
        rel['segundos'] = round(time.time() - t0, 1)
        doc.close()
    relatorio['vinculo_sem_unidade'] = sorted(k for k in vinc if k not in ids_vistos and
                                              (not series or k.split(':')[1] in series))
    for slug in sorted(modulos_vistos):
        ids = [i for i in itens if i['modulo']['slug'] == slug]
        for s in sorted(set(i['serie'] for i in ids)):
            docs_busca.append({'id': '%s:%s' % (s, slug), 'serie': s, 'tipo': 'modulo', 'titulo': modulos_vistos[slug],
                               'resumo': ' '.join(sorted(set(i['aula']['titulo'] for i in ids if i['serie'] == s))),
                               'texto': ''})
    # o numero do exercicio e o da lista (o app escreve "Exercicio N" no cartao):
    # 1, 2, 3... em cada assunto de cada caderno, na ordem do caderno. A ordem no
    # caderno inteiro fica em ordem_no_caderno (aditivo); o id nao depende disto
    por_lista = collections.defaultdict(list)
    for i in itens:
        i['ordem_no_caderno'] = i['numero']
        por_lista[(i['serie'], i['modulo']['slug'])].append(i)
    for lista in por_lista.values():
        for k, i in enumerate(sorted(lista, key=lambda i: i['ordem_no_caderno']), 1):
            i['numero'] = k
    itens.sort(key=lambda i: (i['serie'], i['modulo']['slug'], i['aula']['n'], i['numero']))
    docs_busca.sort(key=lambda d: d['id'])
    # o gabarito de fora (aditivo, gerar_pacote.aplicar_gabarito_externo): o
    # caderno do aluno nao traz respostas, e as de duas IAs conferidas entram aqui
    n_gabarito = (gerar_pacote.aplicar_gabarito_externo(itens, gabarito_externo)
                  if gabarito_externo is not None else None)
    # --so-com-resposta (gerar_pacote.tirar_sem_resposta), depois do gabarito de
    # fora: sai o item sem gabarito, a lista que ficou vazia some com ele, e o
    # numero dos que ficam e o mesmo de sem a opção
    sem_resposta = None
    if so_com_resposta:
        antes = {i['serie'] for i in itens}
        sem_resposta = gerar_pacote.tirar_sem_resposta(itens, conteudo, docs_busca)
        gerar_pacote.recusar_pacote_vazio(itens, sem_resposta, series)
        fora = {e['id'] for e in sem_resposta}
        for reg in relatorio['unidades']:
            if reg['id'] in fora:
                reg['destino'] = 'sem_resposta'
        for rel in relatorio['cadernos']:
            rel['sem_resposta'] = sum(1 for e in sem_resposta if e['id'].split(':')[1] == rel['serie'])
            rel['itens'] = sum(1 for i in itens if i['serie'] == rel['serie'])
        relatorio['assuntos'] = gerar_pacote.assuntos_sem(relatorio['assuntos'], sem_resposta)
        relatorio['sem_resposta'] = sem_resposta
        series_vistas = {i['serie'] for i in itens}
        # o ano que tinha item e ficou sem nenhum (sem --serie, não é recusa: fica dito no relatório)
        relatorio['series_sem_item'] = sorted(antes - series_vistas, key=lambda s: int(s[0]))
    conteudo['itens.json'] = gerar_pacote.json_bytes(itens)
    conteudo['teoria.json'] = gerar_pacote.json_bytes([])
    conteudo['busca.json'] = gerar_pacote.json_bytes(gerar_pacote.montar_busca(docs_busca))
    conteudo['apelidos.json'] = gerar_pacote.json_bytes(apelidos)
    aulas = set((i['serie'], i['modulo']['slug'], i['aula']['slug']) for i in itens)
    contagens = {'modulos': len(set((i['serie'], i['modulo']['slug']) for i in itens)), 'aulas_teoria': 0,
                 'paginas_teoria': 0, 'aulas_exercicios': len(aulas), 'itens': len(itens),
                 'itens_com_solucao': 0, 'itens_excluidos': len(relatorio['excluidos'])}
    if n_gabarito is not None:
        contagens['itens_com_gabarito_agente'], contagens['itens_com_gabarito_agente_parcial'] = n_gabarito
    if sem_resposta is not None:
        contagens['itens_sem_resposta_excluidos'] = len(sem_resposta)
    manifest = {
        'esquema': 1, 'pacote': nome, 'versao': versao,
        'gerado_em': gerado_em or datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).replace(microsecond=0).isoformat(),
        'gerador': {'nome': 'biblioteca/gerar_pacote.py --fonte cadernos-sme-sp',
                    'commit': commit or gerar_pacote.commit_do_gerador(), 'pymupdf': pymupdf.VersionBind},
        'materia': 'matematica', 'fonte': FONTE, 'series': sorted(series_vistas, key=lambda s: int(s[0])),
        'licenca': LICENCA_ITEM,
    }
    manifest.update({'contagens': contagens, 'arquivos': {k: gerar_pacote.sha(conteudo[k]) for k in sorted(conteudo)}})
    manifest_b = (json.dumps(manifest, ensure_ascii=False, indent=1) + '\n').encode('utf-8')
    zip_caminho = gerar_pacote.gravar_pacote(conteudo, manifest_b, nome, versao, saida, trabalho, gravar_zip)
    ids = {i['id'] for i in itens}
    ids_excl = {e['id'] for e in relatorio['excluidos'] + (sem_resposta or [])}
    relatorio['curadoria_sem_item'] = sorted(
        ['dificuldade.csv: ' + k for k in dif_cur if k.startswith('sme:') and k not in ids | ids_excl] +
        ['exclusoes.csv: ' + k for k in excl_cur if k.startswith('sme:') and k not in ids_excl])
    tam = collections.Counter()
    for k, v in conteudo.items():
        tam['enunciado' if k.startswith('assets/') else k] += len(v)
    relatorio.update({
        'contagens': contagens, 'hash_manifest': gerar_pacote.sha(manifest_b),
        'zip': {'caminho': zip_caminho if gravar_zip else None,
                'bytes': os.path.getsize(zip_caminho) if gravar_zip else None},
        'bytes_por_tipo': dict(sorted(tam.items())), 'segundos': round(time.time() - t_ini, 1),
    })
    with open(os.path.join(trabalho, 'relatorio.json'), 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps(relatorio, ensure_ascii=False, indent=1) + '\n')
    return manifest, relatorio, trabalho


def exportar_para_leitura(pdfs, saida, series=None):
    """Para a leitura dos vinculos: o texto de cada unidade, sem gerar pacote.
    Grava um json por caderno em `saida` (fora do repositorio: tem o texto da fonte)."""
    os.makedirs(saida, exist_ok=True)
    resumo = {}
    for cad in cadernos(pdfs):
        if series and cad['serie'] not in series:
            continue
        doc, unidades, fx, desl, notas, cache = detectar(pdfs, cad)
        out = []
        for u in unidades:
            ps, motivo = recortar(doc, u['fatias'], cache)
            txt = texto_dos_pedacos(doc, ps) if ps else ''
            cr = creditos(doc, ps) if ps else []
            out.append({'id': u['id'], 'tipo': u['tipo'], 'titulo': u['titulo'], 'unidade': u['unidade'],
                        'paginas': sorted(set(p['pno'] - desl for p in ps)), 'questoes': u['questoes'],
                        'pedacos': [{'pdf_pagina': p['pno'] + 1, 'bbox': p['rect']} for p in ps],
                        'motivo_recorte': motivo, 'creditos': cr, 'anexo': bool(ANEXO.search(txt)),
                        'texto': re.sub(r'[ \t]+', ' ', portal.recompor(txt)).strip()})
        with io.open(os.path.join(saida, '%s.json' % cad['serie']), 'w', encoding='utf-8') as f:
            json.dump({'serie': cad['serie'], 'arquivo': cad['arquivo'], 'deslocamento': desl, 'notas': notas,
                       'unidades': out}, f, ensure_ascii=False, indent=1)
        resumo[cad['serie']] = {'unidades': len(out), 'notas': notas}
        doc.close()
    return resumo
