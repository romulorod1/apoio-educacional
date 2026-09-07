# -*- coding: utf-8 -*-
"""
Verificador do banco de temas.

Confere, para cada tema:
  1. estrutura do arquivo e campos do cabecalho
  2. cada conta declarada na secao VERIFICACAO, resolvida com sympy
  3. se a quantidade de exercicios bate com a de respostas do gabarito
  4. se a versao em ingles tem os mesmos numeros e as mesmas respostas da
     portuguesa, nas materias que tem ingles
  5. ausencia de travessao, conforme a regra da casa
  6. exercicios marcados como conferencia humana, listados no fim

A materia de um tema vem do CAMINHO dele, temas/<pasta>/<serie>/<ID>.md, e a
pasta e lida da tabela unica de materias (Core.MATERIAS no core.js, exportada
para materias.json). E a tabela que diz o prefixo do identificador, as
unidades, as linguas e se o texto pode citar autor com travessao. Este arquivo
nao tem MAT escrito a mao em lugar nenhum: materia nova custa uma linha na
tabela e uma pasta.

Um tema que falhe em qualquer ponto nao entra no banco.

Nas materias com catalogo de topicos (portugues e literatura) o verificador
confere tambem a colecao `fontes/`: cada texto citado mora num arquivo proprio,
com cabecalho de procedencia e dominio, e o bloco citado no tema tem que ser
copia exata das linhas da fonte. E confere tambem o registro do painel cego
(temas/<pasta>/_painel/<ID>.json, gravado pelo painel.py): tema com questao
aberta so entra no banco depois de tres leitores, um juiz e uma lente
adversarial terem lido, e o registro tem que ser do texto de hoje.

Uso:
    python verificar.py                confere tudo
    python verificar.py MAT06-05       confere um tema
    python verificar.py --temas DIR    confere os temas de outra raiz (prova do gerador)
    python verificar.py --fontes DIR   confere as fontes de outra raiz
    python verificar.py --painel DIR   le os registros do painel cego de outra raiz
    python verificar.py --sem-painel   nao exige o registro do painel cego
    python verificar.py --ano 2027     faz a conta do dominio publico em outro ano
"""
import io
import os
import re
import sys
import glob
import json

AQUI = os.path.dirname(os.path.abspath(__file__))
import traceback

from sympy import (symbols, solve, Eq, simplify, expand, factor, Rational, sqrt,
                   nsimplify, S, pi, sin, cos, tan, asin, acos, atan, log, exp,
                   gcd, lcm, factorint, primerange, isprime, binomial, factorial,
                   Matrix, det, limit, oo, diff, integrate, Abs, floor, ceiling,
                   Sum, prod, N, Symbol, Poly, roots, degree, div, rem, srepr,
                   Interval, FiniteSet, Union, Intersection, EmptySet, sympify,
                   Rational as R, nsolve, real_roots, cancel, together, apart,
                   trigsimp, radsimp, powsimp, root, cbrt, sign, Min, Max,
                   solveset, solve_univariate_inequality, Reals, Rational as Fr,
                   I, re as parte_real, im as parte_imag, arg, conjugate, Abs as modulo)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAIZ_PROJETO = os.path.dirname(RAIZ)
ARQUIVO_MATERIAS = os.path.join(AQUI, 'materias.json')
ARQUIVO_BNCC = os.path.join(AQUI, 'bncc_lp.json')

# A colecao de textos citados. Fica na raiz do projeto, plana, um arquivo por
# texto: o que separa os textos e o campo `dominio`, e uma pasta por dominio
# seria um segundo lugar dizendo a mesma coisa. E um modulo-global porque o
# gerador e os testes precisam apontar para uma raiz de mentira sem sujar o
# repositorio; a linha de comando troca por --fontes.
RAIZ_FONTES = os.path.join(RAIZ_PROJETO, 'fontes')

# A raiz dos registros do painel cego (camada 2). None significa "ao lado das
# series", temas/<pasta>/_painel/, que e onde eles moram no repositorio; a linha
# de comando troca por --painel, e as provas em pasta temporaria usam isso.
RAIZ_PAINEL = None
# --sem-painel desliga a conferencia do painel, para quem esta escrevendo um
# tema e quer ver o resto passar antes de rodar os leitores. O gerador NUNCA
# desliga: ele passa sem_painel=False de proposito.
SEM_PAINEL = False
# O ano em que a conta do dominio publico e feita. None significa o relogio: a
# conta so afrouxa com o tempo, entao o relogio e seguro como padrao, e o
# parametro existe para o teste fixar o ano e nao explodir na virada.
ANO = None

# simbolos disponiveis nas expressoes de verificacao
# Declarados reais de proposito: sem isso o sympy recusa resolver equacao com
# valor absoluto, dizendo que nao sabe se o argumento e real. Como todo tema
# deste banco trabalha com numeros reais, a suposicao e sempre verdadeira aqui.
x, y, a, b, c, d, k, m, n, p, q, r, t, u, v, w = symbols(
    'x y a b c d k m n p q r t u v w', real=True)
alpha, beta, theta = symbols('alpha beta theta', real=True)
# z fica sem suposicao, pela convencao de ser a variavel complexa: declarar z
# como real faria o sympy esconder as raizes complexas de uma equacao.
z = symbols('z')

AMBIENTE = dict(
    x=x, y=y, z=z, a=a, b=b, c=c, d=d, k=k, m=m, n=n, p=p, q=q, r=r, t=t, u=u, v=v, w=w,
    alpha=alpha, beta=beta, theta=theta,
    symbols=symbols, solve=solve, Eq=Eq, simplify=simplify, expand=expand, factor=factor,
    Rational=Rational, R=Rational, sqrt=sqrt, nsimplify=nsimplify, S=S, pi=pi,
    sin=sin, cos=cos, tan=tan, asin=asin, acos=acos, atan=atan, log=log, exp=exp,
    gcd=gcd, lcm=lcm, factorint=factorint, primerange=primerange, isprime=isprime,
    binomial=binomial, factorial=factorial, Matrix=Matrix, det=det,
    limit=limit, oo=oo, diff=diff, integrate=integrate, Abs=Abs, floor=floor, ceiling=ceiling,
    Sum=Sum, N=N, Symbol=Symbol, Poly=Poly, roots=roots, degree=degree, div=div, rem=rem,
    Interval=Interval, FiniteSet=FiniteSet, Union=Union, Intersection=Intersection,
    EmptySet=EmptySet, sympify=sympify, nsolve=nsolve, real_roots=real_roots,
    cancel=cancel, together=together, apart=apart, trigsimp=trigsimp, radsimp=radsimp,
    powsimp=powsimp, root=root, cbrt=cbrt, sign=sign, Min=Min, Max=Max, set=set, sorted=sorted,
    len=len, abs=abs, round=round, sum=sum, all=all, any=any, list=list, range=range, int=int,
    max=max, min=min, enumerate=enumerate, zip=zip, divmod=divmod, str=str, float=float,
    solveset=solveset, solve_univariate_inequality=solve_univariate_inequality, Reals=Reals,
    I=I, re=parte_real, im=parte_imag, arg=arg, conjugate=conjugate,
)

SERIES = {'02', '03', '04', '05', '06', '07', '08', '09', 'em1', 'em2', 'em3'}
# Nos anos iniciais a lista e mais curta: crianca de sete a dez anos nao sustenta vinte questoes.
ANOS_INICIAIS = {'02', '03', '04', '05'}
MINIMO_EXERCICIOS = {'02': 10, '03': 10, '04': 12, '05': 12}

# Os nomes das secoes e subsecoes de cada lingua. O gerar_banco.py le daqui,
# para nao existirem duas listas que possam divergir.
SECOES = {
    'pt': {'secao': 'PT', 'explicacao': 'Explicação', 'exercicios': 'Exercícios',
           'gabarito': 'Gabarito', 'nome': 'portugues'},
    'en': {'secao': 'EN', 'explicacao': 'Explanation', 'exercicios': 'Exercises',
           'gabarito': 'Answer key', 'nome': 'ingles'},
}


class Problema(Exception):
    pass


# ------------------------------------------------------------------ materias

_materias = None


def materias():
    """As materias que tem banco de material, na ordem da tabela.

    A tabela unica mora em Core.MATERIAS (core.js). O materias.json e a copia
    gerada por exporta_materias.js e conferida por _teste/testa_materias.js:
    se alguem editar o core.js e esquecer de exportar, o portao reprova. Aqui
    ela e lida uma vez por execucao, e so interessa quem tem o bloco `temas`.
    """
    global _materias
    if _materias is None:
        dados = json.load(io.open(ARQUIVO_MATERIAS, encoding='utf-8'))
        _materias = [mat for mat in dados['materias'] if mat.get('temas')]
    return _materias


def materia_por_pasta():
    """{pasta de autoria: materia}, ex.: 'mat' -> matematica."""
    return dict((mat['temas']['pasta'], mat) for mat in materias())


def materia_do_caminho(caminho):
    """A materia de um tema, lida do caminho temas/<pasta>/<serie>/<ID>.md.

    Vem do caminho, e nao do cabecalho, de proposito: o cabecalho e escrito
    pelo autor e a pasta e onde o arquivo esta. Se as duas coisas dissessem a
    materia, um dia iam discordar. Pasta que nao esta na tabela reprova, e a
    mensagem diz quais existem, para o autor nao ter que abrir o core.js.
    """
    pasta = os.path.basename(os.path.dirname(os.path.dirname(os.path.abspath(caminho))))
    mapa = materia_por_pasta()
    if pasta not in mapa:
        raise Problema('a pasta "%s" nao e de nenhuma materia com banco; as pastas que '
                       'existem sao: %s (temas/<pasta>/<serie>/<ID>.md, pela tabela '
                       'Core.MATERIAS do core.js)'
                       % (pasta, ', '.join(mat['temas']['pasta'] for mat in materias())))
    return mapa[pasta]


def pastas_de_serie(raiz, pasta):
    """As pastas de serie de uma materia: <raiz>/<pasta>/<serie>/, em ordem.

    Pasta que comeca por sublinhado NAO e serie. O registro do painel cego mora
    em temas/<pasta>/_painel/, ao lado das series e nao dentro de uma delas,
    porque o registro e do tema. Sem esta linha, um arquivo deixado ali dentro
    viraria tema de uma serie chamada "_painel", e o portao passaria a conferir
    o proprio registro como se fosse material.
    """
    achadas = []
    for caminho in sorted(glob.glob(os.path.join(raiz, pasta, '*'))):
        if os.path.isdir(caminho) and not os.path.basename(caminho).startswith('_'):
            achadas.append(caminho)
    return achadas


def arquivos_da_materia(materia, raiz=None):
    """Todos os .md de tema de uma materia, em ordem. O gerador le pela mesma."""
    raiz = raiz or RAIZ
    arquivos = []
    for pasta_serie in pastas_de_serie(raiz, materia['temas']['pasta']):
        arquivos.extend(glob.glob(os.path.join(pasta_serie, '*.md')))
    return sorted(arquivos)


def arquivos_de_temas(raiz=None):
    """Todos os .md de tema, materia por materia, na ordem da tabela.

    Varre a lista explicita de materias e nunca 'temas/*/*/*.md': esse curinga
    engoliria temas/_antes, que e um retrato local do banco com 146 arquivos,
    e qualquer outra pasta que alguem deixe ao lado.
    """
    arquivos = []
    for mat in materias():
        arquivos.extend(arquivos_da_materia(mat, raiz))
    return arquivos


def _series_no_id():
    return '|'.join(sorted(s.upper() for s in SERIES))


def regex_id_tema(materia):
    """A forma do identificador de tema: prefixo + serie + '-' + dois digitos.

    A serie vai em maiusculas, do jeito que ja era em MATEM3-04: POREM1-01 e
    LITEM2-03 seguem a mesma forma. O prefixo vem da tabela.
    """
    return re.compile(r'^%s(%s)-(\d{2})$' % (re.escape(materia['temas']['prefixo']), _series_no_id()))


def regex_id_topico(materia):
    """A forma do identificador de topico: prefixo + serie + '-T' + numero.

    Dois digitos, tres se a serie passar de 99 topicos. E o '-T' que separa
    topico de tema: materiaDoTema no core.js recusa qualquer id com '-T', e a
    trilha compara por igualdade, entao os dois nunca podem se confundir.
    """
    return re.compile(r'^%s(%s)-T(\d{2,3})$' % (re.escape(materia['temas']['prefixo']), _series_no_id()))


def campos_obrigatorios(materia):
    """titulo e resumo existem por lingua: so quem tem ingles deve titulo_en."""
    linguas = materia['temas']['linguas']
    campos = ['id', 'serie', 'unidade']
    campos += ['titulo_%s' % l for l in linguas]
    campos += ['resumo_%s' % l for l in linguas]
    campos += ['prerequisitos', 'duracao_min', 'dificuldade']
    return campos


def lista_do_cabecalho(valor, sep=','):
    """'[MAT06-02, MAT06-03]' -> ['MAT06-02', 'MAT06-03']; '[]' -> [].

    O separador e virgula em quase tudo. O campo `vestibular` usa ponto e
    virgula, porque cada item dele e uma frase em portugues e frase leva
    virgula dentro.
    """
    return [p.strip() for p in (valor or '').strip().strip('[]').split(sep) if p.strip()]


def ler_cabecalho(texto):
    """(cabecalho, corpo) de um arquivo com cabecalho entre dois '---'.

    Nao valida campo nenhum: quem sabe o que e obrigatorio e quem chama. E o
    mesmo molde no tema e no arquivo de fonte, e por isso o parser e um so.
    """
    if not texto.startswith('---'):
        raise Problema('falta o cabecalho no inicio do arquivo')
    fim = texto.index('---', 3)
    bruto = texto[3:fim]
    corpo = texto[fim + 3:]

    cab = {}
    for linha in bruto.strip().split('\n'):
        if not linha.strip() or ':' not in linha:
            continue
        chave, valor = linha.split(':', 1)
        cab[chave.strip()] = valor.strip()
    return cab, corpo


def ler_tema(caminho):
    materia = materia_do_caminho(caminho)
    texto = io.open(caminho, encoding='utf-8').read()
    cab, corpo = ler_cabecalho(texto)

    for campo in campos_obrigatorios(materia):
        if campo not in cab:
            raise Problema('falta o campo "%s" no cabecalho' % campo)
    if cab['serie'] not in SERIES:
        raise Problema('serie invalida: %s' % cab['serie'])
    unidades = materia['temas']['unidades']
    if cab['unidade'] not in unidades:
        raise Problema('unidade invalida: %s (%s aceita %s)'
                       % (cab['unidade'], materia['id'], ', '.join(unidades)))

    return cab, corpo


def secao(corpo, titulo):
    """Devolve o texto de uma secao de nivel 2, ex: '## PT'."""
    padrao = re.compile(r'^##\s+' + re.escape(titulo) + r'\s*$', re.M)
    achou = padrao.search(corpo)
    if not achou:
        return None
    inicio = achou.end()
    seguinte = re.search(r'^##\s+', corpo[inicio:], re.M)
    return corpo[inicio: inicio + seguinte.start()] if seguinte else corpo[inicio:]


def subsecao(texto, titulo):
    padrao = re.compile(r'^###\s+' + re.escape(titulo) + r'\s*$', re.M)
    achou = padrao.search(texto or '')
    if not achou:
        return None
    inicio = achou.end()
    seguinte = re.search(r'^###\s+', texto[inicio:], re.M)
    return texto[inicio: inicio + seguinte.start()] if seguinte else texto[inicio:]


def itens_numerados(texto):
    """Extrai itens de uma lista numerada, aceitando continuacao em varias linhas."""
    if not texto:
        return []
    itens = []
    atual = None
    for linha in texto.split('\n'):
        achou = re.match(r'^(\d+)\.\s+(.*)$', linha)
        if achou:
            if atual:
                itens.append(atual)
            atual = achou.group(2).strip()
        elif atual is not None and linha.strip() and not linha.startswith('#'):
            atual += ' ' + linha.strip()
        elif atual is not None and not linha.strip():
            pass
    if atual:
        itens.append(atual)
    return itens


def numeros_de(texto):
    """Todos os numeros do texto, para comparar as duas linguas.

    O separador decimal e normalizado: em portugues escreve-se 0,4 e em ingles
    0.4, e as duas formas precisam contar como o mesmo numero."""
    limpo = re.sub(r'`[^`]*`', ' ', texto or '')
    achados = re.findall(r'-?\d+(?:[.,]\d+)?', limpo)
    return sorted(n.replace(',', '.') for n in achados)


# ------------------------------------------------------------- citacao marcada

# Texto de autor nao se reescreve. Em materia com citacao: true na tabela
# (portugues e literatura), o trecho citado pode trazer o travessao e as
# reticencias do original, desde que esteja num bloco de citacao Markdown: cada
# linha do trecho comeca com '> ' (o sinal e um espaco). Fora do bloco a regra
# da casa continua valendo, e em materia com citacao: false nada muda.
#
# So a marca explicita conta. O Markdown aceita '>' colado ao texto e aceita
# linha de continuacao sem sinal nenhum, mas uma isencao que dependesse de
# entender Markdown seria dificil de conferir no olho. A regra e mecanica de
# proposito: a linha tem o sinal, ou nao tem a isencao.
#
# Esta e a UNICA definicao de linha de citacao no repositorio, e por isso ela e
# exportada. A linha em branco da fonte vira '>' sozinho dentro do bloco, entao
# o sinal pode vir seguido de espaco ou de fim de linha, e de mais nada. Em
# materia com catalogo, toda linha que comeca por '>' e nao casa com esta
# expressao reprova: '>colado' e '    > indentado demais' sao defeito, e nao
# citacao silenciosamente sem isencao.
RE_CITACAO = re.compile(r'^ {0,3}>( |$)')
_MARCA_DE_CITACAO = RE_CITACAO

# Escritos pelo codigo, e nao colados, para o proprio verificador passar na
# busca por travessao que a casa faz em todo arquivo.
TRAVESSAO = re.compile(u'[\u2013\u2014]')
RETICENCIAS = u'\\.\\.\\.|\u2026'


def eh_linha_de_citacao(linha):
    return bool(RE_CITACAO.match(linha))


# A linha `ancora:` do gabarito aberto e trecho literal do texto: E4 exige que
# ela seja substring de um paragrafo do texto do item, e a fidelidade do bloco
# (F2) ja garante que o texto e copia da fonte. Por isso ela herda a mesma
# isencao da linha de citacao, e nao passa por travessao, reticencias nem
# rascunho. Sem isso a ancora de um conto com travessao seria impossivel.
_MARCA_DE_ANCORA = re.compile(r'^\s*ancora:')


def eh_linha_de_ancora(linha):
    return bool(_MARCA_DE_ANCORA.match(linha))


def travessoes(texto, citacao=False, catalogo=False):
    """[(linha, trecho)] de cada linha com travessao, fora de citacao marcada."""
    achados = []
    for numero, linha in enumerate(texto.split('\n'), 1):
        if not TRAVESSAO.search(linha):
            continue
        if citacao and eh_linha_de_citacao(linha):
            continue
        if catalogo and eh_linha_de_ancora(linha):
            continue
        achados.append((numero, linha.strip()[:60]))
    return achados


# Marcas de raciocinio em andamento que nunca podem sobrar no material final.
# Foi um erro real: um paragrafo saiu com a autocorreccao do autor no meio da frase.
# Marcas de raciocinio em andamento que nao podem sobrar no material final.
# Dois niveis de propósito. Um verificador que acusa demais acaba ignorado,
# e ai ele deixa de proteger: 'TODO' sem distinguir maiuscula casava com a
# palavra 'todo', e 'quer dizer' e uso legitimo em texto didatico.
RASCUNHO_ERRO = [
    (r'\?\s*n[aã]o[:.]', 'pergunta seguida de "nao", parece autocorrecao', True),
    (r'(^|[.!?] )(espera|opa|pera[ií])[,!]|\b(hmm+|deixa eu ver)\b', 'marca de conversa interna', True),
    (r'\b(ou melhor|melhor dizendo|corrigindo)[,:]', 'autocorrecao no texto', True),
    (RETICENCIAS, 'reticencias: quase sempre sobra de rascunho', True),
    (r'\b(TODO|FIXME|XXX)\b', 'marca de rascunho', False),
    (r'\b(placeholder|preencher aqui|a definir|completar depois)\b', 'marca de rascunho', True),
    (r'\[(?:inserir|colocar|revisar|conferir)[^\]]*\]', 'instrucao para o autor deixada no texto', True),
]

# Estes sao apenas suspeitas: aparecem em texto legitimo, mas tambem em rascunho.
RASCUNHO_AVISO = [
    (r'\bna verdade\b', 'expressao que costuma indicar autocorrecao', True),
]


def marcas_de_rascunho(corpo, lista=None, citacao=False, catalogo=False):
    """Procura sinais de que o texto ficou com raciocinio do autor dentro.

    Com citacao=True, a regra das reticencias nao vale dentro de linha de
    citacao marcada: reticencia de autor e pontuacao, nao rascunho.

    Com catalogo=True (portugues e literatura), a linha de citacao inteira sai
    da varredura, e a linha `ancora:` tambem. As duas sao texto copiado, e a
    trava de fidelidade ja garante que o que esta ali e o que estava na fonte:
    "ou melhor," escrito por Machado nao e rascunho de quem montou o tema.
    """
    achados = []
    regras = lista if lista is not None else RASCUNHO_ERRO
    texto = corpo.split('## VERIFICACAO')[0]
    for numero, linha in enumerate(texto.split(chr(10)), 1):
        if linha.strip().startswith('#'):
            continue
        citada = citacao and eh_linha_de_citacao(linha)
        if catalogo and (citada or eh_linha_de_ancora(linha)):
            continue
        for padrao, motivo, ignora_caixa in regras:
            if citada and padrao == RETICENCIAS:
                continue
            if re.search(padrao, linha, re.I if ignora_caixa else 0):
                achados.append((numero, motivo, linha.strip()[:70]))
                break
    return achados


def verificacoes(corpo):
    bloco = secao(corpo, 'VERIFICACAO')
    if bloco is None:
        return [], []
    achou = re.search(r'```(?:python)?\n(.*?)```', bloco, re.S)
    if not achou:
        return [], []
    linhas, manuais = [], []
    for linha in achou.group(1).split('\n'):
        limpo = linha.strip()
        if not limpo or limpo.startswith('#'):
            continue
        if '# manual:' in limpo:
            rotulo = limpo.split(':', 1)[0].strip()
            motivo = limpo.split('# manual:', 1)[1].strip()
            manuais.append((rotulo, motivo))
            continue
        if ':' not in limpo:
            continue
        rotulo, expressao = limpo.split(':', 1)
        linhas.append((rotulo.strip(), expressao.strip()))
    return linhas, manuais


# A Nathalia monta a lista marcando e desmarcando exercicios, entao a numeracao
# muda a cada montagem. Um enunciado que diz "compare com o exercicio 8" quebra
# assim que o 8 sai da lista. Todo enunciado precisa se sustentar sozinho.
REFERENCIA_CRUZADA = [
    r'exerc[í i]cio\s+\d+',
    r'exercise\s+\d+',
    r'quest[ãa]o\s+\d+',
    r'item\s+\d+',
]


def referencias_cruzadas(corpo, catalogo=False):
    """Acha enunciado que depende de outro pelo numero.

    Em materia com catalogo, a linha de citacao e a linha `ancora:` ficam de
    fora: um conto que fale em "questao 3" na propria narrativa nao esta
    dependendo de nenhum exercicio.
    """
    achados = []
    texto = corpo.split('## VERIFICACAO')[0]
    for numero, linha in enumerate(texto.split(chr(10)), 1):
        if catalogo and (eh_linha_de_citacao(linha) or eh_linha_de_ancora(linha)):
            continue
        for padrao in REFERENCIA_CRUZADA:
            achado = re.search(padrao, linha, re.I)
            if achado:
                achados.append((numero, achado.group(0), linha.strip()[:70]))
                break
    return achados


def eh_tautologia(expressao):
    """Diz se a expressao passa sem provar nada, do tipo 12 == 12.

    Uma verificacao que nao prova nada e pior do que nenhuma, porque da a
    impressao de que a conta foi conferida. Comparacao entre numeros
    diferentes, como 385 > 358, prova alguma coisa e por isso vale.
    """
    limpo = expressao.split('#')[0].strip()
    achado = re.fullmatch(r'(-?\d+)\s*==\s*(-?\d+)', limpo)
    return bool(achado) and achado.group(1) == achado.group(2)


# ---------------------------------------------------------------- caracteres

# O PDF usa as fontes base-14, que cobrem o portugues inteiro mas nao cobrem
# grego, raiz nem comparacao, e uma fonte de simbolos para os poucos casos que
# faltam. Um caractere fora do repertorio nao quebra nada: vira uma
# interrogacao silenciosa no meio da formula, e so aparece quando alguem olha o
# material pronto. Foi assim que 38 letras pi entraram no banco e sairam como
# "?" no material de circunferencia.
#
# Quem desenha e o pdf.js, entao a autoridade sobre o repertorio e ele. Este
# arquivo NAO mantem lista propria: ele pergunta. E o mesmo padrao que o
# gerar_banco.py usa com o busca.js, e existe pelo mesmo motivo: lista repetida
# em dois lugares diverge no dia em que alguem mexe em um so, e a trava para de
# travar sem ninguem perceber.

_PERGUNTA = (
    "const P=require(process.argv[1]);"
    "const cs=JSON.parse(process.argv[2]);"
    "process.stdout.write(JSON.stringify({"
    "ruins: cs.filter(function(c){return P.caracteresQueNaoDesenha(c).length>0;}),"
    "simbolos: Object.keys(P.SIMBOLOS || {})"
    "}));"
)

_veredito = {}          # caractere -> True quando o PDF NAO desenha


def _perguntar_ao_gerador(caracteres):
    """Pergunta ao pdf.js quais destes ele nao sabe desenhar.

    Uma chamada por lote, e o resultado fica guardado para o resto da
    execucao: o banco inteiro usa umas poucas centenas de caracteres
    distintos, entao na pratica sao uma ou duas chamadas por rodada.
    """
    import subprocess
    pdf = os.path.join(os.path.dirname(RAIZ), 'pdf.js')
    try:
        saida = subprocess.run(
            ['node', '-e', _PERGUNTA, pdf, json.dumps(caracteres)],
            capture_output=True, text=True, encoding='utf-8')
    except OSError:
        raise Problema('o node nao esta instalado ou nao esta no PATH. Ele e '
                       'necessario para conferir quais caracteres o PDF desenha, '
                       'e o gerar_banco.py ja dependia dele.')
    if saida.returncode != 0:
        raise Problema('nao consegui perguntar ao pdf.js quais caracteres ele '
                       'desenha: %s' % saida.stderr[:300])
    resposta = json.loads(saida.stdout or '{}')
    return set(resposta.get('ruins', [])), resposta.get('simbolos', [])


# A largura do bloco de citacao e a mesma pergunta feita de outro jeito: quem
# desenha e o pdf.js, entao e ele que diz quanto mede uma linha e quanto cabe.
# Sem esta trava, uma linha larga demais da fonte viraria duas linhas na folha,
# e a numeracao que o exercicio cita ("linha 12") passaria a mentir.
_PERGUNTA_LARGURA = (
    "const fs=require('fs');"
    "const P=require(process.argv[1]);"
    "const ls=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));"
    "process.stdout.write(JSON.stringify({"
    "larguras: ls.map(function(l){return P.medirRico(l, 10, false);}),"
    "limite: P.LARGURA_CITACAO"
    "}));"
)

_largura = {}           # linha -> pontos que ela ocupa no bloco de citacao
_limite_citacao = [None]


def _medir_no_gerador(linhas):
    """Pergunta ao pdf.js quanto mede cada linha, em UMA chamada por lote.

    As linhas vao por arquivo, e nao pela linha de comando: um poema inteiro
    passa dos 32 mil caracteres que o Windows aceita num comando, e o erro
    apareceria so no dia em que a fonte fosse grande.
    """
    import subprocess
    import tempfile
    pdf = os.path.join(RAIZ_PROJETO, 'pdf.js')
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as f:
        json.dump(linhas, f, ensure_ascii=False)
        entrada = f.name
    try:
        saida = subprocess.run(['node', '-e', _PERGUNTA_LARGURA, pdf, entrada],
                               capture_output=True, text=True, encoding='utf-8')
    except OSError:
        raise Problema('o node nao esta instalado ou nao esta no PATH. Ele e '
                       'necessario para medir a largura das linhas da fonte.')
    finally:
        os.unlink(entrada)
    if saida.returncode != 0:
        raise Problema('nao consegui perguntar ao pdf.js quanto mede a linha da '
                       'fonte: %s' % saida.stderr[:300])
    resposta = json.loads(saida.stdout or '{}')
    return resposta.get('larguras', []), resposta.get('limite')


def larguras_de(linhas):
    """({linha: pontos}, limite) para as linhas dadas, com cache por execucao."""
    novas = sorted(set(l for l in linhas if l not in _largura))
    if novas or _limite_citacao[0] is None:
        medidas, limite = _medir_no_gerador(novas)
        for linha, pontos in zip(novas, medidas):
            _largura[linha] = pontos
        if limite is not None:
            _limite_citacao[0] = limite
    return dict((l, _largura.get(l)) for l in linhas), _limite_citacao[0]


# Alem do que o PDF desenha, ha coisa que simplesmente nao deve estar num
# arquivo de tema, mesmo sendo desenhavel. Controle e uma delas: o gerador
# transforma em espaco e segue, mas no fonte e sempre erro de edicao.
def _proibido_no_fonte(c):
    return ord(c) < 32 and c not in u'\n\r\t'


def _preparar():
    """Pergunta de uma vez pelo alfabeto inteiro que um tema pode usar.

    Sem isto cada arquivo que estreava um caractere novo disparava a sua
    propria chamada: medido no banco, 30 chamadas. O lote inicial cobre o
    Latin-1 e os simbolos que o proprio gerador declara, e derruba para uma.
    A lista de simbolos vem do pdf.js na mesma pergunta, para nao recriar aqui
    a copia que este trabalho existe para eliminar.
    """
    base = [chr(n) for n in range(32, 127)] + [chr(n) for n in range(160, 256)]
    ruins, simbolos = _perguntar_ao_gerador(base)
    for ch in base:
        _veredito[ch] = ch in ruins
    for ch in simbolos:
        _veredito[ch] = False        # se o gerador declara, ele desenha


def caracteres_indesenhaveis(texto):
    """Devolve [(linha, caractere, codigo, trecho)] do que o PDF nao desenha."""
    if not _veredito:
        _preparar()

    novos = sorted(set(ch for ch in texto if ch not in _veredito
                       and not _proibido_no_fonte(ch)))
    if novos:
        ruins, _ = _perguntar_ao_gerador(novos)
        for ch in novos:
            _veredito[ch] = ch in ruins

    achados = []
    for numero, linha in enumerate(texto.split(u'\n'), 1):
        for i, c in enumerate(linha):
            if _proibido_no_fonte(c) or _veredito.get(c):
                # o console do Windows nao imprime o proprio caractere, entao
                # o trecho sai com ele trocado pelo codigo
                trecho = linha[max(0, i - 24):i + 24].strip()
                trecho = trecho.replace(c, u'<%s>' % (u'U+%04X' % ord(c)))
                achados.append((numero, c, u'U+%04X' % ord(c), trecho))
    return achados


def marcacao_quebrada(texto):
    """Chave de expoente ou indice mal fechada, ou aninhada.

    Estes dois passam por todas as outras travas e chegam calados no material:
    "x^{2" sem fechar imprime a chave na folha, e "2^{3^{2}}" aninhado desenha
    um pedaco literal no meio da formula. O caractere e ASCII e o PDF desenha,
    entao a trava de caractere nao ve. Quem tem que ver e esta.
    """
    achados = []
    bem_formado = re.compile(r'[\^_]\{[^{}]*\}')
    for numero, linha in enumerate(texto.split(chr(10)), 1):
        # tira o que esta certo e olha o que sobrou
        resto = bem_formado.sub('', linha)
        if '^{' in resto or '_{' in resto:
            achados.append((numero, linha.strip()[:70]))
    return achados


# ------------------------------------------------------------------- fontes

# Um arquivo por texto em fontes/<id>.md, com cabecalho de procedencia. A trava
# do dominio nao decide nada sozinha: ela repete a conta da Lei 9.610/98, art.
# 41 (setenta anos contados de 1 de janeiro do ano seguinte a morte, ou seja,
# livre no ano A quando morte + 71 <= A) e recusa o arquivo que nao a satisfaz.
# O ano entra por parametro de proposito: a conta so afrouxa com o tempo, e um
# par envenenado escrito com o relogio explodiria sozinho na virada do ano.
GENEROS_DE_FONTE = ['conto', 'poema', 'cronica', 'fabula', 'noticia', 'reportagem', 'artigo',
                    'entrevista', 'propaganda', 'verbete', 'bilhete', 'carta', 'teatro', 'romance',
                    'ensaio', 'cantiga', 'parlenda', 'outro']
DOMINIOS_DE_FONTE = ['publico', 'autoral', 'cc', 'tradicional']
CAMPOS_DE_FONTE = ['id', 'titulo', 'autor', 'ano', 'genero', 'dominio',
                   'licenca', 'procedencia', 'integral']
ANOS_DE_PROTECAO = 71


def ler_fonte(caminho):
    """(cabecalho, linhas do corpo) de um arquivo de fontes/.

    As linhas vem sem a quebra, e sem as vazias das pontas. Linha em branco e a
    que tem strip() vazio: e a mesma definicao no corpo da fonte, no bloco de
    citacao do tema e no JSON que o tablet baixa, e e ela que decide quais
    linhas recebem numero.
    """
    bruto = io.open(caminho, encoding='utf-8', newline='').read()
    cab, corpo = ler_cabecalho(bruto)
    corpo = corpo.replace(chr(13) + chr(10), chr(10)).replace(chr(13), chr(10))
    linhas = corpo.split(chr(10))
    while linhas and linhas[0].strip() == '':
        linhas.pop(0)
    while linhas and linhas[-1].strip() == '':
        linhas.pop()
    return cab, linhas


def numerar(linhas):
    """[(numero, texto)] em que so a linha nao vazia recebe numero, a partir de 1.

    E o numero que a folha imprime ao lado da linha e que o exercicio cita
    ("linha 12"). Ele conta so as nao vazias porque assim nao depende de como o
    gerador quebra a pagina: cada linha da fonte e uma linha impressa.
    """
    saida = []
    numero = 0
    for texto in linhas:
        if texto.strip() == '':
            saida.append((None, texto))
        else:
            numero += 1
            saida.append((numero, texto))
    return saida


def fatia(linhas, a, b):
    """As linhas de numero a ate b, inclusive, com as vazias do meio.

    Sem vazias nas pontas: o bloco citado no tema comeca e termina em linha com
    texto. A linha vazia sai normalizada para '', que e a forma dela em todo
    lugar (no bloco ela e '>' sozinho, no JSON e "").
    """
    saida = []
    for numero, texto in numerar(linhas):
        if numero is not None and a <= numero <= b:
            saida.append(texto)
        elif numero is None and saida:
            saida.append('')
    while saida and saida[-1] == '':
        saida.pop()
    return saida


def _anos_de_morte(valor):
    """[1908] ou [1908, 1955] na coautoria; None quando nao e ano nenhum."""
    partes = [p.strip() for p in (valor or '').split(',') if p.strip()]
    anos = []
    for parte in partes:
        if not re.match(r'^\d{3,4}$', parte):
            return None
        anos.append(int(parte))
    return anos or None


def _retornos_soltos(caminho):
    """As linhas com retorno de carro que nao faz par com quebra de linha.

    O io.open em modo texto normaliza CR, CRLF e LF para LF, entao um CR solto
    no meio da fonte viraria uma linha a mais em silencio e a numeracao passaria
    a mentir. Aqui o arquivo e lido cru, de proposito, so para isso.
    """
    bruto = io.open(caminho, encoding='utf-8', newline='').read()
    achados = []
    for i, c in enumerate(bruto):
        if c == chr(13) and (i + 1 >= len(bruto) or bruto[i + 1] != chr(10)):
            achados.append(bruto.count(chr(10), 0, i) + 1)
    return achados


def problemas_na_fonte(caminho, ano):
    """Lista de erros de um arquivo de fontes/, com a conta do dominio no ano dado."""
    erros = []
    nome = os.path.splitext(os.path.basename(caminho))[0]
    try:
        cab, linhas = ler_fonte(caminho)
    except Problema as e:
        return [str(e)]
    except ValueError:
        return ['o cabecalho nao esta fechado: falta o segundo "---"']

    for campo in CAMPOS_DE_FONTE:
        if campo not in cab:
            erros.append('falta o campo "%s" no cabecalho' % campo)
    if erros:
        return erros

    if cab['id'] != nome:
        erros.append('o id "%s" nao bate com o nome do arquivo "%s"' % (cab['id'], nome))
    if not re.match(r'^\d{3,4}$', cab['ano']):
        erros.append('o campo ano tem que ser um numero inteiro, e esta "%s"' % cab['ano'][:30])
    if cab['genero'] not in GENEROS_DE_FONTE:
        erros.append('genero invalido: %s (os que existem sao: %s)'
                     % (cab['genero'], ', '.join(GENEROS_DE_FONTE)))
    if cab['integral'] not in ('sim', 'nao'):
        erros.append('o campo integral so aceita sim ou nao, e esta "%s"' % cab['integral'][:20])

    dominio = cab['dominio']
    if dominio not in DOMINIOS_DE_FONTE:
        erros.append('dominio invalido: %s (os que existem sao: %s)'
                     % (dominio, ', '.join(DOMINIOS_DE_FONTE)))

    if dominio == 'publico':
        if 'autor_morte' not in cab:
            erros.append('dominio publico exige autor_morte: e por ele que a conta da '
                         'Lei 9.610/98 art. 41 e feita')
        else:
            anos = _anos_de_morte(cab['autor_morte'])
            if anos is None:
                erros.append('autor_morte tem que ser ano inteiro, ou anos separados por '
                             'virgula na coautoria, e esta "%s"' % cab['autor_morte'][:30])
            elif max(anos) + ANOS_DE_PROTECAO > ano:
                erros.append('o texto ainda nao esta em dominio publico em %d: o autor morreu '
                             'em %d e a obra fica livre em %d (morte mais %d, Lei 9.610/98 art. 41)'
                             % (ano, max(anos), max(anos) + ANOS_DE_PROTECAO, ANOS_DE_PROTECAO))
    elif dominio in ('autoral', 'tradicional') and 'autor_morte' in cab:
        erros.append('dominio %s nao pode ter autor_morte: o campo e sinal de que o dominio '
                     'foi marcado errado' % dominio)

    if dominio == 'cc':
        if not cab['licenca'].startswith('CC '):
            erros.append('dominio cc exige licenca com o nome exato da licenca, comecando por '
                         '"CC ", e esta "%s"' % cab['licenca'][:40])
        if 'http' not in cab['procedencia']:
            erros.append('dominio cc exige procedencia com endereco: a licenca so vale com a '
                         'origem verificavel')

    if dominio == 'tradicional' and not cab['procedencia'].strip():
        erros.append('dominio tradicional exige procedencia: e a coletanea publica de onde o '
                     'texto foi copiado')

    if 'tradutor' in cab:
        if 'tradutor_morte' not in cab:
            erros.append('tradutor exige tradutor_morte: a traducao tem direito proprio e a '
                         'conta vale para ela tambem')
        else:
            anos = _anos_de_morte(cab['tradutor_morte'])
            if anos is None:
                erros.append('tradutor_morte tem que ser ano inteiro, e esta "%s"'
                             % cab['tradutor_morte'][:30])
            elif max(anos) + ANOS_DE_PROTECAO > ano:
                erros.append('a traducao ainda nao esta em dominio publico em %d: o tradutor '
                             'morreu em %d e ela fica livre em %d'
                             % (ano, max(anos), max(anos) + ANOS_DE_PROTECAO))

    # O corpo pode ter travessao e reticencias, porque e texto de autor. O
    # cabecalho nao pode: ele e escrito por quem monta a fonte.
    for chave, valor in sorted(cab.items()):
        if TRAVESSAO.search(valor):
            erros.append('travessao no campo "%s" do cabecalho: %s' % (chave, valor[:50]))
        if re.search(RETICENCIAS, valor):
            erros.append('reticencias no campo "%s" do cabecalho: %s' % (chave, valor[:50]))

    for numero in _retornos_soltos(caminho):
        erros.append('linha %d: retorno de carro solto, sem quebra de linha junto' % numero)

    for i, linha in enumerate(linhas, 1):
        if chr(9) in linha:
            erros.append('linha %d: tab ou espaco solto (use espaco, e nunca tab)' % i)
        elif linha.strip() == '' and linha != '':
            erros.append('linha %d: tab ou espaco solto (linha em branco tem que ser '
                         'vazia mesmo)' % i)

    cheias = [l for l in linhas if l.strip() != '']
    if cheias:
        medidas, limite = larguras_de(cheias)
        for numero, texto in numerar(linhas):
            if numero is None:
                continue
            pontos = medidas.get(texto)
            if pontos is not None and limite is not None and pontos > limite:
                erros.append('linha %d passa da largura do bloco de citacao por %.1f pontos '
                             '(mede %.1f, cabem %.1f): quebre a linha mais cedo | %s'
                             % (numero, pontos - limite, pontos, limite, texto[:50]))
    return erros


def arquivos_de_fontes(raiz=None):
    """Todo fontes/*.md, menos o FORMATO.md, que e documentacao e nao texto."""
    raiz = raiz or RAIZ_FONTES
    if not os.path.isdir(raiz):
        return []
    return sorted(a for a in glob.glob(os.path.join(raiz, '*.md'))
                  if os.path.basename(a) != 'FORMATO.md')


def ano_corrente():
    """O ano da conta do dominio publico: o fixado, ou o do relogio."""
    import datetime
    return ANO or datetime.datetime.now().year


_fontes_conferidas = {}


def problemas_da_fonte_citada(ident, raiz_fontes=None, ano=None):
    """Os erros do ARQUIVO de fonte que um tema cita, com cache por execucao.

    O main confere a colecao antes dos temas, e a razao ja estava escrita la: um
    tema so pode ser conferido contra uma fonte que ja passou. Aqui isso vira
    dependencia de verdade, e nao ordem de impressao. Sem ela o gerador, que nao
    confere a colecao, montaria alegremente um tema apoiado num autor que morreu
    em 1970, e a folha sairia com o credito de uma obra ainda protegida.
    """
    caminho = os.path.join(raiz_fontes or RAIZ_FONTES, '%s.md' % ident)
    ano = ano or ano_corrente()
    chave = (caminho, ano)
    if chave not in _fontes_conferidas:
        _fontes_conferidas[chave] = problemas_na_fonte(caminho, ano)
    return _fontes_conferidas[chave]


# ------------------------------------------------------ identificador e topicos

def problemas_no_id(cab, caminho, materia):
    """O id bate com o nome do arquivo, tem a forma da materia e a serie da pasta."""
    erros = []
    ident = cab['id']
    esperado = os.path.splitext(os.path.basename(caminho))[0]
    if ident != esperado:
        erros.append('o id "%s" nao bate com o nome do arquivo "%s"' % (ident, esperado))

    prefixo = materia['temas']['prefixo']
    if '-T' in ident:
        erros.append('o id "%s" tem a forma de identificador de topico (-T no meio); '
                     'tema e %s<serie>-<numero>' % (ident, prefixo))
    elif not ident.startswith(prefixo):
        erros.append('o id "%s" nao comeca com o prefixo %s da materia %s (pasta %s)'
                     % (ident, prefixo, materia['id'], materia['temas']['pasta']))
    else:
        achou = regex_id_tema(materia).match(ident)
        if not achou:
            erros.append('o id "%s" nao tem a forma %s<serie>-<dois digitos>, como %s06-01 ou %sEM2-03'
                         % (ident, prefixo, prefixo, prefixo))
        elif achou.group(1).lower() != cab['serie']:
            erros.append('a serie no id "%s" nao bate com o campo serie (%s)' % (ident, cab['serie']))

    pasta_serie = os.path.basename(os.path.dirname(os.path.abspath(caminho)))
    if pasta_serie != cab['serie']:
        erros.append('o arquivo esta na pasta da serie %s, mas o campo serie diz %s'
                     % (pasta_serie, cab['serie']))
    return erros


def topicos_fora_do_registro(ids, materia):
    """GANCHO, ainda desligado: cruzar os topicos do cabecalho com o registro.

    O registro de identificadores de topico (banco/topicos/_ids.json) esta
    nascendo em outra rodada, em outro arquivo, emitido por
    temas/_ferramentas/emite_ids_topicos.js: um objeto `ids` com uma entrada
    por identificador, {disciplina, grupo, titulo}, e a chave `disciplina` e a
    mesma `topicos` da materia na tabela. Quando ele estiver fechado, este e o
    unico lugar a mexer: ler o registro uma vez por execucao, guardar num
    modulo-cache como o das materias, e devolver uma mensagem por identificador
    que nao exista nele com a disciplina da materia (ou que esteja aposentado).
    Ate la devolve lista vazia, e o verificador confere so a forma.
    """
    return []


def problemas_nos_topicos(cab, materia):
    """O campo topicos existe quando a materia tem catalogo, e so nesse caso.

    Matematica nao tem chave 'topicos' na tabela: o material dela e organizado
    por unidade, e o catalogo banco/topicos nao a inclui. Portugues e literatura
    tem, e e por esse campo que o aplicativo vai achar material a partir do
    assunto marcado na aula. Um tema sem topico ficaria inalcancavel por esse
    caminho, entao a lista vazia reprova como a ausencia.
    """
    tem_catalogo = bool(materia.get('topicos'))
    if 'topicos' not in cab:
        if tem_catalogo:
            return ['falta o campo "topicos" no cabecalho: %s tem catalogo de topicos, e cada tema '
                    'aponta os seus, ex.: topicos: [%s06-T01, %s06-T04]'
                    % (materia['id'], materia['temas']['prefixo'], materia['temas']['prefixo'])]
        return []
    if not tem_catalogo:
        return ['o cabecalho tem "topicos", mas %s nao tem catalogo de topicos na tabela; '
                'tire o campo' % materia['id']]

    ids = lista_do_cabecalho(cab['topicos'])
    if not ids:
        return ['a lista "topicos" esta vazia: um tema sem topico nao e achado a partir da aula']
    erros = []
    padrao = regex_id_topico(materia)
    prefixo = materia['temas']['prefixo']
    for ident in ids:
        if not padrao.match(ident):
            erros.append('o topico "%s" esta fora da forma %s<serie>-T<numero>, como %s07-T03'
                         % (ident, prefixo, prefixo))
    repetidos = sorted(set(i for i in ids if ids.count(i) > 1))
    if repetidos:
        erros.append('topico repetido no cabecalho: %s' % ', '.join(repetidos))
    erros.extend(topicos_fora_do_registro(ids, materia))
    return erros


# --------------------------------------------------------- citacao com fonte

# A diretiva que abre um bloco de citacao. A expressao e estrita de proposito:
# o id tem a forma de nome de arquivo de fontes/ (minusculas, digitos e hifen,
# com um sublinhado separando autor de titulo) e as linhas sao dois inteiros.
# Qualquer folga aqui viraria arquivo nao encontrado la na frente.
_ID_DE_FONTE = r'[a-z0-9]+(?:-[a-z0-9]+)*(?:_[a-z0-9]+(?:-[a-z0-9]+)*)?'
RE_FONTE = re.compile(r'^( {0,3})@fonte (%s) linhas=(\d+)-(\d+)\s*$' % _ID_DE_FONTE)
# Uma linha que tenta ser diretiva e nao consegue precisa reprovar dizendo isso,
# e nao passar batida como paragrafo comum.
RE_FONTE_SOLTA = re.compile(r'^\s*@fonte\b')


def texto_citado(linha):
    """O que a linha de citacao carrega, sem o sinal: '> a' -> 'a', '>' -> ''."""
    achou = RE_CITACAO.match(linha)
    if not achou:
        return None
    resto = linha[achou.end():]
    return '' if resto.strip() == '' else resto


def blocos_de_citacao(corpo):
    """[{linha, id, a, b, conteudo, indentado}] de cada bloco @fonte do texto.

    `conteudo` sao as linhas '>' seguintes, ja sem o sinal, ate a primeira que
    nao e citacao. `indentado` diz se a diretiva veio recuada, que e a forma do
    trecho que pertence a um item so.
    """
    linhas = (corpo or '').split(chr(10))
    blocos = []
    i = 0
    while i < len(linhas):
        achou = RE_FONTE.match(linhas[i])
        if not achou:
            i += 1
            continue
        conteudo = []
        j = i + 1
        while j < len(linhas) and RE_CITACAO.match(linhas[j]):
            conteudo.append(texto_citado(linhas[j]))
            j += 1
        blocos.append({'linha': i + 1, 'id': achou.group(2),
                       'a': int(achou.group(3)), 'b': int(achou.group(4)),
                       'conteudo': conteudo, 'indentado': len(achou.group(1)) > 0})
        i = j
    return blocos


_fontes_lidas = {}


def fonte_do_catalogo(ident, raiz_fontes=None):
    """(cabecalho, linhas) da fonte, ou None quando o arquivo nao existe."""
    raiz = raiz_fontes or RAIZ_FONTES
    caminho = os.path.join(raiz, '%s.md' % ident)
    if caminho in _fontes_lidas:
        return _fontes_lidas[caminho]
    if not os.path.isfile(caminho):
        _fontes_lidas[caminho] = None
        return None
    try:
        lida = ler_fonte(caminho)
    except (Problema, ValueError):
        lida = None
    _fontes_lidas[caminho] = lida
    return lida


def problemas_de_citacao(corpo, com_catalogo, raiz_fontes=None, ano=None):
    """F1 a F4 e M7: o bloco de citacao aponta uma fonte boa e a copia exatamente."""
    erros = []
    linhas = (corpo or '').split(chr(10))

    if not com_catalogo:
        # F4: materia sem catalogo nao cita ninguem. A diretiva ali e engano.
        for numero, linha in enumerate(linhas, 1):
            if RE_FONTE_SOLTA.match(linha):
                erros.append('linha %d: @fonte numa materia sem citacao; o bloco de citacao '
                             'com fonte so existe onde a tabela declara catalogo de topicos'
                             % numero)
        return erros

    # M7: uma so definicao de linha de citacao. O que comeca por '>' e nao casa
    # com ela nao ganha a isencao de travessao em silencio: reprova.
    for numero, linha in enumerate(linhas, 1):
        if linha.lstrip().startswith('>') and not RE_CITACAO.match(linha):
            erros.append('sinal de citacao indentado demais na linha %d: a linha de citacao '
                         'comeca com ate tres espacos, o sinal e um espaco (ou o sinal '
                         'sozinho na linha em branco) | %s' % (numero, linha.strip()[:50]))

    for numero, linha in enumerate(linhas, 1):
        if RE_FONTE_SOLTA.match(linha) and not RE_FONTE.match(linha):
            erros.append('linha %d: a diretiva tem a forma "@fonte <id> linhas=<a>-<b>", em '
                         'coluna zero ou recuada com tres espacos | %s'
                         % (numero, linha.strip()[:60]))

    blocos = blocos_de_citacao(corpo)
    cobertas = set()
    for bloco in blocos:
        for k in range(bloco['linha'], bloco['linha'] + len(bloco['conteudo'])):
            cobertas.add(k + 1)

    # F3: bloco '>' sem diretiva antes. Nao existe citacao sem fonte, nem o
    # bilhete de duas linhas escrito para o exercicio.
    for numero, linha in enumerate(linhas, 1):
        if RE_CITACAO.match(linha) and numero not in cobertas:
            erros.append('bloco de citacao sem @fonte na linha %d: toda citacao aponta um '
                         'arquivo de fontes/, inclusive o texto escrito para o exercicio '
                         '(que e fonte com dominio: autoral)' % numero)

    conferidas = set()
    for bloco in blocos:
        if bloco['a'] > bloco['b']:
            erros.append('linha %d: linhas=%d-%d esta de tras para frente'
                         % (bloco['linha'], bloco['a'], bloco['b']))
            continue
        lida = fonte_do_catalogo(bloco['id'], raiz_fontes)
        if lida is None:
            # F1
            erros.append('linha %d: a fonte "%s" nao existe em fontes/%s.md'
                         % (bloco['linha'], bloco['id'], bloco['id']))
            continue
        # A fonte citada tem que estar boa: dominio publico dentro da conta,
        # cabecalho completo, linha que cabe no bloco. Uma vez por fonte, e nao
        # uma vez por bloco, para o tema que cita o mesmo conto tres vezes nao
        # repetir o mesmo erro tres vezes.
        if bloco['id'] not in conferidas:
            conferidas.add(bloco['id'])
            ruins = problemas_da_fonte_citada(bloco['id'], raiz_fontes, ano)
            if ruins:
                erros.append('linha %d: a fonte "%s" esta reprovada, e o tema nao pode se apoiar '
                             'nela | %s' % (bloco['linha'], bloco['id'], ruins[0]))
        esperado = fatia(lida[1], bloco['a'], bloco['b'])
        if not esperado:
            erros.append('linha %d: a fonte "%s" nao tem as linhas %d a %d'
                         % (bloco['linha'], bloco['id'], bloco['a'], bloco['b']))
            continue
        # F2: copia exata, e a mensagem diz a PRIMEIRA linha que difere.
        if bloco['conteudo'] != esperado:
            erros.append(_diferenca_do_bloco(bloco, esperado))
    return erros


def _diferenca_do_bloco(bloco, esperado):
    obtido = bloco['conteudo']
    for i in range(max(len(obtido), len(esperado))):
        aqui = obtido[i] if i < len(obtido) else None
        la = esperado[i] if i < len(esperado) else None
        if aqui == la:
            continue
        numero = bloco['a'] + len([x for x in esperado[:i] if x != ''])
        if aqui is None:
            return ('linha %d: o bloco de "%s" tem linha a menos; falta a linha %d da fonte: %s'
                    % (bloco['linha'], bloco['id'], numero, (la or '(em branco)')[:60]))
        if la is None:
            return ('linha %d: o bloco de "%s" tem linha a mais depois da linha %d da fonte: %s'
                    % (bloco['linha'], bloco['id'], bloco['b'], (aqui or '(em branco)')[:60]))
        return ('linha %d: o bloco nao e copia exata de "%s"; a primeira linha que difere e a '
                '%d da fonte | fonte: %s | tema: %s'
                % (bloco['linha'], bloco['id'], numero, (la or '(em branco)')[:60],
                   (aqui or '(em branco)')[:60]))
    return 'linha %d: o bloco nao e copia exata de "%s"' % (bloco['linha'], bloco['id'])


# ------------------------------------------------------------------ BNCC

# A forma do codigo de habilidade de Lingua Portuguesa, e a tabela dos que
# existem. Forma sozinha nao basta: EM12LP01 tem a cara certa e nao existe.
RE_BNCC = re.compile(r'^(EF\d{2}LP\d{2}|EM13LP\d{2})$')
_bncc = None


def bncc():
    global _bncc
    if _bncc is None:
        _bncc = json.load(io.open(ARQUIVO_BNCC, encoding='utf-8'))
    return _bncc


def problemas_no_catalogo(cab, materia, com_catalogo):
    """C1 e C2: bncc e vestibular no cabecalho, so em materia com catalogo."""
    erros, avisos = [], []
    if not com_catalogo:
        for campo in ('bncc', 'vestibular'):
            if campo in cab:
                erros.append('o cabecalho tem "%s", mas %s nao tem catalogo de topicos; '
                             'tire o campo' % (campo, materia['id']))
        return erros, avisos

    for campo in ('bncc', 'vestibular'):
        if campo not in cab:
            erros.append('falta o campo "%s" no cabecalho: em %s o tema declara a cobertura, '
                         'e uma das duas listas pode ser vazia, mas as duas nao'
                         % (campo, materia['id']))
    if erros:
        return erros, avisos

    codigos = lista_do_cabecalho(cab['bncc'])
    # O vestibular separa por ponto e virgula: cada item e uma frase, e frase
    # em portugues leva virgula dentro.
    exigencias = lista_do_cabecalho(cab['vestibular'], sep=';')
    if not codigos and not exigencias:
        erros.append('bncc e vestibular estao as duas vazias: pelo menos uma tem que dizer o '
                     'que o tema cobre, senao nao ha como saber se ele foi coberto')

    tabela = bncc()
    for codigo in codigos:
        if not RE_BNCC.match(codigo):
            erros.append('o codigo "%s" esta fora da forma EF<dois digitos>LP<dois digitos> ou '
                         'EM13LP<dois digitos>, como EF67LP28 ou EM13LP01' % codigo)
            continue
        if codigo not in tabela['codigos']:
            erros.append('o codigo "%s" nao existe na tabela da BNCC de Lingua Portuguesa '
                         '(%d codigos, %s)' % (codigo, tabela['total'], 'bncc_lp.json'))
            continue
        series = tabela['codigos'][codigo]
        if series and cab.get('serie') not in series:
            # Aviso, e nao erro: revisao atravessa anos, e um tema do 8 ano pode
            # retomar habilidade do 6 de proposito.
            avisos.append('o codigo %s e das series %s, e este tema e da serie %s'
                          % (codigo, ', '.join(series), cab.get('serie')))
    return erros, avisos


# ------------------------------------------------------------------- estilo

# `*texto*` e italico onde `**texto**` ja e negrito, e `***texto***` e os dois.
# Quem desenha e o pdf.js, por um tokenizador com estado. A trava aqui e de
# paridade: marca que abre e nao fecha imprime asterisco na folha.
_MARCADOR_DE_LISTA = re.compile(r'^(\s*)\*\s')


def problemas_de_estilo(corpo, com_catalogo):
    """G1, G2, M11: asterisco desemparelhado (com catalogo) ou solto (sem)."""
    erros = []
    texto = (corpo or '').split('## VERIFICACAO')[0]
    for numero, linha in enumerate(texto.split(chr(10)), 1):
        # '* ' no comeco da linha e marcador de lista Markdown, e nao italico.
        limpo = _MARCADOR_DE_LISTA.sub(r'\1', linha)
        sem_triplo = limpo.replace('***', '')
        duplos = sem_triplo.count('**')
        soltos = sem_triplo.replace('**', '').count('*')
        if com_catalogo:
            if duplos % 2:
                erros.append('negrito sem fechar na linha %d: %d marcas ** na linha | %s'
                             % (numero, duplos, linha.strip()[:60]))
            if soltos % 2:
                erros.append('italico sem fechar na linha %d: %d asterisco(s) solto(s) na '
                             'linha | %s' % (numero, soltos, linha.strip()[:60]))
        elif soltos:
            erros.append('asterisco solto na linha %d: nesta materia o asterisco so existe '
                         'como marca de negrito, aos pares | %s' % (numero, linha.strip()[:60]))
    return erros


# --------------------------------------------------- itens estruturados

RE_ITEM = re.compile(r'^(\d+)\.\s')
RE_CABECALHO_DE_BLOCO = re.compile(r'^\*\*(?:Bloco|Block)\s+([A-C])[.．]?\s*(.*?)\*\*\s*$')
RE_ALTERNATIVA = re.compile(r'^\s+([a-e])\)\s+(.*)$')
RE_ROTULO = re.compile(r'^\s*(espera_se|aceita_se|nao_aceita|ancora|porque):\s*(.*)$')
RE_LETRA_SO = re.compile(r'^([a-e])\s*$')
# O enunciado nunca cita o texto pelo numero: ela desmarca questoes e o Texto 2
# pode virar o unico da folha.
RE_TEXTO_NUMERADO = re.compile(r'\b[Tt]exto\s+[0-9IVX]+\b')
# "linha 12", "linhas 3 a 5": o numero tem que cair dentro do trecho do item.
RE_LINHA_CITADA = re.compile(r'\blinhas?\s+(\d+)(?:\s+a\s+(\d+))?')


def itens_estruturados(texto, com_catalogo=True):
    """Os eventos da lista de exercicios, na ordem em que aparecem.

    Devolve {'tipo': 'bloco', 'nome'}, {'tipo': 'texto', 'fonte', 'linhas',
    'conteudo'} e {'tipo': 'item', 'n', 'linhas'}. O item guarda as linhas
    CRUAS, e nao o texto juntado com espaco: alternativa e gabarito estruturado
    morrem se as linhas forem coladas.

    O item termina na proxima linha que comeca outro item, um cabecalho de
    bloco, um @fonte em coluna zero ou um '>' em coluna zero. Sem isso o bloco
    que aparece entre a questao 6 e a 7 gruda no enunciado da 6.
    """
    linhas = (texto or '').split(chr(10))
    eventos = []
    i = 0
    atual = None
    while i < len(linhas):
        linha = linhas[i]
        cabecalho = RE_CABECALHO_DE_BLOCO.match(linha.strip())
        comeco = RE_ITEM.match(linha)
        fonte = RE_FONTE.match(linha) if not linha.startswith(' ') else None
        citacao = RE_CITACAO.match(linha) and not linha.startswith(' ')

        if cabecalho or comeco or fonte or citacao:
            atual = None
        if cabecalho:
            eventos.append({'tipo': 'bloco', 'nome': cabecalho.group(2).strip()})
            i += 1
            continue
        if fonte:
            conteudo = []
            j = i + 1
            while j < len(linhas) and RE_CITACAO.match(linhas[j]):
                conteudo.append(texto_citado(linhas[j]))
                j += 1
            eventos.append({'tipo': 'texto', 'fonte': fonte.group(2),
                            'linhas': [int(fonte.group(3)), int(fonte.group(4))],
                            'conteudo': conteudo})
            i = j
            continue
        if citacao:
            # Bloco solto: problemas_de_citacao ja reprovou. Aqui ele so nao
            # pode ser engolido pelo item anterior.
            i += 1
            continue
        if comeco:
            atual = {'tipo': 'item', 'n': int(comeco.group(1)), 'linhas': [linha]}
            eventos.append(atual)
            i += 1
            continue
        if atual is not None and linha.strip():
            atual['linhas'].append(linha)
        i += 1
    return eventos


def ler_exercicio(linhas_do_item):
    """{enunciado, alternativas, trecho} de um item da lista.

    O enunciado vai ate a primeira alternativa ou ate o @fonte recuado, e sai
    juntado com espaco, que e como o pdf.js o recebe. As alternativas saem em
    ordem, com a continuacao recuada colada na anterior. O trecho e o bloco de
    citacao que vive dentro do item e pertence so a ele.
    """
    enunciado = []
    alternativas = []
    trecho = None
    i = 0
    linhas = list(linhas_do_item)
    if linhas:
        primeira = RE_ITEM.match(linhas[0])
        if primeira:
            linhas[0] = linhas[0][primeira.end():]
    while i < len(linhas):
        linha = linhas[i]
        fonte = RE_FONTE.match(linha)
        if fonte:
            conteudo = []
            j = i + 1
            while j < len(linhas) and RE_CITACAO.match(linhas[j]):
                conteudo.append(texto_citado(linhas[j]))
                j += 1
            if trecho is None:
                trecho = {'fonte': fonte.group(2),
                          'linhas': [int(fonte.group(3)), int(fonte.group(4))],
                          'conteudo': conteudo}
            i = j
            continue
        alternativa = RE_ALTERNATIVA.match(linha)
        if alternativa:
            alternativas.append({'letra': alternativa.group(1),
                                 'texto': alternativa.group(2).strip()})
            i += 1
            continue
        if alternativas:
            # continuacao recuada de uma alternativa
            if linha.strip():
                alternativas[-1]['texto'] += ' ' + linha.strip()
            i += 1
            continue
        if linha.strip():
            enunciado.append(linha.strip())
        i += 1
    return {'enunciado': ' '.join(enunciado).strip(),
            'alternativas': alternativas, 'trecho': trecho}


def ler_gabarito(linhas_do_item):
    """A resposta de um item: letra, criterio de resposta aberta ou texto corrido."""
    linhas = list(linhas_do_item)
    if linhas:
        primeira = RE_ITEM.match(linhas[0])
        if primeira:
            linhas[0] = linhas[0][primeira.end():]

    if linhas and RE_LETRA_SO.match(linhas[0].strip()):
        gab = {'letra': linhas[0].strip()}
        corrente = None
        for linha in linhas[1:]:
            rotulo = RE_ROTULO.match(linha)
            if rotulo and rotulo.group(1) in ('ancora', 'porque'):
                corrente = rotulo.group(1)
                gab[corrente] = rotulo.group(2).strip()
            elif corrente and linha.strip():
                gab[corrente] += ' ' + linha.strip()
        return gab

    rotulos = [RE_ROTULO.match(l) for l in linhas]
    if any(r and r.group(1) in ('espera_se', 'aceita_se', 'nao_aceita') for r in rotulos):
        gab = {'espera_se': '', 'aceita_se': [], 'nao_aceita': [], 'ancora': ''}
        corrente = None
        for linha in linhas:
            rotulo = RE_ROTULO.match(linha)
            if rotulo:
                corrente = rotulo.group(1)
                resto = rotulo.group(2).strip()
                if corrente in ('aceita_se', 'nao_aceita'):
                    if resto:
                        gab[corrente].append(resto)
                else:
                    gab[corrente] = resto
                continue
            if corrente is None or not linha.strip():
                continue
            item = re.match(r'^\s*-\s+(.*)$', linha)
            if corrente in ('aceita_se', 'nao_aceita'):
                if item:
                    gab[corrente].append(item.group(1).strip())
                elif gab[corrente]:
                    gab[corrente][-1] += ' ' + linha.strip()
            else:
                gab[corrente] = (gab[corrente] + ' ' + linha.strip()).strip()
        return gab

    return {'corrido': ' '.join(l.strip() for l in linhas if l.strip()).strip()}


def paragrafos(conteudo):
    """Os paragrafos de um trecho citado: o que fica entre linhas em branco.

    A ancora nao atravessa linha em branco de proposito (M5): juntar o fim de
    um paragrafo com o comeco do seguinte inventaria um trecho que nao existe.
    """
    saida, atual = [], []
    for linha in conteudo:
        if linha.strip() == '':
            if atual:
                saida.append(' '.join(atual))
                atual = []
        else:
            atual.append(linha.strip())
    if atual:
        saida.append(' '.join(atual))
    return saida


def _normal(texto):
    return ' '.join((texto or '').split())


def problemas_nos_itens(exerc, gab, com_catalogo, raiz_fontes=None):
    """E1 a E6, M5 e M6: alternativas, gabarito, ancora e linha citada.

    Devolve (erros, enunciados, respostas), com uma entrada por item de cada
    lado: e por essas duas listas que a contagem de exercicios e de respostas
    continua sendo feita, como sempre foi.
    """
    eventos = itens_estruturados(exerc, com_catalogo)
    eventos_gab = itens_estruturados(gab, com_catalogo)
    itens_gab = [e for e in eventos_gab if e['tipo'] == 'item']
    erros, enunciados = [], []

    vigente = None
    posicao = 0
    letras_certas = []
    certas_longas = []
    for evento in eventos:
        if evento['tipo'] == 'texto':
            vigente = evento
            continue
        if evento['tipo'] != 'item':
            continue
        ex = ler_exercicio(evento['linhas'])
        gb = ler_gabarito(itens_gab[posicao]['linhas']) if posicao < len(itens_gab) else None
        posicao += 1
        enunciados.append(ex['enunciado'])
        texto_do_item = ex['trecho'] or vigente
        erros.extend(_problemas_do_item(evento, ex, gb, texto_do_item))
        if gb and 'letra' in gb:
            letras_certas.append(gb['letra'])
            comprimentos = dict((alt['letra'], len(alt['texto'])) for alt in ex['alternativas'])
            if comprimentos and gb['letra'] in comprimentos:
                outras = [v for l, v in comprimentos.items() if l != gb['letra']]
                # empate nao conta: so a certa estritamente mais longa que todas as outras
                certas_longas.append(bool(outras) and comprimentos[gb['letra']] > max(outras))
    erros.extend(_letras_concentradas(letras_certas))
    erros.extend(_certas_mais_longas(certas_longas))
    respostas = [' '.join(l.strip() for l in i['linhas']) for i in itens_gab]
    return erros, enunciados, respostas


# E7: a resposta certa nao pode ter letra preferida. Medido no piloto antes desta
# trava: 35 das 43 fechadas em "b". Um aluno de doze anos percebe na segunda folha e
# passa a marcar pelo padrao, e a questao deixa de medir leitura. Com quatro ou mais
# fechadas no tema, nenhuma letra pode ser a certa em mais da metade delas.
def _letras_concentradas(letras_certas):
    if len(letras_certas) < 4:
        return []
    contagem = {}
    for letra in letras_certas:
        contagem[letra] = contagem.get(letra, 0) + 1
    letra, quantas = max(contagem.items(), key=lambda par: par[1])
    if quantas * 2 > len(letras_certas):
        return ['a letra "%s" e a resposta certa em %d das %d questoes fechadas: redistribua as '
                'alternativas, senao o aluno acerta pelo padrao e nao pela leitura'
                % (letra, quantas, len(letras_certas))]
    return []


# E7, segunda conta: a certa tambem nao pode ser a alternativa mais comprida na maioria
# das fechadas. Medido no piloto: 31 de 43, mesmo depois de espalhar as letras. O aluno
# que aprende "marca a maior" acerta sem ler.
def _certas_mais_longas(certas_longas):
    if len(certas_longas) < 4:
        return []
    quantas = sum(1 for eh in certas_longas if eh)
    if quantas * 2 > len(certas_longas):
        return ['a resposta certa e a alternativa mais longa em %d das %d questoes fechadas: '
                'encurte a certa ou alongue um distrator, senao o aluno acerta pelo tamanho'
                % (quantas, len(certas_longas))]
    return []


def _problemas_do_item(evento, ex, gb, texto_do_item):
    erros = []
    n = evento['n']

    # E6 / L1: o enunciado nunca cita o texto pelo numero.
    achado = RE_TEXTO_NUMERADO.search(ex['enunciado'])
    if achado:
        erros.append('o item %d cita "%s": ela desmarca questoes e o Texto 2 pode virar o '
                     'unico da folha; escreva "no texto", "no poema" ou cite a linha'
                     % (n, achado.group(0)))

    # E1: quatro ou cinco alternativas, de a) em diante, em ordem.
    letras = [a['letra'] for a in ex['alternativas']]
    if letras:
        if len(letras) not in (4, 5):
            erros.append('o item %d tem %d alternativas: sao quatro ou cinco'
                         % (n, len(letras)))
        esperado = [chr(ord('a') + i) for i in range(len(letras))]
        if letras != esperado:
            erros.append('as alternativas do item %d estao fora de ordem ou pulam letra: %s'
                         % (n, ', '.join(letras)))

    if gb is None:
        return erros

    # E5: gabarito corrido nao serve para interpretacao.
    if 'corrido' in gb:
        erros.append('o gabarito do item %d e resposta corrida: em materia com catalogo a '
                     'questao fechada responde com a letra e a aberta com os quatro campos '
                     '(espera_se, aceita_se, nao_aceita, ancora)' % n)
        return erros

    # E2: alternativas e letra andam juntas.
    if letras and 'letra' not in gb:
        erros.append('o item %d tem alternativas e o gabarito nao e uma letra' % n)
    if 'letra' in gb and not letras:
        erros.append('o gabarito do item %d e a letra "%s" e o item nao tem alternativas'
                     % (n, gb['letra']))
    if 'letra' in gb and letras and gb['letra'] not in letras:
        erros.append('o gabarito do item %d aponta a letra "%s", que nao esta entre as '
                     'alternativas (%s)' % (n, gb['letra'], ', '.join(letras)))

    # E3: a aberta exige os quatro campos, e as listas com pelo menos um item.
    if 'espera_se' in gb:
        if not gb['espera_se'].strip():
            erros.append('o item %d nao diz espera_se: e a resposta que a professora quer ver' % n)
        for campo in ('aceita_se', 'nao_aceita'):
            if not gb[campo]:
                erros.append('o item %d nao tem %s: a lista precisa de pelo menos um item' % (n, campo))
        if not gb.get('ancora', '').strip():
            erros.append('o item %d nao tem ancora: o trecho literal que justifica a resposta' % n)

    erros.extend(_problemas_da_ancora(n, ex, gb, texto_do_item))
    erros.extend(_problemas_da_linha_citada(n, ex, texto_do_item))
    return erros


def _problemas_da_ancora(n, ex, gb, texto_do_item):
    """E4 e M5: a ancora e trecho literal de UM paragrafo do texto do item."""
    ancora = (gb.get('ancora') or '').strip()
    if not ancora:
        return []
    if len(ancora.split()) < 3:
        return ['a ancora do item %d tem menos de tres palavras: "%s"' % (n, ancora)]
    if texto_do_item:
        onde = 'no texto do item'
        candidatos = paragrafos(texto_do_item['conteudo'])
    else:
        onde = 'no enunciado (o item nao tem texto)'
        candidatos = [ex['enunciado']]
    alvo = _normal(ancora)
    for paragrafo in candidatos:
        if alvo in _normal(paragrafo):
            return []
    return ['a ancora do item %d nao esta %s: ela tem que ser trecho literal de um paragrafo '
            'so, sem atravessar linha em branco | %s' % (n, onde, ancora[:70])]


def _problemas_da_linha_citada(n, ex, texto_do_item):
    """M6: "linha 12" no enunciado tem que cair dentro do trecho do item."""
    erros = []
    for achado in RE_LINHA_CITADA.finditer(ex['enunciado']):
        primeira = int(achado.group(1))
        ultima = int(achado.group(2)) if achado.group(2) else primeira
        if texto_do_item is None:
            erros.append('o item %d cita "%s" e nao tem texto: sem bloco de citacao o numero '
                         'da linha nao aponta nada' % (n, achado.group(0)))
            continue
        a, b = texto_do_item['linhas']
        if primeira < a or ultima > b:
            erros.append('o item %d cita "%s", fora das linhas %d a %d do texto dele'
                         % (n, achado.group(0), a, b))
    return erros


# ----------------------------------------------------------------- conferir

def _painel():
    """O modulo do painel cego, importado tarde para nao fechar ciclo.

    O painel.py importa este arquivo (ele le a lista pelo mesmo parser do
    gerador), entao a importacao aqui e adiada ate a hora da chamada.
    """
    import painel
    return painel


def conferir(caminho, raiz_fontes=None, raiz_painel=None, sem_painel=None, ano=None):
    """Devolve (erros, avisos, manuais, cabecalho)."""
    erros, avisos, manuais = [], [], []
    raiz_painel = raiz_painel or RAIZ_PAINEL
    sem_painel = SEM_PAINEL if sem_painel is None else sem_painel
    ano = ano or ano_corrente()
    materia = materia_do_caminho(caminho)
    cab, corpo = ler_tema(caminho)
    linguas = materia['temas']['linguas']
    citacao = bool(materia['temas'].get('citacao'))
    # Materia com catalogo de topicos e materia com texto: portugues e
    # literatura hoje. E a mesma condicao do campo `topicos`, e por isso ela e
    # lida da tabela e nao escrita a mao aqui.
    com_catalogo = bool(materia.get('topicos'))

    erros.extend(problemas_no_id(cab, caminho, materia))
    erros.extend(problemas_nos_topicos(cab, materia))
    erros_bncc, avisos_bncc = problemas_no_catalogo(cab, materia, com_catalogo)
    erros.extend(erros_bncc)
    avisos.extend(avisos_bncc)

    inteiro = io.open(caminho, encoding='utf-8').read()

    # travessao, em qualquer lugar do arquivo, salvo citacao marcada onde a
    # materia permite
    for numero, trecho in travessoes(inteiro, citacao, com_catalogo):
        erros.append('travessao na linha %d: %s' % (numero, trecho))

    for numero, trecho in marcacao_quebrada(inteiro):
        erros.append('marcacao de expoente ou indice mal fechada na linha %d: %s'
                     % (numero, trecho))

    for numero, c, codigo, trecho in caracteres_indesenhaveis(inteiro):
        erros.append('caractere que o PDF nao desenha na linha %d: %s | %s'
                     % (numero, codigo, trecho))

    for numero, motivo, trecho in marcas_de_rascunho(corpo, citacao=citacao, catalogo=com_catalogo):
        erros.append('possivel rascunho na linha %d (%s): %s' % (numero, motivo, trecho))
    for numero, motivo, trecho in marcas_de_rascunho(corpo, RASCUNHO_AVISO, citacao=citacao,
                                                     catalogo=com_catalogo):
        avisos.append('linha %d, %s: %s' % (numero, motivo, trecho))

    for numero, citada, trecho in referencias_cruzadas(corpo, catalogo=com_catalogo):
        erros.append('linha %d cita "%s": o enunciado precisa se sustentar sozinho, '
                     'porque a numeracao muda quando ela monta a lista | %s'
                     % (numero, citada, trecho))

    erros.extend(problemas_de_estilo(corpo, com_catalogo))
    erros.extend(problemas_de_citacao(corpo, com_catalogo, raiz_fontes, ano))

    # As secoes de lingua: uma por lingua que a materia declara. Secao de uma
    # lingua que a materia nao tem e aviso, nao erro: ninguem proibiu escrever
    # ingles num tema de portugues, so o gerador nao vai ler.
    for lingua in linguas:
        if lingua not in SECOES:
            raise Problema('a materia %s declara a lingua "%s", e este verificador so conhece %s'
                           % (materia['id'], lingua, ', '.join(sorted(SECOES))))
    partes = {}
    for lingua in linguas:
        partes[lingua] = secao(corpo, SECOES[lingua]['secao'])
        if partes[lingua] is None:
            erros.append('falta a secao %s' % SECOES[lingua]['secao'])
    for lingua in SECOES:
        if lingua not in linguas and secao(corpo, SECOES[lingua]['secao']) is not None:
            avisos.append('a secao %s existe, mas %s e so em %s: o gerador nao a le'
                          % (SECOES[lingua]['secao'], materia['id'], ', '.join(linguas)))
    if any(parte is None for parte in partes.values()):
        return erros, avisos, manuais, cab

    listas, respostas = {}, {}
    for lingua in linguas:
        nomes = SECOES[lingua]
        explic = subsecao(partes[lingua], nomes['explicacao'])
        exerc = subsecao(partes[lingua], nomes['exercicios'])
        gab = subsecao(partes[lingua], nomes['gabarito'])
        for nome, valor in [(nomes['explicacao'], explic), (nomes['exercicios'], exerc),
                            (nomes['gabarito'], gab)]:
            if valor is None:
                erros.append('falta a subsecao "%s"' % nome)
        listas[lingua] = itens_numerados(exerc)
        respostas[lingua] = itens_numerados(gab)
        # Em materia com catalogo quem le a lista e o parser estruturado: o
        # itens_numerados junta continuacao com espaco, e alternativa, trecho e
        # gabarito de criterio morrem coladas.
        if com_catalogo and lingua == 'pt':
            erros_itens, enunciados, gabaritos = problemas_nos_itens(
                exerc, gab, com_catalogo, raiz_fontes)
            erros.extend(erros_itens)
            listas[lingua] = enunciados
            respostas[lingua] = gabaritos
    if erros:
        return erros, avisos, manuais, cab

    # Camada 2: a prova cega. Toda questao aberta de tema com catalogo passa por
    # um painel antes de o tema entrar no banco, e o portao confere o registro
    # que o painel deixou: que ele existe, que e do texto de hoje, e que todas as
    # abertas foram aprovadas. E erro, e nao aviso: um item ambiguo chega na mao
    # dela como se estivesse conferido.
    #
    # Vem depois das travas de estrutura de proposito. Num tema com o gabarito
    # quebrado, "falta o registro do painel" seria a mensagem errada a ler
    # primeiro: o que falta ali e o gabarito.
    if com_catalogo and not sem_painel:
        erros.extend(_painel().conferir_registro(caminho, raiz_painel))
    if erros:
        return erros, avisos, manuais, cab

    lista_pt, resp_pt = listas['pt'], respostas['pt']
    minimo = MINIMO_EXERCICIOS.get(cab['serie'], 15)
    if len(lista_pt) < minimo:
        avisos.append('so %d exercicios, o minimo desta serie sao %d' % (len(lista_pt), minimo))
    for lingua in linguas:
        if len(listas[lingua]) != len(respostas[lingua]):
            erros.append('%d exercicios em %s para %d respostas'
                         % (len(listas[lingua]), SECOES[lingua]['nome'], len(respostas[lingua])))

    # Nas materias bilingues as duas linguas precisam usar os mesmos numeros,
    # exercicio a exercicio. Traduzir e onde um erro passa com mais facilidade.
    if 'en' in linguas:
        lista_en, resp_en = listas['en'], respostas['en']
        if len(lista_pt) != len(lista_en):
            erros.append('portugues tem %d exercicios e ingles tem %d' % (len(lista_pt), len(lista_en)))
        for i in range(min(len(lista_pt), len(lista_en))):
            if numeros_de(lista_pt[i]) != numeros_de(lista_en[i]):
                erros.append('o exercicio %d usa numeros diferentes nas duas linguas: PT %s / EN %s'
                             % (i + 1, numeros_de(lista_pt[i]), numeros_de(lista_en[i])))
        for i in range(min(len(resp_pt), len(resp_en))):
            if numeros_de(resp_pt[i]) != numeros_de(resp_en[i]):
                erros.append('a resposta %d difere entre as linguas: PT %s / EN %s'
                             % (i + 1, numeros_de(resp_pt[i]), numeros_de(resp_en[i])))

    # as contas
    linhas, marcados = verificacoes(corpo)
    manuais.extend(marcados)
    rotulos_exercicio = set()
    for rotulo, expressao in linhas:
        if rotulo.startswith('E'):
            rotulos_exercicio.add(rotulo)
        if eh_tautologia(expressao):
            erros.append('%s nao prova nada: %s. Escreva a conta que sustenta a resposta, '
                         'ou marque como conferencia humana' % (rotulo, expressao[:40]))
            continue
        try:
            # o ambiente vai como global: dentro de uma compreensao de lista o
            # escopo local nao e enxergado, e os nomes ficariam indefinidos
            escopo = dict(AMBIENTE)
            escopo['__builtins__'] = {}
            resultado = eval(expressao, escopo)
        except Exception as e:
            erros.append('%s nao pode ser avaliado: %s | %s' % (rotulo, expressao[:60], e))
            continue
        if resultado is not True and resultado is not S.true:
            try:
                ok = bool(simplify(resultado))
            except Exception:
                ok = False
            if not ok:
                erros.append('%s deu falso: %s' % (rotulo, expressao[:70]))

    # V1: em materia so em portugues a secao VERIFICACAO e opcional. Ausente,
    # nada e avaliado e o aviso nao sai: em interpretacao de texto a conta que o
    # sympy sabe fazer nao existe, e um aviso que aparece em todo tema vira
    # ruido e para de ser lido. Nas bilingues (matematica) nada muda.
    sem_verificacao = secao(corpo, 'VERIFICACAO') is None and linguas == ['pt']
    cobertos = len(rotulos_exercicio) + len([r for r, _ in marcados if r.startswith('E')])
    if cobertos < len(lista_pt) and not sem_verificacao:
        avisos.append('%d exercicios sem verificacao nem marca de conferencia humana'
                      % (len(lista_pt) - cobertos))

    return erros, avisos, manuais, cab


def _tirar_opcao(args, nome):
    """O valor que segue --nome, retirado da lista; None quando nao veio."""
    if nome not in args:
        return None
    i = args.index(nome)
    valor = args[i + 1] if i + 1 < len(args) else None
    del args[i:i + 2]
    return valor


def main():
    global RAIZ_FONTES, RAIZ_PAINEL, SEM_PAINEL, ANO
    args = sys.argv[1:]
    raiz = _tirar_opcao(args, '--temas')
    raiz = os.path.abspath(raiz) if raiz else RAIZ
    fontes = _tirar_opcao(args, '--fontes')
    if fontes:
        RAIZ_FONTES = os.path.abspath(fontes)
    painel = _tirar_opcao(args, '--painel')
    if painel:
        RAIZ_PAINEL = os.path.abspath(painel)
    if '--sem-painel' in args:
        args.remove('--sem-painel')
        SEM_PAINEL = True
    # A conta do dominio publico so afrouxa com o tempo, entao o relogio e um
    # padrao seguro. O parametro existe para o teste poder fixar um ano e para
    # alguem poder perguntar o que estara livre no ano que vem.
    ano = _tirar_opcao(args, '--ano')
    ANO = int(ano) if ano else None
    ano = ano_corrente()
    alvo = args[0] if args else None
    arquivos = arquivos_de_temas(raiz)
    if alvo:
        arquivos = [a for a in arquivos if alvo in os.path.basename(a)]

    total_erros = 0
    total_avisos = 0
    pendentes = []
    aprovados = []
    por_materia = {}

    # As linhas "  ok        NOME" e "  REPROVADO NOME" sao lidas pelo portao
    # (_teste/confere_tudo.sh conta as duas): nao mude a forma delas.
    #
    # As fontes vem antes dos temas de proposito: um tema so pode ser conferido
    # contra uma fonte que ja passou, e ler o erro na ordem em que ele nasce
    # poupa quem esta consertando.
    arquivos_fonte = arquivos_de_fontes()
    for caminho in arquivos_fonte:
        nome = os.path.basename(caminho)
        try:
            erros = problemas_na_fonte(caminho, ano)
        except Exception as e:
            print('  REPROVADO %s: erro inesperado: %s' % (nome, e))
            traceback.print_exc()
            total_erros += 1
            continue
        if erros:
            print('  REPROVADO %s' % nome)
            for e in erros:
                print('      %s' % e)
            total_erros += len(erros)
        else:
            print('  ok        %s' % nome)
    if arquivos_fonte:
        print('%d fonte(s) conferida(s) com a conta do dominio publico em %d.'
              % (len(arquivos_fonte), ano))
        print('')

    if not arquivos:
        print('nenhum tema encontrado.')
        return 1 if total_erros else 0

    for caminho in arquivos:
        nome = os.path.basename(caminho)
        materia_id = materia_do_caminho(caminho)['id']
        por_materia[materia_id] = por_materia.get(materia_id, 0) + 1
        try:
            erros, avisos, manuais, cab = conferir(caminho)
        except Problema as e:
            print('  REPROVADO %s: %s' % (nome, e))
            total_erros += 1
            continue
        except Exception as e:
            print('  REPROVADO %s: erro inesperado: %s' % (nome, e))
            traceback.print_exc()
            total_erros += 1
            continue

        if erros:
            print('  REPROVADO %s' % nome)
            for e in erros:
                print('      %s' % e)
            total_erros += len(erros)
        else:
            marca = ''
            if avisos:
                marca = '  (%s)' % '; '.join(avisos)
                total_avisos += len(avisos)
            print('  ok        %s%s' % (nome, marca))
            aprovados.append(cab)
        for rotulo, motivo in manuais:
            pendentes.append((nome, rotulo, motivo))

    print('')
    print('=' * 66)
    print('%d tema(s) conferido(s) e %d fonte(s), %d aprovado(s), %d erro(s), %d aviso(s).'
          % (len(arquivos), len(arquivos_fonte), len(aprovados), total_erros, total_avisos))
    print('por materia: %s' % '; '.join(
        '%s %d' % (mat['id'], por_materia.get(mat['id'], 0)) for mat in materias()))
    if pendentes:
        print('')
        print('Conferencia humana pendente (%d):' % len(pendentes))
        for nome, rotulo, motivo in pendentes:
            print('  %s %s: %s' % (nome, rotulo, motivo))
    print('=' * 66)
    return 1 if total_erros else 0


if __name__ == '__main__':
    sys.exit(main())
