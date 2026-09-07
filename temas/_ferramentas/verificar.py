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

Uso:
    python verificar.py                confere tudo
    python verificar.py MAT06-05       confere um tema
    python verificar.py --temas DIR    confere os temas de outra raiz (prova do gerador)
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
ARQUIVO_MATERIAS = os.path.join(AQUI, 'materias.json')

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


def arquivos_de_temas(raiz=None):
    """Todos os .md de tema, materia por materia, na ordem da tabela.

    Varre a lista explicita de materias e nunca 'temas/*/*/*.md': esse curinga
    engoliria temas/_antes, que e um retrato local do banco com 146 arquivos,
    e qualquer outra pasta que alguem deixe ao lado.
    """
    raiz = raiz or RAIZ
    arquivos = []
    for mat in materias():
        arquivos.extend(sorted(glob.glob(os.path.join(raiz, mat['temas']['pasta'], '*', '*.md'))))
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


def lista_do_cabecalho(valor):
    """'[MAT06-02, MAT06-03]' -> ['MAT06-02', 'MAT06-03']; '[]' -> []."""
    return [p.strip() for p in (valor or '').strip().strip('[]').split(',') if p.strip()]


def ler_tema(caminho):
    materia = materia_do_caminho(caminho)
    texto = io.open(caminho, encoding='utf-8').read()
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
_MARCA_DE_CITACAO = re.compile(r'^ {0,3}> ')

# Escritos pelo codigo, e nao colados, para o proprio verificador passar na
# busca por travessao que a casa faz em todo arquivo.
TRAVESSAO = re.compile(u'[\u2013\u2014]')
RETICENCIAS = u'\\.\\.\\.|\u2026'


def eh_linha_de_citacao(linha):
    return bool(_MARCA_DE_CITACAO.match(linha))


def travessoes(texto, citacao=False):
    """[(linha, trecho)] de cada linha com travessao, fora de citacao marcada."""
    achados = []
    for numero, linha in enumerate(texto.split('\n'), 1):
        if not TRAVESSAO.search(linha):
            continue
        if citacao and eh_linha_de_citacao(linha):
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


def marcas_de_rascunho(corpo, lista=None, citacao=False):
    """Procura sinais de que o texto ficou com raciocinio do autor dentro.

    Com citacao=True, a regra das reticencias nao vale dentro de linha de
    citacao marcada: reticencia de autor e pontuacao, nao rascunho. As outras
    regras continuam valendo la dentro, porque a decisao de 08/09/2026 cobre
    travessao e reticencias, e nada alem disso.
    """
    achados = []
    regras = lista if lista is not None else RASCUNHO_ERRO
    texto = corpo.split('## VERIFICACAO')[0]
    for numero, linha in enumerate(texto.split(chr(10)), 1):
        if linha.strip().startswith('#'):
            continue
        citada = citacao and eh_linha_de_citacao(linha)
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


def referencias_cruzadas(corpo):
    """Acha enunciado que depende de outro pelo numero."""
    achados = []
    texto = corpo.split('## VERIFICACAO')[0]
    for numero, linha in enumerate(texto.split(chr(10)), 1):
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


# ----------------------------------------------------------------- conferir

def conferir(caminho):
    """Devolve (erros, avisos, manuais, cabecalho)."""
    erros, avisos, manuais = [], [], []
    materia = materia_do_caminho(caminho)
    cab, corpo = ler_tema(caminho)
    linguas = materia['temas']['linguas']
    citacao = bool(materia['temas'].get('citacao'))

    erros.extend(problemas_no_id(cab, caminho, materia))
    erros.extend(problemas_nos_topicos(cab, materia))

    inteiro = io.open(caminho, encoding='utf-8').read()

    # travessao, em qualquer lugar do arquivo, salvo citacao marcada onde a
    # materia permite
    for numero, trecho in travessoes(inteiro, citacao):
        erros.append('travessao na linha %d: %s' % (numero, trecho))

    for numero, trecho in marcacao_quebrada(inteiro):
        erros.append('marcacao de expoente ou indice mal fechada na linha %d: %s'
                     % (numero, trecho))

    for numero, c, codigo, trecho in caracteres_indesenhaveis(inteiro):
        erros.append('caractere que o PDF nao desenha na linha %d: %s | %s'
                     % (numero, codigo, trecho))

    for numero, motivo, trecho in marcas_de_rascunho(corpo, citacao=citacao):
        erros.append('possivel rascunho na linha %d (%s): %s' % (numero, motivo, trecho))
    for numero, motivo, trecho in marcas_de_rascunho(corpo, RASCUNHO_AVISO, citacao=citacao):
        avisos.append('linha %d, %s: %s' % (numero, motivo, trecho))

    for numero, citada, trecho in referencias_cruzadas(corpo):
        erros.append('linha %d cita "%s": o enunciado precisa se sustentar sozinho, '
                     'porque a numeracao muda quando ela monta a lista | %s'
                     % (numero, citada, trecho))

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

    cobertos = len(rotulos_exercicio) + len([r for r, _ in marcados if r.startswith('E')])
    if cobertos < len(lista_pt):
        avisos.append('%d exercicios sem verificacao nem marca de conferencia humana'
                      % (len(lista_pt) - cobertos))

    return erros, avisos, manuais, cab


def main():
    args = sys.argv[1:]
    raiz = RAIZ
    if '--temas' in args:
        i = args.index('--temas')
        raiz = os.path.abspath(args[i + 1])
        del args[i:i + 2]
    alvo = args[0] if args else None
    arquivos = arquivos_de_temas(raiz)
    if alvo:
        arquivos = [a for a in arquivos if alvo in os.path.basename(a)]
    if not arquivos:
        print('nenhum tema encontrado.')
        return 0

    total_erros = 0
    total_avisos = 0
    pendentes = []
    aprovados = []
    por_materia = {}

    # As linhas "  ok        NOME" e "  REPROVADO NOME" sao lidas pelo portao
    # (_teste/confere_tudo.sh conta as duas): nao mude a forma delas.
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
    print('%d tema(s) conferido(s), %d aprovado(s), %d erro(s), %d aviso(s).'
          % (len(arquivos), len(aprovados), total_erros, total_avisos))
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
