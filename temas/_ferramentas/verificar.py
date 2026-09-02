# -*- coding: utf-8 -*-
"""
Verificador do banco de temas.

Confere, para cada tema:
  1. estrutura do arquivo e campos do cabecalho
  2. cada conta declarada na secao VERIFICACAO, resolvida com sympy
  3. se a quantidade de exercicios bate com a de respostas do gabarito
  4. se a versao em ingles tem os mesmos numeros e as mesmas respostas da portuguesa
  5. ausencia de travessao, conforme a regra da casa
  6. exercicios marcados como conferencia humana, listados no fim

Um tema que falhe em qualquer ponto nao entra no banco.

Uso:
    python verificar.py            confere tudo
    python verificar.py MAT06-05   confere um tema
"""
import io
import os
import re
import sys
import glob

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
PASTA_MAT = os.path.join(RAIZ, 'mat')

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

UNIDADES = {'numeros', 'algebra', 'geometria', 'grandezas', 'estatistica'}
SERIES = {'02', '03', '04', '05', '06', '07', '08', '09', 'em1', 'em2', 'em3'}
# Nos anos iniciais a lista e mais curta: crianca de sete a dez anos nao sustenta vinte questoes.
ANOS_INICIAIS = {'02', '03', '04', '05'}
MINIMO_EXERCICIOS = {'02': 10, '03': 10, '04': 12, '05': 12}
CAMPOS = ['id', 'serie', 'unidade', 'titulo_pt', 'titulo_en', 'resumo_pt', 'resumo_en',
          'prerequisitos', 'duracao_min', 'dificuldade']


class Problema(Exception):
    pass


def ler_tema(caminho):
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

    for campo in CAMPOS:
        if campo not in cab:
            raise Problema('falta o campo "%s" no cabecalho' % campo)
    if cab['serie'] not in SERIES:
        raise Problema('serie invalida: %s' % cab['serie'])
    if cab['unidade'] not in UNIDADES:
        raise Problema('unidade invalida: %s' % cab['unidade'])

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
    (r'\.\.\.|…', 'reticencias: quase sempre sobra de rascunho', True),
    (r'\b(TODO|FIXME|XXX)\b', 'marca de rascunho', False),
    (r'\b(placeholder|preencher aqui|a definir|completar depois)\b', 'marca de rascunho', True),
    (r'\[(?:inserir|colocar|revisar|conferir)[^\]]*\]', 'instrucao para o autor deixada no texto', True),
]

# Estes sao apenas suspeitas: aparecem em texto legitimo, mas tambem em rascunho.
RASCUNHO_AVISO = [
    (r'\bna verdade\b', 'expressao que costuma indicar autocorrecao', True),
]


def marcas_de_rascunho(corpo, lista=None):
    """Procura sinais de que o texto ficou com raciocinio do autor dentro."""
    achados = []
    regras = lista if lista is not None else RASCUNHO_ERRO
    texto = corpo.split('## VERIFICACAO')[0]
    for numero, linha in enumerate(texto.split(chr(10)), 1):
        if linha.strip().startswith('#'):
            continue
        for padrao, motivo, ignora_caixa in regras:
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
    r'item\s+\d+',
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
    "process.stdout.write(JSON.stringify("
    "cs.filter(function(c){return P.caracteresQueNaoDesenha(c).length>0;})));"
)

_veredito = {}          # caractere -> True quando o PDF NAO desenha


def _perguntar_ao_gerador(caracteres):
    """Pergunta ao pdf.js quais destes ele nao sabe desenhar.

    Uma chamada por lote, e o resultado fica guardado para o resto da
    execucao: o banco inteiro usa umas poucas centenas de caracteres
    distintos, entao na pratica sao uma ou duas chamadas por rodada.
    """
    import json
    import subprocess
    pdf = os.path.join(os.path.dirname(RAIZ), 'pdf.js')
    saida = subprocess.run(
        ['node', '-e', _PERGUNTA, pdf, json.dumps(caracteres)],
        capture_output=True, text=True, encoding='utf-8')
    if saida.returncode != 0:
        raise Problema('nao consegui perguntar ao pdf.js quais caracteres ele '
                       'desenha: %s' % saida.stderr[:300])
    return set(json.loads(saida.stdout or '[]'))


# Alem do que o PDF desenha, ha coisa que simplesmente nao deve estar num
# arquivo de tema, mesmo sendo desenhavel. Controle e uma delas: o gerador
# transforma em espaco e segue, mas no fonte e sempre erro de edicao.
def _proibido_no_fonte(c):
    return ord(c) < 32 and c not in u'\n\r\t'


def caracteres_indesenhaveis(texto):
    """Devolve [(linha, caractere, codigo, trecho)] do que o PDF nao desenha."""
    novos = sorted(set(ch for ch in texto if ch not in _veredito
                       and not _proibido_no_fonte(ch)))
    if novos:
        ruins = _perguntar_ao_gerador(novos)
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


def conferir(caminho):
    """Devolve (erros, avisos, manuais, cabecalho)."""
    erros, avisos, manuais = [], [], []
    cab, corpo = ler_tema(caminho)

    esperado = os.path.splitext(os.path.basename(caminho))[0]
    if cab['id'] != esperado:
        erros.append('o id "%s" nao bate com o nome do arquivo "%s"' % (cab['id'], esperado))

    # travessao, em qualquer lugar do arquivo
    for numero, linha in enumerate(io.open(caminho, encoding='utf-8').read().split('\n'), 1):
        if '–' in linha or '—' in linha:
            erros.append('travessao na linha %d: %s' % (numero, linha.strip()[:60]))

    for numero, trecho in marcacao_quebrada(bruto if 'bruto' in dir() else
                                            io.open(caminho, encoding='utf-8').read()):
        erros.append('marcacao de expoente ou indice mal fechada na linha %d: %s'
                     % (numero, trecho))

    for numero, c, codigo, trecho in caracteres_indesenhaveis(
            io.open(caminho, encoding='utf-8').read()):
        erros.append('caractere que o PDF nao desenha na linha %d: %s | %s'
                     % (numero, codigo, trecho))

    for numero, motivo, trecho in marcas_de_rascunho(corpo):
        erros.append('possivel rascunho na linha %d (%s): %s' % (numero, motivo, trecho))
    for numero, motivo, trecho in marcas_de_rascunho(corpo, RASCUNHO_AVISO):
        avisos.append('linha %d, %s: %s' % (numero, motivo, trecho))

    for numero, citacao, trecho in referencias_cruzadas(corpo):
        erros.append('linha %d cita "%s": o enunciado precisa se sustentar sozinho, '
                     'porque a numeracao muda quando ela monta a lista | %s'
                     % (numero, citacao, trecho))

    pt, en = secao(corpo, 'PT'), secao(corpo, 'EN')
    if pt is None:
        erros.append('falta a secao PT')
    if en is None:
        erros.append('falta a secao EN')
    if pt is None or en is None:
        return erros, avisos, manuais, cab

    explic_pt = subsecao(pt, 'Explicação')
    exerc_pt = subsecao(pt, 'Exercícios')
    gab_pt = subsecao(pt, 'Gabarito')
    explic_en = subsecao(en, 'Explanation')
    exerc_en = subsecao(en, 'Exercises')
    gab_en = subsecao(en, 'Answer key')

    for nome, valor in [('Explicação', explic_pt), ('Exercícios', exerc_pt), ('Gabarito', gab_pt),
                        ('Explanation', explic_en), ('Exercises', exerc_en), ('Answer key', gab_en)]:
        if valor is None:
            erros.append('falta a subsecao "%s"' % nome)
    if erros:
        return erros, avisos, manuais, cab

    lista_pt = itens_numerados(exerc_pt)
    lista_en = itens_numerados(exerc_en)
    resp_pt = itens_numerados(gab_pt)
    resp_en = itens_numerados(gab_en)

    minimo = MINIMO_EXERCICIOS.get(cab['serie'], 15)
    if len(lista_pt) < minimo:
        avisos.append('so %d exercicios, o minimo desta serie sao %d' % (len(lista_pt), minimo))
    if len(lista_pt) != len(resp_pt):
        erros.append('%d exercicios em portugues para %d respostas' % (len(lista_pt), len(resp_pt)))
    if len(lista_en) != len(resp_en):
        erros.append('%d exercicios em ingles para %d respostas' % (len(lista_en), len(resp_en)))
    if len(lista_pt) != len(lista_en):
        erros.append('portugues tem %d exercicios e ingles tem %d' % (len(lista_pt), len(lista_en)))

    # as duas linguas precisam usar os mesmos numeros, exercicio a exercicio
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
    alvo = sys.argv[1] if len(sys.argv) > 1 else None
    arquivos = sorted(glob.glob(os.path.join(PASTA_MAT, '*', '*.md')))
    if alvo:
        arquivos = [a for a in arquivos if alvo in os.path.basename(a)]
    if not arquivos:
        print('nenhum tema encontrado.')
        return 0

    total_erros = 0
    total_avisos = 0
    pendentes = []
    aprovados = []

    for caminho in arquivos:
        nome = os.path.basename(caminho)
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
    if pendentes:
        print('')
        print('Conferencia humana pendente (%d):' % len(pendentes))
        for nome, rotulo, motivo in pendentes:
            print('  %s %s: %s' % (nome, rotulo, motivo))
    print('=' * 66)
    return 1 if total_erros else 0


if __name__ == '__main__':
    sys.exit(main())
